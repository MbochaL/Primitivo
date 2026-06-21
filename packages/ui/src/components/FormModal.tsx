import { type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useBreakpoint } from '../hooks/useBreakpoint';
import { theme } from '../theme';
import { Heading } from './Typography';
import { Icon } from './Icon';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Acciones del pie (ej. botones Guardar/Cancelar). */
  footer?: ReactNode;
};

/**
 * Modal centrado para formularios de crear/editar. En desktop/tablet es una tarjeta
 * centrada con sombra "ink"; en mobile ocupa toda la pantalla.
 */
export function FormModal({ visible, onClose, title, children, footer }: Props) {
  const { isMobile } = useBreakpoint();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, !isMobile && styles.overlayCentered]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.content, isMobile ? styles.contentMobile : styles.contentDesktop]}>
          <View style={styles.header}>
            <Heading>{title}</Heading>
            <Pressable onPress={onClose} hitSlop={8}>
              <Icon name="close" size={24} color={theme.colors.black} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  overlayCentered: { alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
  content: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderColor: theme.colors.black,
  },
  contentDesktop: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    borderWidth: 2,
    ...theme.shadows.ink,
  },
  contentMobile: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.black,
    padding: theme.spacing.gutter,
  },
  body: { padding: theme.spacing.gutter, gap: theme.spacing.md },
  footer: {
    borderTopWidth: 2,
    borderTopColor: theme.colors.black,
    padding: theme.spacing.gutter,
    gap: theme.spacing.sm,
  },
});
