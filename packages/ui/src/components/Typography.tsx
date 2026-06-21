import { type ReactNode } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { theme } from '../theme';

type Props = TextProps & { children: ReactNode };

/** Número/dato gigante (display-xl, Oswald). Para métricas destacadas. */
export function Display({ children, style, ...rest }: Props) {
  return (
    <Text style={[styles.display, style]} {...rest}>
      {children}
    </Text>
  );
}

/** Título display condensado en mayúsculas (Oswald bold). */
export function Title({ children, style, ...rest }: Props) {
  return (
    <Text style={[styles.title, style]} {...rest}>
      {children}
    </Text>
  );
}

/** Encabezado de sección (Oswald semibold, mayúsculas). */
export function Heading({ children, style, ...rest }: Props) {
  return (
    <Text style={[styles.heading, style]} {...rest}>
      {children}
    </Text>
  );
}

/** Texto de cuerpo (Inter). */
export function Body({ children, style, ...rest }: Props) {
  return (
    <Text style={[styles.body, style]} {...rest}>
      {children}
    </Text>
  );
}

/** Texto secundario chico (Inter, gris). */
export function Caption({ children, style, ...rest }: Props) {
  return (
    <Text style={[styles.caption, style]} {...rest}>
      {children}
    </Text>
  );
}

/** Etiqueta/metadato en mayúsculas con tracking (Inter bold). */
export function Label({ children, style, ...rest }: Props) {
  return (
    <Text style={[styles.label, style]} {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  display: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: theme.typography.fontSize.displayXl,
    color: theme.colors.onSurface,
    letterSpacing: -1,
  },
  title: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: theme.typography.fontSize.headlineLg,
    color: theme.colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: theme.typography.fontFamily.headingMedium,
    fontSize: theme.typography.fontSize.headlineMd,
    color: theme.colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.bodyMd,
    color: theme.colors.onSurface,
    lineHeight: theme.typography.fontSize.bodyMd * theme.typography.lineHeight.normal,
  },
  caption: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.labelSm,
    color: theme.colors.onSurfaceVariant,
  },
  label: {
    fontFamily: theme.typography.fontFamily.label,
    fontSize: theme.typography.fontSize.labelBold,
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
