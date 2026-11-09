import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_KEY = '@conexpass:onboarding_completed';
const LEGACY_ONBOARDING_KEY = '@conexpass:onboarding_completed';

export async function isOnboardingCompleted() {
  if ((await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true') return true;
  const completed =
    (await AsyncStorage.getItem(LEGACY_ONBOARDING_KEY)) === 'true';
  if (completed) {
    // A conclusão já está registrada; uma falha na migração não deve reabrir a apresentação.
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true').catch(() => {});
  }
  return completed;
}

export async function completeOnboarding() {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}
