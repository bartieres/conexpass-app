
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/login/LoginScreen';
import RegisterScreen from './src/screens/create-user/RegisterScreen';
import RegisterSuccessScreen from './src/screens/create-user/RegisterSuccessScreen';
import ForgotPasswordScreen from './src/screens/password/ForgotPasswordScreen';
import ForgotPasswordSuccessScreen from './src/screens/password/ForgotPasswordSuccessScreen';

import SplashLoadingScreen from './src/screens/SplashLoadingScreen';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';

import MainTabs from './src/navigation/MainTabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Stack = createNativeStackNavigator();

const ONBOARDING_KEY = '@conexpass:onboarding_completed';

// O deep linking para detalhes de estabelecimentos será configurado
// quando a estrutura de navegação de MainTabs for confirmada.

function RootNavigator() {
  const { isAuthenticated, isBooting } = useAuth();

  const [onboardingConcluido, setOnboardingConcluido] = useState(null);

  useEffect(() => {
    let ativo = true;

    async function verificarOnboarding() {
      try {
        const concluido = await AsyncStorage.getItem(ONBOARDING_KEY);

        if (ativo) {
          setOnboardingConcluido(concluido === 'true');
        }
      } catch (error) {
        console.error('Erro ao verificar onboarding:', error);

        if (ativo) {
          setOnboardingConcluido(false);
        }
      }
    }

    verificarOnboarding();

    return () => {
      ativo = false;
    };
  }, []);

  const finalizarOnboarding = () => {
    setOnboardingConcluido(true);
  };

  // Aguarda a validação do token e a leitura do primeiro acesso.
  if (isBooting || onboardingConcluido === null) {
    return <SplashLoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!onboardingConcluido ? (
        <Stack.Screen name="Onboarding">
          {(props) => (
            <OnboardingScreen
              {...props}
              onFinish={finalizarOnboarding}
            />
          )}
        </Stack.Screen>
      ) : isAuthenticated ? (
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
        />
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
          />

          <Stack.Screen
            name="Register"
            component={RegisterScreen}
          />

          <Stack.Screen
            name="RegisterSuccess"
            component={RegisterSuccessScreen}
          />

          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />

          <Stack.Screen
            name="ForgotPasswordSuccess"
            component={ForgotPasswordSuccessScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
