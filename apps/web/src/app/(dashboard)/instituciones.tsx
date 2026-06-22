import { zodResolver } from '@hookform/resolvers/zod';
import {
  InstitucionesService,
  type dto_InstitucionResponse,
} from '@primitivo/api-client';
import {
  Body,
  Button,
  Caption,
  ConfirmDialog,
  EmptyState,
  FormModal,
  Icon,
  ResponsiveTable,
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
import { Pressable, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { z } from 'zod';

import { useAuth } from '@/lib/auth';
import { mensajeDeError } from '@/lib/errors';

// ── Zod schema ────────────────────────────────────────────────────────────────

const institucionSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  activa: z.boolean().default(true),
});
type InstitucionForm = z.infer<typeof institucionSchema>;

// ── Screen ────────────────────────────────────────────────────────────────────

export default function InstitucionesScreen() {
  const { esAdmin } = useAuth();
  if (!esAdmin) return <Redirect href="/clientes" />;

  return <InstitucionesContent />;
}

function InstitucionesContent() {
  const qc = useQueryClient();
  const toast = useToast();

  const [modal, setModal] = useState<{
    mode: 'crear' | 'editar';
    inst?: dto_InstitucionResponse;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<dto_InstitucionResponse | null>(null);

  // ── queries ───────────────────────────────────────────────────────────────
  const { data: instituciones = [], isLoading } = useQuery({
    queryKey: ['instituciones'],
    queryFn: () => InstitucionesService.getInstituciones(),
  });

  // ── mutations ─────────────────────────────────────────────────────────────
  const crear = useMutation({
    mutationFn: (d: InstitucionForm) =>
      InstitucionesService.postInstituciones({ nombre: d.nombre }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instituciones'] });
      toast.success('Institución creada');
      setModal(null);
    },
    onError: (e) => toast.error(mensajeDeError(e)),
  });

  const editar = useMutation({
    mutationFn: ({ id, d }: { id: string; d: InstitucionForm }) =>
      InstitucionesService.putInstituciones(id, { nombre: d.nombre, activa: d.activa }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instituciones'] });
      toast.success('Institución actualizada');
      setModal(null);
    },
    onError: (e) => toast.error(mensajeDeError(e)),
  });

  const desactivar = useMutation({
    mutationFn: (inst: dto_InstitucionResponse) =>
      InstitucionesService.putInstituciones(inst.id!, { nombre: inst.nombre!, activa: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instituciones'] });
      toast.success('Institución desactivada');
      setDeleteTarget(null);
    },
    onError: (e) => {
      toast.error(mensajeDeError(e));
      setDeleteTarget(null);
    },
  });

  // ── columnas ──────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'nombre',
      header: 'Nombre',
      flex: 3,
      render: (inst: dto_InstitucionResponse) => (
        <View style={styles.nombreCell}>
          <Body numberOfLines={1}>{inst.nombre}</Body>
          {!inst.activa && (
            <View style={styles.inactivoBadge}>
              <Caption style={{ color: theme.colors.onSurfaceVariant }}>inactiva</Caption>
            </View>
          )}
        </View>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      flex: 1,
      hideOnMobile: true,
      render: (inst: dto_InstitucionResponse) => (
        <View style={styles.estadoCell}>
          <Icon
            name={inst.activa ? 'check-circle' : 'cancel'}
            size={16}
            color={inst.activa ? theme.colors.success : theme.colors.danger}
          />
          <Caption style={{ color: inst.activa ? theme.colors.success : theme.colors.danger }}>
            {inst.activa ? 'Activa' : 'Inactiva'}
          </Caption>
        </View>
      ),
    },
  ];

  const rowActions = (inst: dto_InstitucionResponse) => (
    <View style={styles.rowActions}>
      <Pressable
        style={styles.iconBtn}
        onPress={() => setModal({ mode: 'editar', inst })}
        accessibilityLabel="Editar institución"
      >
        <Icon name="edit" size={18} color={theme.colors.black} />
      </Pressable>
      {inst.activa && (
        <Pressable
          style={[styles.iconBtn, styles.iconBtnDanger]}
          onPress={() => setDeleteTarget(inst)}
          accessibilityLabel="Desactivar institución"
        >
          <Icon name="delete" size={18} color={theme.colors.danger} />
        </Pressable>
      )}
    </View>
  );

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Screen scroll>
      <View style={styles.pageHeader}>
        <Title>Instituciones</Title>
        <Button
          title="Nueva institución"
          variant="primary"
          onPress={() => setModal({ mode: 'crear' })}
        />
      </View>

      {isLoading && <TableSkeleton rows={5} />}

      {!isLoading && instituciones.length === 0 && (
        <EmptyState
          icon="domain"
          title="Sin instituciones"
          description="Todavía no hay convenios creados. Agregá la primera institución para asociar clientes."
          actionLabel="Crear primera institución"
          onAction={() => setModal({ mode: 'crear' })}
        />
      )}

      {!isLoading && instituciones.length > 0 && (
        <ResponsiveTable
          columns={columns}
          data={instituciones}
          keyExtractor={(i) => i.id ?? ''}
          rowActions={rowActions}
        />
      )}

      <InstitucionFormModal
        visible={!!modal}
        mode={modal?.mode ?? 'crear'}
        initial={modal?.inst}
        loading={crear.isPending || editar.isPending}
        onSubmit={(d) => {
          if (modal?.mode === 'editar' && modal.inst?.id) {
            editar.mutate({ id: modal.inst.id, d });
          } else {
            crear.mutate(d);
          }
        }}
        onClose={() => setModal(null)}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="¿Desactivar institución?"
        message={`"${deleteTarget?.nombre}" dejará de estar disponible. Los clientes y beneficios asociados se conservan.`}
        confirmLabel="Desactivar"
        loading={desactivar.isPending}
        onConfirm={() => deleteTarget && desactivar.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </Screen>
  );
}

// ── InstitucionFormModal ──────────────────────────────────────────────────────

function InstitucionFormModal({
  visible,
  mode,
  initial,
  loading,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  mode: 'crear' | 'editar';
  initial?: dto_InstitucionResponse;
  loading: boolean;
  onSubmit: (d: InstitucionForm) => void;
  onClose: () => void;
}) {
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InstitucionForm>({
    resolver: zodResolver(institucionSchema),
    defaultValues: {
      nombre: initial?.nombre ?? '',
      activa: initial?.activa ?? true,
    },
  });

  useMemo(() => {
    reset({
      nombre: initial?.nombre ?? '',
      activa: initial?.activa ?? true,
    });
  }, [initial, reset]);

  const activaVal = watch('activa');

  return (
    <FormModal
      visible={visible}
      title={mode === 'crear' ? 'Nueva institución' : 'Editar institución'}
      onClose={onClose}
      footer={
        <Button
          title={mode === 'crear' ? 'Crear institución' : 'Guardar cambios'}
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
            placeholder="Ej: UBA, Hospital Italiano"
            value={field.value}
            onChangeText={field.onChange}
            error={errors.nombre?.message}
          />
        )}
      />

      {mode === 'editar' && (
        <Pressable style={styles.toggle} onPress={() => setValue('activa', !activaVal)}>
          <View style={[styles.toggleBox, activaVal && styles.toggleBoxOn]}>
            {activaVal && <Icon name="check" size={14} color={theme.colors.surfaceContainerLowest} />}
          </View>
          <Body>Activa</Body>
        </Pressable>
      )}
    </FormModal>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
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
  estadoCell: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  rowActions: { flexDirection: 'row', gap: theme.spacing.xs, alignItems: 'center' },
  iconBtn: {
    padding: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDanger: { borderColor: theme.colors.danger },
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
