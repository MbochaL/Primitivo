import { StyleSheet, View } from 'react-native';

import { theme } from '../theme';
import { Body, Heading } from './Typography';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

type Props = {
  icon?: IconName;
  title: string;
  description?: string;
  /** CTA opcional para crear el primer elemento. */
  actionLabel?: string;
  onAction?: () => void;
};

/** Estado vacío amable, con CTA opcional para crear el primer elemento. */
export function EmptyState({ icon = 'inbox', title, description, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <Icon name={icon} size={40} color={theme.colors.outline} />
      <Heading style={styles.title}>{title}</Heading>
      {description ? <Body style={styles.description}>{description}</Body> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button title={actionLabel} icon="add" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  title: { textAlign: 'center', marginTop: theme.spacing.xs },
  description: { color: theme.colors.onSurfaceVariant, textAlign: 'center', maxWidth: 360 },
  action: { marginTop: theme.spacing.md },
});
