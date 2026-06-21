import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

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
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.flex, styles.content, center && styles.center, style]}>{children}</View>
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
