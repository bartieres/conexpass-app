const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const axios = require('axios');

function setup() {
  const store = new Map();
  const calls = [];
  let handler;
  let clock = Date.now();
  const secureStore = {
    getItemAsync: async (key) => store.get(key) ?? null,
    setItemAsync: async (key, value) => {
      store.set(key, value);
    },
    deleteItemAsync: async (key) => {
      store.delete(key);
    },
  };
  const client = {
    create: (defaults) =>
      axios.create({
        ...defaults,
        adapter: async (config) => {
          assert.equal(config.headers['X-Client-Type'], 'APP');
          calls.push(config);
          const result = await handler(config);
          const response = {
            config,
            status: result.status ?? 200,
            data: result.data,
            headers: {},
          };
          if (response.status >= 400)
            throw new axios.AxiosError(
              'HTTP error',
              undefined,
              config,
              {},
              response
            );
          return response;
        },
      }),
  };
  const source = ['src/config/api.js', 'src/services/authService.js']
    .map((file) =>
      fs
        .readFileSync(file, 'utf8')
        .replace(/import[\s\S]*?from\s+['"][^'"]+['"];\n/g, '')
        .replace(/export /g, '')
    )
    .join('\n');
  const clockDate = class extends Date {
    static now() {
      return clock;
    }
  };
  const env = new Function(
    'axios',
    'SecureStore',
    'constants',
    'Date',
    `${source}\nreturn { api, authService, getAccessToken, setOnUnauthorized };`
  )(
    client,
    secureStore,
    { URL: { LOCATION: { api: 'http://test' } } },
    clockDate
  );
  const token = (suffix = '1') => ({
    accessToken: `access-${suffix}`,
    refreshToken: `refresh-${suffix}`,
    expiresIn: 900000,
  });
  handler = async (config) => {
    if (config.url === '/auth/login')
      return { data: { token: token(), user: { id: 1 } } };
    if (config.url === '/auth/refresh') return { data: token('2') };
    return { data: { id: 1 } };
  };
  return {
    ...env,
    store,
    calls,
    token,
    setHandler: (next) => {
      handler = next;
    },
    advance: (ms) => {
      clock += ms;
    },
  };
}

test('login, access em memória, rotação compartilhada antes de cinco operações mutáveis', async () => {
  const env = setup();
  await env.authService.login('user@test', 'secret');
  assert.equal(env.store.has('conexpass_token'), false);
  env.advance(900000);
  await Promise.all(
    Array.from({ length: 5 }, () => env.api.post('/checkin', { id: 1 }))
  );
  assert.equal(env.calls.filter((c) => c.url === '/auth/refresh').length, 1);
  assert.equal(env.calls.filter((c) => c.url === '/checkin').length, 5);
  assert.equal(env.store.get('conexpass_refresh_token'), 'refresh-2');
  for (const config of env.calls.filter((c) => c.url === '/checkin'))
    assert.equal(config.headers.Authorization, 'Bearer access-2');
});

test('restaura sem access persistido e preserva refresh em rede/500; retry futuro funciona', async () => {
  const env = setup();
  env.store.set('conexpass_refresh_token', 'refresh-old');
  for (const status of [0, 500]) {
    env.setHandler(async () => {
      if (!status) throw new Error('offline');
      return { status };
    });
    await assert.rejects(env.authService.restoreSession());
    assert.equal(env.store.get('conexpass_refresh_token'), 'refresh-old');
  }
  env.setHandler(async (c) => ({
    data: c.url === '/auth/refresh' ? env.token('restored') : { id: 7 },
  }));
  assert.deepEqual(await env.authService.restoreSession(), { id: 7 });
  assert.equal(env.getAccessToken(), 'access-restored');
});

