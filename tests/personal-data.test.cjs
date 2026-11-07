const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const babel = require('@babel/core');
const code = babel.transformFileSync(
  'src/screens/profile/conta/PersonalDataScreen.js',
  {
    babelrc: false,
    configFile: false,
    presets: ['babel-preset-expo'],
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  }
).code;
function setup(sexo = null, perfil = {}) {
  const states = [],
    refs = [];
  let cursor = 0,
    refCursor = 0,
    effects = [],
    fail = false;
  const calls = [];
  const hooks = {
    ...require('react'),
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
    useMemo: (fn) => fn(),
    useCallback: (fn) => fn,
    useEffect: (fn) => effects.push(fn),
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
      if (name === '@react-navigation/native')
        return { useFocusEffect: () => {} };
      if (name.includes('theme/theme'))
        return { colors: {}, radius: {}, shadow: {} };
      if (name.includes('AuthContext')) return { useAuth: () => ({}) };
      if (name.includes('usuarioService'))
        return {
          updateProfile: async (payload) => {
            calls.push(payload);
            if (fail) throw Error('rede');
            return { response: { id: 1, nome: 'Maria' } };
          },
        };
      if (name.includes('estadoService') || name.includes('cidadeService'))
        return {};
      return require(name);
    },
  });
  const render = () => {
    cursor = 0;
    refCursor = 0;
    effects = [];
    return mod.exports.default({ navigation: {} });
  };
  render();
  states[0] = {
    id: 1,
    nome: 'Maria',
    email: 'maria@email.com',
    documento: '00000000000',
    telefone: '43111111111',
    endereco: {
      cep: '86000000',
      logradouro: 'Rua de teste',
      numero: '10',
      bairro: 'Centro',
      cidade: { id: 1, nome: 'Cidade', estado: { id: 1, nome: 'Estado' } },
    },
    sexo,
    ...perfil,
  };
  states[1] = false;
  render();
  effects[0]();
  return {
    render,
    calls,
    fail: () => {
      fail = true;
    },
    sync: () => effects[0](),
  };
}
function nodes(v) {
  if (!v || typeof v !== 'object') return [];
  if (Array.isArray(v)) return v.flatMap(nodes);
  return [v, ...nodes(v.props?.children)];
}
function sexField(tree) {
  return nodes(tree).find((n) => n.props?.label === 'Sexo');
}
function sexModal(tree) {
  return nodes(tree).find((n) => n.props?.title === 'Selecione o sexo');
}
function save(tree) {
  return nodes(tree).find(
    (n) =>
      n.type === 'TouchableOpacity' &&
      nodes(n).some((child) => child.props?.children === 'Salvar alterações')
  );
}

test('sexo vazio permite selecionar, trocar antes de salvar e bloqueia só após sucesso', async () => {
  const env = setup();
  let tree = env.render();
  assert.equal(sexField(tree).type.name, 'SelectField');
  assert.equal(save(tree).props.disabled, true);
  sexModal(tree).props.onSelect({ codigo: 'MASCULINO' });
  tree = env.render();
  assert.equal(sexField(tree).props.value, 'Masculino');
  assert.equal(save(tree).props.disabled, false);
  sexModal(tree).props.onSelect({ codigo: 'FEMININO' });
  tree = env.render();
  const salvar = save(tree).props.onPress;
  await Promise.all([salvar(), salvar()]);
  assert.equal(env.calls.length, 1);
  assert.equal(env.calls[0].sexo, 'FEMININO');
  tree = env.render();
  assert.equal(sexField(tree).type.name, 'ReadOnlyField');
  assert.equal(sexField(tree).props.value, 'Feminino');
  assert.equal(save(tree).props.disabled, true);
});

test('erro ao salvar mantém sexo editável', async () => {
  const env = setup();
  env.fail();
  sexModal(env.render()).props.onSelect({ codigo: 'PREFIRO_NAO_DECLARAR' });
  await save(env.render()).props.onPress();
  assert.equal(sexField(env.render()).type.name, 'SelectField');
  assert.equal(save(env.render()).props.disabled, false);
});

test('sexo preenchido permanece bloqueado e é preservado ao salvar outro campo', async () => {
  for (const sexo of [
    { codigo: 'MASCULINO', descricao: 'Masculino' },
    'FEMININO',
  ]) {
    const env = setup(sexo);
    let tree = env.render();
    assert.equal(sexField(tree).type.name, 'ReadOnlyField');
    const phone = nodes(tree).find(
      (n) => n.type === 'TextInput' && n.props.placeholder === '(00) 00000-0000'
    );
    phone.props.onChangeText('43999999999');
    await save(env.render()).props.onPress();
    assert.equal(
      env.calls[0].sexo,
      typeof sexo === 'string' ? sexo : sexo.codigo
    );
    assert.equal(sexField(env.render()).type.name, 'ReadOnlyField');
  }
});

test('usuário sem endereço não pode salvar somente telefone', async () => {
  const env = setup('MASCULINO', { endereco: null, telefone: '' });
  const tree = env.render();
  nodes(tree)
    .find(
      (n) => n.type === 'TextInput' && n.props.placeholder === '(00) 00000-0000'
    )
    .props.onChangeText('43999999999');
  await save(env.render()).props.onPress();
  assert.equal(env.calls.length, 0);
  const texto = nodes(env.render())
    .filter((n) => n.type === 'Text')
    .flatMap((n) => n.props.children)
    .join(' ');
  assert.match(texto, /Preencha os campos obrigatórios/);
  assert.match(texto, /CEP, Estado, Cidade, Bairro, Logradouro, Número/);
});

test('complemento é opcional, mas os demais dados não aceitam vazio ou espaços', async () => {
  const env = setup();
  sexModal(env.render()).props.onSelect({ codigo: 'FEMININO' });
  await save(env.render()).props.onPress();
  assert.equal(env.calls.length, 1);
  assert.equal(env.calls[0].endereco.complemento, '');
  for (const perfil of [
    { telefone: '' },
    { documento: '' },
    { nome: ' ' },
    { email: '' },
    {
      endereco: {
        cep: '',
        logradouro: ' ',
        numero: '',
        bairro: '',
        cidade: null,
      },
    },
  ]) {
    const incomplete = setup('MASCULINO', perfil);
    nodes(incomplete.render())
      .find(
        (n) =>
          n.type === 'TextInput' && n.props.placeholder === 'Apto, bloco...'
      )
      .props.onChangeText('Apto 1');
    await save(incomplete.render()).props.onPress();
    assert.equal(incomplete.calls.length, 0);
  }
});
