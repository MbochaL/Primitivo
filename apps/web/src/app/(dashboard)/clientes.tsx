import { zodResolver } from '@hookform/resolvers/zod';
import {
  ClientesService,
  InstitucionesService,
  type dto_ClienteResponse,
  type dto_ImportarClientesResponse,
} from '@primitivo/api-client';
import * as XLSX from 'xlsx';
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
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/lib/auth';
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
  { key: 'todo', label: 'Todos' },
  { key: 'mes', label: 'Este mes' },
  { key: 'mes_ant', label: 'Mes anterior' },
  { key: 'custom', label: 'Personalizado' },
];

function rangoFechas(rango: Rango, desde: string, hasta: string): [string, string] | null {
  switch (rango) {
    case 'todo': return null;
    case 'mes': return [inicioMes(), hoy()];
    case 'mes_ant': return [inicioMesAnterior(), finMesAnterior()];
    case 'custom': return [desde || hoy(), hasta || hoy()];
  }
}

// ── Form schema ───────────────────────────────────────────────────────────────

const clienteSchema = z.object({
  dni: z.string().min(1, 'DNI requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
});
type ClienteForm = z.infer<typeof clienteSchema>;

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ClientesScreen() {
  const qc = useQueryClient();
  const toast = useToast();
  const { isMobile, isDesktop } = useBreakpoint();
  const { esAdmin } = useAuth();

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rango, setRango] = useState<Rango>('todo');
  const [customDesde, setCustomDesde] = useState(hoy());
  const [customHasta, setCustomHasta] = useState(hoy());
  const [modal, setModal] = useState<
    { mode: 'crear' } | { mode: 'editar'; cliente: dto_ClienteResponse } | null
  >(null);
  const [importModal, setImportModal] = useState(false);

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
        id: c.id ?? '',
        label: c.nombre ?? '',
        sublabel: `DNI ${c.dni}${c.institucion_nombre ? ` · ${c.institucion_nombre}` : ''}`,
        meta: `${c.contador_infusiones ?? 0} inf.`,
        icon: 'person' as const,
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

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => ClientesService.deleteClientes(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] });
      setSelectedId(null);
      toast.success('Cliente eliminado');
    },
    onError: (err) => toast.error(mensajeDeError(err)),
  });

  const handleEliminar = (cliente: dto_ClienteResponse) => {
    if (!cliente.id) return;
    const id = cliente.id;
    const nombre = cliente.nombre ?? 'este cliente';
    if (Platform.OS === 'web') {
      if (window.confirm(`¿Eliminar a ${nombre}? Se borrarán también sus compras y canjes. Esta acción no se puede deshacer.`)) {
        eliminarMutation.mutate(id);
      }
    } else {
      Alert.alert(
        'Eliminar cliente',
        `¿Eliminar a ${nombre}? Se borrarán también sus compras y canjes. Esta acción no se puede deshacer.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => eliminarMutation.mutate(id) },
        ],
      );
    }
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
        <View style={styles.headerActions}>
          {Platform.OS === 'web' && esAdmin && (
            <Button
              title="Importar"
              icon="upload-file"
              variant="secondary"
              onPress={() => setImportModal(true)}
            />
          )}
          <Button title="Nuevo" icon="person-add" onPress={() => setModal({ mode: 'crear' })} />
        </View>
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
            onEliminar={esAdmin ? () => handleEliminar(selectedCliente) : undefined}
            eliminando={eliminarMutation.isPending}
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
                      onEliminar={esAdmin ? () => handleEliminar(selectedCliente) : undefined}
                      eliminando={eliminarMutation.isPending}
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

      {importModal && (
        <ImportarClientesModal
          onClose={() => setImportModal(false)}
          onImportado={() => qc.invalidateQueries({ queryKey: ['clientes'] })}
        />
      )}

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
  onEliminar,
  eliminando,
}: {
  cliente: dto_ClienteResponse;
  isDesktop: boolean;
  onEditar: () => void;
  onEliminar?: () => void;
  eliminando?: boolean;
}) {
  const id = cliente.id ?? '';
  const contador = cliente.contador_infusiones ?? 0;

  const beneficios = useQuery({
    queryKey: ['cliente', id, 'beneficios'],
    queryFn: () => ClientesService.getClientesBeneficios(id),
    enabled: !!id,
  });
  const historial = useQuery({
    queryKey: ['cliente', id, 'historial'],
    queryFn: () => ClientesService.getClientesHistorial(id),
    enabled: !!id,
  });

  const proximo = (beneficios.data ?? []).find((b) => !b.alcanzado);
  const meta = proximo?.umbral_infusiones ?? contador;

  return (
    <View style={styles.detalle}>
      {/* Perfil */}
      <Card>
        <View style={styles.profileHead}>
          <View style={{ flex: 3 }}>
            <Title>{cliente.nombre}</Title>
            <Label style={{ marginTop: 4 }}>
              DNI {cliente.dni}
              {cliente.institucion_nombre ? ` · ${cliente.institucion_nombre}` : ' · Sin convenio'}
            </Label>
          </View>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <Button title="Editar" icon="edit" variant="secondary" onPress={onEditar} />
            {onEliminar && (
              <Button
                title="Eliminar"
                icon="delete"
                variant="danger"
                loading={eliminando}
                onPress={onEliminar}
              />
            )}
          </View>
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
              <Caption>No hay beneficios disponibles para este cliente.</Caption>
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
  const [institucionId, setInstitucionId] = useState<string>(
    cliente?.institucion_id ?? '',
  );

  const instituciones = useQuery({
    queryKey: ['instituciones'],
    queryFn: () => InstitucionesService.getInstituciones(),
  });

  useEffect(() => {
    if (!institucionId && instituciones.data?.[0]?.id) {
      setInstitucionId(instituciones.data[0].id);
    }
  }, [instituciones.data, institucionId]);

  const { control, handleSubmit, formState: { errors } } = useForm<ClienteForm>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      dni: cliente?.dni ?? '',
      nombre: cliente?.nombre ?? '',
      email: cliente?.email ?? '',
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
    onError: (err) => toast.error(mensajeDeError(err)),
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
        <Label>Institución</Label>
        <View style={styles.chips}>
          {(instituciones.data ?? []).map((i) => (
            <Pressable
              key={i.id}
              style={[styles.chip, institucionId === i.id && styles.chipActive]}
              onPress={() => setInstitucionId(i.id ?? '')}
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

// ── ImportarClientesModal ─────────────────────────────────────────────────────

type FilaParseada = { dni: string; nombre: string; email?: string; institucion?: string };

async function parsearArchivo(file: File): Promise<FilaParseada[]> {
  let workbook: XLSX.WorkBook;
  const ext = file.name.toLowerCase().split('.').pop();

  if (ext === 'csv') {
    const text = await file.text();
    const primeraLinea = text.split('\n')[0] ?? '';
    const sep = primeraLinea.includes('|') ? '|' : primeraLinea.includes(';') ? ';' : ',';
    workbook = XLSX.read(text, { type: 'string', FS: sep });
  } else {
    const buffer = await file.arrayBuffer();
    workbook = XLSX.read(buffer, { type: 'array' });
  }

  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1 }) as unknown[][];

  if (filas.length < 2) return [];

  const encabezados = (filas[0] as unknown[]).map((h) =>
    String(h ?? '').trim().toLowerCase(),
  );

  const idx = {
    nombre: encabezados.findIndex(
      (h) => h.includes('nombre') || h.includes('apellido') || h === 'name',
    ),
    dni: encabezados.findIndex(
      (h) => h === 'dni' || h === 'documento' || h === 'document',
    ),
    cuil: encabezados.findIndex((h) => h === 'cuil'),
    email: encabezados.findIndex((h) => h.includes('email') || h.includes('correo')),
    institucion: encabezados.findIndex(
      (h) => h === 'institución' || h === 'institucion' || h === 'institution' || h === 'convenio',
    ),
  };

  if (idx.nombre === -1 || (idx.dni === -1 && idx.cuil === -1)) return [];

  const resultado: FilaParseada[] = [];
  for (let i = 1; i < filas.length; i++) {
    const fila = filas[i] as unknown[];
    const nombre = String(fila[idx.nombre] ?? '').trim();
    if (!nombre) continue;

    let dni: string;
    if (idx.dni >= 0 && fila[idx.dni]) {
      dni = String(fila[idx.dni]).replace(/\D/g, '');
    } else if (idx.cuil >= 0 && fila[idx.cuil]) {
      const cuil = String(fila[idx.cuil]).replace(/\D/g, '');
      // CUIL: 11 dígitos — DNI = posiciones 2-9 (base 0)
      dni = cuil.length === 11 ? cuil.substring(2, 10) : cuil;
    } else {
      continue;
    }

    if (!dni) continue;

    const emailVal =
      idx.email >= 0 && fila[idx.email]
        ? String(fila[idx.email]).trim() || undefined
        : undefined;

    const institucionVal =
      idx.institucion >= 0 && fila[idx.institucion]
        ? String(fila[idx.institucion]).trim() || undefined
        : undefined;

    resultado.push({ nombre, dni, email: emailVal, institucion: institucionVal });
  }

  return resultado;
}

function ImportarClientesModal({
  onClose,
  onImportado,
}: {
  onClose: () => void;
  onImportado: () => void;
}) {
  const toast = useToast();
  const [archivo, setArchivo] = useState<{ nombre: string; filas: FilaParseada[] } | null>(null);
  const [resultado, setResultado] = useState<dto_ImportarClientesResponse | null>(null);
  const [importando, setImportando] = useState(false);
  const [institucionId, setInstitucionId] = useState<string>('');

  const instituciones = useQuery({
    queryKey: ['instituciones'],
    queryFn: () => InstitucionesService.getInstituciones(),
  });

  useEffect(() => {
    if (!institucionId && instituciones.data?.[0]?.id) {
      setInstitucionId(instituciones.data[0].id);
    }
  }, [instituciones.data, institucionId]);

  const seleccionarArchivo = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const filas = await parsearArchivo(file);
        if (filas.length === 0) {
          toast.error(
            'No se encontraron filas válidas. Verificá que el archivo tenga columnas "Nombre" y "DNI" o "CUIL".',
          );
          return;
        }
        setArchivo({ nombre: file.name, filas });
        setResultado(null);
      } catch {
        toast.error('No se pudo leer el archivo. Verificá el formato.');
      }
    };
    input.click();
  };

  const importar = async () => {
    if (!archivo || !institucionId) return;
    setImportando(true);
    try {
      const instList = instituciones.data ?? [];
      const res = await ClientesService.postClientesImportar({
        clientes: archivo.filas.map((f) => {
          const matchId = f.institucion
            ? (instList.find(
              (i) => i.nombre?.toLowerCase() === f.institucion!.toLowerCase(),
            )?.id ?? institucionId)
            : institucionId;
          const { institucion: _inst, ...rest } = f;
          return { ...rest, institucion_id: matchId };
        }),
      });
      setResultado(res);
      onImportado();
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setImportando(false);
    }
  };

  return (
    <FormModal
      visible
      onClose={onClose}
      title="Importar clientes"
      footer={
        resultado ? (
          <Button title="Cerrar" onPress={onClose} variant="secondary" fullWidth />
        ) : (
          <Button
            title={
              archivo
                ? `Importar ${archivo.filas.length} cliente${archivo.filas.length !== 1 ? 's' : ''}`
                : 'Seleccionar archivo'
            }
            loading={importando}
            disabled={!!archivo && !institucionId}
            onPress={archivo ? importar : seleccionarArchivo}
            fullWidth
          />
        )
      }
    >
      {/* Institución por defecto */}
      {!resultado && (
        <View>
          <Label>Institución por defecto</Label>
          <Caption style={{ color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.xs }}>
            Se usa para las filas que no tengan columna "Institución" en el archivo.
          </Caption>
          <View style={styles.chips}>
            {(instituciones.data ?? []).map((i) => (
              <Pressable
                key={i.id}
                style={[styles.chip, institucionId === i.id && styles.chipActive]}
                onPress={() => setInstitucionId(i.id ?? '')}
              >
                <Label style={institucionId === i.id ? styles.chipActiveText : undefined}>
                  {i.nombre}
                </Label>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Zona de carga de archivo */}
      {!resultado && (
        <Pressable style={styles.dropzone} onPress={seleccionarArchivo}>
          <Icon name="upload-file" size={32} color={theme.colors.onSurfaceVariant} />
          <Body style={{ textAlign: 'center' }}>
            {archivo ? archivo.nombre : 'Tocá para seleccionar un archivo'}
          </Body>
          <Caption style={{ color: theme.colors.onSurfaceVariant }}>
            .xlsx · .xls · .csv
          </Caption>
        </Pressable>
      )}

      {/* Preview de filas detectadas */}
      {archivo && !resultado && (
        <Card>
          <View style={styles.importStats}>
            <View style={styles.importStat}>
              <Text style={styles.importStatNum}>{archivo.filas.length}</Text>
              <Caption>filas detectadas</Caption>
            </View>
            <View style={styles.importStat}>
              <Text style={styles.importStatNum}>
                {archivo.filas.filter((f) => !!f.institucion).length}
              </Text>
              <Caption>con institución</Caption>
            </View>
          </View>
        </Card>
      )}

      {/* Resultado de importación */}
      {resultado && (
        <Card>
          <View style={styles.importStats}>
            <View style={styles.importStat}>
              <Text style={[styles.importStatNum, { color: theme.colors.success }]}>
                {resultado.creados}
              </Text>
              <Caption>creados</Caption>
            </View>
            <View style={styles.importStat}>
              <Text style={styles.importStatNum}>{resultado.duplicados}</Text>
              <Caption>duplicados</Caption>
            </View>
            <View style={styles.importStat}>
              <Text
                style={[
                  styles.importStatNum,
                  resultado.errores.length > 0 && { color: theme.colors.danger },
                ]}
              >
                {resultado.errores.length}
              </Text>
              <Caption>errores</Caption>
            </View>
          </View>
          {resultado.errores.length > 0 && (
            <View style={{ marginTop: theme.spacing.sm, gap: theme.spacing.xs }}>
              {resultado.errores.slice(0, 5).map((e, i) => (
                <Caption key={i} style={{ color: theme.colors.danger }}>
                  {e.nombre} (DNI {e.dni}): {e.error}
                </Caption>
              ))}
              {resultado.errores.length > 5 && (
                <Caption style={{ color: theme.colors.onSurfaceVariant }}>
                  ... y {resultado.errores.length - 5} errores más
                </Caption>
              )}
            </View>
          )}
        </Card>
      )}

      {/* Instrucciones */}
      {!archivo && (
        <Card>
          <Caption style={{ color: theme.colors.onSurfaceVariant }}>
            Columnas requeridas:{'\n'}
            {'• '}
            <Caption style={{ fontWeight: '700' }}>Nombre</Caption>
            {' o '}
            <Caption style={{ fontWeight: '700' }}>Apellido y Nombre</Caption>
            {'\n'}
            {'• '}
            <Caption style={{ fontWeight: '700' }}>DNI</Caption>
            {' o '}
            <Caption style={{ fontWeight: '700' }}>CUIL</Caption>
            {' (el DNI se extrae del CUIL automáticamente)\n\nColumna opcional:\n• '}
            <Caption style={{ fontWeight: '700' }}>Institución</Caption>
            {' — sobreescribe la institución por defecto para esa fila'}
          </Caption>
        </Card>
      )}
    </FormModal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // layout
  layout: { gap: theme.spacing.xl },
  layoutDesktop: { flex: 1, flexDirection: 'row', gap: theme.spacing.xl },
  colLeft: { flex: 1 },
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
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.black,
    backgroundColor: theme.colors.surfaceContainerLowest,
    ...theme.shadows.ink,
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
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },

  // importación
  dropzone: {
    borderWidth: 2,
    borderColor: theme.colors.black,
    borderStyle: 'dashed',
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  importStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  importStat: {
    alignItems: 'center',
    gap: 2,
  },
  importStatNum: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: theme.typography.fontSize.displayXl,
    color: theme.colors.onSurface,
  },
  conteo: { color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.sm },

  // rango chips
  rangoScroll: { flexGrow: 0 },
  rangoRow: { flexDirection: 'row', gap: theme.spacing.sm },
  rangoChip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.black,
  },
  rangoChipActive: { backgroundColor: theme.colors.black },
  rangoChipText: { color: theme.colors.black },
  rangoChipActiveText: { color: theme.colors.surfaceContainerLowest },

  // date inputs
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dateField: { flex: 1, gap: 4 },
  dateSep: { paddingTop: theme.spacing.lg },
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
  detalle: { gap: theme.spacing.md },
  profileHead: { flexDirection: 'column', alignItems: 'flex-start', gap: theme.spacing.md },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  counterNum: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: theme.typography.fontSize.displayXl,
    color: theme.colors.white,
  },
  counterMeta: {
    fontFamily: theme.typography.fontFamily.headingMedium,
    fontSize: theme.typography.fontSize.headlineMd,
    color: theme.colors.onPrimaryMuted,
    marginBottom: 8,
  },
  proximoText: { color: theme.colors.onPrimaryMuted, marginTop: theme.spacing.sm },
  twoCol: { gap: theme.spacing.md },
  twoColRow: { flexDirection: 'row' },
  col: { flex: 1, gap: theme.spacing.sm },
  sectionTitle: { fontSize: theme.typography.fontSize.headlineMd, color: theme.colors.black },
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
    fontSize: theme.typography.fontSize.bodyMd,
    color: theme.colors.onSurface,
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
  chipActive: { backgroundColor: theme.colors.black },
  chipActiveText: { color: theme.colors.white },
});
