
import { useCallback, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Onboarding from './Onboarding';

export const ONBOARDING_KEY = '@conexpass:onboarding_completed';

export default function OnboardingScreen({ onFinish }) {
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const savingRef = useRef(false);

  const finish = useCallback(async () => {
    if (savingRef.current) return;

    savingRef.current = true;
    setSaving(true);

    try {
      await AsyncStorage.setItem(
        ONBOARDING_KEY,
        'true'
      );

      // O App.js decide se deve abrir Login ou MainTabs.
      onFinish();
    } catch (error) {
      console.warn(
        'Falha ao salvar conclusão do onboarding:',
        error
      );

      savingRef.current = false;
      setSaving(false);
    }
  }, [onFinish]);

  const next = useCallback(() => {
    if (savingRef.current) return;

    if (index === 3) {
      finish();
      return;
    }

    setIndex((atual) => Math.min(atual + 1, 3));
  }, [index, finish]);

  const back = useCallback(() => {
    if (savingRef.current) return;

    setIndex((atual) => Math.max(0, atual - 1));
  }, []);

  return (
    <Onboarding
      index={index}
      saving={saving}
      onNext={next}
      onBack={back}
      onSkip={finish}
    />
  );
}
