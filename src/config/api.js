import axios from 'axios';
import constants from '../shared/constants';

// Mantida apenas para remover credenciais persistidas por versões anteriores.
export const TOKEN_KEY = 'conexpass_token';
let accessToken = null;
let accessExpiresAt = 0;
let sessionVersion = 0;
let refreshSession = null;
let onUnauthorized = null;

export function setAccessToken(token, expiresIn = 0) {
  accessToken = token;
  accessExpiresAt = token ? Date.now() + expiresIn : 0;
}

export function invalidateSession() {
  sessionVersion += 1;
  setAccessToken(null);
}

export function getSessionVersion() {
  return sessionVersion;
}

export function getAccessToken() {
  return accessToken;
}

export function setRefreshSession(callback) {
  refreshSession = callback;
}

export function setOnUnauthorized(callback) {
  onUnauthorized = callback;
}

export function notifyUnauthorized() {
  onUnauthorized?.();
}

export const api = axios.create({
  baseURL: `${constants.URL.LOCATION.api}/api`,
  paramsSerializer: { indexes: null },
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', 'X-Client-Type': 'APP' },
});

const isPublic = (config) => /^\/?auth\//.test(config.url ?? '');

api.interceptors.request.use(async (config) => {
  config.headers['X-Client-Type'] = 'APP';
  if (isPublic(config)) {
    delete config.headers.Authorization;
    return config;
  }
  const version = sessionVersion;
  if (accessToken && accessExpiresAt <= Date.now() + 30000 && refreshSession) {
    await refreshSession();
  }
  if (
    version !== sessionVersion ||
    (config._sessionVersion !== undefined && config._sessionVersion !== version)
  ) {
    throw new Error('A sessão foi encerrada ou substituída.');
  }
  config._sessionVersion = version;
  config._accessExpiresAt = accessExpiresAt;
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  else delete config.headers.Authorization;
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (
      !isPublic(response.config) &&
      response.config._sessionVersion !== sessionVersion
    ) {
      return Promise.reject(
        new Error('A sessão foi encerrada ou substituída.')
      );
    }
    return response;
  },
  async (error) => {
    const config = error.config;
    // O filtro JWT atual não distingue expiração de outras causas de 401.
    // Só repetimos leituras com access comprovadamente expirado, uma vez.
    if (
      config &&
      !isPublic(config) &&
      !config._retry &&
      config._sessionVersion === sessionVersion &&
      error.response?.status === 401 &&
      config._accessExpiresAt > 0 &&
      config._accessExpiresAt <= Date.now() &&
      ['get', 'head', 'options'].includes(
        (config.method ?? 'get').toLowerCase()
      ) &&
      refreshSession
    ) {
      config._retry = true;
      try {
        if (config.headers.Authorization === `Bearer ${accessToken}`)
          await refreshSession();
        return await api(config);
      } catch (refreshError) {
        error = refreshError;
      }
    }
    // Não devolvemos config/request: podem conter tokens ou credenciais.
    const safeError = new Error(
      error.response?.data?.status?.messages?.[0] ||
        error.response?.data?.message ||
        'Não foi possível concluir a solicitação. Tente novamente.'
    );
    safeError.friendlyMessage = safeError.message;
    safeError.response = error.response
      ? { status: error.response.status, data: error.response.data }
      : undefined;
    return Promise.reject(safeError);
  }
);
