import { setApiBaseUrl } from '@primitivo/api-client';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Oswald_500Medium, Oswald_600SemiBold, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/lib/auth';

// URL base de la API (inyectada por Expo en build/runtime).
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';
setApiBaseUrl(apiUrl);

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  // Cargamos las fuentes pero NO bloqueamos el render: si alguna tarda o falla,
  // la app igual se muestra usando la fuente del sistema y luego se aplica Oswald/Inter.
  useFonts({
    Oswald_500Medium,
    Oswald_600SemiBold,
    Oswald_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
