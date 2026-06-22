import { zodResolver } from '@hookform/resolvers/zod';
import {
  UsuariosService,
  type dto_UsuarioResponse,
  dto_CrearUsuarioRequest,
  dto_ActualizarUsuarioRequest,
} from '@primitivo/api-client';
import {
  Body,
  Button,
  Caption,
  ConfirmDialog,
  EmptyState,
  FormModal,
  Icon,
  Label,
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

// ── tipos ─────────────────────────────────────────────────────────────────────

type RolValue =
  | dto_CrearUsuarioRequest.rol.ADMINISTRADOR
  | dto_CrearUsuarioRequest.rol.OPERADOR;

const ROLES: RolValue[] = [
  dto_CrearUsuarioRequest.rol.OPERADOR,
  dto_CrearUsuarioRequest.rol.ADMINISTRADOR,
];

const labelRol = (r: string) =>
  r === dto_CrearUsuarioRequest.rol.ADMINISTRADOR ? 'Administrador' : 'Operador';

// ── Zod schemas ───────────────────────────────────────────────────────────────

const crearUsuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  rol: z.enum([
    dto_CrearUsuarioRequest.rol.ADMINISTRADOR,
    dto_CrearUsuarioRequest.rol.OPERADOR,
  ]),
});
type CrearUsuarioForm = z.infer<typeof crearUsuarioSchema>;

const editarUsuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  rol: z.enum([
    dto_ActualizarUsuarioRequest.rol.ADMINISTRADOR,
    dto_ActualizarUsuarioRequest.rol.OPERADOR,
  ]),
  activo: z.boolean(),
});
type EditarUsuarioForm = z.infer<typeof editarUsuarioSchema>;

const passwordSchema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmar: z.string().min(8, 'Mínimo 8 caracteres'),
}).refine((d) => d.password === d.confirmar, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmar'],
});
type PasswordForm = z.infer<typeof passwordSchema>;

// ── Screen ────────────────────────────────────────────────────────────────────

export default function UsuariosScreen() {
  const { esAdmin } = useAuth();
  if (!esAdmin) return <Redirect href="/clientes" />;

  return <UsuariosContent />;
}

