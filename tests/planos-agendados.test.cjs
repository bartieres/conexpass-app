const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
const react = require('react');
const utilsSource = fs
  .readFileSync('src/utils/assinaturasPlano.js', 'utf8')
  .replace(/export /g, '');
const utils = new Function(
  `${utilsSource}; return {validarAssinaturas,derivarPainel,permiteAcao,podeAlterarAtual,podeAgendarProximo,formatarDataPlano,formatarValorPlano};`
)();
const atual = {
  id: 101,
  tipoRegistro: 'ATUAL',
  situacao: { codigo: 'ATIVO' },
  plano: { id: 1, nome: 'Basic', beneficios: ['Benefício da API'] },
  valor: 49.9,
  podeUtilizar: true,
  renovacaoAutomatica: true,
  acoesPermitidas: ['CANCELAR_RENOVACAO'],
  fimVigencia: '2026-12-01T10:00:00',
  dataInicioVigencia: '2026-11-01T10:00:00',
  dataProximaCobranca: '2026-12-01',
};
const cancelada = {
  ...atual,
  renovacaoAutomatica: false,
  acoesPermitidas: ['CONSULTAR'],
  dataProximaCobranca: null,
};
const proximo = {
  id: 102,
  tipoRegistro: 'PROXIMO',
  situacao: { codigo: 'AGENDADO' },
  plano: { id: 3, nome: 'Premium' },
  valor: 119.9,
  podeUtilizar: false,
  acoesPermitidas: ['ALTERAR_PROXIMO', 'CANCELAR_PROXIMO'],
  dataInicioVigencia: '2026-12-01T10:00:00',
};
const pendente = {
  id: 103,
  tipoRegistro: 'PENDENTE',
  situacao: { codigo: 'AGUARDANDO_CONFIRMACAO' },
  plano: { id: 3, nome: 'Premium' },
  valor: 119.9,
  podeUtilizar: false,
  acoesPermitidas: ['CONSULTAR'],
};

function load(file, mocks) {
  const code = babel.transformFileSync(file, {
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
      if (name in mocks) return mocks[name];
      if (name.includes('assinaturasPlano')) return utils;
      return require(name);
    },
  });
  return mod.exports;
}
const native = new Proxy(
  { StyleSheet: { create: (v) => v } },
  { get: (o, k) => o[k] || k }
);
const visual = load('src/screens/plan/Plan.js', {
  'react-native': native,
  'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
  '@expo/vector-icons': { Ionicons: 'Ionicons' },
  '../../theme/theme': { colors: {}, radius: {}, shadow: {}, typography: {} },
}).default;
function nodes(v) {
  if (!v || typeof v !== 'object') return [];
  if (Array.isArray(v)) return v.flatMap(nodes);
  if (typeof v.type === 'function') return nodes(v.type(v.props));
  return [v, ...nodes(v.props?.children)];
}
function text(tree) {
  return nodes(tree)
    .filter((n) => n.type === 'Text')
    .flatMap((n) => n.props.children)
    .join(' ');
}
function render(lista) {
  return visual({
    ...utils.derivarPainel(lista),
    navigation: {},
    loading: false,
  });
}

test('lista vazia é sem assinatura; objeto e duplicatas são erros de integração', () => {
  assert.equal(
    utils.derivarPainel(utils.validarAssinaturas([])).semAssinatura,
    true
  );
  assert.throws(
    () => utils.validarAssinaturas({ plano: { id: 1 } }),
    /incompatível/
  );
  assert.throws(
    () => utils.validarAssinaturas([atual, atual]),
    /inconsistentes/
  );
  assert.match(text(render([])), /Você não possui um plano/);
});

test('lista fora de ordem identifica atual e próximo, sem duplicar o registro pendente', () => {
  const painel = utils.derivarPainel([proximo, pendente, cancelada]);
  assert.equal(painel.planoAtual.id, 101);
  assert.equal(painel.proximoPlano.id, 102);
  assert.deepEqual(
    painel.pagamentosPendentes.map((a) => a.id),
    [103]
  );
  assert.equal(utils.derivarPainel([pendente]).semAssinatura, false);
});

test('atual cancelado continua em uso, sem próxima cobrança, com opção de agendar', () => {
  const tree = render([cancelada]);
  assert.match(text(tree), /Em uso/);
  assert.match(text(tree), /Renovação cancelada/);
  assert.match(text(tree), /Escolher próximo plano/);
  assert.doesNotMatch(text(tree), /Próxima cobrança|Cancelar renovação/);
  assert.match(text(tree), /01\/12\/2026 às 10:00/);
  assert.equal(utils.podeAgendarProximo(cancelada, null, []), true);
});

