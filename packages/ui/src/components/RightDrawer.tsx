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
  footer?: ReactNode;
};

/**
 * Panel lateral derecho. Reservado para el registro de compra (POS). En desktop/tablet
 * es un panel angosto a la derecha; en mobile ocupa toda la pantalla.
 */
export function RightDrawer({ visible, onClose, title, children, footer }: Props) {
  const { isMobile } = useBreakpoint();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.panel, isMobile ? styles.panelMobile : styles.panelDesktop]}>
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
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: { backgroundColor: theme.colors.surfaceContainerLowest, height: '100%' },
  panelDesktop: { width: 440, borderLeftWidth: 2, borderLeftColor: theme.colors.black },
  panelMobile: { width: '100%' },
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
