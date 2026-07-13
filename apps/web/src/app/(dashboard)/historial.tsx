import { ComprasService, type dto_CompraListaResponse } from '@primitivo/api-client';
import {
  Body,
  Button,
  Caption,
  ConfirmDialog,
  EmptyState,
  ResponsiveTable,
  Screen,
  TableSkeleton,
  TextField,
  theme,
  Title,
  useToast,
} from '@primitivo/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth';
import { mensajeDeError } from '@/lib/errors';

const moneda = (n: number) => `$ ${n.toLocaleString('es-AR')}`;

function hoy() {
  return new Date().toISOString().slice(0, 10);
}
function hace30dias() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

export default function HistorialScreen() {
  const { esAdmin } = useAuth();
  if (!esAdmin) return <Redirect href="/clientes" />;
  return <HistorialContent />;
}

function HistorialContent() {
  const qc = useQueryClient();
  const toast = useToast();

  const [desde, setDesde] = useState(hace30dias());
  const [hasta, setHasta] = useState(hoy());
  const [desdeInput, setDesdeInput] = useState(hace30dias());
  const [hastaInput, setHastaInput] = useState(hoy());
  const [deleteTarget, setDeleteTarget] = useState<dto_CompraListaResponse | null>(null);

  const { data: compras = [], isLoading } = useQuery({
    queryKey: ['compras', desde, hasta],
    queryFn: () => ComprasService.getCompras(desde, hasta),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => ComprasService.deleteCompras(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compras'] });
      toast.success('Compra eliminada');
      setDeleteTarget(null);
    },
    onError: (e) => {
      toast.error(mensajeDeError(e));
      setDeleteTarget(null);
    },
  });

  const aplicarFiltro = () => {
    setDesde(desdeInput);
    setHasta(hastaInput);
  };

  const columns = [
    {
      key: 'fecha',
      header: 'Fecha',
      flex: 2,
      render: (c: dto_CompraListaResponse) => (
        <Caption>{c.fecha ? new Date(c.fecha).toLocaleString('es-AR') : '—'}</Caption>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      flex: 3,
      render: (c: dto_CompraListaResponse) => (
        <View>
          <Body numberOfLines={1}>{c.cliente_nombre}</Body>
          <Caption style={{ color: theme.colors.onSurfaceVariant }}>DNI {c.cliente_dni}</Caption>
        </View>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      flex: 2,
      render: (c: dto_CompraListaResponse) => (
        <View>
          <Body>{moneda(c.total ?? 0)}</Body>
          {(c.descuento ?? 0) > 0 && (
            <Caption style={{ color: theme.colors.success }}>
              − {moneda(c.descuento ?? 0)}
            </Caption>
          )}
        </View>
      ),
    },
  ];

  const rowActions = (c: dto_CompraListaResponse) => (
    <Pressable
      style={[styles.iconBtn, styles.iconBtnDanger]}
      onPress={() => setDeleteTarget(c)}
      accessibilityLabel="Eliminar compra"
    >
      <Body style={{ color: theme.colors.danger, fontSize: 13 }}>✕</Body>
    </Pressable>
  );

  return (
    <Screen scroll>
      <Title>Historial de compras</Title>

      <View style={styles.filtros}>
        <View style={styles.filtroField}>
          <Caption style={styles.filtroLabel}>Desde</Caption>
          <TextField
            value={desdeInput}
            onChangeText={setDesdeInput}
            placeholder="AAAA-MM-DD"
          />
        </View>
        <View style={styles.filtroField}>
          <Caption style={styles.filtroLabel}>Hasta</Caption>
          <TextField
            value={hastaInput}
            onChangeText={setHastaInput}
            placeholder="AAAA-MM-DD"
          />
        </View>
        <View style={styles.filtroBtn}>
          <Button title="Buscar" variant="primary" onPress={aplicarFiltro} />
        </View>
      </View>

      {isLoading && <TableSkeleton rows={6} />}

      {!isLoading && compras.length === 0 && (
        <EmptyState
          icon="receipt-long"
          title="Sin compras"
          description={`No hay compras entre ${desde} y ${hasta}.`}
        />
      )}

      {!isLoading && compras.length > 0 && (
        <ResponsiveTable
          columns={columns}
          data={compras}
          keyExtractor={(c) => c.id ?? ''}
          rowActions={rowActions}
        />
      )}

      <ConfirmDialog
        visible={!!deleteTarget}
        title="¿Eliminar compra?"
        message={`Compra de ${deleteTarget?.cliente_nombre} por ${moneda(deleteTarget?.total ?? 0)} será eliminada permanentemente junto con su canje asociado (si tiene uno). Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={eliminar.isPending}
        onConfirm={() => deleteTarget?.id && eliminar.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filtros: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'flex-end',
    marginBottom: theme.spacing.md,
    flexWrap: 'wrap',
  },
  filtroField: { flex: 1, minWidth: 140, gap: theme.spacing.xs },
  filtroLabel: { color: theme.colors.onSurfaceVariant },
  filtroBtn: { paddingBottom: 2 },
  iconBtn: {
    padding: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDanger: { borderColor: theme.colors.danger },
});
