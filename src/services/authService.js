import * as SecureStore from 'expo-secure-store';
import { api, TOKEN_KEY } from './api';
import { ENDPOINTS } from '../config/api';

const USER_KEY = 'conexpass_user';

function onlyDigits(value = '') {
  return value.replace(/\D/g, '');
}

async function persistSession(token, user) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export const authService = {
  // POST /auth/login  { identifier, password } -> { token, user }
  async login(identifier, password) {
    
    const payload = { email: identifier.trim(), senha: password };

    const { data } = await api.post(ENDPOINTS.login, payload);
    await persistSession(data.token.accessToken, data.user);
    return data.user;
  },

  // POST /auth/register { name, email, cpf, password } -> { token, user }
  async register(payload) {
    const { data } = await api.post(ENDPOINTS.register, payload);
    return data;
  },

  // POST /auth/forgot-password { email } -> { message }
  async forgotPassword(email) {
    const { data } = await api.post(ENDPOINTS.forgotPassword, { email: email.trim() });
    return data;
  },

  // GET /users/me -> valida o token salvo e retorna o usuário atualizado
  async getMe() {
    const { data } = await api.get(ENDPOINTS.me);
    return data;
  },

  async logout() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },

  async getStoredToken() {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  async getStoredUser() {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
};
