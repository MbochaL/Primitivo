import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '../theme';

type Tone = 'white' | 'tan' | 'inverse';

type Props = {
  children: ReactNode;
  tone?: Tone;
  shadow?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Contenedor Neo-Brutalista: borde negro 2px, esquinas rectas y sombra "ink" opcional. */
export function Card({ children, tone = 'white', shadow = true, padded = true, style }: Props) {
  return (
    <View
      style={[
        styles.base,
        tone === 'white' && styles.white,
        tone === 'tan' && styles.tan,
        tone === 'inverse' && styles.inverse,
        padded && styles.padded,
        shadow && theme.shadows.ink,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 2,
    borderColor: theme.colors.black,
    borderRadius: theme.radii.sharp,
  },
  white: { backgroundColor: theme.colors.surfaceContainerLowest },
  tan: { backgroundColor: theme.colors.surfaceTan },
  inverse: { backgroundColor: theme.colors.black },
  padded: { padding: theme.spacing.gutter },
});
