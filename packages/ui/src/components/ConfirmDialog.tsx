import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { theme } from '../theme';
import { Body, Heading } from './Typography';
import { Button } from './Button';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  /** Texto del botón destructivo (default "Eliminar"). */
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Diálogo de confirmación para acciones destructivas. Botón de confirmación en rojo,
 * claramente diferenciado. Siempre centrado y compacto (también en mobile).
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.card}>
          <Heading>{title}</Heading>
          <Body style={styles.message}>{message}</Body>
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button title={cancelLabel} variant="secondary" onPress={onCancel} fullWidth />
            </View>
            <View style={styles.action}>
              <Button
                title={confirmLabel}
                variant="danger"
                loading={loading}
                onPress={onConfirm}
                fullWidth
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: theme.colors.black,
    padding: theme.spacing.gutter,
    gap: theme.spacing.md,
    ...theme.shadows.ink,
  },
  message: { color: theme.colors.onSurfaceVariant },
  actions: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  action: { flex: 1 },
});
