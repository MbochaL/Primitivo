import { ActivityIndicator } from 'react-native';

import { theme } from '../theme';

type Props = {
  size?: 'small' | 'large';
  /** Color del spinner (default negro). En fondos oscuros pasar blanco. */
  color?: string;
};

/**
 * Spinner para acciones puntuales. (El componente Button ya muestra este spinner
 * internamente cuando `loading` es true.)
 */
export function Spinner({ size = 'small', color = theme.colors.black }: Props) {
  return <ActivityIndicator size={size} color={color} />;
}
