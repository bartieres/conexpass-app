import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from './src/screens/login/LoginScreen';
import RegisterScreen from './src/screens/create-user/RegisterScreen';
import RegisterSuccessScreen from './src/screens/create-user/RegisterSuccessScreen';
import ForgotPasswordScreen from './src/screens/password/ForgotPasswordScreen';
import ForgotPasswordSuccessScreen from './src/screens/password/ForgotPasswordSuccessScreen';
import SplashLoadingScreen from './src/screens/SplashLoadingScreen';
import MainTabs from './src/navigation/MainTabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Stack = createNativeStackNavigator();

// Deep linking: conexpass://estabelecimento/123 abre direto o detalhe do
// estabelecimento 123 (se o app já estiver instalado).
//
// IMPORTANTE: o mapeamento de "EstablishmentDetail" dentro de "MainTabs" abaixo
// é um PALPITE — depende de como as telas estão de fato aninhadas dentro do
// seu MainTabs.js (tabs + stack). Ajustar assim que soubermos a estrutura real.
const linking = {
  prefixes: ['conexpass://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          EstablishmentDetail: 'estabelecimento/:id',
        },
      },
    },
  },
};

function RootNavigator() {
  const { isAuthenticated, isBooting } = useAuth();

  if (isBooting) {
    // Validando token salvo (SecureStore) contra o backend antes de decidir a rota inicial
    return <SplashLoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="MainTabs" component={MainTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
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
        <NavigationContainer linking={linking}>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