test('401 SESSION_EXPIRED limpa sessão e notifica uma vez com cinco chamadas', async () => {
  const env = setup();
  let notified = 0;
  env.setOnUnauthorized(() => {
    notified++;
  });
  env.store.set('conexpass_refresh_token', 'expired');
  env.setHandler(async () => ({
    status: 401,
    data: { status: { codigo: 'SESSION_EXPIRED' } },
  }));
  const results = await Promise.allSettled(
    Array.from({ length: 5 }, () => env.authService.refreshToken())
  );
  assert.ok(results.every((r) => r.status === 'rejected'));
  assert.equal(env.calls.length, 1);
  assert.equal(notified, 1);
  assert.equal(env.store.size, 0);
});

test('403 e 401 genérico não renovam e não repetem check-in/checkout', async () => {
  const env = setup();
  await env.authService.login('user@test', 'secret');
  for (const status of [403, 401]) {
    env.setHandler(async () => ({ status }));
    await assert.rejects(env.api.get('/users'));
    await assert.rejects(env.api.post('/checkin'));
    await assert.rejects(env.api.post('/checkout'));
  }
  assert.equal(env.calls.filter((c) => c.url === '/auth/refresh').length, 0);
  assert.equal(env.calls.filter((c) => c.url === '/checkin').length, 2);
});

test('logout em voo impede restauração e revoga refresh novo', async () => {
  const env = setup();
  await env.authService.login('user@test', 'secret');
  let complete;
  let started;
  const ready = new Promise((resolve) => {
    started = resolve;
  });
  env.setHandler((c) => {
    if (c.url === '/auth/refresh')
      return new Promise((resolve) => {
        complete = resolve;
        started();
      });
    return { data: {} };
  });
  const pending = env.authService.restoreSession();
  const rejected = assert.rejects(pending);
  await ready;
  const logout = env.authService.logout();
  assert.equal(env.getAccessToken(), null);
  complete({ data: env.token('stale') });
  await rejected;
  await logout;
  assert.equal(env.store.size, 0);
  assert.equal(env.getAccessToken(), null);
  assert.ok(
    env.calls.some(
      (c) =>
        c.url === '/auth/logout' &&
        JSON.parse(c.data).refreshToken === 'refresh-stale'
    )
  );
});

test('leitura com access expirando durante a chamada repete apenas uma vez', async () => {
  const env = setup();
  await env.authService.login('user@test', 'secret');
  env.setHandler((c) => {
    if (c.url === '/auth/refresh') return { data: env.token('2') };
    env.advance(900000);
    return { status: 401 };
  });
  await assert.rejects(env.api.get('/users'));
  assert.equal(env.calls.filter((c) => c.url === '/users').length, 2);
  assert.equal(env.calls.filter((c) => c.url === '/auth/refresh').length, 1);
});

test('cinco 401 simultâneos de leituras expiradas compartilham refresh', async () => {
  const env = setup();
  await env.authService.login('user@test', 'secret');
  let release;
  const requests = [];
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  env.setHandler(async (c) => {
    if (c.url === '/auth/refresh') return { data: env.token('2') };
    if (c.headers.Authorization === 'Bearer access-1') {
      requests.push(c);
      if (requests.length === 5) {
        env.advance(900000);
        release();
      }
      await gate;
      return { status: 401 };
    }
    return { data: { ok: true } };
  });
  await Promise.all(Array.from({ length: 5 }, () => env.api.get('/history')));
  assert.equal(env.calls.filter((c) => c.url === '/auth/refresh').length, 1);
  assert.equal(env.calls.filter((c) => c.url === '/history').length, 10);
});

test('logout offline limpa credenciais e informa falha remota sem expor tokens', async () => {
  const env = setup();
  await env.authService.login('user@test', 'secret');
  env.setHandler(async () => {
    throw new Error('offline');
  });
  assert.deepEqual(await env.authService.logout(), { remoteRevoked: false });
  assert.equal(env.store.size, 0);
  assert.equal(env.getAccessToken(), null);
});

test('sem refresh salvo solicita login e remove access legado', async () => {
  const env = setup();
  env.store.set('conexpass_token', 'legacy');
  assert.equal(await env.authService.restoreSession(), null);
  assert.equal(env.calls.length, 0);
  assert.equal(env.store.size, 0);
});
