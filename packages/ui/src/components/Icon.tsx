import { MaterialIcons } from '@expo/vector-icons';
import { type ComponentProps } from 'react';

import { theme } from '../theme';

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

type Props = {
  name: IconName;
  size?: number;
  color?: string;
};

/** Ícono del set Material (equivalente a los Material Symbols de los diseños). */
export function Icon({ name, size = 24, color = theme.colors.onSurface }: Props) {
  return <MaterialIcons name={name} size={size} color={color} />;
}