test('atual e próximo têm ações separadas; pagamento em andamento não oferece alterar/cancelar', () => {
  const tree = render([cancelada, proximo]);
  assert.match(text(tree), /Alterar próximo plano/);
  assert.match(text(tree), /Cancelar próximo plano/);
  assert.doesNotMatch(text(tree), /Escolher próximo plano/);
  const emCobranca = { ...proximo, situacao: { codigo: 'PROCESSING_PAYMENT' } };
  const texto = text(render([emCobranca]));
  assert.match(texto, /Aguardando pagamento/);
  assert.match(texto, /Atualizar situação/);
  assert.doesNotMatch(
    texto,
    /Alterar próximo plano|Cancelar próximo plano|Em uso|Você não possui/
  );
});

test('datas civis e horários sem conversão UTC e valor contratado diferente do catálogo', () => {
  assert.equal(utils.formatarDataPlano('2026-12-01'), '01/12/2026');
  assert.equal(utils.formatarDataPlano(null), 'Data não informada');
  assert.equal(
    utils.formatarDataPlano('2026-12-01T10:00:00', true),
    '01/12/2026 às 10:00'
  );
  const texto = text(
    render([{ ...atual, valor: 39.9, plano: { ...atual.plano, valor: 999 } }])
  );
  assert.match(texto, /39,90/);
  assert.doesNotMatch(texto, /999/);
});

function setup() {
  const states = [],
    refs = [],
    callbacks = [];
  let cursor = 0,
    refCursor = 0,
    cbCursor = 0,
    focus;
  let lista = [cancelada, proximo],
    listHandler,
    cancelNextHandler,
    renewHandler;
  const calls = [],
    alerts = [],
    nav = [];
  const hooks = {
    ...react,
    useState(initial) {
      const i = cursor++;
      if (!(i in states))
        states[i] = typeof initial === 'function' ? initial() : initial;
      return [
        states[i],
        (v) => (states[i] = typeof v === 'function' ? v(states[i]) : v),
      ];
    },
    useRef(initial) {
      return (refs[refCursor++] ||= { current: initial });
    },
    useCallback(fn) {
      const i = cbCursor++;
      return (callbacks[i] ||= fn);
    },
  };
  const Screen = load('src/screens/plan/PlanScreen.js', {
    react: hooks,
    'react-native': { Alert: { alert: (...args) => alerts.push(args) } },
    '@react-navigation/native': {
      useFocusEffect: (fn) => {
        focus = fn;
      },
    },
    './Plan': { __esModule: true, default: 'Plan' },
    '../../services/assinaturaService': {
      getMinhasAssinaturas: async () => {
        calls.push('GET');
        const response = listHandler ? await listHandler() : lista;
        return { response: utils.validarAssinaturas(response) };
      },
      cancelarProximoPlano: async () => {
        calls.push('DELETE_NEXT');
        if (cancelNextHandler) return cancelNextHandler();
        lista = lista.filter((a) => a.id !== 102);
      },
      cancelarRenovacao: async (id) => {
        calls.push(`CANCEL_RENEWAL_${id}`);
        if (renewHandler) return renewHandler();
        lista = [
          {
            ...atual,
            renovacaoAutomatica: false,
            acoesPermitidas: ['CONSULTAR'],
          },
        ];
      },
    },
  }).default;
  const render = () => {
    cursor = 0;
    refCursor = 0;
    cbCursor = 0;
    return Screen({ navigation: { navigate: (...args) => nav.push(args) } })
      .props;
  };
  const tick = () => new Promise((r) => setImmediate(r));
  render();
  return {
    render,
    calls,
    alerts,
    nav,
    tick,
    focus: () => focus(),
    list: (value) => {
      lista = value;
    },
    listHandler: (fn) => {
      listHandler = fn;
    },
    cancelNextHandler: (fn) => {
      cancelNextHandler = fn;
    },
    renewHandler: (fn) => {
      renewHandler = fn;
    },
  };
}
function confirmar(env) {
  return env.alerts.at(-1)[2].find((a) => a.style === 'destructive').onPress;
}

