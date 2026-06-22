import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Icon } from './Icon';
import { Caption, Label } from './Typography';
import { theme } from '../theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

/** Campo de texto Neo-Brutalista: borde negro recto; al enfocar engrosa el borde. */
export function TextField({ label, error, style, onFocus, onBlur, secureTextEntry, ...rest }: Props) {
  const [showText, setShowText] = useState(false);

  const isPassword = !!secureTextEntry;

  return (
    <View style={styles.container}>
      {label ? <Label>{label}</Label> : null}
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={theme.colors.outline}
          secureTextEntry={isPassword && !showText}
          onFocus={onFocus}
          onBlur={onBlur}
          {...rest}
        />
        {isPassword && (
          <Pressable
            onPress={() => setShowText((v) => !v)}
            style={styles.eyeBtn}
            hitSlop={8}
            accessibilityLabel={showText ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Icon
              name={showText ? 'visibility' : 'visibility-off'}
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
          </Pressable>
        )}
      </View>
      {error ? <Caption style={styles.error}>{error}</Caption> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.black,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  inputError: {
    borderColor: theme.colors.danger,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.bodyMd,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.onSurface,
  },
  eyeBtn: {
    paddingHorizontal: theme.spacing.sm,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: theme.colors.danger,
  },
});
