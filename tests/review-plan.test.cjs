const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');

const source = fs.readFileSync(
  'src/screens/plan/assinaturaResultado.js',
  'utf8'
);
const obterEstadoAssinatura = new Function(
  `${source.replace('export ', '')}; return obterEstadoAssinatura;`
)();

test('assinatura pendente nunca aparece contratada, mesmo com pagamento confirmado', () => {
  for (const codigo of [
    'AGUARDANDO_CONFIRMACAO',
    'PROCESSANDO',
    'PENDENTE',
    'DESCONHECIDO',
    undefined,
  ]) {
    const estado = obterEstadoAssinatura({
      situacao: { codigo },
      pagamento: { situacao: { codigo: 'CONFIRMADO' } },
    });
    assert.equal(estado.confirmada, false);
    assert.equal(estado.titulo, 'Aguardando confirmação');
  }
});

test('somente ATIVO confirma; agendamento não anuncia ativação imediata', () => {
  assert.equal(
    obterEstadoAssinatura({ situacao: { codigo: 'ATIVO' } }).confirmada,
    true
  );
  assert.equal(
    obterEstadoAssinatura({
      situacao: { codigo: 'ATIVO' },
      alteracaoAgendada: true,
    }).titulo,
    'Alteração agendada!'
  );
  for (const codigo of ['RECUSADO', 'CANCELADO', 'ESTORNADO']) {
    assert.equal(
      obterEstadoAssinatura({ situacao: { codigo } }).titulo,
      'Assinatura não confirmada'
    );
    assert.equal(
      obterEstadoAssinatura({ pagamento: { situacao: { codigo } } }).confirmada,
      false
    );
  }
});

function setup({ semId = false } = {}) {
  let cursor = 0;
  const states = [];
  const refs = [];
  let refCursor = 0;
  let patches = 0;
  let gets = 0;
  let status = 'AGUARDANDO_CONFIRMACAO';
  let falhar = false;
  const react = {
    ...require('react'),
    useState(initial) {
      const i = cursor++;
      if (!(i in states))
        states[i] = typeof initial === 'function' ? initial() : initial;
      return [
        states[i],
        (value) => {
          states[i] = typeof value === 'function' ? value(states[i]) : value;
        },
      ];
    },
    useRef(value) {
      const i = refCursor++;
      return (refs[i] ||= { current: value });
    },
    useCallback: (fn) => fn,
    useEffect: () => {},
  };
  const code = babel.transformFileSync('src/screens/plan/ReviewPlanScreen.js', {
    babelrc: false,
    configFile: false,
    presets: ['babel-preset-expo'],
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  const mod = { exports: {} };
  vm.runInNewContext(code, {
    exports: mod.exports,
    module: mod,
    require(name) {
      if (name === 'react') return react;
      if (name === 'react-native')
        return new Proxy(
          { StyleSheet: { create: (s) => s } },
          { get: (o, k) => o[k] || k }
        );
      if (name === '@expo/vector-icons') return { Ionicons: 'Ionicons' };
      if (name.includes('theme/theme'))
        return { colors: {}, radius: {}, shadow: {} };
      if (name === './assinaturaResultado') return { obterEstadoAssinatura };
      if (name.includes('formaPagamentoService')) return {};
      if (name.includes('assinaturaService'))
        return {
          alterarPlano: async () => {
            patches++;
            return {
              response: {
                ...(semId ? {} : { id: 42 }),
                situacao: { codigo: 'AGUARDANDO_CONFIRMACAO' },
              },
            };
          },
          consultarPagamento: async (id) => {
            assert.equal(id, 42);
            gets++;
            if (falhar) throw new Error('rede');
            return { response: { id: 42, situacao: { codigo: status } } };
          },
        };
      return require(name);
    },
  });
  const render = () => {
    cursor = 0;
    refCursor = 0;
    return mod.exports.default({
      route: {
        params: { planoSelecionado: { id: 7, valor: 99, nome: 'Plano' } },
      },
      navigation: {},
    });
  };
  render();
  states[0] = { ultimosDigitos: '1234' };
  states[1] = false;
  return {
    render,
    stats: () => ({ patches, gets }),
    setStatus: (value) => {
      status = value;
    },
    fail: (value) => {
      falhar = value;
    },
  };
}
function nodes(v) {
  if (!v || typeof v !== 'object') return [];
  if (Array.isArray(v)) return v.flatMap(nodes);
  return [v, ...nodes(v.props?.children)];
}
function text(tree) {
  return nodes(tree)
    .filter((n) => n.type === 'Text')
    .flatMap((n) => n.props.children)
    .join(' ');
}
function button(tree, label) {
  return nodes(tree).find(
    (n) => n.type === 'TouchableOpacity' && text(n).includes(label)
  );
}

test('PATCH consulta por ID, bloqueia clique duplicado e só mostra sucesso após atualização ATIVO', async () => {
  const env = setup();
  const confirmar = button(env.render(), 'Confirmar assinatura').props.onPress;
  await Promise.all([confirmar(), confirmar()]);
  assert.deepEqual(env.stats(), { patches: 1, gets: 1 });
  assert.match(text(env.render()), /Aguardando confirmação/);
  env.fail(true);
  await button(env.render(), 'Atualizar situação').props.onPress();
  assert.match(text(env.render()), /Não foi possível consultar/);
  assert.match(text(env.render()), /Aguardando confirmação/);
  env.fail(false);
  env.setStatus('ATIVO');
  await button(env.render(), 'Atualizar situação').props.onPress();
  assert.match(text(env.render()), /Assinatura confirmada!/);
  assert.equal(env.stats().patches, 1);
});

test('resposta sem ID mantém pendência e não oferece nova contratação', async () => {
  const env = setup({ semId: true });
  await button(env.render(), 'Confirmar assinatura').props.onPress();
  const tree = env.render();
  assert.match(text(tree), /Aguardando confirmação/);
  assert.match(text(tree), /Não foi possível identificar/);
  assert.equal(button(tree, 'Atualizar situação').props.disabled, true);
  assert.deepEqual(env.stats(), { patches: 1, gets: 0 });
});
