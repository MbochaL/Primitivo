/**
 * Tokens de diseño de Primitivo — identidad editorial blanco/negro de alto contraste.
 * Ningún componente debe hardcodear colores, tamaños o espaciados: siempre referenciar
 * estos tokens para mantener la marca consistente y editable en un solo lugar.
 */

export const colors = {
  black: '#000000',
  white: '#FFFFFF',
  // Grises solo para jerarquía sutil.
  gray900: '#1A1A1A',
  gray700: '#3D3D3D',
  gray500: '#737373',
  gray300: '#BFBFBF',
  gray100: '#EDEDED',
  // Estados (uso mínimo y solo cuando es funcionalmente necesario).
  danger: '#B00020',
  success: '#0B6B3A',
} as const;

/** Escala de espaciado en múltiplos de 4 px. El aire es parte del diseño editorial. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  pill: 999,
} as const;

export const typography = {
  fontFamily: {
    /**
     * Display condensada para títulos (estética editorial). La carga la app vía
     * @expo-google-fonts/oswald; si no está cargada, RN cae al system font.
     */
    heading: 'Oswald_700Bold',
    headingMedium: 'Oswald_500Medium',
    body: 'System',
  },
  fontSize: {
    caption: 12,
    body: 16,
    subtitle: 20,
    title: 28,
    display: 40,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    bold: '700',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
  },
} as const;

export const theme = {
  colors,
  spacing,
  radii,
  typography,
} as const;

export type Theme = typeof theme;
