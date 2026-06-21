import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Caption, Screen, TextField, Title, theme } from '@primitivo/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/lib/auth';
import { mensajeDeError } from '@/lib/errors';

const loginSchema = z.object({
  email: z.string().min(1, 'Ingresá tu email').email('Email inválido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    setApiError(null);
    try {
      const rol = await login(data.email, data.password);
      // Admin → dashboard (overview); operador → búsqueda de clientes (su pantalla diaria).
      router.replace(rol === 'administrador' ? '/' : '/clientes');
    } catch (err) {
      setApiError(mensajeDeError(err));
    }
  });

  return (
    <Screen center>
      <View style={styles.card}>
        <View style={styles.brand}>
          <Caption style={styles.kicker}>PAN · CAFÉ · COCINA</Caption>
          <Title>Primitivo</Title>
          <Caption>Ingresá para gestionar beneficios y caja.</Caption>
        </View>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Email"
              placeholder="tu@email.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              onSubmitEditing={onSubmit}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Contraseña"
              placeholder="••••••••"
              secureTextEntry
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              onSubmitEditing={onSubmit}
              error={errors.password?.message}
            />
          )}
        />

        {apiError ? (
          <View style={styles.alert} accessibilityRole="alert">
            <Caption style={styles.alertText}>{apiError}</Caption>
          </View>
        ) : null}

        <Button title="Ingresar" onPress={onSubmit} loading={isSubmitting} fullWidth />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 380,
    gap: theme.spacing.lg,
  },
  brand: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  kicker: {
    letterSpacing: 3,
  },
  alert: {
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderLeftWidth: 4,
    backgroundColor: theme.colors.errorContainer,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  alertText: {
    color: theme.colors.onErrorContainer,
  },
});
