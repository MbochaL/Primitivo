import { StyleSheet, View, type DimensionValue } from 'react-native';

import { theme } from '../theme';

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
};

/** Bloque gris de carga (placeholder). */
export function Skeleton({ width = '100%', height = 16 }: SkeletonProps) {
  return <View style={[styles.block, { width, height }]} />;
}

/** Skeleton para listas/tablas: varias filas con barras. */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <View style={styles.tableCard}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={[styles.row, i < rows - 1 && styles.rowBorder]}>
          <Skeleton width={40} height={40} />
          <View style={styles.rowText}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="35%" height={11} />
          </View>
          <Skeleton width={48} height={24} />
        </View>
      ))}
    </View>
  );
}

/** Skeleton de una tarjeta (ej. detalle, stat card). */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <View style={styles.card}>
      <Skeleton width="50%" height={24} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i % 2 === 0 ? '100%' : '70%'} height={14} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: theme.radii.sharp,
  },
  tableCard: { borderWidth: 2, borderColor: theme.colors.black },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing.gutter },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant },
  rowText: { flex: 1, gap: theme.spacing.sm },
  card: {
    borderWidth: 2,
    borderColor: theme.colors.black,
    padding: theme.spacing.gutter,
    gap: theme.spacing.md,
  },
});
