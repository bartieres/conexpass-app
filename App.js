import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen                  from './src/screens/login/LoginScreen';
import RegisterScreen               from './src/screens/create-user/RegisterScreen';
import RegisterSuccessScreen        from './src/screens/create-user/RegisterSuccessScreen';
import ForgotPasswordScreen         from './src/screens/password/ForgotPasswordScreen';
import ForgotPasswordSuccessScreen  from './src/screens/password/ForgotPasswordSuccessScreen';
import SplashLoadingScreen          from './src/screens/SplashLoadingScreen';
import MainTabs                     from './src/navigation/MainTabs';
import { AuthProvider, useAuth }    from './src/context/AuthContext';

const Stack = createNativeStackNavigator();

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
          <Stack.Screen name="RegisterSuccess" component={RegisterSuccessScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ForgotPasswordSuccess" component={ForgotPasswordSuccessScreen} />
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