function UsuariosContent() {
  const qc = useQueryClient();
  const toast = useToast();
  const { usuarioId: usuarioActualId } = useAuth();

  type ModalState =
    | { type: 'crear' }
    | { type: 'editar'; usuario: dto_UsuarioResponse }
    | { type: 'password'; usuario: dto_UsuarioResponse };

  const [modal, setModal] = useState<ModalState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<dto_UsuarioResponse | null>(null);

  // ── queries ───────────────────────────────────────────────────────────────
  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => UsuariosService.getUsuarios(),
  });

  // ── mutations ─────────────────────────────────────────────────────────────
  const crear = useMutation({
    mutationFn: (d: CrearUsuarioForm) =>
      UsuariosService.postUsuarios({
        email: d.email,
        password: d.password,
        rol: d.rol as dto_CrearUsuarioRequest.rol,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario creado');
      setModal(null);
    },
    onError: (e) => toast.error(mensajeDeError(e)),
  });

  const editar = useMutation({
    mutationFn: ({ id, d }: { id: string; d: EditarUsuarioForm }) =>
      UsuariosService.putUsuarios(id, {
        email: d.email,
        rol: d.rol as dto_ActualizarUsuarioRequest.rol,
        activo: d.activo,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario actualizado');
      setModal(null);
    },
    onError: (e) => toast.error(mensajeDeError(e)),
  });

  const resetPassword = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      UsuariosService.putUsuariosPassword(id, { password }),
    onSuccess: () => {
      toast.success('Contraseña actualizada');
      setModal(null);
    },
    onError: (e) => toast.error(mensajeDeError(e)),
  });

  const desactivar = useMutation({
    mutationFn: (u: dto_UsuarioResponse) =>
      UsuariosService.putUsuarios(u.id!, {
        email: u.email!,
        rol: u.rol as dto_ActualizarUsuarioRequest.rol,
        activo: false,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario desactivado');
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
      key: 'email',
      header: 'Email',
      flex: 3,
      render: (u: dto_UsuarioResponse) => (
        <View style={styles.emailCell}>
          <Body numberOfLines={1}>{u.email}</Body>
          {!u.activo && (
            <View style={styles.inactivoBadge}>
              <Caption style={{ color: theme.colors.onSurfaceVariant }}>inactivo</Caption>
            </View>
          )}
        </View>
      ),
    },
    {
      key: 'rol',
      header: 'Rol',
      flex: 1,
      render: (u: dto_UsuarioResponse) => (
        <View style={styles.rolCell}>
          <Icon
            name={u.rol === 'administrador' ? 'admin-panel-settings' : 'point-of-sale'}
            size={16}
            color={u.rol === 'administrador' ? theme.colors.black : theme.colors.onSurfaceVariant}
          />
          <Caption style={{ color: u.rol === 'administrador' ? theme.colors.black : theme.colors.onSurfaceVariant }}>
            {labelRol(u.rol ?? '')}
          </Caption>
        </View>
      ),
    },
  ];

  const rowActions = (u: dto_UsuarioResponse) => {
    const esSelf = u.id === usuarioActualId;
    return (
      <View style={styles.rowActions}>
        <Pressable
          style={styles.iconBtn}
          onPress={() => setModal({ type: 'editar', usuario: u })}
          accessibilityLabel="Editar usuario"
        >
          <Icon name="edit" size={18} color={theme.colors.black} />
        </Pressable>
        <Pressable
          style={styles.iconBtn}
          onPress={() => setModal({ type: 'password', usuario: u })}
          accessibilityLabel="Resetear contraseña"
        >
          <Icon name="lock-reset" size={18} color={theme.colors.black} />
        </Pressable>
        {u.activo && !esSelf && (
          <Pressable
            style={[styles.iconBtn, styles.iconBtnDanger]}
            onPress={() => setDeleteTarget(u)}
            accessibilityLabel="Desactivar usuario"
          >
            <Icon name="person-off" size={18} color={theme.colors.danger} />
          </Pressable>
        )}
      </View>
    );
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Screen scroll>
      <View style={styles.pageHeader}>
        <Title>Usuarios</Title>
        <Button
          title="Nuevo usuario"
          variant="primary"
          onPress={() => setModal({ type: 'crear' })}
        />
      </View>

      {isLoading && <TableSkeleton rows={4} />}

      {!isLoading && usuarios.length === 0 && (
        <EmptyState
          icon="manage-accounts"
          title="Sin usuarios"
          description="No hay usuarios del sistema registrados."
          actionLabel="Crear primer usuario"
          onAction={() => setModal({ type: 'crear' })}
        />
      )}

      {!isLoading && usuarios.length > 0 && (
        <ResponsiveTable
          columns={columns}
          data={usuarios}
          keyExtractor={(u) => u.id ?? ''}
          rowActions={rowActions}
        />
      )}

      {/* ── Modals ── */}
      {modal?.type === 'crear' && (
        <CrearUsuarioModal
          visible
          loading={crear.isPending}
          onSubmit={(d) => crear.mutate(d)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'editar' && (
        <EditarUsuarioModal
          visible
          usuario={modal.usuario}
          loading={editar.isPending}
          onSubmit={(d) => modal.usuario.id && editar.mutate({ id: modal.usuario.id, d })}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'password' && (
        <ResetPasswordModal
          visible
          usuario={modal.usuario}
          loading={resetPassword.isPending}
          onSubmit={(d) =>
            modal.usuario.id && resetPassword.mutate({ id: modal.usuario.id, password: d.password })
          }
          onClose={() => setModal(null)}
        />
      )}

      <ConfirmDialog
        visible={!!deleteTarget}
        title="¿Desactivar usuario?"
        message={`"${deleteTarget?.email}" perderá acceso al sistema. Podés reactivarlo editando el usuario.`}
        confirmLabel="Desactivar"
        loading={desactivar.isPending}
        onConfirm={() => deleteTarget && desactivar.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </Screen>
  );
}

// ── CrearUsuarioModal ─────────────────────────────────────────────────────────

function CrearUsuarioModal({
  visible,
  loading,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  loading: boolean;
  onSubmit: (d: CrearUsuarioForm) => void;
  onClose: () => void;
}) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CrearUsuarioForm>({
    resolver: zodResolver(crearUsuarioSchema),
    defaultValues: {
      email: '',
      password: '',
      rol: dto_CrearUsuarioRequest.rol.OPERADOR,
    },
  });

  const rolVal = watch('rol');

  return (
    <FormModal
      visible={visible}
      title="Nuevo usuario"
      onClose={onClose}
      footer={
        <Button
          title="Crear usuario"
          variant="primary"
          fullWidth
          loading={loading}
          onPress={handleSubmit(onSubmit)}
        />
      }
    >
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label="Email"
            placeholder="operador@primitivo.app"
            value={field.value}
            onChangeText={field.onChange}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label="Contraseña inicial"
            placeholder="Mínimo 8 caracteres"
            value={field.value}
            onChangeText={field.onChange}
            secureTextEntry
            error={errors.password?.message}
          />
        )}
      />

      <RolSelector value={rolVal} onChange={(r) => setValue('rol', r)} error={errors.rol?.message} />
    </FormModal>
  );
}

// ── EditarUsuarioModal ────────────────────────────────────────────────────────

function EditarUsuarioModal({
  visible,
  usuario,
  loading,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  usuario: dto_UsuarioResponse;
  loading: boolean;
  onSubmit: (d: EditarUsuarioForm) => void;
  onClose: () => void;
}) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditarUsuarioForm>({
    resolver: zodResolver(editarUsuarioSchema),
    defaultValues: {
      email: usuario.email ?? '',
      rol: (usuario.rol as RolValue) ?? dto_ActualizarUsuarioRequest.rol.OPERADOR,
      activo: usuario.activo ?? true,
    },
  });

  const rolVal = watch('rol');
  const activoVal = watch('activo');

  return (
    <FormModal
      visible={visible}
      title="Editar usuario"
      onClose={onClose}
      footer={
        <Button
          title="Guardar cambios"
          variant="primary"
          fullWidth
          loading={loading}
          onPress={handleSubmit(onSubmit)}
        />
      }
    >
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label="Email"
            value={field.value}
            onChangeText={field.onChange}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email?.message}
          />
        )}
      />

      <RolSelector value={rolVal} onChange={(r) => setValue('rol', r)} error={errors.rol?.message} />

      <Pressable style={styles.toggle} onPress={() => setValue('activo', !activoVal)}>
        <View style={[styles.toggleBox, activoVal && styles.toggleBoxOn]}>
          {activoVal && <Icon name="check" size={14} color={theme.colors.surfaceContainerLowest} />}
        </View>
        <Body>Activo</Body>
      </Pressable>
    </FormModal>
  );
}

