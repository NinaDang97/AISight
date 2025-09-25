import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';

export const theme = {
  colors,
  spacing,
  typography,
  
  // Border radius
  borderRadius: {
    none: 0,
    small: 4,
    medium: 8,
    large: 12,
    round: 9999,
  },
  
  // Shadows
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    small: {
      shadowColor: colors.textPrimary,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    medium: {
      shadowColor: colors.textPrimary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3.0,
      elevation: 3,
    },
    large: {
      shadowColor: colors.textPrimary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 5.0,
      elevation: 6,
    },
  },
  
  // Animation durations
  animation: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
};

// Export type for TypeScript usage
export type Theme = typeof theme;
