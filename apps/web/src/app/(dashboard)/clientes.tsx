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
  CardSkeleton,
  EmptyState,
  FormModal,
  Icon,
  Label,
  ProgressBar,
  Screen,
  TextField,
  theme,
  Title,
  useBreakpoint,
} from '@primitivo/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { useToast } from '@primitivo/ui';
import { mensajeDeError } from '@/lib/errors';

const clienteSchema = z.object({
  dni: z.string().min(1, 'DNI requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
});
type ClienteForm = z.infer<typeof clienteSchema>;

const moneda = (n: number) => `$ ${n.toLocaleString('es-AR')}`;

export default function ClientesScreen() {
  const qc = useQueryClient();
  const toast = useToast();
  const { isDesktop } = useBreakpoint();

  const [dni, setDni] = useState('');
  const [buscado, setBuscado] = useState<string | null>(null);
  const [modal, setModal] = useState<{ mode: 'crear' | 'editar'; cliente?: dto_ClienteResponse } | null>(
    null,
  );

  const busqueda = useQuery({
    queryKey: ['clientes', 'dni', buscado],
    queryFn: () => ClientesService.getClientes(buscado ?? undefined),
    enabled: !!buscado,
  });

  const cliente = busqueda.data?.[0];

  return (
    <Screen scroll>
      <View style={styles.headerRow}>
        <Title>Clientes</Title>
        <Button title="Nuevo" icon="person-add" onPress={() => setModal({ mode: 'crear' })} />
      </View>
      <Body style={styles.subtitle}>Buscá un cliente por DNI para ver su detalle.</Body>

      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <TextField
            placeholder="DNI del cliente…"
            keyboardType="number-pad"
            value={dni}
            onChangeText={setDni}
            onSubmitEditing={() => setBuscado(dni.trim())}
          />
        </View>
        <Button title="Buscar" icon="search" onPress={() => setBuscado(dni.trim())} />
      </View>

      {/* Resultado */}
      {buscado && busqueda.isLoading ? <CardSkeleton lines={4} /> : null}

      {buscado && !busqueda.isLoading && !cliente ? (
        <Card>
          <EmptyState
            icon="person-search"
            title="No se encontró un cliente con ese DNI"
            description={`No hay ningún cliente con DNI ${buscado}.`}
            actionLabel="Registrar cliente"
            onAction={() => setModal({ mode: 'crear' })}
          />
        </Card>
      ) : null}

      {cliente ? (
        <ClienteDetalle cliente={cliente} isDesktop={isDesktop} onEditar={() => setModal({ mode: 'editar', cliente })} />
      ) : null}

      {modal ? (
        <ClienteFormModal
          mode={modal.mode}
          cliente={modal.cliente}
          onClose={() => setModal(null)}
          onSaved={(c) => {
            setModal(null);
            qc.invalidateQueries({ queryKey: ['clientes'] });
            if (c.id) {
              qc.invalidateQueries({ queryKey: ['cliente', c.id] });
            }
            // Si veníamos de "no encontrado", mostramos el cliente recién creado.
            if (c.dni) {
              setDni(c.dni);
              setBuscado(c.dni);
            }
            toast.success(modal.mode === 'crear' ? 'Cliente registrado' : 'Cliente actualizado');
          }}
        />
      ) : null}
    </Screen>
  );
}

// ── Detalle ───────────────────────────────────────────────────────────────────

function ClienteDetalle({
  cliente,
  isDesktop,
  onEditar,
}: {
  cliente: dto_ClienteResponse;
  isDesktop: boolean;
  onEditar: () => void;
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
        {/* Beneficios disponibles */}
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
                    <Caption>{c.fecha ? new Date(c.fecha).toLocaleDateString('es-AR') : ''}</Caption>
                  </View>
                  {(c.descuento ?? 0) > 0 ? (
                    <Caption style={{ color: theme.colors.success }}>
                      -{moneda(c.descuento ?? 0)}
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

// ── Form modal (alta / edición) ─────────────────────────────────────────────

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
    queryFn: () => InstitucionesService.getInstituciones(),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ClienteForm>({
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
        return ClientesService.putClientes(cliente.id, {
          nombre: data.nombre,
          email,
          institucion_id: institucionId,
        });
      }
      return ClientesService.postClientes({
        dni: data.dni,
        nombre: data.nombre,
        email,
        institucion_id: institucionId,
      });
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
        control={control}
        name="dni"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="DNI"
            keyboardType="number-pad"
            editable={mode === 'crear'}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.dni?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="nombre"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Nombre"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.nombre?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Email (opcional)"
            autoCapitalize="none"
            keyboardType="email-address"
            value={value ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
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

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md },
  subtitle: { color: theme.colors.onSurfaceVariant },
  searchRow: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-start' },
  searchInput: { flex: 1 },
  detalle: { gap: theme.spacing.md },
  profileHead: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md },
  counterRow: { flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.xs },
  chip: { borderWidth: 1, borderColor: theme.colors.black, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
  chipActive: { backgroundColor: theme.colors.black },
  chipActiveText: { color: theme.colors.white },
});
