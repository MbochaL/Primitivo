import { zodResolver } from '@hookform/resolvers/zod';
import {
  BeneficiosService,
  InstitucionesService,
  type dto_BeneficioAdminResponse,
  type dto_CondicionResponse,
  type dto_InstitucionResponse,
  dto_CrearCondicionRequest,
  dto_ActualizarCondicionRequest,
} from '@primitivo/api-client';
import {
  Body,
  Button,
  Caption,
  ConfirmDialog,
  EmptyState,
  FormModal,
  Heading,
  Icon,
  Label,
  Screen,
  TableSkeleton,
  TextField,
  theme,
  Title,
  useToast,
} from '@primitivo/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/lib/auth';
import { mensajeDeError } from '@/lib/errors';

// ── helpers ──────────────────────────────────────────────────────────────────

const TIPOS_DESCUENTO = [
  dto_CrearCondicionRequest.tipo_descuento.PORCENTAJE,
  dto_CrearCondicionRequest.tipo_descuento.MONTO_FIJO,
] as const;
type TipoDescuentoValue = (typeof TIPOS_DESCUENTO)[number];

const labelTipo = (t: TipoDescuentoValue) =>
  t === dto_CrearCondicionRequest.tipo_descuento.PORCENTAJE ? 'Porcentaje' : 'Monto fijo';

const formatDescuento = (tipo: string | undefined, valor: number | undefined) => {
  if (valor == null) return '—';
  return tipo === 'porcentaje' ? `${valor}%` : `$ ${valor.toLocaleString('es-AR')}`;
};

// ── Zod schemas ───────────────────────────────────────────────────────────────

const beneficioSchema = z.object({
  institucion_id: z.string().uuid('Seleccioná una institución'),
  nombre: z.string().min(1, 'Nombre requerido'),
  activo: z.boolean().default(true),
});
type BeneficioForm = z.infer<typeof beneficioSchema>;

const condicionSchema = z.object({
  umbral_infusiones: z.coerce.number().int().min(0, 'Debe ser ≥ 0'),
  tipo_descuento: z.enum([
    dto_CrearCondicionRequest.tipo_descuento.PORCENTAJE,
    dto_CrearCondicionRequest.tipo_descuento.MONTO_FIJO,
  ]),
  valor_descuento: z.coerce.number().int().min(0, 'Debe ser ≥ 0'),
  reinicia_contador: z.boolean().default(false),
  vigente: z.boolean().default(true),
});
type CondicionForm = z.infer<typeof condicionSchema>;

// ── Screen ───────────────────────────────────────────────────────────────────

