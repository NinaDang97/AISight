import { TextStyle } from 'react-native';

type FontWeight = 
  | 'normal' 
  | 'bold' 
  | '100' 
  | '200' 
  | '300' 
  | '400' 
  | '500' 
  | '600' 
  | '700' 
  | '800' 
  | '900';

interface TypographyStyles {
  fontFamily: string;
  fontWeight: FontWeight;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
}

const createTextStyle = (options: TypographyStyles): TextStyle => ({
  fontFamily: options.fontFamily,
  fontWeight: options.fontWeight,
  fontSize: options.fontSize,
  lineHeight: options.lineHeight,
  letterSpacing: options.letterSpacing,
});

// Font families
const FONT_FAMILY_REGULAR = 'System';
const FONT_FAMILY_MEDIUM = 'System';
const FONT_FAMILY_BOLD = 'System';

// Font weights
const FONT_WEIGHT_REGULAR: FontWeight = '400';
const FONT_WEIGHT_MEDIUM: FontWeight = '500';
const FONT_WEIGHT_BOLD: FontWeight = '700';

export const typography = {
  // Headings
  heading1: createTextStyle({
    fontFamily: FONT_FAMILY_BOLD,
    fontWeight: FONT_WEIGHT_BOLD,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  }),
  heading2: createTextStyle({
    fontFamily: FONT_FAMILY_BOLD,
    fontWeight: FONT_WEIGHT_BOLD,
    fontSize: 24,
    lineHeight: 32,
  }),
  heading3: createTextStyle({
    fontFamily: FONT_FAMILY_BOLD,
    fontWeight: FONT_WEIGHT_BOLD,
    fontSize: 20,
    lineHeight: 28,
  }),
  heading4: createTextStyle({
    fontFamily: FONT_FAMILY_MEDIUM,
    fontWeight: FONT_WEIGHT_MEDIUM,
    fontSize: 18,
    lineHeight: 24,
  }),
  heading5: createTextStyle({
    fontFamily: FONT_FAMILY_MEDIUM,
    fontWeight: FONT_WEIGHT_MEDIUM,
    fontSize: 16,
    lineHeight: 22,
  }),
  
  // Body text
  bodyLarge: createTextStyle({
    fontFamily: FONT_FAMILY_REGULAR,
    fontWeight: FONT_WEIGHT_REGULAR,
    fontSize: 16,
    lineHeight: 24,
  }),
  body: createTextStyle({
    fontFamily: FONT_FAMILY_REGULAR,
    fontWeight: FONT_WEIGHT_REGULAR,
    fontSize: 14,
    lineHeight: 20,
  }),
  bodySmall: createTextStyle({
    fontFamily: FONT_FAMILY_REGULAR,
    fontWeight: FONT_WEIGHT_REGULAR,
    fontSize: 12,
    lineHeight: 16,
  }),
  
  // Special text styles
  button: createTextStyle({
    fontFamily: FONT_FAMILY_MEDIUM,
    fontWeight: FONT_WEIGHT_MEDIUM,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.5,
  }),
  caption: createTextStyle({
    fontFamily: FONT_FAMILY_REGULAR,
    fontWeight: FONT_WEIGHT_REGULAR,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  }),
  overline: createTextStyle({
    fontFamily: FONT_FAMILY_MEDIUM,
    fontWeight: FONT_WEIGHT_MEDIUM,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.5,
  }),
};
