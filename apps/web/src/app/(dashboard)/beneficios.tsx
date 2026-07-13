import { zodResolver } from '@hookform/resolvers/zod';
import {
  BeneficiosService,
  InstitucionesService,
  MenuService,
  type dto_BeneficioAdminResponse,
  type dto_CondicionResponse,
  type dto_InstitucionResponse,
  type dto_CategoriaMenuResponse,
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
  SearchBar,
  type SearchSuggestion,
  TableSkeleton,
  TextField,
  theme,
  Title,
  useToast,
} from '@primitivo/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/lib/auth';
import { mensajeDeError } from '@/lib/errors';
import { Redirect } from 'expo-router';

// ── helpers ──────────────────────────────────────────────────────────────────

const TIPOS_DESCUENTO = [
  dto_CrearCondicionRequest.tipo_descuento.PORCENTAJE,
  dto_CrearCondicionRequest.tipo_descuento.MONTO_FIJO,
  dto_CrearCondicionRequest.tipo_descuento.PRODUCTO_GRATIS,
] as const;
type TipoDescuentoValue = (typeof TIPOS_DESCUENTO)[number];

const TIPOS_TRIGGER = [
  dto_CrearCondicionRequest.tipo_trigger.SIEMPRE,
  dto_CrearCondicionRequest.tipo_trigger.DIAS_SEMANA,
  dto_CrearCondicionRequest.tipo_trigger.CONTADOR,
] as const;
type TipoTriggerValue = (typeof TIPOS_TRIGGER)[number];

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

const labelTipoDescuento = (t: TipoDescuentoValue) => {
  if (t === dto_CrearCondicionRequest.tipo_descuento.PORCENTAJE) return 'Porcentaje';
  if (t === dto_CrearCondicionRequest.tipo_descuento.MONTO_FIJO) return 'Monto fijo';
  return 'Prod. gratis';
};

const labelTipoTrigger = (t: TipoTriggerValue) => {
  if (t === dto_CrearCondicionRequest.tipo_trigger.SIEMPRE) return 'Siempre';
  if (t === dto_CrearCondicionRequest.tipo_trigger.DIAS_SEMANA) return 'Días';
  return 'Contador';
};

const formatDescuento = (tipo: string | undefined, valor: number | undefined) => {
  if (tipo === 'producto_gratis') return 'Gratis';
  if (valor == null) return '—';
  return tipo === 'porcentaje' ? `${valor}%` : `$${valor.toLocaleString('es-AR')}`;
};

const formatTrigger = (c: dto_CondicionResponse) => {
  if (c.tipo_trigger === 'siempre') return 'Siempre';
  if (c.tipo_trigger === 'dias_semana') {
    const dias = (c.dias_semana ?? []).map((d) => DIAS[d] ?? d).join(', ');
    return dias || '—';
  }
  const scope = c.scope_trigger === 'infusiones' ? 'inf.' : c.scope_trigger === 'categoria' ? 'cat.' : 'prod.';
  return `${c.umbral_infusiones ?? 0} ${scope}`;
};

// ── Zod schemas ───────────────────────────────────────────────────────────────

const beneficioSchema = z.object({
  institucion_id: z.string().uuid().nullable().optional(),
  nombre: z.string().min(1, 'Nombre requerido'),
  activo: z.boolean().default(true),
});
type BeneficioForm = z.infer<typeof beneficioSchema>;