export default function BeneficiosScreen() {
  const qc = useQueryClient();
  const toast = useToast();
  const { esAdmin } = useAuth();

  const [beneficioModal, setBeneficioModal] = useState<{
    mode: 'crear' | 'editar';
    beneficio?: dto_BeneficioAdminResponse;
  } | null>(null);
  const [condicionModal, setCondicionModal] = useState<{
    mode: 'crear' | 'editar';
    beneficioId: string;
    condicion?: dto_CondicionResponse;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<dto_BeneficioAdminResponse | null>(null);

  // ── queries ───────────────────────────────────────────────────────────────
  const { data: beneficios = [], isLoading: loadingBeneficios } = useQuery({
    queryKey: ['beneficios'],
    queryFn: () => BeneficiosService.getBeneficios(),
  });

  const { data: instituciones = [], isLoading: loadingInstituciones } = useQuery({
    queryKey: ['instituciones'],
    queryFn: () => InstitucionesService.getInstituciones(),
  });

  const loading = loadingBeneficios || loadingInstituciones;

  // ── mutations ─────────────────────────────────────────────────────────────
  const crearBeneficio = useMutation({
    mutationFn: (d: BeneficioForm) =>
      BeneficiosService.postBeneficios({
        institucion_id: d.institucion_id,
        nombre: d.nombre,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['beneficios'] });
      toast.success('Beneficio creado');
      setBeneficioModal(null);
    },
    onError: (e) => toast.error(mensajeDeError(e)),
  });

  const editarBeneficio = useMutation({
    mutationFn: ({ id, d }: { id: string; d: BeneficioForm }) =>
      BeneficiosService.putBeneficios(id, {
        institucion_id: d.institucion_id,
        nombre: d.nombre,
        activo: d.activo,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['beneficios'] });
      toast.success('Beneficio actualizado');
      setBeneficioModal(null);
    },
    onError: (e) => toast.error(mensajeDeError(e)),
  });

  const desactivarBeneficio = useMutation({
    mutationFn: (id: string) => BeneficiosService.deleteBeneficios(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['beneficios'] });
      toast.success('Beneficio desactivado');
      setDeleteTarget(null);
    },
    onError: (e) => {
      toast.error(mensajeDeError(e));
      setDeleteTarget(null);
    },
  });

  const crearCondicion = useMutation({
    mutationFn: ({ beneficioId, d }: { beneficioId: string; d: CondicionForm }) =>
      BeneficiosService.postBeneficiosCondiciones(beneficioId, {
        umbral_infusiones: d.umbral_infusiones,
        tipo_descuento: d.tipo_descuento as dto_CrearCondicionRequest.tipo_descuento,
        valor_descuento: d.valor_descuento,
        reinicia_contador: d.reinicia_contador,
        vigente: d.vigente,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['beneficios'] });
      toast.success('Condición agregada');
      setCondicionModal(null);
    },
    onError: (e) => toast.error(mensajeDeError(e)),
  });

  const editarCondicion = useMutation({
    mutationFn: ({ condicionId, d }: { condicionId: string; d: CondicionForm }) =>
      BeneficiosService.putCondiciones(condicionId, {
        umbral_infusiones: d.umbral_infusiones,
        tipo_descuento: d.tipo_descuento as dto_ActualizarCondicionRequest.tipo_descuento,
        valor_descuento: d.valor_descuento,
        reinicia_contador: d.reinicia_contador,
        vigente: d.vigente,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['beneficios'] });
      toast.success('Condición actualizada');
      setCondicionModal(null);
    },
    onError: (e) => toast.error(mensajeDeError(e)),
  });

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Screen scroll>
      {/* Header manual */}
      <View style={styles.pageHeader}>
        <Title>Beneficios</Title>
        {esAdmin && (
          <Button
            title="Nuevo beneficio"
            variant="primary"
            onPress={() => setBeneficioModal({ mode: 'crear' })}
          />
        )}
      </View>

      {loading && (
        <View style={styles.skeletonWrap}>
          <TableSkeleton rows={4} />
          <TableSkeleton rows={3} />
        </View>
      )}

      {!loading && beneficios.length === 0 && (
        <EmptyState
          icon="card-giftcard"
          title="Sin beneficios"
          description={
            esAdmin
              ? 'Todavía no hay beneficios configurados. Creá el primero para asociarlo a una institución.'
              : 'No hay beneficios configurados aún.'
          }
          actionLabel={esAdmin ? 'Crear el primer beneficio' : undefined}
          onAction={esAdmin ? () => setBeneficioModal({ mode: 'crear' }) : undefined}
        />
      )}

      {!loading &&
        beneficios.map((b) => (
          <BeneficioCard
            key={b.id}
            beneficio={b}
            esAdmin={esAdmin}
            onEditar={() => setBeneficioModal({ mode: 'editar', beneficio: b })}
            onDesactivar={() => setDeleteTarget(b)}
            onNuevaCondicion={() =>
              b.id && setCondicionModal({ mode: 'crear', beneficioId: b.id })
            }
            onEditarCondicion={(c) =>
              b.id &&
              c.id &&
              setCondicionModal({ mode: 'editar', beneficioId: b.id, condicion: c })
            }
          />
        ))}

      {/* ── Modals ── */}
      <BeneficioFormModal
        visible={!!beneficioModal}
        mode={beneficioModal?.mode ?? 'crear'}
        initial={beneficioModal?.beneficio}
        instituciones={instituciones}
        loading={crearBeneficio.isPending || editarBeneficio.isPending}
        onSubmit={(d) => {
          if (beneficioModal?.mode === 'editar' && beneficioModal.beneficio?.id) {
            editarBeneficio.mutate({ id: beneficioModal.beneficio.id, d });
          } else {
            crearBeneficio.mutate(d);
          }
        }}
        onClose={() => setBeneficioModal(null)}
      />

      <CondicionFormModal
        visible={!!condicionModal}
        mode={condicionModal?.mode ?? 'crear'}
        initial={condicionModal?.condicion}
        loading={crearCondicion.isPending || editarCondicion.isPending}
        onSubmit={(d) => {
          if (condicionModal?.mode === 'editar' && condicionModal.condicion?.id) {
            editarCondicion.mutate({ condicionId: condicionModal.condicion.id, d });
          } else if (condicionModal?.beneficioId) {
            crearCondicion.mutate({ beneficioId: condicionModal.beneficioId, d });
          }
        }}
        onClose={() => setCondicionModal(null)}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="¿Desactivar beneficio?"
        message={`"${deleteTarget?.nombre}" dejará de estar disponible para los clientes. Podés reactivarlo desde el formulario de edición.`}
        confirmLabel="Desactivar"
        loading={desactivarBeneficio.isPending}
        onConfirm={() => deleteTarget?.id && desactivarBeneficio.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </Screen>
  );
}

