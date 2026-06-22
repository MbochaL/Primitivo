import { zodResolver } from '@hookform/resolvers/zod';
import {
  MenuService,
  type dto_CategoriaAdminResponse,
  type dto_ProductoAdminResponse,
  dto_CrearCategoriaRequest,
  dto_ActualizarCategoriaRequest,
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
  ResponsiveTable,
  Screen,
  TableSkeleton,
  TextField,
  theme,
  Title,
  useBreakpoint,
  useToast,
} from '@primitivo/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/lib/auth';
import { mensajeDeError } from '@/lib/errors';

// ── helpers ─────────────────────────────────────────────────────────────────

const moneda = (n: number) => `$ ${n.toLocaleString('es-AR')}`;

const SECCIONES = [
  dto_CrearCategoriaRequest.seccion.CAFETER_A,
  dto_CrearCategoriaRequest.seccion.COCINA_DE_MEDIOD_A,
] as const;
type SeccionValue = (typeof SECCIONES)[number];

// ── Zod schemas ──────────────────────────────────────────────────────────────

const categoriaSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  seccion: z.enum([
    dto_CrearCategoriaRequest.seccion.CAFETER_A,
    dto_CrearCategoriaRequest.seccion.COCINA_DE_MEDIOD_A,
  ]),
  orden: z.coerce.number().int().min(0).default(0),
});
type CategoriaForm = z.infer<typeof categoriaSchema>;

const productoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().default(''),
  precio: z
    .string()
    .min(1, 'Precio requerido')
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, 'Debe ser un número positivo'),
  categoria_id: z.string().uuid('Seleccioná una categoría'),
  es_infusion: z.boolean().default(false),
  activo: z.boolean().default(true),
});
type ProductoForm = z.infer<typeof productoSchema>;

// ── Screen ───────────────────────────────────────────────────────────────────

