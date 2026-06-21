import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { theme } from '../theme';
import { Caption, Label } from './Typography';

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

/** Campo de texto con etiqueta y mensaje de error opcionales. */
export function TextField({ label, error, style, ...rest }: Props) {
  return (
    <View style={styles.container}>
      {label ? <Label>{label}</Label> : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={theme.colors.gray500}
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
    borderColor: theme.colors.gray300,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.body,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.black,
    backgroundColor: theme.colors.white,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  error: {
    color: theme.colors.danger,
  },
});
