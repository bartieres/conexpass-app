const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const babel = require('@babel/core');
const code = babel.transformFileSync('src/context/AuthContext.js', {
  babelrc: false,
  configFile: false,
  presets: ['babel-preset-expo'],
  plugins: ['@babel/plugin-transform-modules-commonjs'],
}).code;
function setup() {
  const states = [],
    refs = [];
  let cursor = 0,
    refCursor = 0,
    effects = [],
    unauthorized,
    listener,
    version = 0;
  let ensure = async () => ({
    nome: 'Maria Atualizada',
    email: 'atualizada@example.com',
  });
  const AppState = {
    currentState: 'background',
    addEventListener(_event, fn) {
      listener = fn;
      return { remove() {} };
    },
  };
  const react = {
    ...require('react'),
    useState(initial) {
      const i = cursor++;
      if (!(i in states)) states[i] = initial;
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
    useCallback: (fn) => fn,
    useEffect: (fn) => effects.push(fn),
  };
  const mod = { exports: {} };
  vm.runInNewContext(code, {
    module: mod,
    exports: mod.exports,
    require(name) {
      if (name === 'react') return react;
      if (name === 'react-native') return { AppState, Alert: { alert() {} } };
      if (name === '../config/api')
        return {
          getSessionVersion: () => version,
          setOnUnauthorized: (fn) => {
            unauthorized = fn;
          },
        };
      if (name === '../services/authService')
        return {
          authService: {
            restoreSession: async () => ({
              nome: 'Maria Restaurada',
              email: 'restaurada@example.com',
            }),
            ensureSession: () => ensure(),
            logout: async () => {
              version++;
              unauthorized?.();
              return { remoteRevoked: true };
            },
          },
        };
      return require(name);
    },
  });
  const render = () => {
    cursor = 0;
    refCursor = 0;
    effects = [];
    return mod.exports.AuthProvider({ children: null }).props.value;
  };
  render();
  effects[0]();
  effects[1]();
  return {
    render,
    tick: () => new Promise((r) => setImmediate(r)),
    subscribe: () => effects[2](),
    resume: () => {
      AppState.currentState = 'active';
      listener('active');
    },
    ensure: (fn) => {
      ensure = fn;
    },
  };
}

test('contexto restaura identidade no boot e atualiza usuário ao retornar ao primeiro plano', async () => {
  const env = setup();
  await env.tick();
  let auth = env.render();
  assert.equal(auth.user.nome, 'Maria Restaurada');
  assert.equal(auth.isBooting, false);
  env.subscribe();
  env.resume();
  await env.tick();
  auth = env.render();
  assert.equal(auth.user.nome, 'Maria Atualizada');
  assert.equal(auth.user.email, 'atualizada@example.com');
});

test('logout durante atualização em primeiro plano não reautentica usuário com resposta atrasada', async () => {
  const env = setup();
  await env.tick();
  const auth = env.render();
  env.subscribe();
  let resolver;
  env.ensure(
    () =>
      new Promise((r) => {
        resolver = r;
      })
  );
  env.resume();
  await auth.logout();
  resolver({ nome: 'Resposta antiga', email: 'antiga@example.com' });
  await env.tick();
  assert.equal(env.render().user, null);
  assert.equal(env.render().isAuthenticated, false);
});

test('falha temporária ao retomar mantém identidade previamente restaurada', async () => {
  const env = setup();
  await env.tick();
  env.render();
  env.subscribe();
  env.ensure(async () => {
    throw Error('offline');
  });
  env.resume();
  await env.tick();
  assert.equal(env.render().user.nome, 'Maria Restaurada');
});
