import { Body, Screen, theme, Title } from '@primitivo/ui';
import { Redirect } from 'expo-router';
import { StyleSheet } from 'react-native';

import { useAuth } from '@/lib/auth';

export default function MenuScreen() {
  const { esAdmin } = useAuth();
  if (!esAdmin) return <Redirect href="/clientes" />;

  return (
    <Screen>
      <Title>Menú</Title>
      <Body style={styles.p}>Gestión de categorías y productos. (en construcción)</Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  p: { color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.sm },
});
