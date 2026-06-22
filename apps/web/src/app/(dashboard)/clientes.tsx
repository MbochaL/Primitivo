import { zodResolver } from '@hookform/resolvers/zod';
import {
  ClientesService,
  InstitucionesService,
  type dto_ClienteResponse,
} from '@primitivo/api-client';
import {
  Body,
  Button,
  Caption,
  Card,
  EmptyState,
  FormModal,
  Icon,
  Label,
  ProgressBar,
  ResponsiveTable,
  Screen,
  SearchBar,
  type SearchSuggestion,
  TableSkeleton,
  TextField,
  theme,
  Title,
  useBreakpoint,
  useToast,
} from '@primitivo/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { z } from 'zod';

import { mensajeDeError } from '@/lib/errors';

// ── helpers ───────────────────────────────────────────────────────────────────

const moneda = (n: number) => `$ ${n.toLocaleString('es-AR')}`;

const hoy = () => new Date().toISOString().slice(0, 10);

const inicioMes = () => {
  const d = new Date(); d.setDate(1);
  return d.toISOString().slice(0, 10);
};
const inicioMesAnterior = () => {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
};
const finMesAnterior = () => {
  const d = new Date(); d.setDate(0);
  return d.toISOString().slice(0, 10);
};

type Rango = 'todo' | 'mes' | 'mes_ant' | 'custom';
const RANGOS: { key: Rango; label: string }[] = [
  { key: 'todo',    label: 'Todos' },
  { key: 'mes',     label: 'Este mes' },
  { key: 'mes_ant', label: 'Mes anterior' },
  { key: 'custom',  label: 'Personalizado' },
];

function rangoFechas(rango: Rango, desde: string, hasta: string): [string, string] | null {
  switch (rango) {
    case 'todo':    return null;
    case 'mes':     return [inicioMes(), hoy()];
    case 'mes_ant': return [inicioMesAnterior(), finMesAnterior()];
    case 'custom':  return [desde || hoy(), hasta || hoy()];
  }
}

// ── Form schema ───────────────────────────────────────────────────────────────