export default function MenuScreen() {
  const qc = useQueryClient();
  const toast = useToast();
  const { esAdmin } = useAuth();
  const { isMobile } = useBreakpoint();

  const [catModal, setCatModal] = useState<{
    mode: 'crear' | 'editar';
    cat?: dto_CategoriaAdminResponse;
  } | null>(null);
  const [prodModal, setProdModal] = useState<{
    mode: 'crear' | 'editar';
    prod?: dto_ProductoAdminResponse;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<dto_ProductoAdminResponse | null>(null);

  // ── queries ───────────────────────────────────────────────────────────────
  const { data: categorias = [], isLoading: loadingCats } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => MenuService.getCategorias(),
  });

  const { data: productos = [], isLoading: loadingProds } = useQuery({
    queryKey: ['productos', 'admin'],
    queryFn: () => MenuService.getProductos(),
  });

  const loading = loadingCats || loadingProds;

  // ── mutations ─────────────────────────────────────────────────────────────
  const crearCat = useMutation({
    mutationFn: (d: CategoriaForm) =>
      MenuService.postCategorias({
        nombre: d.nombre,
        seccion: d.seccion as dto_CrearCategoriaRequest.seccion,
        orden: d.orden,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoría creada');
      setCatModal(null);
    },
    onError: (e) => toast.error(mensajeDeError(e)),
  });

  const editarCat = useMutation({
    mutationFn: ({ id, d }: { id: string; d: CategoriaForm }) =>
      MenuService.putCategorias(id, {
        nombre: d.nombre,
        seccion: d.seccion as dto_ActualizarCategoriaRequest.seccion,
        orden: d.orden,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categorias'] });
      toast.success('Categoría actualizada');
      setCatModal(null);
    },
    onError: (e) => toast.error(mensajeDeError(e)),
  });

  const crearProd = useMutation({
    mutationFn: (d: ProductoForm) =>
      MenuService.postProductos({
        nombre: d.nombre,
        descripcion: d.descripcion,
        precio: Number(d.precio),
        categoria_id: d.categoria_id,
        es_infusion: d.es_infusion,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos', 'admin'] });
      qc.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Producto creado');
      setProdModal(null);
    },
    onError: (e) => toast.error(mensajeDeError(e)),
  });

  const editarProd = useMutation({
    mutationFn: ({ id, d }: { id: string; d: ProductoForm }) =>
      MenuService.putProductos(id, {
        nombre: d.nombre,
        descripcion: d.descripcion,
        precio: Number(d.precio),
        categoria_id: d.categoria_id,
        es_infusion: d.es_infusion,
        activo: d.activo,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos', 'admin'] });
      qc.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Producto actualizado');
      setProdModal(null);
    },
    onError: (e) => toast.error(mensajeDeError(e)),
  });

  const desactivarProd = useMutation({
    mutationFn: (id: string) => MenuService.deleteProductos(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos', 'admin'] });
      qc.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Producto desactivado');
      setDeleteTarget(null);
    },
    onError: (e) => {
      toast.error(mensajeDeError(e));
      setDeleteTarget(null);
    },
  });

  // ── datos agrupados ───────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { cat: dto_CategoriaAdminResponse; prods: dto_ProductoAdminResponse[] }
    >();
    for (const c of categorias) {
      if (c.id) map.set(c.id, { cat: c, prods: [] });
    }
    for (const p of productos) {
      if (p.categoria_id) map.get(p.categoria_id)?.prods.push(p);
    }
    return [...map.values()].sort((a, b) => {
      const sa = a.cat.seccion ?? '';
      const sb = b.cat.seccion ?? '';
      if (sa !== sb) return sa.localeCompare(sb);
      return (a.cat.orden ?? 0) - (b.cat.orden ?? 0);
    });
  }, [categorias, productos]);

  // ── columnas tabla ────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'nombre',
      header: 'Nombre',
      flex: 2,
      render: (p: dto_ProductoAdminResponse) => (
        <View style={styles.nombreCell}>
          <Body numberOfLines={1}>{p.nombre}</Body>
          {!p.activo && (
            <View style={styles.inactivoBadge}>
              <Caption style={{ color: theme.colors.onSurfaceVariant }}>inactivo</Caption>
            </View>
          )}
        </View>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      flex: 3,
      hideOnMobile: true,
      render: (p: dto_ProductoAdminResponse) => (
        <Caption numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant }}>
          {p.descripcion || '—'}
        </Caption>
      ),
    },
    {
      key: 'precio',
      header: 'Precio',
      flex: 1,
      render: (p: dto_ProductoAdminResponse) => <Body>{moneda(p.precio ?? 0)}</Body>,
    },
    {
      key: 'infusion',
      header: 'Infusión',
      flex: 1,
      hideOnMobile: true,
      render: (p: dto_ProductoAdminResponse) => (
        <Icon
          name={p.es_infusion ? 'check-circle' : 'radio-button-unchecked'}
          size={18}
          color={p.es_infusion ? theme.colors.success : theme.colors.outlineVariant}
        />
      ),
    },
  ];

  const rowActions = esAdmin
    ? (p: dto_ProductoAdminResponse) => (
        <View style={styles.rowActions}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => setProdModal({ mode: 'editar', prod: p })}
            accessibilityLabel="Editar producto"
          >
            <Icon name="edit" size={18} color={theme.colors.black} />
          </Pressable>
          {p.activo && (
            <Pressable
              style={[styles.iconBtn, styles.iconBtnDanger]}
              onPress={() => setDeleteTarget(p)}
              accessibilityLabel="Desactivar producto"
            >
              <Icon name="delete" size={18} color={theme.colors.danger} />
            </Pressable>
          )}
        </View>
      )
    : undefined;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Screen scroll>
      {/* Header manual (Screen no tiene title prop) */}
      <View style={styles.pageHeader}>
        <Title>Menú</Title>
        {esAdmin && (
          <View style={styles.headerBtns}>
            <Button
              title={isMobile ? 'Categoría' : 'Nueva categoría'}
              variant="secondary"
              onPress={() => setCatModal({ mode: 'crear' })}
            />
            <Button
              title={isMobile ? 'Producto' : 'Nuevo producto'}
              variant="primary"
              onPress={() => setProdModal({ mode: 'crear' })}
            />
          </View>
        )}
      </View>

      {loading && (
        <View style={styles.skeletonWrap}>
          <TableSkeleton rows={6} />
          <TableSkeleton rows={4} />
          <TableSkeleton rows={3} />
        </View>
      )}

      {!loading && productos.length === 0 && (
        <EmptyState
          icon="restaurant-menu"
          title="El menú está vacío"
          description={
            esAdmin
              ? 'Todavía no hay productos. Empezá creando una categoría y su primer producto.'
              : 'El menú aún no tiene productos cargados.'
          }
          actionLabel={esAdmin ? 'Crear el primer producto' : undefined}
          onAction={esAdmin ? () => setProdModal({ mode: 'crear' }) : undefined}
        />
      )}

      {!loading &&
        productos.length > 0 &&
        grouped.map(({ cat, prods }) => (
          <View key={cat.id} style={styles.section}>
            {/* Header de categoría */}
            <View style={styles.catHeader}>
              <View style={styles.catMeta}>
                <Caption style={styles.seccionLabel}>{(cat.seccion ?? '').toUpperCase()}</Caption>
                <Heading>{cat.nombre}</Heading>
                <Caption style={{ color: theme.colors.onSurfaceVariant }}>
                  {prods.length} producto{prods.length !== 1 ? 's' : ''}
                </Caption>
              </View>
              {esAdmin && (
                <Pressable
                  style={styles.editCatBtn}
                  onPress={() => setCatModal({ mode: 'editar', cat })}
                  accessibilityLabel="Editar categoría"
                >
                  <Icon name="edit" size={16} color={theme.colors.onSurfaceVariant} />
                  {!isMobile && (
                    <Caption style={{ color: theme.colors.onSurfaceVariant }}>Editar</Caption>
                  )}
                </Pressable>
              )}
            </View>

            {prods.length === 0 ? (
              <View style={styles.emptyCategory}>
                <Caption style={{ color: theme.colors.onSurfaceVariant }}>
                  Sin productos en esta categoría
                </Caption>
              </View>
            ) : (
              <ResponsiveTable
                columns={columns}
                data={prods}
                keyExtractor={(p) => p.id ?? ''}
                rowActions={rowActions}
              />
            )}
          </View>
        ))}

      {/* ── Modals ── */}
      <CategoriaFormModal
        visible={!!catModal}
        mode={catModal?.mode ?? 'crear'}
        initial={catModal?.cat}
        loading={crearCat.isPending || editarCat.isPending}
        onSubmit={(d) => {
          if (catModal?.mode === 'editar' && catModal.cat?.id) {
            editarCat.mutate({ id: catModal.cat.id, d });
          } else {
            crearCat.mutate(d);
          }
        }}
        onClose={() => setCatModal(null)}
      />

      <ProductoFormModal
        visible={!!prodModal}
        mode={prodModal?.mode ?? 'crear'}
        initial={prodModal?.prod}
        categorias={categorias}
        loading={crearProd.isPending || editarProd.isPending}
        onSubmit={(d) => {
          if (prodModal?.mode === 'editar' && prodModal.prod?.id) {
            editarProd.mutate({ id: prodModal.prod.id, d });
          } else {
            crearProd.mutate(d);
          }
        }}
        onClose={() => setProdModal(null)}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="¿Desactivar producto?"
        message={`"${deleteTarget?.nombre}" dejará de aparecer en el menú. Podés reactivarlo desde el formulario de edición.`}
        confirmLabel="Desactivar"
        loading={desactivarProd.isPending}
        onConfirm={() => deleteTarget?.id && desactivarProd.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </Screen>
  );
}

