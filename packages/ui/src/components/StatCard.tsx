import { StyleSheet, View } from 'react-native';

import { theme } from '../theme';
import { Icon, type IconName } from './Icon';
import { Display, Label } from './Typography';

type Tone = 'surface' | 'tan' | 'inverse';

type Props = {
  label: string;
  value: string;
  icon: IconName;
  /** Texto de tendencia opcional (ej. "+12% esta semana"). */
  trend?: string;
  tone?: Tone;
};

/** Tarjeta de métrica del dashboard (número grande + ícono + tendencia). */
export function StatCard({ label, value, icon, trend, tone = 'surface' }: Props) {
  const inverse = tone === 'inverse';
  const fg = inverse ? theme.colors.white : theme.colors.onSurface;
  const muted = inverse ? theme.colors.onPrimaryMuted : theme.colors.onSurfaceVariant;
  const bg =
    tone === 'inverse'
      ? theme.colors.black
      : tone === 'tan'
        ? theme.colors.surfaceTan
        : theme.colors.surface;

  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <Label style={{ color: muted }}>{label}</Label>
        <Icon name={icon} size={24} color={fg} />
      </View>
      <View style={styles.body}>
        <Display style={{ color: fg }}>{value}</Display>
        {trend ? (
          <View style={styles.trend}>
            <Icon name="trending-up" size={16} color={muted} />
            <Label style={{ color: muted }}>{trend}</Label>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderColor: theme.colors.black,
    borderRadius: theme.radii.sharp,
    padding: theme.spacing.gutter,
    minHeight: 180,
    justifyContent: 'space-between',
    ...theme.shadows.ink,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  body: {
    marginTop: theme.spacing.md,
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
});
