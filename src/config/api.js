import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import constants from '../shared/constants';

const TOKEN_KEY = 'conexpass_token';

export const api = axios.create({
  baseURL: `${constants.URL.LOCATION.api}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Anexa o token JWT em toda requisição autenticada
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['X-Client-Type'] = 'APP';
  }
  return config;
});

// Callback opcional disparado quando o backend responde 401 (token expirado/inválido)
let onUnauthorized = null;
export function setOnUnauthorized(callback) {
  onUnauthorized = callback;
}

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }

    const message =
      error.response?.data?.status?.messages?.[0] ||
      error.response?.data?.message ||
      error.response?.data?.error ||
      (error.request && !error.response
        ? 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.'
        : 'Ocorreu um erro inesperado. Tente novamente.');

    return Promise.reject({
      ...error,
      friendlyMessage: message
    });
  }
);

export { TOKEN_KEY };
