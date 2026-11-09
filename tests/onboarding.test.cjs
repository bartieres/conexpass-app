const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs
  .readFileSync('src/services/onboardingService.js', 'utf8')
  .replace(/import .*?;\n/g, '')
  .replace(/export /g, '');
function setup(store = new Map(), failWrite = false) {
  const AsyncStorage = {
    getItem: async (key) => store.get(key) ?? null,
    setItem: async (key, value) => {
      if (failWrite) throw Error('storage');
      store.set(key, value);
    },
  };
  return new Function(
    'AsyncStorage',
    `${source}; return {ONBOARDING_KEY,isOnboardingCompleted,completeOnboarding};`
  )(AsyncStorage);
}

test('onboarding não concluído, conclusão e leitura após reiniciar usam a mesma chave', async () => {
  const store = new Map();
  const first = setup(store);
  assert.equal(await first.isOnboardingCompleted(), false);
  await first.completeOnboarding();
  const restarted = setup(store);
  assert.equal(await restarted.isOnboardingCompleted(), true);
  assert.equal(store.get(restarted.ONBOARDING_KEY), 'true');
});

test('conclusão antiga é reconhecida e migrada sem exibir a apresentação novamente', async () => {
  const store = new Map([['@conexpass:onboarding_completed', 'true']]);
  const env = setup(store);
  assert.equal(await env.isOnboardingCompleted(), true);
  assert.equal(store.get(env.ONBOARDING_KEY), 'true');
});

test('falha ao migrar não apaga conclusão antiga; falha ao concluir não confirma gravação', async () => {
  const legacy = setup(
    new Map([['@conexpass:onboarding_completed', 'true']]),
    true
  );
  assert.equal(await legacy.isOnboardingCompleted(), true);
  const first = setup(new Map(), true);
  await assert.rejects(first.completeOnboarding(), /storage/);
  assert.equal(await first.isOnboardingCompleted(), false);
});
