const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const babel = require('@babel/core');
function harness(file, mocks, params = {}) {
  const states = [],
    refs = [];
  let cursor = 0,
    refCursor = 0,
    effects = [],
    route = params;
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
    useRef(initial) {
      return (refs[refCursor++] ||= { current: initial });
    },
    useCallback: (fn) => fn,
    useEffect: (fn) => effects.push(fn),
  };
  const code = babel.transformFileSync(`src/screens/explore/inicio/${file}`, {
    babelrc: false,
    configFile: false,
    presets: ['babel-preset-expo'],
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  const mod = { exports: {} };
  const nav = [];
  vm.runInNewContext(code, {
    module: mod,
    exports: mod.exports,
    require(name) {
      if (name === 'react') return hooks;
      if (name === 'react-native')
        return new Proxy(
          { StyleSheet: { create: (v) => v } },
          { get: (o, k) => o[k] || k }
        );
      if (name === 'react-native-safe-area-context')
        return { SafeAreaView: 'SafeAreaView' };
      if (name === '@expo/vector-icons') return { Ionicons: 'Ionicons' };
      if (name === '@react-native-community/slider')
        return { __esModule: true, default: 'Slider' };
      if (name.includes('theme/theme')) return { colors: {}, radius: {} };
      if (name.includes('data/mock')) return { CATEGORIES: [] };
      if (name in mocks) return mocks[name];
      return require(name);
    },
  });
  const render = () => {
    cursor = 0;
    refCursor = 0;
    effects = [];
    return mod.exports.default({
      navigation: {
        navigate: (...args) => nav.push(args),
        setParams: () => {},
        goBack: () => {},
      },
      route: { params: route },
    });
  };
  render();
  return {
    render,
    nav,
    route: (v) => {
      route = v;
    },
    effect: (i) => effects[i](),
    tick: () => new Promise((r) => setImmediate(r)),
  };
}
function nodes(v) {
  if (!v || typeof v !== 'object') return [];
  if (Array.isArray(v)) return v.flatMap(nodes);
  return [v, ...nodes(v.props?.children)];
}
function press(tree, label) {
  return nodes(tree)
    .find(
      (n) =>
        n.type === 'TouchableOpacity' &&
        (n.props.accessibilityLabel === label ||
          nodes(n).some((x) => x.props?.children === label))
    )
    .props.onPress();
}

test('checkboxes recuperam seleção, aplicam nomes corretos e Limpar remove as três opções', () => {
  const env = harness(
    'FiltersScreen.js',
    {},
    { initialFiltros: { parceiro: true, aberto: false, abreHoje: true } }
  );
  const checkboxes = nodes(env.render()).filter(
    (n) => n.props.accessibilityRole === 'checkbox'
  );
  assert.equal(checkboxes.length, 3);
  assert.deepEqual(
    checkboxes.map((n) => n.props.accessibilityState.checked),
    [true, false, true]
  );
  press(env.render(), 'Aberto');
  press(env.render(), 'Aplicar filtros');
  const filtros = env.nav.at(-1)[1].filtrosAplicados;
  assert.equal(filtros.parceiro, true);
  assert.equal(filtros.aberto, true);
  assert.equal(filtros.abreHoje, true);
  press(env.render(), 'Limpar');
  press(env.render(), 'Aplicar filtros');
  const limpos = env.nav.at(-1)[1].filtrosAplicados;
  assert.equal(limpos.parceiro, false);
  assert.equal(limpos.aberto, false);
  assert.equal(limpos.abreHoje, false);
});

test('Explorar envia true, mantém opções em busca/categorias/paginação/refresh e omite desmarcadas', async () => {
  const calls = [];
  const coords = { latitude: -23, longitude: -51 };
  const env = harness('ExploreScreen.js', {
    '../../../hooks/useCurrentLocation': {
      useCurrentLocation: () => ({ coords, loading: false }),
    },
    '../../../services/estabelecimentoService': {
      findAllByCondition: async (params) => {
        calls.push(params);
        return { response: { content: [], last: false } };
      },
    },
    '../../../services/estabelecimentoLeadService': { save: async () => {} },
    '../../../context/AuthContext': {
      useAuth: () => ({ user: { nome: 'Maria' } }),
    },
    '@react-navigation/native': { useFocusEffect: () => {} },
    '../../../services/assinaturaService': {},
    './Explore': { __esModule: true, default: 'Explore' },
  });
  await env.render().props.onSubmitSearch();
  assert.equal(calls.at(-1).parceiro, undefined);
  env.route({
    filtrosAplicados: { parceiro: true, aberto: true, abreHoje: true },
  });
  env.render();
  env.effect(1);
  await env.tick();
  assert.equal(calls.at(-1).page, 0);
  env.route({});
  await env.render().props.onSubmitSearch();
  env.render().props.onSelectCategory('ACADEMIA');
  await env.tick();
  await env.render().props.onLoadMore();
  assert.equal(calls.at(-1).page, 1);
  await env.render().props.onRefresh();
  assert.equal(calls.at(-1).page, 0);
  for (const call of calls.slice(1)) {
    assert.equal(call.parceiro, true);
    assert.equal(call.aberto, true);
    assert.equal(call.abreHoje, true);
  }
  env.render().props.onOpenFilters();
  const initial = env.nav.at(-1)[1].initialFiltros;
  assert.equal(initial.parceiro, true);
  assert.equal(initial.abreHoje, true);
  env.route({
    filtrosAplicados: { parceiro: false, aberto: false, abreHoje: false },
  });
  env.render();
  env.effect(1);
  await env.tick();
  assert.equal(calls.at(-1).parceiro, undefined);
  assert.equal(calls.at(-1).aberto, undefined);
  assert.equal(calls.at(-1).abreHoje, undefined);
});
