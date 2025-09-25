// Base spacing unit (4px)
const BASE = 4;

export const spacing = {
  // Named spacing values
  none: 0,
  tiny: BASE * 1, // 4px
  xsmall: BASE * 2, // 8px
  small: BASE * 3, // 12px
  medium: BASE * 4, // 16px
  large: BASE * 6, // 24px
  xlarge: BASE * 8, // 32px
  xxlarge: BASE * 12, // 48px
  huge: BASE * 16, // 64px
  
  // Numeric spacing values for more granular control
  // Usage: spacing[4] = 16px
  0: 0,
  1: BASE * 1, // 4px
  2: BASE * 2, // 8px
  3: BASE * 3, // 12px
  4: BASE * 4, // 16px
  5: BASE * 5, // 20px
  6: BASE * 6, // 24px
  7: BASE * 7, // 28px
  8: BASE * 8, // 32px
  9: BASE * 9, // 36px
  10: BASE * 10, // 40px
  12: BASE * 12, // 48px
  16: BASE * 16, // 64px
  20: BASE * 20, // 80px
  24: BASE * 24, // 96px
  
  // Helper function to get spacing value
  get: (multiplier: number) => BASE * multiplier,
} as const;
