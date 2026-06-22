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
  SearchBar,
  type SearchSuggestion,
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

const editarUsuarioSchema = z
  .object({
    email: z.string().email('Email inválido'),
    rol: z.enum([
      dto_ActualizarUsuarioRequest.rol.ADMINISTRADOR,
      dto_ActualizarUsuarioRequest.rol.OPERADOR,
    ]),
    activo: z.boolean(),
    nueva_password: z.string().or(z.literal('')).optional(),
    confirmar_password: z.string().or(z.literal('')).optional(),
  })
  .refine((d) => !d.nueva_password || d.nueva_password.length >= 8, {
    message: 'Mínimo 8 caracteres',
    path: ['nueva_password'],
  })
  .refine((d) => !d.nueva_password || d.nueva_password === d.confirmar_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmar_password'],
  });
type EditarUsuarioForm = z.infer<typeof editarUsuarioSchema>;

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
    | { type: 'editar'; usuario: dto_UsuarioResponse };

  const [modal, setModal] = useState<ModalState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<dto_UsuarioResponse | null>(null);
  const [query, setQuery] = useState('');

  // ── queries ───────────────────────────────────────────────────────────────
  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => UsuariosService.getUsuarios(),
  });

  // ── búsqueda ──────────────────────────────────────────────────────────────
  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter(
      (u) => u.email?.toLowerCase().includes(q) || u.rol?.toLowerCase().includes(q),
    );
  }, [usuarios, query]);

  const suggestions = useMemo<SearchSuggestion[]>(() => {
    return filtrados.slice(0, 8).map((u) => ({
      id: u.id ?? '',
      label: u.email ?? '',
      sublabel: labelRol(u.rol ?? ''),
      icon: (u.rol === 'administrador' ? 'admin-panel-settings' : 'point-of-sale') as SearchSuggestion['icon'],
      inactive: !u.activo,
    }));
  }, [filtrados]);

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

  // Editar y resetPassword sin side effects: la lógica vive en el onSubmit del modal.
  const editar = useMutation({
    mutationFn: ({ id, d }: { id: string; d: EditarUsuarioForm }) =>
      UsuariosService.putUsuarios(id, {
        email: d.email,
        rol: d.rol as dto_ActualizarUsuarioRequest.rol,
        activo: d.activo,
      }),
  });

  const resetPassword = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      UsuariosService.putUsuariosPassword(id, { password }),
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

      <SearchBar
        value={query}
        onChangeText={setQuery}
        suggestions={suggestions}
        onSelect={(s) => setQuery(s.label)}
        placeholder="Buscar por email o rol…"
        autoCapitalize="none"
      />

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

      {!isLoading && usuarios.length > 0 && filtrados.length === 0 && (
        <EmptyState icon="search-off" title="Sin resultados" description={`No hay usuarios que coincidan con "${query}".`} />
      )}

      {!isLoading && filtrados.length > 0 && (
        <ResponsiveTable
          columns={columns}
          data={filtrados}
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
          loading={editar.isPending || resetPassword.isPending}
          onSubmit={async (d) => {
            if (!modal.usuario.id) return;
            const id = modal.usuario.id;
            try {
              await editar.mutateAsync({ id, d });
              if (d.nueva_password) {
                await resetPassword.mutateAsync({ id, password: d.nueva_password });
              }
              qc.invalidateQueries({ queryKey: ['usuarios'] });
              toast.success(d.nueva_password ? 'Usuario y contraseña actualizados' : 'Usuario actualizado');
              setModal(null);
            } catch (e) {
              toast.error(mensajeDeError(e));
            }
          }}
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
            label="Contraseña"
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
  onSubmit: (d: EditarUsuarioForm) => Promise<void>;
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
      nueva_password: '',
      confirmar_password: '',
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

      {/* ── Sección contraseña ── */}
      <View style={styles.passwordDivider}>
        <View style={styles.passwordDividerLine} />
        <Caption style={styles.passwordDividerLabel}>Cambiar contraseña</Caption>
        <View style={styles.passwordDividerLine} />
      </View>

      <Caption style={styles.passwordHint}>Dejá en blanco para no cambiar la contraseña.</Caption>

      <Controller
        control={control}
        name="nueva_password"
        render={({ field }) => (
          <TextField
            label="Nueva contraseña"
            placeholder="Mínimo 8 caracteres"
            value={field.value ?? ''}
            onChangeText={field.onChange}
            secureTextEntry
            error={errors.nueva_password?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmar_password"
        render={({ field }) => (
          <TextField
            label="Confirmar contraseña"
            placeholder="Repetí la nueva contraseña"
            value={field.value ?? ''}
            onChangeText={field.onChange}
            secureTextEntry
            error={errors.confirmar_password?.message}
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
  // password section
  passwordDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  passwordDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
  },
  passwordDividerLabel: {
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  passwordHint: {
    color: theme.colors.onSurfaceVariant,
  },
});