test('cancelar próximo chama só DELETE e mantém atual; duplo toque faz uma única mutação', async () => {
  const env = setup();
  env.focus();
  await env.tick();
  env.render().onCancelarProximo();
  const confirmarCancelamento = confirmar(env);
  await Promise.all([confirmarCancelamento(), confirmarCancelamento()]);
  const props = env.render();
  assert.equal(env.calls.filter((c) => c === 'DELETE_NEXT').length, 1);
  assert.equal(props.planoAtual.id, 101);
  assert.equal(props.proximoPlano, null);
  assert.equal(props.planoAtual.renovacaoAutomatica, false);
  assert.equal(
    env.calls.some((c) => c.startsWith('CANCEL_RENEWAL')),
    false
  );
});

test('cancelar renovação preserva card e comunica vigência; navegação usa IDs distintos', async () => {
  const env = setup();
  env.list([atual]);
  env.focus();
  await env.tick();
  env.render().onAlterarPlano();
  assert.equal(env.nav[0][1].modo, 'ALTERAR_ATUAL');
  assert.equal(env.nav[0][1].planoAtual.id, 1);
  assert.equal(env.nav[0][1].planoAtualId, 101);
  env.render().onCancelarRenovacao();
  await confirmar(env)();
  assert.equal(env.render().planoAtual.id, 101);
  assert.equal(env.render().planoAtual.renovacaoAutomatica, false);
  assert.match(env.alerts.at(-1)[1], /continua disponível/);
});

test('conflito 409 recarrega situação e remove ações de agendamento em cobrança', async () => {
  const env = setup();
  env.focus();
  await env.tick();
  env.cancelNextHandler(() => {
    env.list([
      {
        ...proximo,
        situacao: { codigo: 'PENDING_PAYMENT' },
        acoesPermitidas: ['CONSULTAR'],
      },
    ]);
    throw { response: { status: 409 } };
  });
  env.render().onCancelarProximo();
  await confirmar(env)();
  assert.equal(env.render().proximoPlano, null);
  assert.equal(env.render().pagamentosPendentes.length, 1);
  assert.match(env.alerts.at(-1)[1], /cobrança pode ter iniciado/);
});

test('rede offline mantém cards, erro de consulta não vira lista vazia', async () => {
  const env = setup();
  env.focus();
  await env.tick();
  env.listHandler(() => {
    throw new Error('offline');
  });
  await env.render().onRetry();
  const props = env.render();
  assert.equal(props.planoAtual.id, 101);
  assert.equal(props.semAssinatura, false);
  assert.match(props.error, /offline/);
});

test('resposta fora de ordem e após perda de foco não sobrescreve a lista', async () => {
  const env = setup();
  let resolver;
  env.listHandler(
    () =>
      new Promise((r) => {
        resolver = r;
      })
  );
  const blur = env.focus();
  env.listHandler(() => [pendente]);
  env.focus();
  await env.tick();
  resolver([atual]);
  await env.tick();
  assert.equal(env.render().planoAtual, null);
  assert.equal(env.render().pagamentosPendentes[0].id, 103);
  let resolverSegundo;
  env.listHandler(
    () =>
      new Promise((r) => {
        resolverSegundo = r;
      })
  );
  env.focus();
  blur();
  resolverSegundo([atual]);
  await env.tick();
  assert.equal(env.render().pagamentosPendentes[0].id, 103);
});

test('serviços usam rotas e verbos reais, sem payload para cancelar renovação/próximo', async () => {
  const calls = [];
  const api = {};
  for (const method of ['get', 'post', 'put', 'delete'])
    api[method] = async (...args) => {
      calls.push([method, ...args]);
      return { data: { response: method === 'get' ? [] : null } };
    };
  const service = load('src/services/assinaturaService.js', {
    '../config/api': { api },
  });
  await service.getMinhasAssinaturas();
  await service.cancelarRenovacao(101);
  await service.agendarProximoPlano(3);
  await service.alterarProximoPlano(4);
  await service.cancelarProximoPlano();
  assert.equal(calls[0][1], '/subscriptions/plan/user');
  assert.deepEqual(
    calls.map((c) => c.slice(0, 2)),
    [
      ['get', '/subscriptions/plan/user'],
      ['post', '/subscriptions/plan/101/cancel-renewal'],
      ['post', '/subscriptions/plan/next'],
      ['put', '/subscriptions/plan/next'],
      ['delete', '/subscriptions/plan/next'],
    ]
  );
  assert.equal(calls[1].length, 2);
  assert.equal(calls[2][2].planId, 3);
  assert.equal(calls[3][2].planId, 4);
  assert.equal(calls[4].length, 2);
});
