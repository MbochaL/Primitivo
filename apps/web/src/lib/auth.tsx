import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService, setAuthToken } from '@primitivo/api-client';
import type { Rol } from '@primitivo/types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const ACCESS_KEY = 'primitivo.access_token';
const REFRESH_KEY = 'primitivo.refresh_token';

type Estado = 'cargando' | 'autenticado' | 'no_autenticado';

interface AuthContextValue {
  estado: Estado;
  rol: Rol | null;
  esAdmin: boolean;
  login: (email: string, password: string) => Promise<Rol | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Decodifica el claim `rol` del payload de un JWT (sin verificar la firma). */
function decodeRol(token: string): Rol | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const data = JSON.parse(json) as { rol?: string };
    if (data.rol === 'administrador' || data.rol === 'operador') {
      return data.rol;
    }
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>('cargando');
  const [rol, setRol] = useState<Rol | null>(null);

  const aplicarToken = useCallback((accessToken: string) => {
    setAuthToken(accessToken);
    setRol(decodeRol(accessToken));
    setEstado('autenticado');
  }, []);

  // Rehidrata la sesión al arrancar.
  useEffect(() => {
    (async () => {
      const accessToken = await AsyncStorage.getItem(ACCESS_KEY);
      if (accessToken) {
        aplicarToken(accessToken);
      } else {
        setEstado('no_autenticado');
      }
    })();
  }, [aplicarToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await AuthService.postAuthLogin({ requestBody: { email, password } });
      if (!tokens.access_token) {
        throw new Error('Respuesta de login inválida');
      }
      await AsyncStorage.setItem(ACCESS_KEY, tokens.access_token);
      if (tokens.refresh_token) {
        await AsyncStorage.setItem(REFRESH_KEY, tokens.refresh_token);
      }
      aplicarToken(tokens.access_token);
      return decodeRol(tokens.access_token);
    },
    [aplicarToken],
  );

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
    setAuthToken(undefined);
    setRol(null);
    setEstado('no_autenticado');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      estado,
      rol,
      esAdmin: rol === 'administrador',
      login,
      logout,
    }),
    [estado, rol, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
