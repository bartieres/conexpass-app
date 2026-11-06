import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { authService } from '../services/authService';
import { AppState, Alert } from 'react-native';
import { setOnUnauthorized, getSessionVersion } from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBooting, setIsBooting] = useState(true); // checando sessão salva ao abrir o app

  const [sessionError, setSessionError] = useState(null);
  const restorationRef = useRef(null);

  const restoreSession = useCallback(() => {
    if (restorationRef.current) return restorationRef.current;
    const version = getSessionVersion();
    setSessionError(null);
    setIsBooting(true);
    const pending = authService
      .restoreSession()
      .then(
        (restoredUser) => {
          if (version === getSessionVersion()) setUser(restoredUser);
        },
        (error) => {
          if (version === getSessionVersion()) {
            setSessionError(
              error.friendlyMessage ||
                'Não foi possível restaurar sua sessão. Tente novamente.'
            );
          }
        }
      )
      .finally(() => {
        restorationRef.current = null;
        setIsBooting(false);
      });
    restorationRef.current = pending;
    return pending;
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
      setSessionError(null);
      setIsBooting(false);
    });
    return () => setOnUnauthorized(null);
  }, []);

  useEffect(() => {
    // A restauração é uma operação assíncrona compartilhada entre tentativas.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (!user) return;
    let previousState = AppState.currentState;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && previousState !== 'active') {
        authService.ensureSession().catch(() => {
          // Falhas transitórias não apagam a sessão; a próxima chamada pode tentar novamente.
        });
      }
      previousState = state;
    });
    return () => subscription.remove();
  }, [user]);

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
    setUser(null);
    setSessionError(null);
    const result = await authService.logout();
    if (!result.remoteRevoked) {
      Alert.alert(
        'Você saiu do aplicativo',
        'Não foi possível confirmar o encerramento no servidor. A sessão no servidor poderá permanecer ativa até expirar.'
      );
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isBooting,
    sessionError,
    retrySession: restoreSession,
    login,
    register,
    forgotPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error('useAuth precisa ser usado dentro de <AuthProvider>');
  return ctx;
}
