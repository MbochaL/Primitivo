import { type ReactNode } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { theme } from '../theme';

type Props = TextProps & { children: ReactNode };

/** Título display condensado (estética editorial, mayúsculas). */
export function Title({ children, style, ...rest }: Props) {
  return (
    <Text style={[styles.title, style]} {...rest}>
      {children}
    </Text>
  );
}

/** Encabezado de sección condensado. */
export function Heading({ children, style, ...rest }: Props) {
  return (
    <Text style={[styles.heading, style]} {...rest}>
      {children}
    </Text>
  );
}

/** Texto de cuerpo. */
export function Body({ children, style, ...rest }: Props) {
  return (
    <Text style={[styles.body, style]} {...rest}>
      {children}
    </Text>
  );
}

/** Texto secundario pequeño (gris). */
export function Caption({ children, style, ...rest }: Props) {
  return (
    <Text style={[styles.caption, style]} {...rest}>
      {children}
    </Text>
  );
}

/** Etiqueta de formulario (mayúsculas, tracking). */
export function Label({ children, style, ...rest }: Props) {
  return (
    <Text style={[styles.label, style]} {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.display,
    color: theme.colors.black,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heading: {
    fontFamily: theme.typography.fontFamily.heading,
    fontSize: theme.typography.fontSize.title,
    color: theme.colors.black,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.body,
    color: theme.colors.gray900,
  },
  caption: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.gray500,
  },
  label: {
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.gray700,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