const clienteSchema = z.object({
  dni:    z.string().min(1, 'DNI requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  email:  z.string().email('Email inválido').optional().or(z.literal('')),
});
type ClienteForm = z.infer<typeof clienteSchema>;

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ClientesScreen() {
  const qc       = useQueryClient();
  const toast    = useToast();
  const { isMobile, isDesktop } = useBreakpoint();

  const [query,       setQuery]       = useState('');
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [rango,       setRango]       = useState<Rango>('todo');
  const [customDesde, setCustomDesde] = useState(hoy());
  const [customHasta, setCustomHasta] = useState(hoy());
  const [modal, setModal] = useState<
    { mode: 'crear' } | { mode: 'editar'; cliente: dto_ClienteResponse } | null
  >(null);

  // ── Queries ───────────────────────────────────────────────────────────────
  const clientesQ = useQuery({
    queryKey: ['clientes'],
    queryFn: () => ClientesService.getClientes(),
  });

  // ── Filtros ───────────────────────────────────────────────────────────────
  const fechas = rangoFechas(rango, customDesde, customHasta);

  const filtrados = useMemo(() => {
    let list = clientesQ.data ?? [];

    if (fechas) {
      const d0 = new Date(fechas[0]);
      const d1 = new Date(fechas[1]);
      d1.setHours(23, 59, 59, 999);
      list = list.filter((c) => {
        if (!c.created_at) return false;
        const d = new Date(c.created_at);
        return d >= d0 && d <= d1;
      });
    }

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.nombre?.toLowerCase().includes(q) ||
          c.dni?.includes(q) ||
          c.institucion_nombre?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [clientesQ.data, fechas, query]);

  const suggestions = useMemo<SearchSuggestion[]>(
    () =>
      filtrados.slice(0, 8).map((c) => ({
        id:       c.id ?? '',
        label:    c.nombre ?? '',
        sublabel: `DNI ${c.dni}${c.institucion_nombre ? ` · ${c.institucion_nombre}` : ''}`,
        meta:     `${c.contador_infusiones ?? 0} inf.`,
        icon:     'person' as const,
      })),
    [filtrados],
  );

  const selectedCliente = clientesQ.data?.find((c) => c.id === selectedId) ?? null;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const toggleSelect = (c: dto_ClienteResponse) =>
    setSelectedId(c.id === selectedId ? null : (c.id ?? null));

  const handleSaved = (c: dto_ClienteResponse) => {
    qc.invalidateQueries({ queryKey: ['clientes'] });
    if (c.id) qc.invalidateQueries({ queryKey: ['cliente', c.id] });
    toast.success(modal?.mode === 'crear' ? 'Cliente registrado' : 'Cliente actualizado');
    if (modal?.mode === 'crear' && c.id) setSelectedId(c.id);
    setModal(null);
  };

  // ── Columnas ──────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'nombre', header: 'Nombre', flex: 3,
      render: (c: dto_ClienteResponse) => (
        <View>
          <Body numberOfLines={1}>{c.nombre}</Body>
          {c.email ? <Caption numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>{c.email}</Caption> : null}
        </View>
      ),
    },
    {
      key: 'dni', header: 'DNI', flex: 1.5, hideOnMobile: true,
      render: (c: dto_ClienteResponse) => <Caption>{c.dni}</Caption>,
    },
    {
      key: 'institucion', header: 'Institución', flex: 2,
      render: (c: dto_ClienteResponse) => (
        <Caption style={{ color: c.institucion_nombre ? theme.colors.onSurface : theme.colors.onSurfaceVariant }}>
          {c.institucion_nombre ?? '—'}
        </Caption>
      ),
    },
    {
      key: 'infusiones', header: 'Inf.', flex: 1,
      render: (c: dto_ClienteResponse) => (
        <View style={styles.infBadge}>
          <Icon name="local-cafe" size={13} color={theme.colors.onSurfaceVariant} />
          <Caption>{c.contador_infusiones ?? 0}</Caption>
        </View>
      ),
    },
    {
      key: 'fecha', header: 'Registro', flex: 1.5, hideOnMobile: true,
      render: (c: dto_ClienteResponse) => (
        <Caption style={{ color: theme.colors.onSurfaceVariant }}>
          {c.created_at ? new Date(c.created_at).toLocaleDateString('es-AR') : '—'}
        </Caption>
      ),
    },
  ];

  // ── Contenido de la columna izquierda ─────────────────────────────────────
  const listContent = (
    <>
      {/* Header */}
      <View style={styles.headerRow}>
        <Title>Clientes</Title>
        <Button title="Nuevo" icon="person-add" onPress={() => setModal({ mode: 'crear' })} />
      </View>

      {/* SearchBar */}
      <SearchBar
        value={query}
        onChangeText={setQuery}
        suggestions={suggestions}
        onSelect={(s) => { setSelectedId(s.id); setQuery(''); }}
        placeholder="Buscar por nombre, DNI o institución…"
      />

      {/* Filtro fecha */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rangoScroll}>
        <View style={styles.rangoRow}>
          {RANGOS.map((r) => (
            <Pressable
              key={r.key}
              style={[styles.rangoChip, rango === r.key && styles.rangoChipActive]}
              onPress={() => setRango(r.key)}
            >
              <Caption style={[styles.rangoChipText, rango === r.key && styles.rangoChipActiveText]}>
                {r.label}
              </Caption>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {rango === 'custom' && (
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Caption style={styles.dateLabel}>Desde</Caption>
            <TextInput
              style={styles.dateInput}
              value={customDesde}
              onChangeText={setCustomDesde}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={theme.colors.outline}
            />
          </View>
          <View style={styles.dateSep}><Caption>—</Caption></View>
          <View style={styles.dateField}>
            <Caption style={styles.dateLabel}>Hasta</Caption>
            <TextInput
              style={styles.dateInput}
              value={customHasta}
              onChangeText={setCustomHasta}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={theme.colors.outline}
            />
          </View>
        </View>
      )}

      {/* Detalle inline en mobile */}
      {isMobile && selectedCliente && (
        <View style={styles.mobileDetail}>
          <Pressable style={styles.mobileDetailClose} onPress={() => setSelectedId(null)}>
            <Icon name="close" size={16} color={theme.colors.onSurfaceVariant} />
            <Caption style={{ color: theme.colors.onSurfaceVariant }}>Cerrar detalle</Caption>
          </Pressable>
          <ClienteDetalle
            cliente={selectedCliente}
            isDesktop={false}
            onEditar={() => setModal({ mode: 'editar', cliente: selectedCliente })}
          />
        </View>
      )}

      {/* Lista */}
      {clientesQ.isLoading && <TableSkeleton rows={5} />}

      {!clientesQ.isLoading && filtrados.length === 0 && (
        <EmptyState
          icon={query || rango !== 'todo' ? 'search-off' : 'group'}
          title={query || rango !== 'todo' ? 'Sin resultados' : 'Sin clientes'}
          description={
            query || rango !== 'todo'
              ? 'Probá con otros filtros.'
              : 'Todavía no hay clientes registrados.'
          }
          actionLabel={!query && rango === 'todo' ? 'Registrar primer cliente' : undefined}
          onAction={!query && rango === 'todo' ? () => setModal({ mode: 'crear' }) : undefined}
        />
      )}

      {!clientesQ.isLoading && filtrados.length > 0 && (
        <View>
          <Caption style={styles.conteo}>
            {filtrados.length} cliente{filtrados.length !== 1 ? 's' : ''}
            {rango !== 'todo' ? ` registrados en el período` : ''}
          </Caption>
          <ResponsiveTable
            columns={columns}
            data={filtrados}
            keyExtractor={(c) => c.id ?? ''}
            onRowPress={toggleSelect}
            selectedKey={selectedId ?? undefined}
          />
        </View>
      )}
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Screen scroll={isMobile}>
        <View style={isMobile ? styles.layout : styles.layoutDesktop}>
          <LeftCol isMobile={isMobile}>{listContent}</LeftCol>

          {/* Panel derecho — solo desktop */}
          {!isMobile && (
            <View style={styles.rightCol}>
              {selectedCliente ? (
                <>
                  <View style={styles.rightColHeader}>
                    <Text style={styles.rightColTitle} numberOfLines={1}>
                      {selectedCliente.nombre}
                    </Text>
                    <Pressable
                      onPress={() => setSelectedId(null)}
                      hitSlop={8}
                      style={styles.rightColClose}
                    >
                      <Icon name="close" size={20} color={theme.colors.black} />
                    </Pressable>
                  </View>
                  <ScrollView contentContainerStyle={styles.rightColScroll}>
                    <ClienteDetalle
                      cliente={selectedCliente}
                      isDesktop={false}
                      onEditar={() =>
                        setModal({ mode: 'editar', cliente: selectedCliente })
                      }
                    />
                  </ScrollView>
                </>
              ) : (
                <View style={styles.rightColEmpty}>
                  <EmptyState
                    icon="person-search"
                    title="Seleccioná un cliente"
                    description="Hacé clic en una fila de la lista para ver el detalle completo."
                  />
                </View>
              )}
            </View>
          )}
        </View>
      </Screen>

      {modal && (
        <ClienteFormModal
          mode={modal.mode}
          cliente={modal.mode === 'editar' ? modal.cliente : undefined}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </>
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

// ── ClienteDetalle ────────────────────────────────────────────────────────────

function ClienteDetalle({
  cliente,
  isDesktop,
  onEditar,
}: {
  cliente: dto_ClienteResponse;
  isDesktop: boolean;
  onEditar: () => void;
}) {
  const id       = cliente.id ?? '';
  const contador = cliente.contador_infusiones ?? 0;

  const beneficios = useQuery({
    queryKey: ['cliente', id, 'beneficios'],
    queryFn:  () => ClientesService.getClientesBeneficios(id),
    enabled:  !!id,
  });
  const historial = useQuery({
    queryKey: ['cliente', id, 'historial'],
    queryFn:  () => ClientesService.getClientesHistorial(id),
    enabled:  !!id,
  });

  const proximo = (beneficios.data ?? []).find((b) => !b.alcanzado);
  const meta    = proximo?.umbral_infusiones ?? contador;

  return (
    <View style={styles.detalle}>
      {/* Perfil */}
      <Card>
        <View style={styles.profileHead}>
          <View style={{ flex: 1 }}>
            <Title>{cliente.nombre}</Title>
            <Label style={{ marginTop: 4 }}>
              DNI {cliente.dni}
              {cliente.institucion_nombre ? ` · ${cliente.institucion_nombre}` : ' · Sin convenio'}
            </Label>
          </View>
          <Button title="Editar" icon="edit" variant="secondary" onPress={onEditar} />
        </View>
      </Card>

      {/* Contador + progreso */}
      <Card tone="inverse">
        <Label style={{ color: theme.colors.onPrimaryMuted }}>Contador de infusiones</Label>
        <View style={styles.counterRow}>
          <Text style={styles.counterNum}>{contador}</Text>
          {proximo ? <Text style={styles.counterMeta}>/ {meta}</Text> : null}
        </View>
        <View style={{ marginTop: theme.spacing.md }}>
          <ProgressBar value={contador} max={meta > 0 ? meta : 1} tone="light" />
        </View>
        <Label style={styles.proximoText}>
          {proximo
            ? `${meta - contador} para «${proximo.beneficio_nombre}»`
            : 'Sin un próximo beneficio configurado'}
        </Label>
      </Card>

      <View style={[styles.twoCol, isDesktop && styles.twoColRow]}>
        {/* Beneficios */}
        <View style={styles.col}>
          <Label style={styles.sectionTitle}>Beneficios</Label>
          {beneficios.isLoading ? (
            <ActivityIndicator color={theme.colors.black} />
          ) : (beneficios.data ?? []).length === 0 ? (
            <Card>
              <Caption>Su institución no tiene beneficios configurados.</Caption>
            </Card>
          ) : (
            <Card padded={false}>
              {(beneficios.data ?? []).map((b, i) => (
                <View key={`${b.beneficio_nombre}-${i}`} style={styles.benefRow}>
                  <Icon
                    name={b.alcanzado ? 'check-circle' : 'lock'}
                    size={20}
                    color={b.alcanzado ? theme.colors.success : theme.colors.outline}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.benefName}>{b.beneficio_nombre}</Text>
                    <Caption>
                      {b.umbral_infusiones} infusiones ·{' '}
                      {b.tipo_descuento === 'porcentaje'
                        ? `${b.valor_descuento}%`
                        : moneda(b.valor_descuento ?? 0)}
                    </Caption>
                  </View>
                </View>
              ))}
            </Card>
          )}
        </View>

        {/* Historial */}
        <View style={styles.col}>
          <Label style={styles.sectionTitle}>Historial de compras</Label>
          {historial.isLoading ? (
            <ActivityIndicator color={theme.colors.black} />
          ) : (historial.data ?? []).length === 0 ? (
            <Card>
              <EmptyState
                icon="receipt-long"
                title="Sin compras"
                description="Este cliente todavía no tiene compras."
              />
            </Card>
          ) : (
            <Card padded={false}>
              {(historial.data ?? []).map((c) => (
                <View key={c.id} style={styles.compraRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.benefName}>{moneda(c.total ?? 0)}</Text>
                    <Caption>
                      {c.fecha ? new Date(c.fecha).toLocaleDateString('es-AR') : ''}
                    </Caption>
                  </View>
                  {(c.descuento ?? 0) > 0 ? (
                    <Caption style={{ color: theme.colors.success }}>
                      − {moneda(c.descuento ?? 0)}
                    </Caption>
                  ) : null}
                </View>
              ))}
            </Card>
          )}
        </View>
      </View>
    </View>
  );
}

// ── ClienteFormModal ──────────────────────────────────────────────────────────

function ClienteFormModal({
  mode,
  cliente,
  onClose,
  onSaved,
}: {
  mode: 'crear' | 'editar';
  cliente?: dto_ClienteResponse;
  onClose: () => void;
  onSaved: (c: dto_ClienteResponse) => void;
}) {
  const toast = useToast();
  const [institucionId, setInstitucionId] = useState<string | undefined>(
    cliente?.institucion_id ?? undefined,
  );

  const instituciones = useQuery({
    queryKey: ['instituciones'],
    queryFn:  () => InstitucionesService.getInstituciones(),
  });

  const { control, handleSubmit, formState: { errors } } = useForm<ClienteForm>({
    resolver:      zodResolver(clienteSchema),
    defaultValues: {
      dni:    cliente?.dni    ?? '',
      nombre: cliente?.nombre ?? '',
      email:  cliente?.email  ?? '',
    },
  });

  const guardar = useMutation({
    mutationFn: (data: ClienteForm) => {
      const email = data.email ? data.email : undefined;
      if (mode === 'editar' && cliente?.id) {
        return ClientesService.putClientes(cliente.id, { nombre: data.nombre, email, institucion_id: institucionId });
      }
      return ClientesService.postClientes({ dni: data.dni, nombre: data.nombre, email, institucion_id: institucionId });
    },
    onSuccess: (c) => onSaved(c),
    onError:   (err) => toast.error(mensajeDeError(err)),
  });

  return (
    <FormModal
      visible
      onClose={onClose}
      title={mode === 'crear' ? 'Nuevo cliente' : 'Editar cliente'}
      footer={
        <Button
          title={mode === 'crear' ? 'Registrar' : 'Guardar cambios'}
          loading={guardar.isPending}
          onPress={handleSubmit((d) => guardar.mutate(d))}
          fullWidth
        />
      }
    >
      <Controller
        control={control} name="dni"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="DNI"
            keyboardType="number-pad"
            editable={mode === 'crear'}
            value={value} onChangeText={onChange} onBlur={onBlur}
            error={errors.dni?.message}
          />
        )}
      />
      <Controller
        control={control} name="nombre"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Nombre"
            value={value} onChangeText={onChange} onBlur={onBlur}
            error={errors.nombre?.message}
          />
        )}
      />
      <Controller
        control={control} name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Email (opcional)"
            autoCapitalize="none"
            keyboardType="email-address"
            value={value ?? ''} onChangeText={onChange} onBlur={onBlur}
            error={errors.email?.message}
          />
        )}
      />
      <View>
        <Label>Institución (opcional)</Label>
        <View style={styles.chips}>
          <Pressable
            style={[styles.chip, !institucionId && styles.chipActive]}
            onPress={() => setInstitucionId(undefined)}
          >
            <Label style={!institucionId ? styles.chipActiveText : undefined}>Ninguna</Label>
          </Pressable>
          {(instituciones.data ?? []).map((i) => (
            <Pressable
              key={i.id}
              style={[styles.chip, institucionId === i.id && styles.chipActive]}
              onPress={() => setInstitucionId(i.id)}
            >
              <Label style={institucionId === i.id ? styles.chipActiveText : undefined}>
                {i.nombre}
              </Label>
            </Pressable>
          ))}
        </View>
      </View>
    </FormModal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // layout
  layout:        { gap: theme.spacing.xl },
  layoutDesktop: { flex: 1, flexDirection: 'row', gap: theme.spacing.xl },
  colLeft:       { flex: 1 },
  leftColContent: { gap: theme.spacing.md },

  // right panel
  rightCol: {
    width: 400,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.black,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  rightColHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.black,
    backgroundColor: theme.colors.surfaceVariant,
  },
  rightColTitle: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: theme.typography.fontSize.headlineMd,
    color: theme.colors.black,
    textTransform: 'uppercase',
  },
  rightColClose: { padding: 4 },
  rightColScroll: { padding: theme.spacing.md, gap: theme.spacing.md },
  rightColEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },

  // mobile detail
  mobileDetail: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.black,
  },
  mobileDetailClose: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    alignSelf: 'flex-end',
  },

  // header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  conteo: { color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.sm },

  // rango chips
  rangoScroll: { flexGrow: 0 },
  rangoRow:    { flexDirection: 'row', gap: theme.spacing.sm },
  rangoChip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.black,
  },
  rangoChipActive:     { backgroundColor: theme.colors.black },
  rangoChipText:       { color: theme.colors.black },
  rangoChipActiveText: { color: theme.colors.surfaceContainerLowest },

  // date inputs
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dateField: { flex: 1, gap: 4 },
  dateSep:   { paddingTop: theme.spacing.lg },
  dateLabel: { color: theme.colors.onSurfaceVariant },
  dateInput: {
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.black,
    paddingHorizontal: theme.spacing.md,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.bodyMd,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },

  // infusiones badge
  infBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  // detalle del cliente
  detalle:    { gap: theme.spacing.md },
  profileHead:{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  counterNum: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize:   theme.typography.fontSize.displayXl,
    color:      theme.colors.white,
  },
  counterMeta: {
    fontFamily: theme.typography.fontFamily.headingMedium,
    fontSize:   theme.typography.fontSize.headlineMd,
    color:      theme.colors.onPrimaryMuted,
    marginBottom: 8,
  },
  proximoText: { color: theme.colors.onPrimaryMuted, marginTop: theme.spacing.sm },
  twoCol:      { gap: theme.spacing.md },
  twoColRow:   { flexDirection: 'row' },
  col:         { flex: 1, gap: theme.spacing.sm },
  sectionTitle:{ fontSize: theme.typography.fontSize.headlineMd, color: theme.colors.black },
  benefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  benefName: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize:   theme.typography.fontSize.bodyMd,
    color:      theme.colors.onSurface,
  },
  compraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },

  // form modal chips
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.black,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  chipActive:     { backgroundColor: theme.colors.black },
  chipActiveText: { color: theme.colors.white },
});
