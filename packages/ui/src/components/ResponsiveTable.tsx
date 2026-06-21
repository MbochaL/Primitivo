import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useBreakpoint } from '../hooks/useBreakpoint';
import { theme } from '../theme';
import { Label } from './Typography';

export interface Column<T> {
  key: string;
  header: string;
  /** Contenido de la celda. */
  render: (row: T) => ReactNode;
  /** Peso relativo de la columna en desktop. */
  flex?: number;
  /** Ocultar esta columna en las cards de mobile. */
  hideOnMobile?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowPress?: (row: T) => void;
  /** Acciones por fila (editar/borrar). A la derecha en desktop, abajo en mobile. */
  rowActions?: (row: T) => ReactNode;
}

/**
 * Tabla responsiva: en desktop/tablet es una tabla (header 2px + filas 1px); en mobile
 * cada fila colapsa a una card con pares etiqueta/valor. Sin bordes verticales (estética
 * editorial).
 */
export function ResponsiveTable<T>({ columns, data, keyExtractor, onRowPress, rowActions }: Props<T>) {
  const { isMobile } = useBreakpoint();

  if (isMobile) {
    return (
      <View style={styles.cards}>
        {data.map((row) => (
          <Pressable
            key={keyExtractor(row)}
            style={styles.card}
            onPress={onRowPress ? () => onRowPress(row) : undefined}
          >
            {columns
              .filter((c) => !c.hideOnMobile)
              .map((c) => (
                <View key={c.key} style={styles.cardRow}>
                  <Label>{c.header}</Label>
                  <View style={styles.cardValue}>{c.render(row)}</View>
                </View>
              ))}
            {rowActions ? <View style={styles.cardActions}>{rowActions(row)}</View> : null}
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        {columns.map((c) => (
          <View key={c.key} style={{ flex: c.flex ?? 1 }}>
            <Label>{c.header}</Label>
          </View>
        ))}
        {rowActions ? <View style={styles.actionsCol} /> : null}
      </View>
      {data.map((row) => (
        <Pressable
          key={keyExtractor(row)}
          style={styles.dataRow}
          onPress={onRowPress ? () => onRowPress(row) : undefined}
        >
          {columns.map((c) => (
            <View key={c.key} style={{ flex: c.flex ?? 1 }}>
              {c.render(row)}
            </View>
          ))}
          {rowActions ? <View style={styles.actionsCol}>{rowActions(row)}</View> : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderWidth: 2,
    borderColor: theme.colors.black,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.gutter,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.black,
    backgroundColor: theme.colors.surfaceVariant,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.gutter,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  actionsCol: { width: 96, alignItems: 'flex-end' },
  cards: { gap: theme.spacing.md },
  card: {
    borderWidth: 2,
    borderColor: theme.colors.black,
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: theme.spacing.gutter,
    gap: theme.spacing.sm,
    ...theme.shadows.ink,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  cardValue: { flexShrink: 1, alignItems: 'flex-end' },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    paddingTop: theme.spacing.sm,
  },
});
