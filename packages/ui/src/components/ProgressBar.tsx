import { StyleSheet, View } from 'react-native';

import { theme } from '../theme';

type Props = {
  value: number;
  max: number;
  /** 'dark' sobre fondo claro (default), 'light' sobre fondo oscuro. */
  tone?: 'dark' | 'light';
};

/** Barra de progreso Neo-Brutalista: marco rectangular con relleno sólido. */
export function ProgressBar({ value, max, tone = 'dark' }: Props) {
  const pct = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0;
  const color = tone === 'light' ? theme.colors.white : theme.colors.black;

  return (
    <View style={[styles.track, { borderColor: color }]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 16, borderWidth: 1, borderRadius: theme.radii.sharp },
  fill: { height: '100%' },
});