// ── BeneficioCard ─────────────────────────────────────────────────────────────

function BeneficioCard({
  beneficio,
  esAdmin,
  onEditar,
  onDesactivar,
  onNuevaCondicion,
  onEditarCondicion,
}: {
  beneficio: dto_BeneficioAdminResponse;
  esAdmin: boolean;
  onEditar: () => void;
  onDesactivar: () => void;
  onNuevaCondicion: () => void;
  onEditarCondicion: (c: dto_CondicionResponse) => void;
}) {
  const condiciones = beneficio.condiciones ?? [];
  const sortedConds = [...condiciones].sort(
    (a, b) => (a.umbral_infusiones ?? 0) - (b.umbral_infusiones ?? 0),
  );

  return (
    <View style={styles.card}>
      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardMeta}>
          <Caption style={styles.instLabel}>
            {beneficio.institucion_nombre?.toUpperCase() ?? ''}
          </Caption>
          <View style={styles.cardTitleRow}>
            <Heading>{beneficio.nombre}</Heading>
            {!beneficio.activo && (
              <View style={styles.inactivoBadge}>
                <Caption style={{ color: theme.colors.onSurfaceVariant }}>inactivo</Caption>
              </View>
            )}
          </View>
          <Caption style={{ color: theme.colors.onSurfaceVariant }}>
            {condiciones.length} condición{condiciones.length !== 1 ? 'es' : ''}
          </Caption>
        </View>

        {esAdmin && (
          <View style={styles.cardActions}>
            <Pressable style={styles.iconBtn} onPress={onEditar} accessibilityLabel="Editar beneficio">
              <Icon name="edit" size={18} color={theme.colors.black} />
            </Pressable>
            {beneficio.activo && (
              <Pressable
                style={[styles.iconBtn, styles.iconBtnDanger]}
                onPress={onDesactivar}
                accessibilityLabel="Desactivar beneficio"
              >
                <Icon name="delete" size={18} color={theme.colors.danger} />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Condiciones */}
      <View style={styles.condiciones}>
        {sortedConds.length === 0 ? (
          <Caption style={{ color: theme.colors.onSurfaceVariant }}>
            Sin condiciones configuradas
          </Caption>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.condTableHeader}>
              <Caption style={[styles.condCell, styles.condCellUmbral]}>Umbral</Caption>
              <Caption style={[styles.condCell, styles.condCellTipo]}>Tipo</Caption>
              <Caption style={[styles.condCell, styles.condCellValor]}>Valor</Caption>
              <Caption style={[styles.condCell, styles.condCellReinicia]}>Reinicia</Caption>
              <Caption style={[styles.condCell, styles.condCellVigente]}>Vigente</Caption>
              {esAdmin && <View style={styles.condCellAction} />}
            </View>
            {sortedConds.map((c) => (
              <View key={c.id} style={styles.condRow}>
                <Body style={[styles.condCell, styles.condCellUmbral]}>
                  {c.umbral_infusiones ?? 0} inf.
                </Body>
                <Body style={[styles.condCell, styles.condCellTipo]}>
                  {c.tipo_descuento === 'porcentaje' ? 'Porcentaje' : 'Monto fijo'}
                </Body>
                <Body style={[styles.condCell, styles.condCellValor]}>
                  {formatDescuento(c.tipo_descuento, c.valor_descuento)}
                </Body>
                <View style={[styles.condCellReinicia, styles.condCell]}>
                  <Icon
                    name={c.reinicia_contador ? 'check-circle' : 'radio-button-unchecked'}
                    size={16}
                    color={
                      c.reinicia_contador ? theme.colors.success : theme.colors.outlineVariant
                    }
                  />
                </View>
                <View style={[styles.condCellVigente, styles.condCell]}>
                  <Icon
                    name={c.vigente ? 'check-circle' : 'cancel'}
                    size={16}
                    color={c.vigente ? theme.colors.success : theme.colors.danger}
                  />
                </View>
                {esAdmin && (
                  <Pressable
                    style={styles.condCellAction}
                    onPress={() => onEditarCondicion(c)}
                    accessibilityLabel="Editar condición"
                  >
                    <Icon name="edit" size={16} color={theme.colors.onSurfaceVariant} />
                  </Pressable>
                )}
              </View>
            ))}
          </ScrollView>
        )}

        {esAdmin && (
          <Pressable style={styles.addCondBtn} onPress={onNuevaCondicion}>
            <Icon name="add" size={16} color={theme.colors.onSurfaceVariant} />
            <Caption style={{ color: theme.colors.onSurfaceVariant }}>Agregar condición</Caption>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ── BeneficioFormModal ────────────────────────────────────────────────────────

function BeneficioFormModal({
  visible,
  mode,
  initial,
  instituciones,
  loading,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  mode: 'crear' | 'editar';
  initial?: dto_BeneficioAdminResponse;
  instituciones: dto_InstitucionResponse[];
  loading: boolean;
  onSubmit: (d: BeneficioForm) => void;
  onClose: () => void;
}) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BeneficioForm>({
    resolver: zodResolver(beneficioSchema),
    defaultValues: {
      institucion_id: initial?.institucion_id ?? '',
      nombre: initial?.nombre ?? '',
      activo: initial?.activo ?? true,
    },
  });

  useMemo(() => {
    reset({
      institucion_id: initial?.institucion_id ?? '',
      nombre: initial?.nombre ?? '',
      activo: initial?.activo ?? true,
    });
  }, [initial, reset]);

  const activoVal = watch('activo');

  return (
    <FormModal
      visible={visible}
      title={mode === 'crear' ? 'Nuevo beneficio' : 'Editar beneficio'}
      onClose={onClose}
      footer={
        <Button
          title={mode === 'crear' ? 'Crear beneficio' : 'Guardar cambios'}
          variant="primary"
          fullWidth
          loading={loading}
          onPress={handleSubmit(onSubmit)}
        />
      }
    >
      <Controller
        control={control}
        name="nombre"
        render={({ field }) => (
          <TextField
            label="Nombre del beneficio"
            placeholder="Ej: Descuento UBA"
            value={field.value}
            onChangeText={field.onChange}
            error={errors.nombre?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="institucion_id"
        render={({ field }) => (
          <View style={styles.fieldWrap}>
            <Label>Institución</Label>
            <View style={styles.chipPicker}>
              {instituciones.map((inst) => (
                <Pressable
                  key={inst.id}
                  style={[styles.chip, field.value === inst.id && styles.chipActive]}
                  onPress={() => inst.id && field.onChange(inst.id)}
                >
                  <Caption
                    style={
                      field.value === inst.id
                        ? { color: theme.colors.surfaceContainerLowest }
                        : undefined
                    }
                  >
                    {inst.nombre}
                  </Caption>
                </Pressable>
              ))}
            </View>
            {errors.institucion_id && (
              <Caption style={{ color: theme.colors.danger }}>
                {errors.institucion_id.message}
              </Caption>
            )}
          </View>
        )}
      />

      {mode === 'editar' && (
        <Pressable style={styles.toggle} onPress={() => setValue('activo', !activoVal)}>
          <View style={[styles.toggleBox, activoVal && styles.toggleBoxOn]}>
            {activoVal && (
              <Icon name="check" size={14} color={theme.colors.surfaceContainerLowest} />
            )}
          </View>
          <Body>Activo</Body>
        </Pressable>
      )}
    </FormModal>
  );
}

// ── CondicionFormModal ────────────────────────────────────────────────────────

function CondicionFormModal({
  visible,
  mode,
  initial,
  loading,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  mode: 'crear' | 'editar';
  initial?: dto_CondicionResponse;
  loading: boolean;
  onSubmit: (d: CondicionForm) => void;
  onClose: () => void;
}) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CondicionForm>({
    resolver: zodResolver(condicionSchema),
    defaultValues: {
      umbral_infusiones: initial?.umbral_infusiones ?? 0,
      tipo_descuento:
        (initial?.tipo_descuento as TipoDescuentoValue) ??
        dto_CrearCondicionRequest.tipo_descuento.PORCENTAJE,
      valor_descuento: initial?.valor_descuento ?? 0,
      reinicia_contador: initial?.reinicia_contador ?? false,
      vigente: initial?.vigente ?? true,
    },
  });

  useMemo(() => {
    reset({
      umbral_infusiones: initial?.umbral_infusiones ?? 0,
      tipo_descuento:
        (initial?.tipo_descuento as TipoDescuentoValue) ??
        dto_CrearCondicionRequest.tipo_descuento.PORCENTAJE,
      valor_descuento: initial?.valor_descuento ?? 0,
      reinicia_contador: initial?.reinicia_contador ?? false,
      vigente: initial?.vigente ?? true,
    });
  }, [initial, reset]);

  const reiniciaVal = watch('reinicia_contador');
  const vigenteVal = watch('vigente');

  return (
    <FormModal
      visible={visible}
      title={mode === 'crear' ? 'Nueva condición' : 'Editar condición'}
      onClose={onClose}
      footer={
        <Button
          title={mode === 'crear' ? 'Agregar condición' : 'Guardar cambios'}
          variant="primary"
          fullWidth
          loading={loading}
          onPress={handleSubmit(onSubmit)}
        />
      }
    >
      <Controller
        control={control}
        name="umbral_infusiones"
        render={({ field }) => (
          <TextField
            label="Umbral de infusiones"
            placeholder="0"
            value={String(field.value)}
            onChangeText={(v) => field.onChange(isNaN(Number(v)) ? 0 : Number(v))}
            keyboardType="numeric"
            error={errors.umbral_infusiones?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="tipo_descuento"
        render={({ field }) => (
          <View style={styles.fieldWrap}>
            <Label>Tipo de descuento</Label>
            <View style={styles.segmented}>
              {TIPOS_DESCUENTO.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.segBtn, field.value === t && styles.segBtnActive]}
                  onPress={() => field.onChange(t)}
                >
                  <Body style={field.value === t ? styles.segBtnActiveText : undefined}>
                    {labelTipo(t)}
                  </Body>
                </Pressable>
              ))}
            </View>
            {errors.tipo_descuento && (
              <Caption style={{ color: theme.colors.danger }}>
                {errors.tipo_descuento.message}
              </Caption>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="valor_descuento"
        render={({ field }) => (
          <TextField
            label="Valor del descuento"
            placeholder="0"
            value={String(field.value)}
            onChangeText={(v) => field.onChange(isNaN(Number(v)) ? 0 : Number(v))}
            keyboardType="numeric"
            error={errors.valor_descuento?.message}
          />
        )}
      />

      <View style={styles.togglesRow}>
        <Pressable
          style={styles.toggle}
          onPress={() => setValue('reinicia_contador', !reiniciaVal)}
        >
          <View style={[styles.toggleBox, reiniciaVal && styles.toggleBoxOn]}>
            {reiniciaVal && (
              <Icon name="check" size={14} color={theme.colors.surfaceContainerLowest} />
            )}
          </View>
          <Body>Reinicia contador</Body>
        </Pressable>

        <Pressable style={styles.toggle} onPress={() => setValue('vigente', !vigenteVal)}>
          <View style={[styles.toggleBox, vigenteVal && styles.toggleBoxOn]}>
            {vigenteVal && (
              <Icon name="check" size={14} color={theme.colors.surfaceContainerLowest} />
            )}
          </View>
          <Body>Vigente</Body>
        </Pressable>
      </View>
    </FormModal>
  );
}

// ── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  skeletonWrap: { gap: theme.spacing.xl },
  // card
  card: {
    borderWidth: 2,
    borderColor: theme.colors.black,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.black,
    backgroundColor: theme.colors.surfaceVariant,
    gap: theme.spacing.md,
  },
  cardMeta: { gap: 2, flex: 1 },
  instLabel: {
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 1,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flexWrap: 'wrap' },
  inactivoBadge: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  cardActions: { flexDirection: 'row', gap: theme.spacing.xs, alignItems: 'center' },
  iconBtn: {
    padding: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDanger: { borderColor: theme.colors.danger },
  // condiciones
  condiciones: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  condTableHeader: {
    flexDirection: 'row',
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
    marginBottom: theme.spacing.xs,
  },
  condRow: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
    alignItems: 'center',
  },
  condCell: { paddingRight: theme.spacing.sm },
  condCellUmbral: { width: 80 },
  condCellTipo: { width: 100 },
  condCellValor: { width: 90 },
  condCellReinicia: { width: 70, alignItems: 'center' },
  condCellVigente: { width: 70, alignItems: 'center' },
  condCellAction: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCondBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderStyle: 'dashed',
    marginTop: theme.spacing.xs,
  },
  // forms
  fieldWrap: { gap: theme.spacing.xs },
  chipPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  chip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.black,
  },
  chipActive: { backgroundColor: theme.colors.black },
  segmented: { flexDirection: 'row' },
  segBtn: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.black,
    alignItems: 'center',
    marginRight: -2,
  },
  segBtnActive: { backgroundColor: theme.colors.black },
  segBtnActiveText: { color: theme.colors.surfaceContainerLowest },
  togglesRow: { flexDirection: 'row', gap: theme.spacing.lg, marginTop: theme.spacing.sm },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  toggleBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: theme.colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBoxOn: { backgroundColor: theme.colors.black },
});
