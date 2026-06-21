import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { theme } from '../theme';
import { Caption, Label } from './Typography';

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

/** Campo de texto Neo-Brutalista: borde negro recto; al enfocar engrosa el borde. */
export function TextField({ label, error, style, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label ? <Label>{label}</Label> : null}
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={theme.colors.outline}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {error ? <Caption style={styles.error}>{error}</Caption> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.black,
    borderRadius: theme.radii.sharp,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.bodyMd,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  inputFocused: {
    borderWidth: 2,
  },
  inputError: {
    borderColor: theme.colors.danger,
    borderWidth: 2,
  },
  error: {
    color: theme.colors.danger,
  },
});
