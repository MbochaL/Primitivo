import { setApiBaseUrl } from '@primitivo/api-client';
import { ErrorBoundary, ToastProvider, useToast } from '@primitivo/ui';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Oswald_500Medium, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/lib/auth';
import { mensajeDeError } from '@/lib/errors';

// URL base de la API (inyectada por Expo en build/runtime).
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';
setApiBaseUrl(apiUrl);

// TanStack Query con manejo de error global: cualquier query que falle muestra un toast.
// Las mutaciones manejan su error de forma contextual (onError por llamada).
function AppQueryProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
        queryCache: new QueryCache({
          onError: (err) => toast.error(mensajeDeError(err)),
        }),
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export default function RootLayout() {
  // Cargamos las fuentes pero NO bloqueamos el render (si tardan/fallan, usa la del sistema).
  useFonts({
    Oswald_500Medium,
    Oswald_600SemiBold,
    Oswald_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppQueryProvider>
          <AuthProvider>
            <SafeAreaProvider>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false }} />
            </SafeAreaProvider>
          </AuthProvider>
        </AppQueryProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
