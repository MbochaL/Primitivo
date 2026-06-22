import { ComprasService, type dto_CompraListaResponse } from '@primitivo/api-client';
import {
  Body,
  Caption,
  EmptyState,
  Icon,
  Label,
  Screen,
  TableSkeleton,
  theme,
  Title,
  useBreakpoint,
} from '@primitivo/ui';
import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/lib/auth';

// ── helpers ───────────────────────────────────────────────────────────────────

const moneda = (n: number) => `$ ${n.toLocaleString('es-AR')}`;

const fmtFecha = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
const fmtHora = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

const hoy = () => new Date().toISOString().slice(0, 10);
const offsetDays = (d: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
};
const inicioMes = () => {
  const dt = new Date();
  dt.setDate(1);
  return dt.toISOString().slice(0, 10);
};
const inicioMesAnterior = () => {
  const dt = new Date();
  dt.setDate(1);
  dt.setMonth(dt.getMonth() - 1);
  return dt.toISOString().slice(0, 10);
};
const finMesAnterior = () => {
  const dt = new Date();
  dt.setDate(0); // último día del mes anterior
  return dt.toISOString().slice(0, 10);
};

type Rango = 'hoy' | 'ayer' | 'semana' | 'mes' | 'mes_ant' | 'custom';

const RANGOS: { key: Rango; label: string }[] = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'ayer', label: 'Ayer' },
  { key: 'semana', label: 'Últimos 7 días' },
  { key: 'mes', label: 'Este mes' },
  { key: 'mes_ant', label: 'Mes anterior' },
  { key: 'custom', label: 'Personalizado' },
];

function rangoFechas(rango: Rango, customDesde: string, customHasta: string): [string, string] {
  switch (rango) {
    case 'hoy':     return [hoy(), hoy()];
    case 'ayer':    return [offsetDays(-1), offsetDays(-1)];
    case 'semana':  return [offsetDays(-6), hoy()];
    case 'mes':     return [inicioMes(), hoy()];
    case 'mes_ant': return [inicioMesAnterior(), finMesAnterior()];
    case 'custom':  return [customDesde || hoy(), customHasta || hoy()];
  }
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ReportesScreen() {
  const { esAdmin } = useAuth();
  if (!esAdmin) return <Redirect href="/clientes" />;
  return <ReportesContent />;
}

function ReportesContent() {
  const { isDesktop } = useBreakpoint();

  const [rango, setRango] = useState<Rango>('hoy');
  const [customDesde, setCustomDesde] = useState(hoy());
  const [customHasta, setCustomHasta] = useState(hoy());

  const [desde, hasta] = rangoFechas(rango, customDesde, customHasta);

  const { data: compras = [], isLoading, error } = useQuery({
    queryKey: ['compras', desde, hasta],
    queryFn: () => ComprasService.getCompras(desde, hasta),
  });

  // ── Métricas derivadas ─────────────────────────────────────────────────────
  const metricas = useMemo(() => {
    const totalVentas = compras.reduce((s, c) => s + (c.total ?? 0), 0);
    const totalDescuentos = compras.reduce((s, c) => s + (c.descuento ?? 0), 0);
    const ticketPromedio = compras.length > 0 ? Math.round(totalVentas / compras.length) : 0;
    return { totalVentas, totalDescuentos, ticketPromedio, cantidad: compras.length };
  }, [compras]);

  return (
    <Screen scroll>
      <View style={styles.pageHeader}>
        <Title>Reportes</Title>
      </View>

      {/* ── Filtro de rango ── */}
      <View style={styles.filtroSection}>
        <Label style={styles.filtroTitle}>Período</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {RANGOS.map((r) => (
              <Pressable
                key={r.key}
                style={[styles.chip, rango === r.key && styles.chipActive]}
                onPress={() => setRango(r.key)}
              >
                <Caption style={[styles.chipText, rango === r.key && styles.chipTextActive]}>
                  {r.label}
                </Caption>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {rango === 'custom' && (
          <View style={[styles.customRow, isDesktop && styles.customRowDesktop]}>
            <View style={styles.dateField}>
              <Caption style={styles.dateLabel}>Desde</Caption>
              <TextInput
                style={styles.dateInput}
                value={customDesde}
                onChangeText={setCustomDesde}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.onSurfaceVariant}
              />
            </View>
            <View style={styles.dateField}>
              <Caption style={styles.dateLabel}>Hasta</Caption>
              <TextInput
                style={styles.dateInput}
                value={customHasta}
                onChangeText={setCustomHasta}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.onSurfaceVariant}
              />
            </View>
          </View>
        )}
      </View>

      {/* ── Stat cards ── */}
      <View style={[styles.statsGrid, isDesktop && styles.statsGridDesktop]}>
        <StatBox label="Ventas" value={moneda(metricas.totalVentas)} icon="payments" />
        <StatBox label="Transacciones" value={String(metricas.cantidad)} icon="receipt-long" />
        <StatBox label="Ticket promedio" value={moneda(metricas.ticketPromedio)} icon="bar-chart" />
        <StatBox label="Descuentos" value={moneda(metricas.totalDescuentos)} icon="redeem" tone="muted" />
      </View>

      {/* ── Historial ── */}
      <View style={styles.historialHeader}>
        <Label style={styles.historialTitle}>Historial de compras</Label>
        <Caption style={{ color: theme.colors.onSurfaceVariant }}>
          {desde === hasta ? fmtFecha(desde + 'T00:00:00') : `${fmtFecha(desde + 'T00:00:00')} — ${fmtFecha(hasta + 'T00:00:00')}`}
        </Caption>
      </View>

      {isLoading && <TableSkeleton rows={8} />}

      {!isLoading && error && (
        <EmptyState icon="error-outline" title="Error al cargar" description="No se pudo obtener el historial." />
      )}

      {!isLoading && !error && compras.length === 0 && (
        <EmptyState
          icon="receipt-long"
          title="Sin ventas en este período"
          description="No hay compras registradas para el rango seleccionado."
        />
      )}

      {!isLoading && compras.length > 0 && (
        <HistorialTable compras={compras} isDesktop={isDesktop} />
      )}
    </Screen>
  );
}

// ── StatBox ───────────────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  icon,
  tone = 'normal',
}: {
  label: string;
  value: string;
  icon: string;
  tone?: 'normal' | 'muted';
}) {
  return (
    <View style={[styles.statBox, tone === 'muted' && styles.statBoxMuted]}>
      <View style={styles.statIcon}>
        <Icon name={icon as any} size={20} color={tone === 'muted' ? theme.colors.onSurfaceVariant : theme.colors.black} />
      </View>
      <Text style={[styles.statValue, tone === 'muted' && styles.statValueMuted]}>{value}</Text>
      <Caption style={styles.statLabel}>{label}</Caption>
    </View>
  );
}

