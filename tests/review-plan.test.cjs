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

function setup({
  semId = false,
  modo,
  agendada = false,
  validar = false,
  lista = [],
} = {}) {
  let efeito;
  let posts = 0;
  let puts = 0;
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
    useEffect: (fn) => {
      efeito = fn;
    },
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
      if (name.includes('assinaturasPlano'))
        return { formatarDataPlano: (value) => value || '' };
      if (name.includes('formaPagamentoService')) return {};
      if (name.includes('assinaturaService'))
        return {
          getMinhasAssinaturas: async () => ({ response: lista }),
          agendarProximoPlano: async (id) => {
            assert.equal(id, 7);
            posts++;
            return {
              response: {
                id: 42,
                situacao: { codigo: 'AGENDADO' },
                dataInicioVigencia: '2026-12-01T10:00:00',
              },
            };
          },
          alterarProximoPlano: async (id) => {
            assert.equal(id, 7);
            puts++;
            return {
              response: {
                id: 42,
                situacao: { codigo: 'AGENDADO' },
                dataInicioVigencia: '2026-12-01T10:00:00',
              },
            };
          },
          alterarPlano: async () => {
            patches++;
            return {
              response: {
                ...(semId ? {} : { id: 42 }),
                situacao: {
                  codigo: agendada ? 'AGENDADO' : 'AGUARDANDO_CONFIRMACAO',
                },
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
        params: {
          modo,
          planoAgendadoId: 42,
          dataInicioVigencia: '2026-12-01T10:00:00',
          planoSelecionado: { id: 7, valor: 99, nome: 'Plano' },
        },
      },
      navigation: {},
    });
  };
  render();
  states[3] = { ultimosDigitos: '1234' };
  states[4] = false;
  if (!validar) states[1] = false;
  return {
    render,
    validar: () => efeito(),
    stats: () => ({ patches, gets }),
    scheduleStats: () => ({ posts, puts }),
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

test('AGENDAR_PROXIMO usa POST e ALTERAR_PROXIMO usa PUT, sem PATCH ou consulta de pagamento', async () => {
  for (const modo of ['AGENDAR_PROXIMO', 'ALTERAR_PROXIMO']) {
    const env = setup({ modo });
    await button(env.render(), 'Confirmar agendamento').props.onPress();
    assert.deepEqual(env.stats(), { patches: 0, gets: 0 });
    assert.deepEqual(env.scheduleStats(), {
      posts: modo === 'AGENDAR_PROXIMO' ? 1 : 0,
      puts: modo === 'ALTERAR_PROXIMO' ? 1 : 0,
    });
    assert.match(text(env.render()), /Próximo plano agendado!/);
    assert.equal(button(env.render(), 'Atualizar situação'), undefined);
  }
});

test('PATCH que devolve AGENDADO não anuncia assinatura ativa nem consulta pagamento', async () => {
  const env = setup({ agendada: true });
  await button(env.render(), 'Confirmar assinatura').props.onPress();
  assert.deepEqual(env.stats(), { patches: 1, gets: 0 });
  assert.match(text(env.render()), /Próximo plano agendado!/);
});

test('revisão valida data calculada e permissão pela lista, bloqueando agendamento que entrou em cobrança', async () => {
  const atual = {
    id: 101,
    tipoRegistro: 'ATUAL',
    podeUtilizar: true,
    renovacaoAutomatica: false,
    fimVigencia: '2026-12-01T10:00:00',
    acoesPermitidas: ['CONSULTAR'],
  };
  const env = setup({ modo: 'AGENDAR_PROXIMO', validar: true, lista: [atual] });
  assert.equal(
    button(env.render(), 'Confirmar agendamento').props.disabled,
    true
  );
  env.validar();
  await new Promise((r) => setImmediate(r));
  assert.equal(
    button(env.render(), 'Confirmar agendamento').props.disabled,
    false
  );
  assert.equal(
    nodes(env.render()).find((n) => n.props?.label === 'Entra em vigor').props
      .value,
    '2026-12-01T10:00:00'
  );
  const bloqueado = setup({
    modo: 'ALTERAR_PROXIMO',
    validar: true,
    lista: [
      {
        id: 42,
        tipoRegistro: 'PROXIMO',
        situacao: { codigo: 'AGUARDANDO_CONFIRMACAO' },
        acoesPermitidas: ['CONSULTAR'],
      },
    ],
  });
  bloqueado.validar();
  await new Promise((r) => setImmediate(r));
  assert.equal(
    button(bloqueado.render(), 'Confirmar agendamento').props.disabled,
    true
  );
  assert.match(text(bloqueado.render()), /O agendamento mudou/);
});
