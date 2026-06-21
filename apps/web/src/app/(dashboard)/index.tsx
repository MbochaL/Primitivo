import {
  Body,
  Card,
  Icon,
  Label,
  Screen,
  StatCard,
  theme,
  Title,
  type IconName,
} from '@primitivo/ui';
import { Redirect } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useAuth } from '@/lib/auth';

// NOTA: métricas y actividad son datos de ejemplo (placeholder). Se conectarán cuando
// existan los endpoints de clientes/compras/canjes en el backend.
const ACTIVIDAD = [
  { icon: 'person-add' as IconName, titulo: 'Nuevo cliente', detalle: 'DNI 30.123.456', cuando: 'hace 10 min' },
  { icon: 'point-of-sale' as IconName, titulo: 'Compra registrada', detalle: '$ 4.680 · 3 ítems', cuando: 'hace 1 h' },
  { icon: 'redeem' as IconName, titulo: 'Beneficio canjeado', detalle: '5 infusiones → 20%', cuando: 'hace 3 h' },
];

export default function DashboardScreen() {
  const { esAdmin } = useAuth();
  const { width } = useWindowDimensions();

  // El overview (reportes/estadísticas) es exclusivo de administrador (sección 9).
  if (!esAdmin) {
    return <Redirect href="/clientes" />;
  }

  const isWide = width >= 1024;
  const cardWidth = isWide ? '32%' : '100%';

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Title>Overview</Title>
        <Body style={styles.subtitle}>Métricas y actividad reciente de la red.</Body>
      </View>

      <View style={styles.grid}>
        <View style={{ width: cardWidth }}>
          <StatCard label="Total Clientes" value="—" icon="group" tone="surface" />
        </View>
        <View style={{ width: cardWidth }}>
          <StatCard label="Infusiones" value="—" icon="local-cafe" tone="inverse" />
        </View>
        <View style={{ width: cardWidth }}>
          <StatCard label="Instituciones" value="—" icon="domain" tone="tan" />
        </View>
      </View>

      <View style={styles.activityHeader}>
        <Label style={styles.activityTitle}>Actividad reciente</Label>
      </View>

      <Card padded={false}>
        {ACTIVIDAD.map((a, i) => (
          <View key={a.titulo} style={[styles.row, i < ACTIVIDAD.length - 1 && styles.rowBorder]}>
            <View style={styles.iconBox}>
              <Icon name={a.icon} size={20} color={theme.colors.white} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{a.titulo}</Text>
              <Label>{a.detalle}</Label>
            </View>
            <Label>{a.cuando}</Label>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: theme.spacing.lg },
  subtitle: { color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xs },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  activityHeader: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.black,
    paddingBottom: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  activityTitle: { fontSize: theme.typography.fontSize.headlineMd, color: theme.colors.black },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.gutter,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.black },
  iconBox: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.bodyMd,
    color: theme.colors.onSurface,
  },
});
