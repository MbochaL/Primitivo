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
        // iOS: ajusta automáticamente el scroll cuando aparece el teclado
        automaticallyAdjustKeyboardInsets
      >
        {children}
      </ScrollView>
    );
  }

  if (center) {
    return (
      <KeyboardAvoidingView
        style={[styles.flex, styles.center]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.content, style]}>{children}</View>
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
  content: {
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  center: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
