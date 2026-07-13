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
  Screen,
  SearchBar,
  type SearchSuggestion,
  theme,
  Title,
  useBreakpoint,
  useToast,
} from '@primitivo/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { mensajeDeError } from '@/lib/errors';

// ── helpers ───────────────────────────────────────────────────────────────────

const moneda = (n: number) => `$ ${n.toLocaleString('es-AR')}`;

interface Linea {
  producto: dto_ProductoResponse;
  cantidad: number;
}

function calcularDescuento(
  b: dto_BeneficioDisponibleResponse | undefined,
  lineas: Linea[],
  subtotal: number,
  catMap: Map<string, string>,
): number {
  if (!b) return 0;

  if (b.tipo_descuento === 'producto_gratis') {
    const catId = b.scope_descuento_categoria_id;
    const elegibles = lineas.filter(
      (l) => !catId || catMap.get(l.producto.id ?? '') === catId,
    );
    if (!elegibles.length) return 0;
    return Math.min(...elegibles.map((l) => l.producto.precio ?? 0));
  }

  const v = b.valor_descuento ?? 0;
  let base = subtotal;
  if (b.scope_descuento === 'categoria' && b.scope_descuento_categoria_id) {
    base = lineas
      .filter((l) => catMap.get(l.producto.id ?? '') === b.scope_descuento_categoria_id)
      .reduce((s, l) => s + (l.producto.precio ?? 0) * l.cantidad, 0);
  }
  const raw = b.tipo_descuento === 'porcentaje' ? Math.floor((base * v) / 100) : v;
  return Math.min(raw, subtotal);
}

