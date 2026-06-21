/**
 * Tokens de diseño de Primitivo — estética Neo-Brutalista: blanco/negro absoluto,
 * Oswald (display condensada, mayúsculas) + Inter (cuerpo), esquinas rectas (0px),
 * bordes negros y sombra dura "ink" (4px 4px 0 #000). Ningún componente hardcodea
 * valores: siempre referencia estos tokens.
 */

export const colors = {
  black: '#000000',
  white: '#FFFFFF',

  // Superficies
  surface: '#f9f9f9',
  surfaceContainerLowest: '#ffffff',
  surfaceContainer: '#eeeeee',
  surfaceContainerHigh: '#e8e8e8',
  surfaceVariant: '#e2e2e2',
  surfaceTan: '#f4dfcb', // acento artesanal (momentos de fidelidad)

  // Texto / contenido
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#4c4546',
  onPrimaryMuted: 'rgba(255,255,255,0.7)',

  // Líneas
  outline: '#7e7576',
  outlineVariant: '#cfc4c5',

  // Acentos / estados
  secondary: '#6b5c4c',
  onSecondaryFixedVariant: '#524435',
  danger: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  success: '#0b6b3a',

  // Aliases legacy (compatibilidad con pantallas previas)
  gray900: '#1a1c1c',
  gray700: '#4c4546',
  gray500: '#7e7576',
  gray300: '#cfc4c5',
  gray100: '#eeeeee',
} as const;

/** Escala basada en una unidad de 4px. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  gutter: 24,
  stackLg: 32,
  stackXl: 64,
} as const;

/** Bordes rectos (estética industrial). `pill` solo para avatares/badges circulares. */
export const radii = {
  none: 0,
  sharp: 0,
  sm: 4,
  md: 8,
  pill: 9999,
} as const;

const fontFamily = {
  display: 'Oswald_700Bold',
  heading: 'Oswald_700Bold',
  headingMedium: 'Oswald_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodyBold: 'Inter_700Bold',
  label: 'Inter_700Bold',
} as const;

const fontSize = {
  // Escala Neo-Brutalista
  displayXl: 64,
  headlineLg: 40,
  headlineMd: 24,
  bodyLg: 18,
  bodyMd: 16,
  labelBold: 12,
  labelSm: 11,
  // Aliases legacy
  caption: 12,
  body: 16,
  subtitle: 20,
  title: 28,
  display: 40,
} as const;

const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const typography = {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight: {
    tight: 1.1,
    normal: 1.6,
  },
} as const;

/**
 * Sombra "ink": offset duro sin blur. En RN Web se traduce a `box-shadow: 4px 4px 0 #000`.
 */
export const shadows = {
  ink: {
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowRadius: 0,
    shadowOpacity: 1,
    elevation: 4,
  },
} as const;

export const theme = {
  colors,
  spacing,
  radii,
  typography,
  shadows,
} as const;

export type Theme = typeof theme;
