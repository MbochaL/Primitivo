import {
  ClientesService,
  ComprasService,
  MenuService,
  type dto_BeneficioDisponibleResponse,
  type dto_ProductoResponse,
} from '@primitivo/api-client';
import {
  Body,
  Button,
  Caption,
  Card,
  CardSkeleton,
  EmptyState,
  Icon,
  Label,
  RightDrawer,
  Screen,
  TextField,
  theme,
  Title,
  useToast,
} from '@primitivo/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { mensajeDeError } from '@/lib/errors';

const moneda = (n: number) => `$ ${n.toLocaleString('es-AR')}`;

interface Linea {
  producto: dto_ProductoResponse;
  cantidad: number;
}

export default function ComprasScreen() {
  const qc = useQueryClient();
  const toast = useToast();

  const [dni, setDni] = useState('');
  const [buscado, setBuscado] = useState<string | null>(null);
  const [orden, setOrden] = useState<Record<string, Linea>>({});
  const [condicionID, setCondicionID] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);

  const menu = useQuery({ queryKey: ['menu'], queryFn: () => MenuService.getMenu() });

  const clienteQ = useQuery({
    queryKey: ['clientes', 'dni', buscado],
    queryFn: () => ClientesService.getClientes({ dni: buscado ?? undefined }),
    enabled: !!buscado,
  });
  const cliente = clienteQ.data?.[0];

  const beneficiosQ = useQuery({
    queryKey: ['cliente', cliente?.id, 'beneficios'],
    queryFn: () => ClientesService.getClientesBeneficios({ id: cliente?.id ?? '' }),
    enabled: !!cliente?.id,
  });
  const beneficiosAlcanzados = (beneficiosQ.data ?? []).filter((b) => b.alcanzado);

  const lineas = Object.values(orden);
  const cantidadTotal = lineas.reduce((s, l) => s + l.cantidad, 0);
  const subtotal = lineas.reduce((s, l) => s + (l.producto.precio ?? 0) * l.cantidad, 0);

  const beneficioSel = beneficiosAlcanzados.find((b) => b.condicion_id === condicionID);
  const descuento = calcularDescuento(beneficioSel, subtotal);
  const total = Math.max(0, subtotal - descuento);

  const agregar = (p: dto_ProductoResponse) => {
    if (!p.id) return;
    setOrden((o) => {
      const prev = o[p.id!];
      return { ...o, [p.id!]: { producto: p, cantidad: (prev?.cantidad ?? 0) + 1 } };
    });
    setDrawer(true);
  };

  const cambiarCantidad = (id: string, delta: number) => {
    setOrden((o) => {
      const linea = o[id];
      if (!linea) return o;
      const cantidad = linea.cantidad + delta;
      if (cantidad <= 0) {
        const { [id]: _, ...resto } = o;
        return resto;
      }
      return { ...o, [id]: { ...linea, cantidad } };
    });
  };

  const confirmar = useMutation({
    mutationFn: () =>
      ComprasService.postCompras({
        requestBody: {
          cliente_id: cliente?.id ?? '',
          items: lineas.map((l) => ({ producto_id: l.producto.id ?? '', cantidad: l.cantidad })),
          condicion_id: condicionID ?? undefined,
        },
      }),
    onSuccess: (res) => {
      toast.success(`Compra registrada · ${moneda(res.total ?? 0)}`);
      setOrden({});
      setCondicionID(null);
      setDrawer(false);
      // El contador, beneficios e historial del cliente cambiaron.
      qc.invalidateQueries({ queryKey: ['clientes', 'dni', buscado] });
      if (cliente?.id) qc.invalidateQueries({ queryKey: ['cliente', cliente.id] });
    },
    onError: (err) => toast.error(mensajeDeError(err)), // el pedido NO se pierde
  });

  return (
    <Screen scroll>
      <View style={styles.headerRow}>
        <Title>POS</Title>
        <Button
          title={`Pedido (${cantidadTotal})`}
          icon="shopping-cart"
          onPress={() => setDrawer(true)}
        />
      </View>

      {/* Cliente */}
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <TextField
            label="Cliente (DNI)"
            placeholder="DNI…"
            keyboardType="number-pad"
            value={dni}
            onChangeText={setDni}
            onSubmitEditing={() => setBuscado(dni.trim())}
          />
        </View>
        <Button title="Buscar" icon="search" onPress={() => setBuscado(dni.trim())} />
      </View>
      {buscado && !clienteQ.isLoading && !cliente ? (
        <Caption style={{ color: theme.colors.danger }}>No se encontró un cliente con ese DNI.</Caption>
      ) : null}
      {cliente ? (
        <Card>
          <Label>Cliente del pedido</Label>
          <Text style={styles.clienteNombre}>{cliente.nombre}</Text>
          <Caption>
            DNI {cliente.dni} · {cliente.contador_infusiones ?? 0} infusiones
            {cliente.institucion_nombre ? ` · ${cliente.institucion_nombre}` : ''}
          </Caption>
        </Card>
      ) : null}

      {/* Menú */}
      <Label style={styles.sectionTitle}>Menú</Label>
      {menu.isLoading ? (
        <CardSkeleton lines={4} />
      ) : (
        (menu.data ?? []).map((cat) => (
          <View key={cat.id} style={styles.categoria}>
            <View style={styles.catHeader}>
              <Body style={styles.catNombre}>{cat.nombre}</Body>
              <Caption>{cat.seccion}</Caption>
            </View>
            <View style={styles.productos}>
              {(cat.productos ?? []).map((p) => (
                <Pressable key={p.id} style={styles.prodCard} onPress={() => agregar(p)}>
                  <Text style={styles.prodNombre}>{p.nombre}</Text>
                  <View style={styles.prodFooter}>
                    <Text style={styles.prodPrecio}>{moneda(p.precio ?? 0)}</Text>
                    {p.es_infusion ? <Icon name="local-cafe" size={16} color={theme.colors.outline} /> : null}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))
      )}

      {/* Pedido en el drawer lateral derecho */}
      <RightDrawer
        visible={drawer}
        onClose={() => setDrawer(false)}
        title="Registro de pedido"
        footer={
          <Button
            title={`Registrar · ${moneda(total)}`}
            icon="arrow-forward"
            loading={confirmar.isPending}
            disabled={!cliente || lineas.length === 0}
            onPress={() => confirmar.mutate()}
            fullWidth
          />
        }
      >
        {!cliente ? (
          <Caption style={{ color: theme.colors.danger }}>
            Buscá y seleccioná un cliente (por DNI) antes de registrar.
          </Caption>
        ) : null}

        {lineas.length === 0 ? (
          <EmptyState icon="shopping-cart" title="Pedido vacío" description="Agregá productos al pedido." />
        ) : (
          <>
            {lineas.map((l) => (
              <View key={l.producto.id} style={styles.lineaRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineaNombre}>{l.producto.nombre}</Text>
                  <Caption>{moneda(l.producto.precio ?? 0)}</Caption>
                </View>
                <View style={styles.stepper}>
                  <Pressable style={styles.stepBtn} onPress={() => cambiarCantidad(l.producto.id ?? '', -1)}>
                    <Icon name="remove" size={16} color={theme.colors.black} />
                  </Pressable>
                  <Text style={styles.stepNum}>{l.cantidad}</Text>
                  <Pressable style={styles.stepBtn} onPress={() => cambiarCantidad(l.producto.id ?? '', 1)}>
                    <Icon name="add" size={16} color={theme.colors.black} />
                  </Pressable>
                </View>
              </View>
            ))}

            {/* Beneficio */}
            {beneficiosAlcanzados.length > 0 ? (
              <View style={styles.beneficios}>
                <Label>Aplicar beneficio</Label>
                <View style={styles.chips}>
                  <Pressable
                    style={[styles.chip, !condicionID && styles.chipActive]}
                    onPress={() => setCondicionID(null)}
                  >
                    <Label style={!condicionID ? styles.chipActiveText : undefined}>Ninguno</Label>
                  </Pressable>
                  {beneficiosAlcanzados.map((b) => (
                    <Pressable
                      key={b.condicion_id}
                      style={[styles.chip, condicionID === b.condicion_id && styles.chipActive]}
                      onPress={() => setCondicionID(b.condicion_id ?? null)}
                    >
                      <Label style={condicionID === b.condicion_id ? styles.chipActiveText : undefined}>
                        {b.beneficio_nombre}
                      </Label>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Totales */}
            <View style={styles.totales}>
              <View style={styles.totalRow}>
                <Caption>Subtotal</Caption>
                <Caption>{moneda(subtotal)}</Caption>
              </View>
              {descuento > 0 ? (
                <View style={styles.totalRow}>
                  <Caption style={{ color: theme.colors.success }}>Beneficio</Caption>
                  <Caption style={{ color: theme.colors.success }}>- {moneda(descuento)}</Caption>
                </View>
              ) : null}
              <View style={[styles.totalRow, styles.totalFinal]}>
                <Body style={styles.totalLabel}>TOTAL</Body>
                <Body style={styles.totalLabel}>{moneda(total)}</Body>
              </View>
            </View>
          </>
        )}
      </RightDrawer>
    </Screen>
  );
}

function calcularDescuento(b: dto_BeneficioDisponibleResponse | undefined, subtotal: number): number {
  if (!b) return 0;
  const valor = b.valor_descuento ?? 0;
  const d = b.tipo_descuento === 'porcentaje' ? Math.floor((subtotal * valor) / 100) : valor;
  return Math.min(d, subtotal);
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md },
  searchRow: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-end' },
  searchInput: { flex: 1 },
  clienteNombre: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: theme.typography.fontSize.headlineMd,
    color: theme.colors.black,
    textTransform: 'uppercase',
  },
  sectionTitle: { fontSize: theme.typography.fontSize.headlineMd, color: theme.colors.black, marginTop: theme.spacing.sm },
  categoria: { gap: theme.spacing.sm },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomWidth: 2, borderBottomColor: theme.colors.black, paddingBottom: theme.spacing.xs },
  catNombre: { fontFamily: theme.typography.fontFamily.bodyBold, textTransform: 'uppercase' },
  productos: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  prodCard: {
    borderWidth: 1,
    borderColor: theme.colors.black,
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: theme.spacing.md,
    minWidth: 150,
    flexGrow: 1,
    gap: theme.spacing.sm,
  },
  prodNombre: { fontFamily: theme.typography.fontFamily.bodyBold, fontSize: theme.typography.fontSize.bodyMd, color: theme.colors.onSurface },
  prodFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prodPrecio: { fontFamily: theme.typography.fontFamily.body, color: theme.colors.onSurfaceVariant },
  lineaRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant, paddingBottom: theme.spacing.sm },
  lineaNombre: { fontFamily: theme.typography.fontFamily.bodyBold, fontSize: theme.typography.fontSize.bodyMd, color: theme.colors.onSurface },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.black },
  stepBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  stepNum: { width: 32, textAlign: 'center', fontFamily: theme.typography.fontFamily.bodyBold },
  beneficios: { gap: theme.spacing.xs, marginTop: theme.spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: { borderWidth: 1, borderColor: theme.colors.black, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
  chipActive: { backgroundColor: theme.colors.black },
  chipActiveText: { color: theme.colors.white },
  totales: { gap: theme.spacing.xs, marginTop: theme.spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalFinal: { borderTopWidth: 2, borderTopColor: theme.colors.black, paddingTop: theme.spacing.sm, marginTop: theme.spacing.xs },
  totalLabel: { fontFamily: theme.typography.fontFamily.display, fontSize: theme.typography.fontSize.headlineMd, color: theme.colors.black },
});