const condicionSchema = z
  .object({
    tipo_trigger: z.enum([
      dto_CrearCondicionRequest.tipo_trigger.SIEMPRE,
      dto_CrearCondicionRequest.tipo_trigger.DIAS_SEMANA,
      dto_CrearCondicionRequest.tipo_trigger.CONTADOR,
    ]),
    dias_semana: z.array(z.number()).default([]),
    scope_trigger: z.enum([
      dto_CrearCondicionRequest.scope_trigger.INFUSIONES,
      dto_CrearCondicionRequest.scope_trigger.CATEGORIA,
      dto_CrearCondicionRequest.scope_trigger.PRODUCTO,
    ]),
    scope_trigger_categoria_id: z.string().nullable().optional(),
    scope_trigger_producto_id: z.string().nullable().optional(),
    umbral_infusiones: z.coerce.number().int().min(0, 'Debe ser ≥ 0'),
    tipo_descuento: z.enum([
      dto_CrearCondicionRequest.tipo_descuento.PORCENTAJE,
      dto_CrearCondicionRequest.tipo_descuento.MONTO_FIJO,
      dto_CrearCondicionRequest.tipo_descuento.PRODUCTO_GRATIS,
    ]),
    valor_descuento: z.coerce.number().int().min(0, 'Debe ser ≥ 0'),
    scope_descuento: z.enum([
      dto_CrearCondicionRequest.scope_descuento.TOTAL,
      dto_CrearCondicionRequest.scope_descuento.CATEGORIA,
    ]),
    scope_descuento_categoria_id: z.string().nullable().optional(),
    reinicia_contador: z.boolean().default(false),
    vigente: z.boolean().default(true),
  })
  .refine(
    (d) =>
      d.tipo_descuento !== dto_CrearCondicionRequest.tipo_descuento.PORCENTAJE ||
      d.valor_descuento <= 100,
    { message: 'El porcentaje no puede superar 100', path: ['valor_descuento'] },
  );
type CondicionForm = z.infer<typeof condicionSchema>;

// ── Screen ───────────────────────────────────────────────────────────────────

