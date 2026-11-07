const { test } = require('node:test');
const assert = require('node:assert/strict');
const babel = require('@babel/core');
const vm = require('node:vm');
const code = babel.transformFileSync(
  'src/screens/create-user/RegisterScreen.js',
  {
    babelrc: false,
    configFile: false,
    presets: ['babel-preset-expo'],
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  }
).code;
function setup() {
  let cursor = 0,
    fail = false;
  const states = [],
    calls = [],
    nav = [];
  const hooks = {
    ...require('react'),
    useState(initial) {
      const i = cursor++;
      if (!(i in states)) states[i] = initial;
      return [
        states[i],
        (value) => {
          states[i] = typeof value === 'function' ? value(states[i]) : value;
        },
      ];
    },
  };
  const mod = { exports: {} };
  vm.runInNewContext(code, {
    module: mod,
    exports: mod.exports,
    require(name) {
      if (name === 'react') return hooks;
      if (name === 'react-native')
        return new Proxy(
          { StyleSheet: { create: (v) => v }, Platform: { OS: 'ios' } },
          { get: (o, k) => o[k] || k }
        );
      if (name === 'react-native-safe-area-context')
        return { SafeAreaView: 'SafeAreaView' };
      if (name === '@expo/vector-icons') return { Ionicons: 'Ionicons' };
      if (name === 'expo-linear-gradient')
        return { LinearGradient: 'LinearGradient' };
      if (name.includes('theme/theme')) return { colors: {}, shadow: {} };
      if (name.includes('AuthContext'))
        return {
          useAuth: () => ({
            register: async (payload) => {
              calls.push(payload);
              if (fail) throw { friendlyMessage: 'E-mail já cadastrado.' };
            },
          }),
        };
      if (name.endsWith('.png')) return 1;
      return require(name);
    },
  });
  const render = () => {
    cursor = 0;
    return mod.exports.default({
      navigation: { navigate: (...args) => nav.push(args), goBack: () => {} },
    });
  };
  render();
  return {
    render,
    calls,
    nav,
    fail: () => {
      fail = true;
    },
  };
}
function nodes(v) {
  if (!v || typeof v !== 'object') return [];
  if (Array.isArray(v)) return v.flatMap(nodes);
  if (typeof v.type === 'function') return nodes(v.type(v.props));
  return [v, ...nodes(v.props?.children)];
}
function field(env, label) {
  return nodes(env.render()).find(
    (n) => n.type === 'TextInput' && n.props.accessibilityLabel === label
  ).props;
}
function button(env) {
  return nodes(env.render()).find(
    (n) =>
      n.type === 'TouchableOpacity' &&
      nodes(n).some((c) => c.props?.children === 'Cadastrar')
  ).props;
}
function text(env) {
  return nodes(env.render())
    .filter((n) => n.type === 'Text')
    .flatMap((n) => n.props.children)
    .join(' ');
}
function fill(env, overrides = {}) {
  const values = {
    'Nome completo': 'Pessoa de Teste',
    'E-mail': 'teste@example.com',
    CPF: '12345678901',
    Senha: 'senha123',
    'Confirmar senha': 'senha123',
    ...overrides,
  };
  for (const [label, value] of Object.entries(values))
    field(env, label).onChangeText(value);
  nodes(env.render())
    .find((n) => n.props.accessibilityRole === 'checkbox')
    .props.onPress();
}

test('cadastro mantém máscara, payload e navegação para confirmação de e-mail', async () => {
  const env = setup();
  assert.equal(button(env).disabled, true);
  fill(env);
  assert.equal(field(env, 'CPF').value, '123.456.789-01');
  assert.equal(button(env).disabled, false);
  await button(env).onPress();
  assert.equal(env.calls.length, 1);
  assert.deepEqual(Object.keys(env.calls[0]), [
    'nome',
    'email',
    'documento',
    'senha',
  ]);
  assert.equal(env.calls[0].documento, '123.456.789-01');
  assert.equal(env.calls[0].senha, 'senha123');
  assert.equal(env.nav[0][0], 'RegisterSuccess');
  assert.equal(env.nav[0][1].email, 'teste@example.com');
});

test('campos obrigatórios, CPF, regras de senha e confirmação continuam impedindo cadastro inválido', async () => {
  for (const [override, message] of [
    [{ 'Nome completo': ' ' }, /Preencha todos os campos/],
    [{ 'E-mail': '' }, /Preencha todos os campos/],
    [{ CPF: '123' }, /Preencha todos os campos/],
    [{ Senha: '12345678' }, /8 caracteres/],
    [{ Senha: 'abcdefgh' }, /8 caracteres/],
    [{ Senha: 'abc123' }, /8 caracteres/],
    [{ 'Confirmar senha': 'outra123' }, /não coincidem/],
  ]) {
    const env = setup();
    fill(env, override);
    await button(env).onPress();
    assert.equal(env.calls.length, 0);
    assert.match(text(env), message);
  }
});

test('aceite controla botão, mostrar senha não muda valor e erro da API mantém formulário', async () => {
  const env = setup();
  fill(env);
  nodes(env.render())
    .find((n) => n.props.accessibilityRole === 'checkbox')
    .props.onPress();
  assert.equal(button(env).disabled, true);
  nodes(env.render())
    .find((n) => n.props.accessibilityRole === 'checkbox')
    .props.onPress();
  assert.equal(field(env, 'Senha').secureTextEntry, true);
  nodes(env.render())
    .find((n) => n.props.accessibilityLabel === 'Mostrar senha')
    .props.onPress();
  assert.equal(field(env, 'Senha').secureTextEntry, false);
  assert.equal(field(env, 'Senha').value, 'senha123');
  env.fail();
  await button(env).onPress();
  assert.match(text(env), /E-mail já cadastrado/);
  assert.equal(field(env, 'E-mail').value, 'teste@example.com');
  assert.equal(env.nav.length, 0);
});
