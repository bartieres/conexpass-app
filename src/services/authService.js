import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import {
  api,
  TOKEN_KEY,
  setAccessToken,
  getAccessToken,
  invalidateSession,
  setRefreshSession,
  notifyUnauthorized,
} from '../config/api';

const USER_KEY = 'conexpass_user';
const REFRESH_TOKEN_KEY = 'conexpass_refresh_token';
const authApi = axios.create({
  baseURL: api.defaults.baseURL,
  timeout: api.defaults.timeout,
  headers: { 'Content-Type': 'application/json', 'X-Client-Type': 'APP' },
});
let sessionGeneration = 0;
let refreshPromise = null;
let storagePromise = Promise.resolve();

function updateStorage(operation) {
  const pending = storagePromise.then(operation);
  storagePromise = pending.catch(() => {});
  return pending;
}

function assertCurrentSession(generation) {
  if (generation !== sessionGeneration) {
    throw new Error('A sessão foi encerrada ou substituída.');
  }
}

async function clearSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
}

async function persistSession(token, generation, user) {
  if (!token?.accessToken || !token?.refreshToken) {
    throw new Error('Resposta de autenticação sem os tokens esperados.');
  }
  await updateStorage(async () => {
    assertCurrentSession(generation);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token.refreshToken);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    if (user !== undefined) {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    }
    assertCurrentSession(generation);
    setAccessToken(token.accessToken, token.expiresIn);
  });
}

export const authService = {
  // POST /auth/login  { identifier, password } -> { token, user }
  async login(identifier, password) {
    const generation = ++sessionGeneration;
    invalidateSession();
    const payload = { email: identifier.trim(), senha: password };

    const { data } = await api.post(
      '/auth/login',
      {
        ...payload,
      },
      {
        headers: {
          'X-Client-Type': 'APP',
        },
      }
    );
    await persistSession(data.token, generation, data.user);
    return data.user;
  },

  // Uma única renovação por vez: o backend rotaciona o refresh token.
  refreshToken() {
    if (refreshPromise?.generation === sessionGeneration) {
      return refreshPromise.promise;
    }
    const generation = sessionGeneration;
    const pending = (async () => {
      try {
        await storagePromise;
        assertCurrentSession(generation);
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        assertCurrentSession(generation);
        const { data } = await authApi.post('/auth/refresh', { refreshToken });
        if (generation !== sessionGeneration) {
          await authApi
            .post('/auth/logout', { refreshToken: data.refreshToken })
            .catch(() => {
              const error = new Error(
                'Não foi possível revogar a sessão no servidor.'
              );
              error.remoteRevocationFailed = true;
              throw error;
            });
          assertCurrentSession(generation);
        }
        await persistSession(data, generation);
        return data;
      } catch (error) {
        if (
          generation === sessionGeneration &&
          error.response?.status === 401 &&
          error.response?.data?.status?.codigo === 'SESSION_EXPIRED'
        ) {
          sessionGeneration += 1;
          invalidateSession();
          await updateStorage(clearSession);
          notifyUnauthorized();
        }
        const safeError = new Error(
          error.response?.data?.status?.messages?.[0] ||
            'Não foi possível renovar sua sessão. Verifique a conexão e tente novamente.'
        );
        safeError.friendlyMessage = safeError.message;
        safeError.remoteRevocationFailed = error.remoteRevocationFailed;
        safeError.response = error.response
          ? { status: error.response.status, data: error.response.data }
          : undefined;
        throw safeError;
      }
    })();
    const promise = pending.finally(() => {
      if (refreshPromise?.promise === promise) refreshPromise = null;
    });
    refreshPromise = { generation, promise };
    return promise;
  },

  // POST /auth/register { name, email, cpf, password } -> { token, user }
  async register(payload) {
    const { data } = await api.post('/auth/register', payload, {
      headers: { 'X-Client-Type': 'APP' },
    });
    return data;
  },

  // POST /auth/forgot-password { email } -> { message }
  async forgotPassword(email) {
    const { data } = await api.post(
      '/auth/forgot-password',
      { email: email.trim() },
      { headers: { 'X-Client-Type': 'APP' } }
    );
    return data;
  },

  // GET /users/me -> valida o token salvo e retorna o usuário atualizado
  async getMe() {
    const { data } = await api.get('/users', {
      headers: { 'X-Client-Type': 'APP' },
    });
    return data;
  },

  async logout() {
    sessionGeneration += 1;
    invalidateSession();
    notifyUnauthorized();
    const pendingRefresh = refreshPromise?.promise;
    let refreshToken;
    await updateStorage(async () => {
      refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      await clearSession();
    });
    // A renovação obsoleta revoga o token novo antes de finalizar.
    const remoteLogout = async () => {
      if (pendingRefresh)
        await pendingRefresh.catch((error) => {
          if (error.remoteRevocationFailed) throw error;
        });
      if (refreshToken) await authApi.post('/auth/logout', { refreshToken });
    };
    return remoteLogout().then(
      () => ({ remoteRevoked: true }),
      () => ({ remoteRevoked: false })
    );
  },

  async getStoredToken() {
    return getAccessToken();
  },

  async restoreSession() {
    const generation = sessionGeneration;
    await storagePromise;
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    assertCurrentSession(generation);
    if (!refreshToken) {
      await updateStorage(async () => {
        assertCurrentSession(generation);
        await clearSession();
      });
      return null;
    }
    await authService.refreshToken();
    const user = await authService.getMe();
    assertCurrentSession(generation);
    await updateStorage(async () => {
      assertCurrentSession(generation);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    });
    return user;
  },

  async ensureSession() {
    // O interceptor renova apenas se o access estiver próximo de expirar.
    return authService.getMe();
  },

  async getStoredUser() {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
};

setRefreshSession(() => authService.refreshToken());
