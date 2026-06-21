import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { theme } from '../theme';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
};

/**
 * Botón Neo-Brutalista: borde negro recto + sombra "ink". Al presionar se "hunde"
 * (se desplaza 4px y pierde la sombra). Primario negro sólido / secundario contorno.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
}: Props) {
  const isPrimary = variant === 'primary';
  const inactivo = disabled || loading;
  const textColor = isPrimary ? theme.colors.white : theme.colors.black;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactivo}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        fullWidth && styles.fullWidth,
        pressed ? styles.pressed : theme.shadows.ink,
        inactivo && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          <Text style={[styles.text, { color: textColor }]}>{title}</Text>
          {icon ? <Icon name={icon} size={20} color={textColor} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.sharp,
    borderWidth: 2,
    borderColor: theme.colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: theme.colors.black,
  },
  secondary: {
    backgroundColor: theme.colors.white,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    transform: [{ translateX: 4 }, { translateY: 4 }],
    shadowOpacity: 0,
    elevation: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  text: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.bodyMd,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