// ── ResetPasswordModal ────────────────────────────────────────────────────────

function ResetPasswordModal({
  visible,
  usuario,
  loading,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  usuario: dto_UsuarioResponse;
  loading: boolean;
  onSubmit: (d: PasswordForm) => void;
  onClose: () => void;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmar: '' },
  });

  return (
    <FormModal
      visible={visible}
      title={`Contraseña — ${usuario.email}`}
      onClose={onClose}
      footer={
        <Button
          title="Actualizar contraseña"
          variant="primary"
          fullWidth
          loading={loading}
          onPress={handleSubmit(onSubmit)}
        />
      }
    >
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label="Nueva contraseña"
            placeholder="Mínimo 8 caracteres"
            value={field.value}
            onChangeText={field.onChange}
            secureTextEntry
            error={errors.password?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmar"
        render={({ field }) => (
          <TextField
            label="Confirmar contraseña"
            placeholder="Repetí la contraseña"
            value={field.value}
            onChangeText={field.onChange}
            secureTextEntry
            error={errors.confirmar?.message}
          />
        )}
      />
    </FormModal>
  );
}

// ── RolSelector ───────────────────────────────────────────────────────────────

function RolSelector({
  value,
  onChange,
  error,
}: {
  value: RolValue;
  onChange: (r: RolValue) => void;
  error?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Label>Rol</Label>
      <View style={styles.segmented}>
        {ROLES.map((r) => (
          <Pressable
            key={r}
            style={[styles.segBtn, value === r && styles.segBtnActive]}
            onPress={() => onChange(r)}
          >
            <Icon
              name={r === dto_CrearUsuarioRequest.rol.ADMINISTRADOR ? 'admin-panel-settings' : 'point-of-sale'}
              size={16}
              color={value === r ? theme.colors.surfaceContainerLowest : theme.colors.black}
            />
            <Body style={value === r ? styles.segBtnActiveText : undefined}>{labelRol(r)}</Body>
          </Pressable>
        ))}
      </View>
      {error && <Caption style={{ color: theme.colors.danger }}>{error}</Caption>}
    </View>
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
  emailCell: {
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
  rolCell: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
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
    flexDirection: 'row',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginRight: -2,
  },
  segBtnActive: { backgroundColor: theme.colors.black },
  segBtnActiveText: { color: theme.colors.surfaceContainerLowest },
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
