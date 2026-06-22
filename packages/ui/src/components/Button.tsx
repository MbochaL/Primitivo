import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { theme } from '../theme';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'danger';

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
  const { width } = useWindowDimensions();
  const inactivo = disabled || loading;
  const textColor = variant === 'secondary' ? theme.colors.black : theme.colors.white;
  // En pantallas muy estrechas los botones con icono colapsan a solo-icono
  const iconOnly = width < 400 && !!icon && !fullWidth;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={inactivo}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        iconOnly && styles.baseIconOnly,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
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
          {!iconOnly && <Text style={[styles.text, { color: textColor }]}>{title}</Text>}
          {icon ? <Icon name={icon} size={iconOnly ? 20 : 18} color={textColor} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 40,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.sharp,
    borderWidth: 2,
    borderColor: theme.colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseIconOnly: {
    paddingHorizontal: theme.spacing.sm,
    minWidth: 40,
  },
  primary: {
    backgroundColor: theme.colors.black,
  },
  secondary: {
    backgroundColor: theme.colors.white,
  },
  danger: {
    backgroundColor: theme.colors.danger,
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
    fontSize: theme.typography.fontSize.labelBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
