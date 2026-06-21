import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Caption, Screen, TextField, Title, theme } from '@primitivo/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
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
      await login(data.email, data.password);
      router.replace('/clientes');
    } catch {
      setApiError('Email o contraseña incorrectos');
    }
  });

  return (
    <Screen center>
      <View style={styles.card}>
        <View style={styles.brand}>
          <Caption style={styles.kicker}>PAN · CAFÉ · COCINA</Caption>
          <Title>Primitivo</Title>
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
              error={errors.password?.message}
            />
          )}
        />

        {apiError ? <Caption style={styles.apiError}>{apiError}</Caption> : null}

        <Button title="Ingresar" onPress={onSubmit} loading={isSubmitting} fullWidth />
      </View>
    </Screen>
  );
}

const styles = {
  card: {
    width: '100%' as const,
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
  apiError: {
    color: theme.colors.danger,
  },
};
