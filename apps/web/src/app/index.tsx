import { HealthService } from '@primitivo/api-client';
import { theme } from '@primitivo/ui';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

// Usa la operación tipada generada desde el OpenAPI del backend: si el contrato del
// endpoint cambia en Go y se regenera el cliente, esto deja de compilar.
function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => HealthService.getHealth(),
    retry: false,
  });
}

export default function HomeScreen() {
  const { data, isLoading, isError } = useHealth();

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>PAN · CAFÉ · COCINA</Text>
      <Text style={styles.title}>Primitivo</Text>
      <Text style={styles.subtitle}>Sistema de beneficios y fidelización</Text>

      <View style={styles.statusRow}>
        {isLoading ? (
          <ActivityIndicator color={theme.colors.black} />
        ) : (
          <Text style={styles.status}>
            {isError ? 'API: sin conexión' : `API: ok · BD ${data?.db}`}
          </Text>
        )}
      </View>

      <Link href="/login" style={styles.link}>
        Ingresar →
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  kicker: {
    color: theme.colors.gray500,
    fontSize: theme.typography.fontSize.caption,
    letterSpacing: 3,
  },
  title: {
    color: theme.colors.black,
    fontSize: theme.typography.fontSize.display,
    fontWeight: theme.typography.fontWeight.bold,
  },
  subtitle: {
    color: theme.colors.gray700,
    fontSize: theme.typography.fontSize.subtitle,
  },
  statusRow: {
    marginTop: theme.spacing.lg,
    minHeight: 24,
    justifyContent: 'center',
  },
  status: {
    color: theme.colors.gray500,
    fontSize: theme.typography.fontSize.body,
  },
  link: {
    marginTop: theme.spacing.lg,
    color: theme.colors.black,
    fontSize: theme.typography.fontSize.subtitle,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
