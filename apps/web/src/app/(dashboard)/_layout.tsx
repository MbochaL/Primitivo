import { theme } from '@primitivo/ui';
import { Redirect, Slot } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/lib/auth';

export default function DashboardLayout() {
  const { estado } = useAuth();

  if (estado === 'cargando') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.black} />
      </View>
    );
  }

  // Toda el área de dashboard requiere sesión.
  if (estado === 'no_autenticado') {
    return <Redirect href="/login" />;
  }

  return (
    <AppShell>
      <Slot />
    </AppShell>
  );
}

const styles = {
  loading: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: theme.colors.surface,
  },
};
