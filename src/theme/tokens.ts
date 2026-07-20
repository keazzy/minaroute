/**
 * Design tokens — the single source of truth for Manasik/Minaroute styling.
 * Derived directly from the YAML front matter of `docs/design.md`. Never hardcode
 * colors, type, spacing, or radii in components — read them from here.
 *
 * Font strategy: ONE swappable UI font token. Quicksand is the default (loaded via
 * @expo-google-fonts/quicksand); Satoshi is the alternate (drop its TTFs into
 * assets/fonts/ — see src/theme/ThemeProvider.tsx — and it activates with no other
 * change). Amiri is reserved for Arabic/sacred text and is NOT swappable.
 * Weights are baked into the family name (RN best practice: set fontFamily, not
 * fontWeight, for custom fonts to avoid faux-bold on Android).
 */
import type { TextStyle } from 'react-native';

// ---- Colors (docs/design.md § colors) --------------------------------------
export const colors = {
  primary: '#12664F',
  primaryDark: '#0C4F3D',
  primarySoft: '#E4EFEA',
  onPrimary: '#FFFFFF',
  accent: '#C79A54',
  accentDark: '#8A6A2E',
  accentSoft: '#F5ECD9',
  onAccent: '#3A2E17',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  surfaceSunken: '#F2EDE3',
  onSurface: '#1B2A25',
  onSurfaceMuted: '#64726B',
  border: '#E8E2D6',
  success: '#2E9E6B',
  warning: '#C98A2B',
  error: '#B4462F',
  info: '#3A7CA5',
} as const;
export type ColorToken = keyof typeof colors;

// ---- Radii (docs/design.md § rounded) --------------------------------------
export const radii = { xs: 6, sm: 10, md: 16, lg: 24, pill: 999 } as const;
export type RadiusToken = keyof typeof radii;

// ---- Spacing (docs/design.md § spacing, 4-based) ---------------------------
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export type SpacingToken = keyof typeof spacing;

// ---- Font families ---------------------------------------------------------
export type FontChoice = 'quicksand' | 'satoshi';
type UiWeight = 400 | 500 | 600 | 700;
type ArabicWeight = 400 | 700;

const QUICKSAND: Record<UiWeight, string> = {
  400: 'Quicksand_400Regular',
  500: 'Quicksand_500Medium',
  600: 'Quicksand_600SemiBold',
  700: 'Quicksand_700Bold',
};

// Family names Satoshi TTFs must register as once added to assets/fonts/.
const SATOSHI: Record<UiWeight, string> = {
  400: 'Satoshi-Regular',
  500: 'Satoshi-Medium',
  600: 'Satoshi-Bold',
  700: 'Satoshi-Bold',
};

const AMIRI: Record<ArabicWeight, string> = {
  400: 'Amiri_400Regular',
  700: 'Amiri_700Bold',
};

/** Resolve the UI font family for a weight, honoring the swappable token. */
export function uiFontFamily(choice: FontChoice, weight: UiWeight = 400): string {
  return (choice === 'satoshi' ? SATOSHI : QUICKSAND)[weight];
}

/** Resolve the Arabic (Amiri) font family. Not swappable. */
export function arabicFontFamily(weight: ArabicWeight = 400): string {
  return AMIRI[weight];
}

// ---- Typography (docs/design.md § typography) ------------------------------
// lineHeight/letterSpacing pre-computed to absolute px (RN uses px, not multipliers).
type VariantSpec = {
  script: 'ui' | 'arabic';
  weight: UiWeight;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
};

export const typography = {
  display: { script: 'ui', weight: 700, fontSize: 32, lineHeight: 37, letterSpacing: -0.64 },
  h1: { script: 'ui', weight: 700, fontSize: 26, lineHeight: 31, letterSpacing: -0.26 },
  h2: { script: 'ui', weight: 700, fontSize: 20, lineHeight: 25 },
  h3: { script: 'ui', weight: 600, fontSize: 17, lineHeight: 22 },
  body: { script: 'ui', weight: 400, fontSize: 16, lineHeight: 24 },
  bodyStrong: { script: 'ui', weight: 600, fontSize: 16, lineHeight: 24 },
  caption: { script: 'ui', weight: 400, fontSize: 13, lineHeight: 18 },
  button: { script: 'ui', weight: 700, fontSize: 16, lineHeight: 16 },
  arabic: { script: 'arabic', weight: 400, fontSize: 26, lineHeight: 49 },
  arabicDisplay: { script: 'arabic', weight: 700, fontSize: 32, lineHeight: 58 },
} satisfies Record<string, VariantSpec>;

export type TypographyVariant = keyof typeof typography;

/**
 * Build a ready-to-use RN TextStyle for a variant, resolving the font family from
 * the active UI font choice (Arabic variants always use Amiri). This is how the
 * single font token flips the whole interface between Quicksand and Satoshi.
 */
export function textStyle(variant: TypographyVariant, choice: FontChoice = 'quicksand'): TextStyle {
  const spec = typography[variant];
  const fontFamily =
    spec.script === 'arabic'
      ? arabicFontFamily(spec.weight as ArabicWeight)
      : uiFontFamily(choice, spec.weight);
  return {
    fontFamily,
    fontSize: spec.fontSize,
    lineHeight: spec.lineHeight,
    ...(('letterSpacing' in spec && spec.letterSpacing !== undefined)
      ? { letterSpacing: spec.letterSpacing }
      : null),
    ...(spec.script === 'arabic' ? { writingDirection: 'rtl' as const } : null),
  };
}
