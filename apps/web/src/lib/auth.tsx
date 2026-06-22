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
  usuarioId: string | null;
  login: (email: string, password: string) => Promise<Rol | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Decodifica el payload de un JWT (sin verificar la firma). */
function decodePayload(token: string): { rol?: string; sub?: string; exp?: number } {
  try {
    const payload = token.split('.')[1];
    if (!payload) return {};
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as { rol?: string; sub?: string; exp?: number };
  } catch {
    return {};
  }
}

function decodeRol(token: string): Rol | null {
  const { rol } = decodePayload(token);
  if (rol === 'administrador' || rol === 'operador') return rol;
  return null;
}

function decodeSub(token: string): string | null {
  return decodePayload(token).sub ?? null;
}

/** Devuelve true si el token tiene `exp` y ya pasó. Tokens sin `exp` nunca expiran. */
function tokenEstaExpirado(token: string): boolean {
  const { exp } = decodePayload(token);
  if (!exp) return false;
  return Date.now() / 1000 > exp;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>('cargando');
  const [rol, setRol] = useState<Rol | null>(null);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);

  const aplicarToken = useCallback((accessToken: string) => {
    setAuthToken(accessToken);
    setRol(decodeRol(accessToken));
    setUsuarioId(decodeSub(accessToken));
    setEstado('autenticado');
  }, []);

  // Rehidrata la sesión al arrancar.
  // Si el access token expiró (tokens viejos de 15min), intenta renovar con el refresh token.
  useEffect(() => {
    (async () => {
      const [[, access], [, refresh]] = await AsyncStorage.multiGet([ACCESS_KEY, REFRESH_KEY]);

      // Token válido y no expirado → usar directamente.
      if (access && !tokenEstaExpirado(access)) {
        aplicarToken(access);
        return;
      }

      // Token expirado o ausente → intentar renovar.
      if (refresh) {
        try {
          const tokens = await AuthService.postAuthRefresh({ refresh_token: refresh });
          if (tokens.access_token) {
            await AsyncStorage.setItem(ACCESS_KEY, tokens.access_token);
            if (tokens.refresh_token) {
              await AsyncStorage.setItem(REFRESH_KEY, tokens.refresh_token);
            }
            aplicarToken(tokens.access_token);
            return;
          }
        } catch {
          // Refresh fallido (token revocado o secreto cambiado): limpiar y pedir login.
          await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
        }
      }

      setEstado('no_autenticado');
    })();
  }, [aplicarToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await AuthService.postAuthLogin({ email, password });
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
    setUsuarioId(null);
    setEstado('no_autenticado');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      estado,
      rol,
      esAdmin: rol === 'administrador',
      usuarioId,
      login,
      logout,
    }),
    [estado, rol, usuarioId, login, logout],
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
