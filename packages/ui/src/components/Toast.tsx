import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';

import { theme } from '../theme';
import { Body } from './Typography';
import { Icon, type IconName } from './Icon';

type ToastKind = 'info' | 'success' | 'error';

interface ToastItem {
  id: string;
  message: string;
  kind: ToastKind;
}

interface ToastApi {
  show: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICON: Record<ToastKind, IconName> = {
  info: 'info',
  success: 'check-circle',
  error: 'error',
};

const ACCENT: Record<ToastKind, string> = {
  info: theme.colors.black,
  success: theme.colors.success,
  error: theme.colors.danger,
};

/** Provee toasts no intrusivos (auto-descartan a los 4s). Envolver la app una vez. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m) => show(m, 'success'),
      error: (m) => show(m, 'error'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((t) => (
          <View key={t.id} style={[styles.toast, { borderLeftColor: ACCENT[t.kind] }]}>
            <Icon name={ICON[t.kind]} size={20} color={ACCENT[t.kind]} />
            <Body style={styles.message}>{t.message}</Body>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

/** Acceso a los toasts desde cualquier pantalla. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { show: () => {}, success: () => {}, error: () => {} };
  }
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: theme.spacing.md,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: theme.spacing.sm,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    width: '92%',
    maxWidth: 480,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: theme.colors.black,
    borderLeftWidth: 6,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadows.ink,
  },
  message: { flex: 1 },
});

export type { ToastKind };