export default function BeneficiosScreen() {
  const qc = useQueryClient();
  const toast = useToast();
  const { esAdmin } = useAuth();

  if (!esAdmin) return <Redirect href="/clientes" />;

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

  const { data: menu = [] } = useQuery({
    queryKey: ['menu'],
    queryFn: () => MenuService.getMenu(),
  });

  const loading = loadingBeneficios || loadingInstituciones;

  // ── búsqueda ──────────────────────────────────────────────────────────────
  const [query, setQuery] = useState('');

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return beneficios;
    return beneficios.filter(
      (b) =>
        b.nombre?.toLowerCase().includes(q) ||
        b.institucion_nombre?.toLowerCase().includes(q),
    );
  }, [beneficios, query]);

  const suggestions = useMemo<SearchSuggestion[]>(() => {
    return filtrados.slice(0, 8).map((b) => ({
      id: b.id ?? '',
      label: b.nombre ?? '',
      sublabel: b.institucion_nombre ?? 'Global',
      meta: b.condiciones?.length ? `${b.condiciones.length} cond.` : undefined,
      icon: 'loyalty' as const,
      inactive: !b.activo,
    }));
  }, [filtrados]);

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

  const eliminarBeneficio = useMutation({
    mutationFn: (id: string) => BeneficiosService.deleteBeneficios(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['beneficios'] });
      toast.success('Beneficio eliminado');
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
        tipo_trigger: d.tipo_trigger as dto_CrearCondicionRequest.tipo_trigger,
        dias_semana: d.dias_semana,
        scope_trigger: d.scope_trigger as dto_CrearCondicionRequest.scope_trigger,
        scope_trigger_categoria_id: d.scope_trigger_categoria_id ?? null,
        scope_trigger_producto_id: d.scope_trigger_producto_id ?? null,
        scope_descuento: d.scope_descuento as dto_CrearCondicionRequest.scope_descuento,
        scope_descuento_categoria_id: d.scope_descuento_categoria_id ?? null,
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
        tipo_trigger: d.tipo_trigger as dto_ActualizarCondicionRequest.tipo_trigger,
        dias_semana: d.dias_semana,
        scope_trigger: d.scope_trigger as dto_ActualizarCondicionRequest.scope_trigger,
        scope_trigger_categoria_id: d.scope_trigger_categoria_id ?? null,
        scope_trigger_producto_id: d.scope_trigger_producto_id ?? null,
        scope_descuento: d.scope_descuento as dto_ActualizarCondicionRequest.scope_descuento,
        scope_descuento_categoria_id: d.scope_descuento_categoria_id ?? null,
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

      <SearchBar
        value={query}
        onChangeText={setQuery}
        suggestions={suggestions}
        onSelect={(s) => setQuery(s.label)}
        placeholder="Buscar beneficio por nombre o institución…"
      />

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

      {!loading && beneficios.length > 0 && filtrados.length === 0 && (
        <EmptyState icon="search-off" title="Sin resultados" description={`No hay beneficios que coincidan con "${query}".`} />
      )}

      {!loading &&
        filtrados.map((b) => (
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
        categorias={menu}
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
        title="¿Eliminar beneficio?"
        message={`"${deleteTarget?.nombre}" será eliminado permanentemente junto con todas sus condiciones. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={eliminarBeneficio.isPending}
        onConfirm={() => deleteTarget?.id && eliminarBeneficio.mutate(deleteTarget.id)}
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
            {beneficio.institucion_nombre ? beneficio.institucion_nombre.toUpperCase() : 'GLOBAL'}
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
                accessibilityLabel="Eliminar beneficio"
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
            <View>
              <View style={styles.condTableHeader}>
                <Caption style={[styles.condCell, styles.condCellTrigger]}>Cuándo</Caption>
                <Caption style={[styles.condCell, styles.condCellTipo]}>Descuento</Caption>
                <Caption style={[styles.condCell, styles.condCellValor]}>Valor</Caption>
                <Caption style={[styles.condCell, styles.condCellReinicia]}>Reinicia</Caption>
                <Caption style={[styles.condCell, styles.condCellVigente]}>Vigente</Caption>
                {esAdmin && <View style={styles.condCellAction} />}
              </View>
              {sortedConds.map((c) => (
                <View key={c.id} style={styles.condRow}>
                  <Body style={[styles.condCell, styles.condCellTrigger]}>
                    {formatTrigger(c)}
                  </Body>
                  <Body style={[styles.condCell, styles.condCellTipo]}>
                    {c.tipo_descuento === 'porcentaje'
                      ? 'Porcentaje'
                      : c.tipo_descuento === 'monto_fijo'
                      ? 'Monto fijo'
                      : 'Prod. gratis'}
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
            </View>
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
      institucion_id: initial?.institucion_id ?? null,
      nombre: initial?.nombre ?? '',
      activo: initial?.activo ?? true,
    },
  });

  useEffect(() => {
    reset({
      institucion_id: initial?.institucion_id ?? null,
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
              {/* Opción global */}
              <Pressable
                style={[styles.chip, !field.value && styles.chipActive]}
                onPress={() => field.onChange(null)}
              >
                <Caption style={!field.value ? { color: theme.colors.white } : undefined}>
                  Global (todos)
                </Caption>
              </Pressable>
              {instituciones.map((inst) => (
                <Pressable
                  key={inst.id}
                  style={[styles.chip, field.value === inst.id && styles.chipActive]}
                  onPress={() => inst.id && field.onChange(inst.id)}
                >
                  <Caption
                    style={
                      field.value === inst.id
                        ? { color: theme.colors.white }
                        : undefined
                    }
                  >
                    {inst.nombre}
                  </Caption>
                </Pressable>
              ))}
            </View>
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
  categorias,
  loading,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  mode: 'crear' | 'editar';
  initial?: dto_CondicionResponse;
  categorias: dto_CategoriaMenuResponse[];
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
    defaultValues: buildDefaults(initial),
  });

  useEffect(() => {
    reset(buildDefaults(initial));
  }, [initial, reset]);

  const tipoTrigger = watch('tipo_trigger');
  const scopeTrigger = watch('scope_trigger');
  const tipoDescuento = watch('tipo_descuento');
  const scopeDescuento = watch('scope_descuento');
  const diasSemana = watch('dias_semana');
  const reiniciaVal = watch('reinicia_contador');
  const vigenteVal = watch('vigente');

  const toggleDia = (d: number) => {
    const next = diasSemana.includes(d) ? diasSemana.filter((x) => x !== d) : [...diasSemana, d];
    setValue('dias_semana', next);
  };

  const needsCategoriaTrigger =
    tipoTrigger === dto_CrearCondicionRequest.tipo_trigger.CONTADOR &&
    scopeTrigger === dto_CrearCondicionRequest.scope_trigger.CATEGORIA;

  const needsCategoriaDescuento =
    (tipoDescuento !== dto_CrearCondicionRequest.tipo_descuento.PRODUCTO_GRATIS &&
      scopeDescuento === dto_CrearCondicionRequest.scope_descuento.CATEGORIA) ||
    tipoDescuento === dto_CrearCondicionRequest.tipo_descuento.PRODUCTO_GRATIS;

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
      {/* ── TRIGGER ── */}
      <Controller
        control={control}
        name="tipo_trigger"
        render={({ field }) => (
          <View style={styles.fieldWrap}>
            <Label>Cuándo aplica</Label>
            <View style={styles.segmented}>
              {TIPOS_TRIGGER.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.segBtn, field.value === t && styles.segBtnActive]}
                  onPress={() => field.onChange(t)}
                >
                  <Body style={field.value === t ? styles.segBtnActiveText : undefined}>
                    {labelTipoTrigger(t)}
                  </Body>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      />

      {/* días de semana */}
      {tipoTrigger === dto_CrearCondicionRequest.tipo_trigger.DIAS_SEMANA && (
        <View style={styles.fieldWrap}>
          <Label>Días de la semana</Label>
          <View style={styles.diasRow}>
            {DIAS.map((label, idx) => (
              <Pressable
                key={idx}
                style={[styles.diaBtn, diasSemana.includes(idx) && styles.diaBtnActive]}
                onPress={() => toggleDia(idx)}
              >
                <Caption
                  style={
                    diasSemana.includes(idx)
                      ? { color: theme.colors.white }
                      : undefined
                  }
                >
                  {label}
                </Caption>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* scope del contador */}
      {tipoTrigger === dto_CrearCondicionRequest.tipo_trigger.CONTADOR && (
        <>
          <Controller
            control={control}
            name="scope_trigger"
            render={({ field }) => (
              <View style={styles.fieldWrap}>
                <Label>Qué se cuenta</Label>
                <View style={styles.chipPicker}>
                  {[
                    { v: dto_CrearCondicionRequest.scope_trigger.INFUSIONES, label: 'Infusiones' },
                    { v: dto_CrearCondicionRequest.scope_trigger.CATEGORIA, label: 'Categoría' },
                    { v: dto_CrearCondicionRequest.scope_trigger.PRODUCTO, label: 'Producto' },
                  ].map((opt) => (
                    <Pressable
                      key={opt.v}
                      style={[styles.chip, field.value === opt.v && styles.chipActive]}
                      onPress={() => field.onChange(opt.v)}
                    >
                      <Caption style={field.value === opt.v ? { color: theme.colors.white } : undefined}>
                        {opt.label}
                      </Caption>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          />

          {needsCategoriaTrigger && (
            <Controller
              control={control}
              name="scope_trigger_categoria_id"
              render={({ field }) => (
                <View style={styles.fieldWrap}>
                  <Label>Categoría del contador</Label>
                  <View style={styles.chipPicker}>
                    {categorias.map((cat) => (
                      <Pressable
                        key={cat.id}
                        style={[styles.chip, field.value === cat.id && styles.chipActive]}
                        onPress={() => cat.id && field.onChange(cat.id)}
                      >
                        <Caption style={field.value === cat.id ? { color: theme.colors.white } : undefined}>
                          {cat.nombre}
                        </Caption>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            />
          )}

          <Controller
            control={control}
            name="umbral_infusiones"
            render={({ field }) => (
              <TextField
                label={`Umbral (cantidad de ${scopeTrigger === 'infusiones' ? 'infusiones' : 'ítems'})`}
                placeholder="0"
                value={String(field.value)}
                onChangeText={(v) => field.onChange(isNaN(Number(v)) ? 0 : Number(v))}
                keyboardType="numeric"
                error={errors.umbral_infusiones?.message}
              />
            )}
          />
        </>
      )}

      {/* ── DESCUENTO ── */}
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
                    {labelTipoDescuento(t)}
                  </Body>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      />

      {tipoDescuento !== dto_CrearCondicionRequest.tipo_descuento.PRODUCTO_GRATIS && (
        <>
          <Controller
            control={control}
            name="valor_descuento"
            render={({ field }) => (
              <TextField
                label={
                  tipoDescuento === dto_CrearCondicionRequest.tipo_descuento.PORCENTAJE
                    ? 'Porcentaje (0–100)'
                    : 'Monto fijo ($)'
                }
                placeholder={
                  tipoDescuento === dto_CrearCondicionRequest.tipo_descuento.PORCENTAJE ? '10' : '500'
                }
                value={String(field.value)}
                onChangeText={(v) => field.onChange(isNaN(Number(v)) ? 0 : Number(v))}
                keyboardType="numeric"
                error={errors.valor_descuento?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="scope_descuento"
            render={({ field }) => (
              <View style={styles.fieldWrap}>
                <Label>¿A qué aplica el descuento?</Label>
                <View style={styles.chipPicker}>
                  {[
                    { v: dto_CrearCondicionRequest.scope_descuento.TOTAL, label: 'Compra completa' },
                    { v: dto_CrearCondicionRequest.scope_descuento.CATEGORIA, label: 'Solo una categoría' },
                  ].map((opt) => (
                    <Pressable
                      key={opt.v}
                      style={[styles.chip, field.value === opt.v && styles.chipActive]}
                      onPress={() => field.onChange(opt.v)}
                    >
                      <Caption style={field.value === opt.v ? { color: theme.colors.white } : undefined}>
                        {opt.label}
                      </Caption>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          />
        </>
      )}

      {/* categoría objetivo del descuento (para scope='categoria' o producto_gratis) */}
      {needsCategoriaDescuento && (
        <Controller
          control={control}
          name="scope_descuento_categoria_id"
          render={({ field }) => (
            <View style={styles.fieldWrap}>
              <Label>
                {tipoDescuento === dto_CrearCondicionRequest.tipo_descuento.PRODUCTO_GRATIS
                  ? 'Categoría del producto gratuito'
                  : 'Categoría con descuento'}
              </Label>
              <View style={styles.chipPicker}>
                {categorias.map((cat) => (
                  <Pressable
                    key={cat.id}
                    style={[styles.chip, field.value === cat.id && styles.chipActive]}
                    onPress={() => cat.id && field.onChange(cat.id)}
                  >
                    <Caption style={field.value === cat.id ? { color: theme.colors.white } : undefined}>
                      {cat.nombre}
                    </Caption>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        />
      )}

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

function buildDefaults(initial?: dto_CondicionResponse): CondicionForm {
  return {
    tipo_trigger:
      (initial?.tipo_trigger as TipoTriggerValue) ??
      dto_CrearCondicionRequest.tipo_trigger.CONTADOR,
    dias_semana: initial?.dias_semana ?? [],
    scope_trigger:
      (initial?.scope_trigger as dto_CrearCondicionRequest.scope_trigger) ??
      dto_CrearCondicionRequest.scope_trigger.INFUSIONES,
    scope_trigger_categoria_id: initial?.scope_trigger_categoria_id ?? null,
    scope_trigger_producto_id: initial?.scope_trigger_producto_id ?? null,
    umbral_infusiones: initial?.umbral_infusiones ?? 0,
    tipo_descuento:
      (initial?.tipo_descuento as TipoDescuentoValue) ??
      dto_CrearCondicionRequest.tipo_descuento.PORCENTAJE,
    valor_descuento: initial?.valor_descuento ?? 0,
    scope_descuento:
      (initial?.scope_descuento as dto_CrearCondicionRequest.scope_descuento) ??
      dto_CrearCondicionRequest.scope_descuento.TOTAL,
    scope_descuento_categoria_id: initial?.scope_descuento_categoria_id ?? null,
    reinicia_contador: initial?.reinicia_contador ?? false,
    vigente: initial?.vigente ?? true,
  };
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
  condCellTrigger: { width: 100 },
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
  diasRow: { flexDirection: 'row', gap: theme.spacing.xs, flexWrap: 'wrap' },
  diaBtn: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.black,
    minWidth: 40,
    alignItems: 'center',
  },
  diaBtnActive: { backgroundColor: theme.colors.black },
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
