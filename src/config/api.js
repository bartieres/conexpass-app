// Configuração central de acesso ao backend (Java + Spring Boot).
//
// IMPORTANTE:
// - Em emulador Android, "localhost" do seu computador é acessado via 10.0.2.2.
// - Em dispositivo físico (Expo Go), use o IP da sua máquina na rede local,
//   ex: "http://192.168.0.15:8080/api" (celular e PC precisam estar na mesma Wi-Fi).
// - Em produção, aponte para o domínio real da API (https://api.conexpass.com.br/api).
//
// Você pode também mover isso para variáveis de ambiente com `expo-constants`
// (app.json -> "extra") quando tiver ambientes de homologação/produção.

export const API_BASE_URL = 'http://192.168.0.59:8082/api';

export const ENDPOINTS = {
  login: '/auth/login',
  register: '/auth/register',
  forgotPassword: '/auth/forgot-password',
  me: '/users',
  gyms: '/gyms',
  checkins: '/checkins',
  plans: '/plans',
  mySubscription: '/subscriptions/me',
};