function labelBeneficio(b: dto_BeneficioDisponibleResponse): string {
  const nombre = b.beneficio_nombre ?? '';
  if (b.tipo_descuento === 'producto_gratis') return `${nombre} · gratis`;
  const v = b.valor_descuento ?? 0;
  const desc = b.tipo_descuento === 'porcentaje' ? `${v}%` : `$${v.toLocaleString('es-AR')}`;
  return `${nombre} · ${desc}`;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ComprasScreen() {
  const qc = useQueryClient();
  const toast = useToast();
  const { isMobile } = useBreakpoint();

  // Cliente
  const [dni, setDni] = useState('');
  const [buscado, setBuscado] = useState<string | null>(null);
  const dniDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Orden
  const [orden, setOrden] = useState<Record<string, Linea>>({});
  const [condicionID, setCondicionID] = useState<string | null>(null);

  // Selector modo: categorías o búsqueda
  const [modo, setModo] = useState<'categorias' | 'buscar'>('categorias');
  const [busqueda, setBusqueda] = useState('');
  const [seccionActiva, setSeccionActiva] = useState<string | null>(null);
  const [catActiva, setCatActiva] = useState<string | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const menuQ = useQuery({ queryKey: ['menu'], queryFn: () => MenuService.getMenu() });

  const clienteQ = useQuery({
    queryKey: ['clientes', 'q', buscado],
    queryFn: () => ClientesService.getClientes(undefined, buscado ?? undefined),
    enabled: !!buscado,
  });
  const cliente = clienteQ.data?.[0];

  const beneficiosQ = useQuery({
    queryKey: ['cliente', cliente?.id, 'beneficios'],
    queryFn: () => ClientesService.getClientesBeneficios(cliente?.id ?? ''),
    enabled: !!cliente?.id,
  });
  const beneficiosAlcanzados = (beneficiosQ.data ?? []).filter((b) => b.alcanzado);

  // ── Derivados ────────────────────────────────────────────────────────────────
  const lineas = Object.values(orden);
  const subtotal = lineas.reduce((s, l) => s + (l.producto.precio ?? 0) * l.cantidad, 0);
  const beneficioSel = beneficiosAlcanzados.find((b) => b.condicion_id === condicionID);

  const catMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const cat of menuQ.data ?? [])
      for (const p of cat.productos ?? [])
        if (p.id && cat.id) m.set(p.id, cat.id);
    return m;
  }, [menuQ.data]);

  const descuento = calcularDescuento(beneficioSel, lineas, subtotal, catMap);
  const total = Math.max(0, subtotal - descuento);

  const secciones = useMemo(() => {
    const s = new Set<string>();
    for (const c of menuQ.data ?? []) if (c.seccion) s.add(c.seccion);
    return [...s];
  }, [menuQ.data]);

  const categoriasFiltradas = useMemo(
    () => (menuQ.data ?? []).filter((c) => !seccionActiva || c.seccion === seccionActiva),
    [menuQ.data, seccionActiva],
  );

  const productosBuscados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return [];
    const res: dto_ProductoResponse[] = [];
    for (const cat of menuQ.data ?? [])
      for (const p of cat.productos ?? [])
        if (p.nombre?.toLowerCase().includes(q)) res.push(p);
    return res;
  }, [menuQ.data, busqueda]);

  // ── Suggestions ───────────────────────────────────────────────────────────────
  const clienteSuggestions = useMemo<SearchSuggestion[]>(() => {
    if (!clienteQ.data?.length) return [];
    return clienteQ.data.map((c) => ({
      id: c.id ?? '',
      label: c.nombre ?? '',
      sublabel: `DNI ${c.dni}${c.institucion_nombre ? ` · ${c.institucion_nombre}` : ''}`,
      meta: `${c.contador_infusiones ?? 0} inf.`,
      icon: 'person' as const,
    }));
  }, [clienteQ.data]);

  const productSuggestions = useMemo<SearchSuggestion[]>(() => {
    const q = busqueda.trim().toLowerCase();
    const res: SearchSuggestion[] = [];
    for (const cat of menuQ.data ?? []) {
      for (const p of cat.productos ?? []) {
        if (q && !p.nombre?.toLowerCase().includes(q)) continue;
        res.push({
          id: p.id ?? '',
          label: p.nombre ?? '',
          sublabel: cat.nombre,
          meta: moneda(p.precio ?? 0),
          icon: 'lunch-dining' as const,
        });
        if (res.length >= 8) break;
      }
      if (res.length >= 8) break;
    }
    return res;
  }, [menuQ.data, busqueda]);

  const handleChangeDni = (text: string) => {
    setDni(text);
    if (dniDebounceRef.current) clearTimeout(dniDebounceRef.current);
    const trimmed = text.trim();
    if (trimmed.length >= 3) {
      dniDebounceRef.current = setTimeout(() => setBuscado(trimmed), 350);
    } else if (!trimmed) {
      setBuscado(null);
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const agregar = (p: dto_ProductoResponse) => {
    if (!p.id) return;
    setOrden((o) => ({ ...o, [p.id!]: { producto: p, cantidad: (o[p.id!]?.cantidad ?? 0) + 1 } }));
  };

  const cambiarCantidad = (id: string, delta: number) => {
    setOrden((o) => {
      const l = o[id];
      if (!l) return o;
      const n = l.cantidad + delta;
      if (n <= 0) { const { [id]: _, ...rest } = o; return rest; }
      return { ...o, [id]: { ...l, cantidad: n } };
    });
  };

  const confirmar = useMutation({
    mutationFn: () =>
      ComprasService.postCompras({
        cliente_id: cliente?.id ?? '',
        items: lineas.map((l) => ({ producto_id: l.producto.id ?? '', cantidad: l.cantidad })),
        condicion_id: condicionID ?? undefined,
      }),
    onSuccess: (res) => {
      toast.success(`Compra registrada · ${moneda(res.total ?? 0)}`);
      setOrden({});
      setCondicionID(null);
      qc.invalidateQueries({ queryKey: ['clientes', 'dni', buscado] });
      if (cliente?.id) qc.invalidateQueries({ queryKey: ['cliente', cliente.id] });
    },
    onError: (err) => toast.error(mensajeDeError(err)),
  });

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Screen scroll={isMobile}>
      <View style={isMobile ? styles.layout : styles.layoutDesktop}>

        {/* ── Columna izquierda: selector ── */}
        <LeftCol isMobile={isMobile}>
          <Title>Registrar compra</Title>

          {/* ── Sección: Cliente ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Label style={styles.sectionLabel}>Cliente</Label>
            </View>
            <SearchBar
              value={dni}
              onChangeText={handleChangeDni}
              suggestions={clienteSuggestions}
              onSelect={(s) => {
                const c = clienteQ.data?.find((x) => x.id === s.id);
                if (c?.dni) { setDni(c.dni); setBuscado(c.dni); }
              }}
              loading={clienteQ.isFetching}
              placeholder="Buscar por DNI o nombre…"
              onSubmitEditing={() => { if (dni.trim()) setBuscado(dni.trim()); }}
            />
            {buscado && !clienteQ.isLoading && !cliente && (
              <Caption style={styles.errorText}>No se encontró ningún cliente.</Caption>
            )}
            {cliente && (
              <Card>
                <View style={styles.clienteRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clienteNombre}>{cliente.nombre}</Text>
                    <Caption>
                      DNI {cliente.dni} · {cliente.contador_infusiones ?? 0} infusiones
                      {cliente.institucion_nombre ? ` · ${cliente.institucion_nombre}` : ''}
                    </Caption>
                  </View>
                  <Icon name="check-circle" size={22} color={theme.colors.success} />
                </View>
              </Card>
            )}
          </View>

          {/* ── Sección: Producto ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Label style={styles.sectionLabel}>Producto</Label>
            </View>

          {/* Toggle modo — solo desktop */}
          {!isMobile && (
            <View style={styles.modoToggle}>
              {(['categorias', 'buscar'] as const).map((m) => (
                <Pressable
                  key={m}
                  style={[styles.modoBtn, modo === m && styles.modoBtnActive]}
                  onPress={() => setModo(m)}
                >
                  <Icon
                    name={m === 'categorias' ? 'category' : 'search'}
                    size={15}
                    color={modo === m ? theme.colors.white : theme.colors.black}
                  />
                  <Label style={modo === m ? styles.modoBtnActiveText : undefined}>
                    {m === 'categorias' ? 'Categorías' : 'Buscar'}
                  </Label>
                </Pressable>
              ))}
            </View>
          )}

          {/* ── Buscador de texto (siempre en mobile, solo si modo=buscar en desktop) ── */}
          {(modo === 'buscar' || isMobile) && (
            <View style={styles.block}>
              <SearchBar
                value={busqueda}
                onChangeText={setBusqueda}
                suggestions={productSuggestions}
                onSelect={(s) => {
                  const p = menuQ.data?.flatMap((c) => c.productos ?? []).find((x) => x.id === s.id);
                  if (p) { agregar(p); setBusqueda(''); }
                }}
                placeholder="Buscar producto por nombre…"
              />
              {busqueda.trim().length > 0 && productosBuscados.length === 0 && (
                <Caption style={styles.sinResultados}>
                  Sin resultados para "{busqueda}"
                </Caption>
              )}
              <View style={styles.prodGrid}>
                {productosBuscados.map((p) => (
                  <ProductoCard
                    key={p.id}
                    producto={p}
                    enOrden={orden[p.id ?? '']?.cantidad ?? 0}
                    onAgregar={() => agregar(p)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ── Categorías — solo desktop ── */}
          {!isMobile && modo === 'categorias' && (
            <View style={styles.block}>
              {menuQ.isLoading && <CardSkeleton lines={4} />}

              {/* Filtro sección */}
              {!menuQ.isLoading && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.seccionesScroll}
                >
                  <View style={styles.seccionesRow}>
                    <Pressable
                      style={[styles.seccionChip, !seccionActiva && styles.seccionChipActive]}
                      onPress={() => { setSeccionActiva(null); setCatActiva(null); }}
                    >
                      <Caption style={[styles.seccionChipText, !seccionActiva && styles.chipTextActive]}>
                        Todas
                      </Caption>
                    </Pressable>
                    {secciones.map((s) => (
                      <Pressable
                        key={s}
                        style={[styles.seccionChip, seccionActiva === s && styles.seccionChipActive]}
                        onPress={() => { setSeccionActiva(s); setCatActiva(null); }}
                      >
                        <Caption style={[styles.seccionChipText, seccionActiva === s && styles.chipTextActive]}>
                          {s}
                        </Caption>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              )}

              {/* Acordeón de categorías */}
              {!menuQ.isLoading && categoriasFiltradas.map((cat) => (
                <View key={cat.id} style={styles.catAccordion}>
                  <Pressable
                    style={[styles.catHeader, catActiva === cat.id && styles.catHeaderActive]}
                    onPress={() => setCatActiva(catActiva === cat.id ? null : (cat.id ?? null))}
                  >
                    <View style={{ flex: 1 }}>
                      <Caption
                        style={[
                          styles.catSeccionLabel,
                          catActiva === cat.id && styles.catTextActive,
                        ]}
                      >
                        {cat.seccion}
                      </Caption>
                      <Body
                        style={[
                          styles.catNombre,
                          catActiva === cat.id && styles.catTextActive,
                        ]}
                      >
                        {cat.nombre}
                      </Body>
                    </View>
                    <View style={styles.catChevron}>
                      <Caption
                        style={catActiva === cat.id ? styles.catTextActive : { color: theme.colors.onSurfaceVariant }}
                      >
                        {(cat.productos ?? []).length}
                      </Caption>
                      <Icon
                        name={catActiva === cat.id ? 'expand-less' : 'expand-more'}
                        size={20}
                        color={catActiva === cat.id ? theme.colors.white : theme.colors.onSurfaceVariant}
                      />
                    </View>
                  </Pressable>
                  {catActiva === cat.id && (
                    <View style={[styles.prodGrid, styles.prodGridInCat]}>
                      {(cat.productos ?? []).map((p) => (
                        <ProductoCard
                          key={p.id}
                          producto={p}
                          enOrden={orden[p.id ?? '']?.cantidad ?? 0}
                          onAgregar={() => agregar(p)}
                        />
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
          </View>{/* fin sección Producto */}
        </LeftCol>

        {/* ── Columna derecha: pedido ── */}
        <View style={!isMobile ? styles.colRight : undefined}>
          <PedidoPanel
            lineas={lineas}
            tieneCliente={!!cliente}
            beneficiosAlcanzados={beneficiosAlcanzados}
            beneficioSel={beneficioSel}
            condicionID={condicionID}
            setCondicionID={setCondicionID}
            cambiarCantidad={cambiarCantidad}
            subtotal={subtotal}
            descuento={descuento}
            total={total}
            loading={confirmar.isPending}
            onConfirmar={() => confirmar.mutate()}
          />
        </View>

      </View>
    </Screen>
  );
}

// ── LeftCol ───────────────────────────────────────────────────────────────────

function LeftCol({ children, isMobile }: { children: ReactNode; isMobile: boolean }) {
  if (isMobile) return <View style={styles.leftColContent}>{children}</View>;
  return (
    <ScrollView style={styles.colLeft} contentContainerStyle={styles.leftColContent}>
      {children}
    </ScrollView>
  );
}

// ── ProductoCard ──────────────────────────────────────────────────────────────

function ProductoCard({
  producto,
  enOrden,
  onAgregar,
}: {
  producto: dto_ProductoResponse;
  enOrden: number;
  onAgregar: () => void;
}) {
  return (
    <Pressable
      style={[styles.prodCard, enOrden > 0 && styles.prodCardSelected]}
      onPress={onAgregar}
    >
      <Text style={styles.prodNombre} numberOfLines={2}>
        {producto.nombre}
      </Text>
      <View style={styles.prodFooter}>
        <Caption style={{ color: theme.colors.onSurfaceVariant }}>
          {moneda(producto.precio ?? 0)}
        </Caption>
        <View style={styles.prodIconsRow}>
          {producto.es_infusion && (
            <Icon name="local-cafe" size={13} color={theme.colors.onSurfaceVariant} />
          )}
          {enOrden > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{enOrden}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ── PedidoPanel ───────────────────────────────────────────────────────────────

function PedidoPanel({
  lineas,
  tieneCliente,
  beneficiosAlcanzados,
  beneficioSel,
  condicionID,
  setCondicionID,
  cambiarCantidad,
  subtotal,
  descuento,
  total,
  loading,
  onConfirmar,
}: {
  lineas: Linea[];
  tieneCliente: boolean;
  beneficiosAlcanzados: dto_BeneficioDisponibleResponse[];
  beneficioSel?: dto_BeneficioDisponibleResponse;
  condicionID: string | null;
  setCondicionID: (id: string | null) => void;
  cambiarCantidad: (id: string, delta: number) => void;
  subtotal: number;
  descuento: number;
  total: number;
  loading: boolean;
  onConfirmar: () => void;
}) {
  const cantTotal = lineas.reduce((s, l) => s + l.cantidad, 0);

  return (
    <View style={styles.pedidoBox}>
      {/* Header */}
      <View style={styles.pedidoHeader}>
        <Label style={styles.pedidoTitle}>Pedido</Label>
        {cantTotal > 0 && (
          <View style={styles.pedidoBadge}>
            <Caption style={styles.pedidoBadgeText}>{cantTotal}</Caption>
          </View>
        )}
      </View>

      {/* Aviso sin cliente */}
      {!tieneCliente && (
        <View style={styles.pedidoAlert}>
          <Icon name="info-outline" size={15} color={theme.colors.onSurfaceVariant} />
          <Caption style={[styles.pedidoAlertText, { flex: 1 }]}>
            Buscá un cliente por DNI o nombre para poder confirmar la compra.
          </Caption>
        </View>
      )}

      {/* Items vacíos */}
      {lineas.length === 0 ? (
        <EmptyState
          icon="shopping-cart"
          title="Pedido vacío"
          description="Seleccioná productos del menú."
        />
      ) : (
        <>
          {/* Líneas */}
          {lineas.map((l) => (
            <View key={l.producto.id} style={styles.lineaRow}>
              <View style={{ flex: 1 }}>
                <Body numberOfLines={1}>{l.producto.nombre}</Body>
                <Caption style={{ color: theme.colors.onSurfaceVariant }}>
                  {moneda(l.producto.precio ?? 0)}
                </Caption>
              </View>
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => cambiarCantidad(l.producto.id ?? '', -1)}
                >
                  <Icon name="remove" size={15} color={theme.colors.black} />
                </Pressable>
                <Text style={styles.stepNum}>{l.cantidad}</Text>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => cambiarCantidad(l.producto.id ?? '', 1)}
                >
                  <Icon name="add" size={15} color={theme.colors.black} />
                </Pressable>
              </View>
            </View>
          ))}

          {/* Beneficios alcanzados */}
          {beneficiosAlcanzados.length > 0 && (
            <View style={styles.beneficiosSection}>
              <Caption style={styles.beneficiosSectionLabel}>Aplicar beneficio</Caption>
              <View style={styles.chipsRow}>
                <Pressable
                  style={[styles.chip, !condicionID && styles.chipActive]}
                  onPress={() => setCondicionID(null)}
                >
                  <Caption style={!condicionID ? styles.chipTextActive : undefined}>
                    Ninguno
                  </Caption>
                </Pressable>
                {beneficiosAlcanzados.map((b) => (
                  <Pressable
                    key={b.condicion_id}
                    style={[styles.chip, condicionID === b.condicion_id && styles.chipActive]}
                    onPress={() => setCondicionID(b.condicion_id ?? null)}
                  >
                    <Caption
                      style={condicionID === b.condicion_id ? styles.chipTextActive : undefined}
                    >
                      {labelBeneficio(b)}
                    </Caption>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Totales */}
          <View style={styles.totales}>
            <View style={styles.totalRow}>
              <Caption>Subtotal</Caption>
              <Caption>{moneda(subtotal)}</Caption>
            </View>
            {descuento > 0 && (
              <View style={styles.totalRow}>
                <Caption style={{ color: theme.colors.success }}>
                  {beneficioSel?.tipo_descuento === 'producto_gratis' ? 'Prod. gratis' : 'Beneficio'}
                </Caption>
                <Caption style={{ color: theme.colors.success }}>− {moneda(descuento)}</Caption>
              </View>
            )}
            <View style={[styles.totalRow, styles.totalFinal]}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalLabel}>{moneda(total)}</Text>
            </View>
          </View>
        </>
      )}

      <Button
        title={lineas.length > 0 ? `Confirmar · ${moneda(total)}` : 'Agregá productos al pedido'}
        variant="primary"
        fullWidth
        loading={loading}
        disabled={!tieneCliente || lineas.length === 0}
        onPress={onConfirmar}
        icon="arrow-forward"
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // layout dos columnas
  layout: { gap: theme.spacing.xl },
  layoutDesktop: { flex: 1, flexDirection: 'row', gap: theme.spacing.xl },
  colLeft: { flex: 1 },
  leftColContent: { gap: theme.spacing.xl },
  colRight: { width: 360 },

  // secciones con separador visual
  section: {
    gap: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.black,
  },
  sectionLabel: {
    fontSize: theme.typography.fontSize.labelBold,
    color: theme.colors.black,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  // compat
  block: { gap: theme.spacing.md },
  searchRow: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-end' },
  errorText: { color: theme.colors.danger },
  sinResultados: { color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.sm },

  // cliente
  clienteRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  clienteNombre: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: theme.typography.fontSize.headlineMd,
    color: theme.colors.black,
    textTransform: 'uppercase',
  },

  // toggle modo
  modoToggle: { flexDirection: 'row' },
  modoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.black,
    marginRight: -2,
  },
  modoBtnActive: { backgroundColor: theme.colors.black },
  modoBtnActiveText: { color: theme.colors.surfaceContainerLowest },

  // secciones filtro
  seccionesScroll: { marginBottom: theme.spacing.xs },
  seccionesRow: { flexDirection: 'row', gap: theme.spacing.sm },
  seccionChip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.black,
  },
  seccionChipActive: { backgroundColor: theme.colors.black },
  seccionChipText: { color: theme.colors.black },
  chipTextActive: { color: theme.colors.surfaceContainerLowest },

  // acordeón categorías
  catAccordion: {
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    overflow: 'hidden',
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    gap: theme.spacing.sm,
  },
  catHeaderActive: { backgroundColor: theme.colors.black },
  catTextActive: { color: theme.colors.white },
  catSeccionLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: theme.colors.onSurfaceVariant,
  },
  catNombre: { fontFamily: theme.typography.fontFamily.bodyBold },
  catChevron: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },

  // grid de productos
  prodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  prodGridInCat: { backgroundColor: theme.colors.surfaceContainerLowest },
  prodCard: {
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    minWidth: 120,
    maxWidth: 180,
    flexGrow: 1,
    gap: theme.spacing.xs,
  },
  prodCardSelected: {
    borderColor: theme.colors.black,
    borderWidth: 2,
    backgroundColor: theme.colors.surfaceVariant,
  },
  prodNombre: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.labelSm,
    color: theme.colors.onSurface,
    lineHeight: 18,
  },
  prodFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prodIconsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badge: {
    backgroundColor: theme.colors.black,
    borderRadius: 99,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bodyBold,
  },

  // pedido panel
  pedidoBox: {
    flex: 1,
    borderWidth: 2,
    borderColor: theme.colors.black,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  pedidoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.black,
    paddingBottom: theme.spacing.sm,
  },
  pedidoTitle: {
    fontSize: theme.typography.fontSize.headlineMd,
    color: theme.colors.black,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pedidoBadge: {
    backgroundColor: theme.colors.black,
    borderRadius: 99,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  pedidoBadgeText: { color: theme.colors.white, fontSize: 11 },
  pedidoAlert: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surfaceVariant,
    padding: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  pedidoAlertText: { color: theme.colors.onSurfaceVariant },

  // lineas
  lineaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.black },
  stepBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  stepNum: {
    width: 28,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.bodyMd,
  },

  // beneficios
  beneficiosSection: { gap: theme.spacing.xs },
  beneficiosSectionLabel: {
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 1,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.black,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  chipActive: { backgroundColor: theme.colors.black },

  // totales
  totales: { gap: theme.spacing.xs },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalFinal: {
    borderTopWidth: 2,
    borderTopColor: theme.colors.black,
    paddingTop: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  totalLabel: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: theme.typography.fontSize.headlineMd,
    color: theme.colors.black,
    textTransform: 'uppercase',
  },
});
