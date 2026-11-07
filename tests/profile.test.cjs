const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
const utils = new Function(
  `${fs.readFileSync('src/utils/assinaturasPlano.js', 'utf8').replace(/export /g, '')}; return {derivarPainel,formatarDataPlano};`
)();
const code = babel.transformFileSync('src/screens/profile/ProfileScreen.js', {
  babelrc: false,
  configFile: false,
  presets: ['babel-preset-expo'],
  plugins: ['@babel/plugin-transform-modules-commonjs'],
}).code;
function setup() {
  let assinatura = null;
  let effect;
  let lista = [];
  let fail = false;
  const nav = [];
  const mod = { exports: {} };
  vm.runInNewContext(code, {
    module: mod,
    exports: mod.exports,
    require(name) {
      if (name === 'react')
        return {
          ...require('react'),
          useState: () => [
            assinatura,
            (v) => {
              assinatura = v;
            },
          ],
          useCallback: (fn) => fn,
        };
      if (name === '@react-navigation/native')
        return {
          useFocusEffect: (fn) => {
            effect = fn;
          },
        };
      if (name === 'react-native')
        return new Proxy(
          { StyleSheet: { create: (v) => v } },
          { get: (o, k) => o[k] || k }
        );
      if (name === 'react-native-safe-area-context')
        return { SafeAreaView: 'SafeAreaView' };
      if (name === '@expo/vector-icons') return { Ionicons: 'Ionicons' };
      if (name === 'expo-linear-gradient')
        return { LinearGradient: 'LinearGradient' };
      if (name.includes('theme/theme'))
        return { colors: {}, radius: {}, shadow: {} };
      if (name.includes('AuthContext'))
        return {
          useAuth: () => ({
            user: { nome: 'Maria Andrade', email: 'maria@email.com' },
            logout: () => {},
          }),
        };
      if (name.includes('assinaturasPlano')) return utils;
      if (name.includes('assinaturaService'))
        return {
          getMinhasAssinaturas: async () => {
            if (fail) throw Error('offline');
            return { response: lista };
          },
        };
      if (name.endsWith('app.json')) return { expo: { version: '1.0.0' } };
      return require(name);
    },
  });
  const render = () =>
    mod.exports.default({
      navigation: { navigate: (route) => nav.push(route) },
    });
  render();
  return {
    render,
    nav,
    setList: (v) => {
      lista = v;
    },
    fail: () => {
      fail = true;
    },
    focus: () => effect(),
    tick: () => new Promise((r) => setImmediate(r)),
  };
}
function nodes(v) {
  if (!v || typeof v !== 'object') return [];
  if (Array.isArray(v)) return v.flatMap(nodes);
  return [v, ...nodes(v.props?.children)];
}
function planCard(tree) {
  return nodes(tree).find((n) =>
    n.props?.accessibilityLabel?.startsWith('Gerenciar plano')
  );
}
const atual = {
  id: 101,
  tipoRegistro: 'ATUAL',
  plano: { nome: 'Basic' },
  podeUtilizar: true,
  renovacaoAutomatica: true,
};

test('perfil sem plano e somente pendente/agendado não exibe cartão de plano', async () => {
  const env = setup();
  for (const lista of [
    [],
    [{ ...atual, tipoRegistro: 'PENDENTE', podeUtilizar: false }],
    [
      {
        ...atual,
        tipoRegistro: 'PROXIMO',
        podeUtilizar: false,
        situacao: { codigo: 'AGENDADO' },
      },
    ],
  ]) {
    env.setList(lista);
    env.focus();
    await env.tick();
    assert.equal(planCard(env.render()), undefined);
  }
});
test('plano atual utilizável aparece, navega para Planos e some ao voltar sem plano', async () => {
  const env = setup();
  env.setList([atual]);
  env.focus();
  await env.tick();
  const card = planCard(env.render());
  assert(card);
  card.props.onPress();
  assert.deepEqual(env.nav, ['Plano']);
  env.setList([]);
  env.focus();
  await env.tick();
  assert.equal(planCard(env.render()), undefined);
});
test('renovação cancelada permanece em uso, consulta falha ou perda de foco não mostra plano incorreto', async () => {
  const env = setup();
  env.setList([
    {
      ...atual,
      renovacaoAutomatica: false,
      fimVigencia: '2026-12-01T10:00:00',
    },
  ]);
  env.focus();
  await env.tick();
  assert.match(
    nodes(planCard(env.render()))
      .filter((n) => n.type === 'Text')
      .flatMap((n) => n.props.children)
      .join(' '),
    /Em uso.*Renovação cancelada/
  );
  env.fail();
  env.focus();
  await env.tick();
  assert.equal(planCard(env.render()), undefined);
  const other = setup();
  other.setList([atual]);
  const blur = other.focus();
  blur();
  await other.tick();
  assert.equal(planCard(other.render()), undefined);
});
