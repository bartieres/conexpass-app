const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
const base = 'src/screens/profile/pagamento/pagamento/';
const source = fs
  .readFileSync(`${base}paymentPresentation.js`, 'utf8')
  .replace(/export /g, '');
const presentation = new Function(
  `${source}; return {moeda,dataPagamento,apresentacaoSituacao,iconeOrigem};`
)();
function load(file, mocks) {
  const code = babel.transformFileSync(file, {
    babelrc: false,
    configFile: false,
    presets: ['babel-preset-expo'],
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  const mod = { exports: {} };
  vm.runInNewContext(code, {
    module: mod,
    exports: mod.exports,
    require(name) {
      return name in mocks ? mocks[name] : require(name);
    },
  });
  return mod.exports;
}
const pagamento = {
  id: 85,
  codigo: 'CP-00008784',
  nome: 'ConexPass Basic',
  origemDescricao: 'Plano ConexPass',
  valor: 49.9,
  dataCobranca: '2026-11-15T10:24:00',
  situacao: { codigo: 'CONFIRMADO', descricao: 'Confirmado' },
};
const detalhe = {
  ...pagamento,
  dataPagamento: '2026-11-15T00:00:00',
  valorOriginal: 49.9,
  desconto: 0,
  valorFinal: 49.9,
  formaPagamento: {
    tipo: 'CREDIT_CARD',
    bandeira: 'MASTERCARD',
    ultimosDigitos: '4242',
  },
  comprovanteUrl: 'https://example.com/recibo',
};
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
function button(tree, label) {
  return nodes(tree).find(
    (n) =>
      n.type === 'TouchableOpacity' &&
      (n.props.accessibilityLabel === label || text(n).includes(label))
  );
}

function setup(file, { pagamentoId = 85 } = {}) {
  let cursor = 0,
    refCursor = 0,
    cbCursor = 0,
    focus;
  const states = [],
    refs = [],
    callbacks = [],
    calls = [],
    nav = [],
    copies = [],
    links = [],
    alerts = [];
  let listHandler = async () => ({
    response: { content: [pagamento], last: true, page: 1 },
  });
  let detailHandler = async () => ({ response: detalhe });
  const hooks = {
    ...require('react'),
    useState(initial) {
      const i = cursor++;
      if (!(i in states))
        states[i] = typeof initial === 'function' ? initial() : initial;
      return [
        states[i],
        (v) => {
          states[i] = typeof v === 'function' ? v(states[i]) : v;
        },
      ];
    },
    useRef(value) {
      return (refs[refCursor++] ||= { current: value });
    },
    useCallback(fn) {
      return (callbacks[cbCursor++] ||= fn);
    },
  };
  const Screen = load(`${base}${file}`, {
    react: hooks,
    'react-native': new Proxy(
      {
        StyleSheet: { create: (v) => v },
        Alert: { alert: (...args) => alerts.push(args) },
        Linking: { openURL: async (url) => links.push(url) },
      },
      { get: (o, k) => o[k] || k }
    ),
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '@react-navigation/native': {
      useFocusEffect: (fn) => {
        focus = fn;
      },
    },
    '@expo/vector-icons': { Ionicons: 'Ionicons' },
    'expo-linear-gradient': { LinearGradient: 'LinearGradient' },
    'expo-clipboard': {
      setStringAsync: async (code) => {
        copies.push(code);
      },
    },
    '../../../../theme/theme': { colors: {}, shadow: {} },
    '../../../../services/assinaturaPagamentoService': {
      findAllByCondition: async (params) => {
        calls.push({ type: 'list', ...params });
        return listHandler(params);
      },
      findById: async (id) => {
        calls.push({ type: 'detail', id });
        return detailHandler(id);
      },
    },
    './paymentPresentation': presentation,
  }).default;
  const render = () => {
    cursor = 0;
    refCursor = 0;
    cbCursor = 0;
    return Screen({
      navigation: { navigate: (...args) => nav.push(args), goBack: () => {} },
      route: { params: { pagamentoId } },
    });
  };
  render();
  return {
    render,
    focus: () => focus(),
    calls,
    nav,
    copies,
    links,
    alerts,
    tick: () => new Promise((r) => setImmediate(r)),
    list: (fn) => {
      listHandler = fn;
    },
    detail: (fn) => {
      detailHandler = fn;
    },
  };
}
function list(tree) {
  return nodes(tree).find((n) => n.type === 'FlatList').props;
}

test('serviço usa endpoints de assinatura, filtros por query e ID para detalhe', async () => {
  const calls = [];
  let resposta = { response: { content: [pagamento], last: true } };
  const service = load('src/services/assinaturaPagamentoService.js', {
    '../config/api': {
      api: {
        get: async (...args) => {
          calls.push(args);
          return { data: resposta };
        },
      },
    },
  });
  await service.findAllByCondition({
    origem: 'CONEXPASS',
    situacao: 'CONFIRMADO',
    dataInicio: '2026-11-01',
    dataFim: '2026-11-30',
    codigo: 'CP-00008784',
    page: 0,
    size: 10,
  });
  assert.equal(calls[0][0], '/subscriptions/payments');
  assert.equal(calls[0][1].params.page, 0);
  assert.equal(calls[0][1].params.codigo, 'CP-00008784');
  resposta = { response: detalhe };
  await service.findById(85);
  assert.equal(calls[1][0], '/subscriptions/payments/85');
  resposta = { response: { id: 999 } };
  await assert.rejects(service.findById(85), /interpretar/);
  resposta = { response: [] };
  await assert.rejects(service.findAllByCondition({}), /interpretar/);
});

test('status desconhecido não vira pago ou recusado e pagamento à meia-noite não afirma horário real', () => {
  assert.equal(
    presentation.apresentacaoSituacao({ codigo: 'CONFIRMADO' }).label,
    'Pago'
  );
  assert.equal(
    presentation.apresentacaoSituacao({ codigo: 'RECUSADO' }).label,
    'Recusado'
  );
  assert.equal(
    presentation.apresentacaoSituacao({ codigo: 'AGUARDANDO_CONFIRMACAO' })
      .label,
    'Pendente'
  );
  assert.equal(
    presentation.apresentacaoSituacao({
      codigo: 'NOVO',
      descricao: 'Em análise',
    }).label,
    'Em análise'
  );
  assert.equal(presentation.dataPagamento('2026-11-15T00:00:00'), '15/11/2026');
  assert.equal(
    presentation.dataPagamento('2026-11-15T10:24:00', true),
    '15/11/2026 às 10:24'
  );
  assert.equal(presentation.moeda(null), '—');
  assert.equal(presentation.moeda(0).includes('0,00'), true);
});

test('paginação usa 0 e 1 nos requests, preserva códigos repetidos e navega com ID', async () => {
  const env = setup('PaymentScreen.js');
  env.list(async ({ page }) => ({
    response: {
      page: page + 1,
      last: page === 1,
      content: [{ ...pagamento, id: 85 + page }],
    },
  }));
  env.focus();
  await env.tick();
  list(env.render()).onEndReached();
  list(env.render()).onEndReached();
  await env.tick();
  const props = list(env.render());
  assert.deepEqual(
    env.calls.map((c) => c.page),
    [0, 1]
  );
  assert.equal(props.data.length, 2);
  assert.equal(props.data[0].codigo, props.data[1].codigo);
  props.renderItem({ item: props.data[1], index: 1 }).props.onPress();
  assert.equal(env.nav[0][0], 'PaymentDetail');
  assert.equal(env.nav[0][1].pagamentoId, 86);
  props.onEndReached();
  await env.tick();
  assert.equal(env.calls.length, 2);
});

test('falha ao paginar preserva lista e tenta novamente a página que falhou', async () => {
  const env = setup('PaymentScreen.js');
  let falhar = true;
  env.list(async ({ page }) => {
    if (page === 1 && falhar) throw Error('offline');
    return {
      response: {
        last: page === 1,
        content: [{ ...pagamento, id: 85 + page }],
      },
    };
  });
  env.focus();
  await env.tick();
  list(env.render()).onEndReached();
  await env.tick();
  const props = list(env.render());
  assert.equal(props.data.length, 1);
  falhar = false;
  await button(props.ListFooterComponent, 'Tentar novamente').props.onPress();
  assert.equal(list(env.render()).data.length, 2);
  assert.deepEqual(
    env.calls.map((c) => c.page),
    [0, 1, 1]
  );
});

test('refresh reinicia em zero e respostas após perder foco não alteram histórico', async () => {
  const env = setup('PaymentScreen.js');
  env.focus();
  await env.tick();
  await list(env.render()).refreshControl.props.onRefresh();
  assert.deepEqual(
    env.calls.map((c) => c.page),
    [0, 0]
  );
  let resolve;
  env.list(
    () =>
      new Promise((r) => {
        resolve = r;
      })
  );
  const blur = env.focus();
  blur();
  resolve({ response: { content: [], last: true } });
  await env.tick();
  assert.equal(list(env.render()).data.length, 1);
});

test('detalhe consulta pelo ID, copia o código, mostra valores reais e abre comprovante', async () => {
  const env = setup('PaymentDetail.js');
  env.focus();
  await env.tick();
  assert.equal(env.calls[0].id, 85);
  const tree = env.render();
  assert.match(text(tree), /Pagamento aprovado/);
  assert.match(text(tree), /MASTERCARD • •••• 4242/);
  assert.match(text(tree), /Data do pagamento 15\/11\/2026/);
  assert.doesNotMatch(text(tree), /00:00/);
  await button(tree, 'Copiar código da cobrança').props.onPress();
  assert.deepEqual(env.copies, ['CP-00008784']);
  await button(tree, 'Ver comprovante').props.onPress();
  assert.deepEqual(env.links, ['https://example.com/recibo']);
});

test('dados opcionais nulos não quebram detalhe nem inventam cartão, desconto ou comprovante', async () => {
  const env = setup('PaymentDetail.js');
  env.detail(async () => ({
    response: {
      ...detalhe,
      formaPagamento: null,
      comprovanteUrl: null,
      dataPagamento: null,
      desconto: null,
      valorOriginal: null,
    },
  }));
  env.focus();
  await env.tick();
  const tree = env.render();
  assert.match(text(tree), /Não informada para esta cobrança/);
  assert.match(text(tree), /Data do pagamento Não informada/);
  assert.equal(button(tree, 'Ver comprovante'), undefined);
  assert.doesNotMatch(text(tree), /4242/);
});

test('erro no detalhe permite tentar novamente; ID ausente não dispara GET', async () => {
  const env = setup('PaymentDetail.js');
  env.detail(async () => {
    throw Error('offline');
  });
  env.focus();
  await env.tick();
  assert.match(text(env.render()), /offline/);
  env.detail(async () => ({ response: detalhe }));
  await button(env.render(), 'Tentar novamente').props.onPress();
  assert.match(text(env.render()), /Pagamento aprovado/);
  const missing = setup('PaymentDetail.js', { pagamentoId: null });
  missing.focus();
  await missing.tick();
  assert.equal(missing.calls.length, 0);
  assert.match(text(missing.render()), /identificar o pagamento/);
});
