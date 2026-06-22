import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { IconName } from './Icon';
import { Icon } from './Icon';
import { Caption } from './Typography';
import { theme } from '../theme';

// ── Tipos públicos ────────────────────────────────────────────────────────────

export interface SearchSuggestion {
  id: string;
  label: string;
  sublabel?: string;
  meta?: string;
  icon?: IconName;
  inactive?: boolean;
}

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelect?: (suggestion: SearchSuggestion) => void;
  suggestions?: SearchSuggestion[];
  placeholder?: string;
  loading?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'email-address';
  onSubmitEditing?: () => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

// ── Componente ────────────────────────────────────────────────────────────────

export function SearchBar({
  value,
  onChangeText,
  onSelect,
  suggestions = [],
  placeholder = 'Buscar…',
  loading = false,
  keyboardType = 'default',
  onSubmitEditing,
  autoCapitalize = 'none',
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const [inputH, setInputH] = useState(44);

  // El dropdown se abre cuando hay foco Y hay sugerencias (con o sin texto).
  const isOpen = focused && suggestions.length > 0;

  const handleSelect = (item: SearchSuggestion) => {
    onSelect?.(item);
    setFocused(false);
  };

  return (
    // position relative → contexto de posicionamiento para el dropdown absoluto.
    <View style={[styles.root, isOpen && styles.rootOpen]}>
      {/* ── Input ── */}
      <View
        onLayout={(e) => setInputH(e.nativeEvent.layout.height)}
        style={[styles.inputRow, (focused || isOpen) && styles.inputRowOpen]}
      >
        <Icon
          name={loading ? 'hourglass-empty' : 'search'}
          size={18}
          color={focused ? theme.colors.black : theme.colors.onSurfaceVariant}
        />
        <TextInput
          style={[styles.input, { outline: 'none' } as object]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 160)}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChangeText('')} hitSlop={8}>
            <Icon name="close" size={16} color={theme.colors.onSurfaceVariant} />
          </Pressable>
        )}
      </View>

      {/* ── Dropdown flotante (absolute, superpone el contenido de abajo) ── */}
      {isOpen && (
        <View style={[styles.dropdown, { top: inputH }]}>
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled" style={styles.scroll}>
            {suggestions.map((item, idx) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.row,
                  idx < suggestions.length - 1 && styles.rowDivider,
                  pressed && styles.rowPressed,
                  item.inactive && styles.rowInactive,
                ]}
                onPress={() => handleSelect(item)}
              >
                <View style={styles.rowIcon}>
                  <Icon
                    name={item.icon ?? 'search'}
                    size={16}
                    color={item.inactive ? theme.colors.outline : theme.colors.onSurfaceVariant}
                  />
                </View>
                <View style={styles.rowText}>
                  <Text
                    style={[styles.rowLabel, item.inactive && styles.rowMuted]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                  {item.sublabel ? (
                    <Caption
                      style={item.inactive ? styles.rowMuted : undefined}
                      numberOfLines={1}
                    >
                      {item.sublabel}
                    </Caption>
                  ) : null}
                </View>
                {item.meta ? (
                  <Text style={[styles.rowMeta, item.inactive && styles.rowMuted]}>
                    {item.meta}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Contenedor: position relative para que el dropdown absoluto se ancle aquí.
  root: {
    position: 'relative',
    zIndex: 1,
  },
  rootOpen: {
    zIndex: 200,
  },

  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  inputRowOpen: {
    borderWidth: 2,
    borderColor: theme.colors.black,
  },
  input: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.body,
    fontSize: theme.typography.fontSize.bodyMd,
    color: theme.colors.onSurface,
    paddingVertical: 0,
    minHeight: 26,
  },

  // Dropdown absoluto — se superpone al contenido
  dropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 200,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: theme.colors.black,
    // Ink shadow Neo-Brutalista
    shadowColor: theme.colors.black,
    shadowOffset: { width: 4, height: 4 },
    shadowRadius: 0,
    shadowOpacity: 1,
    elevation: 12,
  },
  scroll: { maxHeight: 320 },

  // Filas de sugerencia
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    gap: theme.spacing.sm,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  rowPressed: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  rowInactive: { opacity: 0.55 },
  rowIcon: { width: 20, alignItems: 'center' },
  rowText: { flex: 1, gap: 1 },
  rowLabel: {
    fontFamily: theme.typography.fontFamily.bodyMedium,
    fontSize: theme.typography.fontSize.bodyMd,
    color: theme.colors.onSurface,
  },
  rowMeta: {
    fontFamily: theme.typography.fontFamily.bodyBold,
    fontSize: theme.typography.fontSize.labelBold,
    color: theme.colors.onSurfaceVariant,
  },
  rowMuted: { color: theme.colors.outline },
});
