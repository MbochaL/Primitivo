import { useWindowDimensions } from 'react-native';

import { breakpoints } from '../theme';

export interface Breakpoint {
  width: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Hook responsivo centralizado. Toda pantalla decide su layout con esto en vez de
 * comparar anchos a mano.
 *   - mobile:  width < 768
 *   - tablet:  768 <= width < 1024
 *   - desktop: width >= 1024
 */
export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  return {
    width,
    isMobile: width < breakpoints.tablet,
    isTablet: width >= breakpoints.tablet && width < breakpoints.desktop,
    isDesktop: width >= breakpoints.desktop,
  };
}
