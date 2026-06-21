import { setApiBaseUrl } from '@primitivo/api-client';
import { theme } from '@primitivo/ui';
import { Oswald_500Medium, Oswald_700Bold, useFonts } from '@expo-google-fonts/oswald';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/lib/auth';

// URL base de la API (inyectada por Expo en build/runtime).
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';
setApiBaseUrl(apiUrl);

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const [fontsLoaded] = useFonts({ Oswald_500Medium, Oswald_700Bold });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.white,
        }}
      >
        <ActivityIndicator color={theme.colors.black} />
      </View>
    );
  }

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
