import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { theme } from '../theme';

type Props = {
  children: ReactNode;
  /** Centra el contenido vertical y horizontalmente (útil para login). */
  center?: boolean;
  /** Envuelve el contenido en un ScrollView. */
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Contenedor de pantalla con fondo blanco y padding editorial. */
export function Screen({ children, center = false, scroll = false, style }: Props) {
  if (scroll) {
    return (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, style]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {children}
      </ScrollView>
    );
  }

  if (center) {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.centerOuter]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <View style={[styles.centerContent, style]}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.flex, styles.content, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  // Modo scroll y default: ocupa todo el espacio disponible.
  content: {
    flexGrow: 1,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  // Modo center: el ScrollView exterior permite desplazarse si el teclado comprime la pantalla.
  centerOuter: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  // El contenedor del form: ancho completo, sin flexGrow para que el padre lo centre.
  centerContent: {
    width: '100%',
    maxWidth: 480,
    gap: theme.spacing.md,
  },
});
