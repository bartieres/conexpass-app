// Exemplo de integração: NÃO substitua sua lógica atual de autenticação.
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_KEY } from './OnboardingScreen';

export function useOnboardingCompleted() {
  const [completed, setCompleted] = useState(null);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then(value => { if (active) setCompleted(value === 'done'); })
      .catch(() => { if (active) setCompleted(false); });
    return () => { active = false; };
  }, []);
  return completed; // null = carregando, false = mostrar onboarding, true = fluxo existente
}

// Registre OnboardingScreen no mesmo Stack que a rota de destino (ex.: Login).
// Na inicialização, se completed === false, navegue para Onboarding.
// Caso contrário, preserve seu fluxo atual (sessão ativa, login ou explorar).
