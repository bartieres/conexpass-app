import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import { setOnUnauthorized } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBooting, setIsBooting] = useState(true); // checando sessão salva ao abrir o app

  // Ao abrir o app: se existir token salvo, valida contra o backend (GET /users/me).
  // Se o backend confirmar, mantém o usuário logado; se não, limpa a sessão.
  useEffect(() => {
    (async () => {
      try {
        const token = await authService.getStoredToken();
        if (!token) {
          setIsBooting(false);
          return;
        }
        const freshUser = await authService.getMe();
        setUser(freshUser);
      } catch (err) {
        await authService.logout();
        setUser(null);
      } finally {
        setIsBooting(false);
      }
    })();
  }, []);

  // Se o backend responder 401 em qualquer chamada, derruba a sessão automaticamente
  useEffect(() => {
    setOnUnauthorized(() => {
      authService.logout();
      setUser(null);
    });
  }, []);

  const login = useCallback(async (identifier, password) => {
    const loggedUser = await authService.login(identifier, password);
    setUser(loggedUser);
    return loggedUser;
  }, []);

  const register = useCallback(async (payload) => {
    return authService.register(payload);
  }, []);

  const forgotPassword = useCallback(async (email) => {
    return authService.forgotPassword(email);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isBooting,
    login,
    register,
    forgotPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa ser usado dentro de <AuthProvider>');
  return ctx;
}
