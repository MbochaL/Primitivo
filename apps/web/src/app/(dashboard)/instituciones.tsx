import { Body, Screen, theme, Title } from '@primitivo/ui';
import { Redirect } from 'expo-router';
import { StyleSheet } from 'react-native';

import { useAuth } from '@/lib/auth';

export default function InstitucionesScreen() {
  const { esAdmin } = useAuth();
  if (!esAdmin) return <Redirect href="/clientes" />;

  return (
    <Screen>
      <Title>Instituciones</Title>
      <Body style={styles.p}>Convenios: crear y editar instituciones. (en construcción)</Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  p: { color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.sm },
});