// ── CategoriaFormModal ───────────────────────────────────────────────────────

function CategoriaFormModal({
  visible,
  mode,
  initial,
  loading,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  mode: 'crear' | 'editar';
  initial?: dto_CategoriaAdminResponse;
  loading: boolean;
  onSubmit: (d: CategoriaForm) => void;
  onClose: () => void;
}) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoriaForm>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nombre: initial?.nombre ?? '',
      seccion: (initial?.seccion as SeccionValue) ?? SECCIONES[0],
      orden: initial?.orden ?? 0,
    },
  });

  useMemo(() => {
    reset({
      nombre: initial?.nombre ?? '',
      seccion: (initial?.seccion as SeccionValue) ?? SECCIONES[0],
      orden: initial?.orden ?? 0,
    });
  }, [initial, reset]);

  return (
    <FormModal
      visible={visible}
      title={mode === 'crear' ? 'Nueva categoría' : 'Editar categoría'}
      onClose={onClose}
      footer={
        <Button
          title={mode === 'crear' ? 'Crear categoría' : 'Guardar cambios'}
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
            label="Nombre"
            placeholder="Ej: Espresso & café"
            value={field.value}
            onChangeText={field.onChange}
            error={errors.nombre?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="seccion"
        render={({ field }) => (
          <View style={styles.fieldWrap}>
            <Label>Sección</Label>
            <View style={styles.segmented}>
              {SECCIONES.map((s) => (
                <Pressable
                  key={s}
                  style={[styles.segBtn, field.value === s && styles.segBtnActive]}
                  onPress={() => field.onChange(s)}
                >
                  <Body style={field.value === s ? styles.segBtnActiveText : undefined}>{s}</Body>
                </Pressable>
              ))}
            </View>
            {errors.seccion && (
              <Caption style={{ color: theme.colors.danger }}>{errors.seccion.message}</Caption>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="orden"
        render={({ field }) => (
          <TextField
            label="Orden"
            placeholder="0"
            value={String(field.value)}
            onChangeText={(v) => field.onChange(isNaN(Number(v)) ? 0 : Number(v))}
            keyboardType="numeric"
            error={errors.orden?.message}
          />
        )}
      />
    </FormModal>
  );
}

// ── ProductoFormModal ────────────────────────────────────────────────────────

function ProductoFormModal({
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
  initial?: dto_ProductoAdminResponse;
  categorias: dto_CategoriaAdminResponse[];
  loading: boolean;
  onSubmit: (d: ProductoForm) => void;
  onClose: () => void;
}) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductoForm>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      nombre: initial?.nombre ?? '',
      descripcion: initial?.descripcion ?? '',
      precio: initial?.precio != null ? String(initial.precio) : '',
      categoria_id: initial?.categoria_id ?? '',
      es_infusion: initial?.es_infusion ?? false,
      activo: initial?.activo ?? true,
    },
  });

  useMemo(() => {
    reset({
      nombre: initial?.nombre ?? '',
      descripcion: initial?.descripcion ?? '',
      precio: initial?.precio != null ? String(initial.precio) : '',
      categoria_id: initial?.categoria_id ?? '',
      es_infusion: initial?.es_infusion ?? false,
      activo: initial?.activo ?? true,
    });
  }, [initial, reset]);

  const esInfusion = watch('es_infusion');
  const activoVal = watch('activo');

  return (
    <FormModal
      visible={visible}
      title={mode === 'crear' ? 'Nuevo producto' : 'Editar producto'}
      onClose={onClose}
      footer={
        <Button
          title={mode === 'crear' ? 'Crear producto' : 'Guardar cambios'}
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
            label="Nombre"
            placeholder="Ej: Cortado"
            value={field.value}
            onChangeText={field.onChange}
            error={errors.nombre?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="descripcion"
        render={({ field }) => (
          <TextField
            label="Descripción"
            placeholder="Describe el producto (opcional)"
            value={field.value}
            onChangeText={field.onChange}
            multiline
            error={errors.descripcion?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="precio"
        render={({ field }) => (
          <TextField
            label="Precio ($)"
            placeholder="0"
            value={field.value}
            onChangeText={field.onChange}
            keyboardType="numeric"
            error={errors.precio?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="categoria_id"
        render={({ field }) => (
          <View style={styles.fieldWrap}>
            <Label>Categoría</Label>
            <View style={styles.catPicker}>
              {categorias.map((c) => (
                <Pressable
                  key={c.id}
                  style={[styles.catChip, field.value === c.id && styles.catChipActive]}
                  onPress={() => c.id && field.onChange(c.id)}
                >
                  <Caption
                    style={
                      field.value === c.id
                        ? { color: theme.colors.surfaceContainerLowest }
                        : undefined
                    }
                  >
                    {c.nombre}
                  </Caption>
                </Pressable>
              ))}
            </View>
            {errors.categoria_id && (
              <Caption style={{ color: theme.colors.danger }}>{errors.categoria_id.message}</Caption>
            )}
          </View>
        )}
      />

      <View style={styles.togglesRow}>
        <Pressable style={styles.toggle} onPress={() => setValue('es_infusion', !esInfusion)}>
          <View style={[styles.toggleBox, esInfusion && styles.toggleBoxOn]}>
            {esInfusion && (
              <Icon name="check" size={14} color={theme.colors.surfaceContainerLowest} />
            )}
          </View>
          <Body>Es infusión</Body>
        </Pressable>

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
  },
  headerBtns: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'center', flexWrap: 'wrap' },
  skeletonWrap: { gap: theme.spacing.xl },
  section: { gap: theme.spacing.md, marginBottom: theme.spacing.xl },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.black,
  },
  catMeta: { gap: 2 },
  seccionLabel: {
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 1,
  },
  editCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  emptyCategory: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.gutter,
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
  },
  nombreCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  inactivoBadge: {
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  rowActions: { flexDirection: 'row', gap: theme.spacing.xs, alignItems: 'center' },
  iconBtn: {
    padding: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDanger: { borderColor: theme.colors.danger },
  // forms
  fieldWrap: { gap: theme.spacing.xs },
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
  catPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  catChip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.black,
  },
  catChipActive: { backgroundColor: theme.colors.black },
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