// ── HistorialTable ────────────────────────────────────────────────────────────

function HistorialTable({
  compras,
  isDesktop,
}: {
  compras: dto_CompraListaResponse[];
  isDesktop: boolean;
}) {
  return (
    <View style={styles.table}>
      {/* Cabecera — solo desktop */}
      {isDesktop && (
        <View style={[styles.tableRow, styles.tableHead]}>
          <Caption style={[styles.cell, styles.cellFecha]}>Fecha / Hora</Caption>
          <Caption style={[styles.cell, styles.cellCliente]}>Cliente</Caption>
          <Caption style={[styles.cell, styles.cellNum]}>Subtotal</Caption>
          <Caption style={[styles.cell, styles.cellNum]}>Descuento</Caption>
          <Caption style={[styles.cell, styles.cellNum]}>Total</Caption>
        </View>
      )}

      {compras.map((c, idx) => (
        <View
          key={c.id}
          style={[
            styles.tableRow,
            idx < compras.length - 1 && styles.tableRowBorder,
            !isDesktop && styles.tableRowMobile,
          ]}
        >
          {isDesktop ? (
            <>
              <View style={[styles.cell, styles.cellFecha]}>
                <Body numberOfLines={1}>{fmtFecha(c.fecha!)}</Body>
                <Caption style={{ color: theme.colors.onSurfaceVariant }}>{fmtHora(c.fecha!)}</Caption>
              </View>
              <View style={[styles.cell, styles.cellCliente]}>
                <Body numberOfLines={1}>{c.cliente_nombre}</Body>
                <Caption style={{ color: theme.colors.onSurfaceVariant }}>DNI {c.cliente_dni}</Caption>
              </View>
              <Body style={[styles.cell, styles.cellNum]}>{moneda(c.subtotal ?? 0)}</Body>
              <Body style={[styles.cell, styles.cellNum, (c.descuento ?? 0) > 0 && styles.descuentoText]}>
                {(c.descuento ?? 0) > 0 ? `− ${moneda(c.descuento ?? 0)}` : '—'}
              </Body>
              <Text style={[styles.cell, styles.cellNum, styles.totalText]}>{moneda(c.total ?? 0)}</Text>
            </>
          ) : (
            /* Vista mobile: card compacta */
            <>
              <View style={{ flex: 1 }}>
                <View style={styles.mobileTopRow}>
                  <Body style={{ flex: 1 }} numberOfLines={1}>{c.cliente_nombre}</Body>
                  <Text style={styles.totalText}>{moneda(c.total ?? 0)}</Text>
                </View>
                <View style={styles.mobileBottomRow}>
                  <Caption style={{ color: theme.colors.onSurfaceVariant }}>
                    DNI {c.cliente_dni}
                  </Caption>
                  <Caption style={{ color: theme.colors.onSurfaceVariant }}>
                    {fmtFecha(c.fecha!)} {fmtHora(c.fecha!)}
                  </Caption>
                </View>
              </View>
              {(c.descuento ?? 0) > 0 && (
                <Caption style={styles.descuentoText}>−{moneda(c.descuento ?? 0)}</Caption>
              )}
            </>
          )}
        </View>
      ))}

      {/* Totalizador */}
      <View style={styles.totalRow}>
        <Caption style={{ flex: 1, color: theme.colors.onSurfaceVariant }}>
          {compras.length} venta{compras.length !== 1 ? 's' : ''}
        </Caption>
        <Text style={styles.totalText}>
          {moneda(compras.reduce((s, c) => s + (c.total ?? 0), 0))}
        </Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },

  // Filtro
  filtroSection: { gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  filtroTitle: { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 },
  chipRow: { flexDirection: 'row', gap: theme.spacing.sm },
  chip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  chipActive: { backgroundColor: theme.colors.black, borderColor: theme.colors.black },
  chipText: { color: theme.colors.onSurface },
  chipTextActive: { color: theme.colors.white },
  customRow: { gap: theme.spacing.md },
  customRowDesktop: { flexDirection: 'row' },
  dateField: { gap: theme.spacing.xs, flex: 1 },
  dateLabel: { color: theme.colors.onSurfaceVariant },
  dateInput: {
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.bodyMd,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },

  // Stats
  statsGrid: { gap: theme.spacing.md, marginBottom: theme.spacing.xl },
  statsGridDesktop: { flexDirection: 'row' },
  statBox: {
    flex: 1,
    borderWidth: 2,
    borderColor: theme.colors.black,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceContainerLowest,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowRadius: 0,
    shadowOpacity: 1,
    elevation: 4,
  },
  statBoxMuted: { borderColor: theme.colors.outlineVariant, shadowOpacity: 0, elevation: 0 },
  statIcon: { marginBottom: 2 },
  statValue: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: theme.typography.fontSize.headlineLg,
    color: theme.colors.black,
  },
  statValueMuted: { color: theme.colors.onSurfaceVariant },
  statLabel: { color: theme.colors.onSurfaceVariant },

  // Historial header
  historialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.black,
    paddingBottom: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  historialTitle: { fontSize: theme.typography.fontSize.headlineMd, color: theme.colors.black },

  // Tabla
  table: {
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    overflow: 'hidden',
  },
  tableHead: {
    backgroundColor: theme.colors.surfaceVariant,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.black,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  tableRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant },
  tableRowMobile: { paddingVertical: theme.spacing.md },

  // Celdas desktop
  cell: { overflow: 'hidden' },
  cellFecha: { width: 120 },
  cellCliente: { flex: 1 },
  cellNum: { width: 110, textAlign: 'right' },

  // Mobile
  mobileTopRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  mobileBottomRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },

  // Totalizador
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 2,
    borderTopColor: theme.colors.black,
    backgroundColor: theme.colors.surfaceVariant,
  },
  totalText: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.bodyMd,
    color: theme.colors.black,
  },
  descuentoText: { color: theme.colors.success },
});
