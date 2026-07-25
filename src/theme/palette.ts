/**
 * Scheme-aware colours for the discovery surfaces (Home, and later Explore).
 *
 * Why this sits beside `tokens.ts` rather than inside it: `tokens.ts` is
 * generated from the YAML front matter of `docs/design.md` and holds the brand
 * palette as flat constants. This file adds the *screen* palette the Home Figma
 * specifies, in light and dark, behind a hook. `tokens.ts` keeps its static
 * `colors` export so the ~dozen existing consumers are untouched.
 *
 * Light values are lifted verbatim from the Figma (node 270:2338). Dark values
 * are derived — see `docs/build-log.md` for the rationale. The short version:
 * the light theme is warm (cream, beige borders), so the dark counterpart is a
 * warm near-black rather than the cold #151718 the legacy `hooks/use-theme.ts`
 * uses, and primary text reuses the existing cream token `#F2EDE3`.
 *
 * IMPORTANT: read colours through `useColors()`. Values captured inside
 * `StyleSheet.create` at module load cannot react to a scheme change.
 */
import { useColorScheme } from 'react-native';

/** A category tile: tinted background + the icon tint that sits on it. */
export type CategorySwatch = { bg: string; icon: string };

export type DiscoveryPalette = {
  /** Screen background. */
  background: string;
  /** Cards, search field, raised surfaces. */
  surface: string;
  /** Avatar chip, subtle fills. */
  surfaceMuted: string;
  onBackground: string;
  onBackgroundMuted: string;
  border: string;
  /** Rating / attendance pill. */
  badge: string;
  onBadge: string;
  /** Location prompt chip. */
  locationChipBg: string;
  locationChipIcon: string;
  /** Carousel dot, inactive then active. */
  dot: string;
  dotActive: string;
  /** Scrim over promo imagery so white text stays legible. */
  scrimColor: string;
  scrimMaxOpacity: number;
  categories: Record<CategoryKey, CategorySwatch>;
};

export type CategoryKey = 'mosques' | 'learning' | 'events' | 'food' | 'thingsToDo' | 'stays';

const light: DiscoveryPalette = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F3F3',
  onBackground: '#000000',
  onBackgroundMuted: '#6A6A6A',
  border: 'rgba(0,0,0,0.1)',
  badge: '#238C3D',
  onBadge: '#FFFFFF',
  locationChipBg: '#D8F4DF',
  locationChipIcon: '#12461F',
  dot: 'rgba(255,255,255,0.55)',
  dotActive: '#FFFFFF',
  scrimColor: '#000000',
  scrimMaxOpacity: 0.92,
  categories: {
    mosques: { bg: '#D4EBD8', icon: '#26552F' },
    learning: { bg: '#D6C5E3', icon: '#000000' },
    events: { bg: '#FFEBD6', icon: '#000000' },
    food: { bg: '#BBF7F3', icon: '#000000' },
    thingsToDo: { bg: '#F7C7F3', icon: '#000000' },
    stays: { bg: '#C1D9FC', icon: '#000000' },
  },
};

/**
 * Warm dark. Anchored on the same ~40° hue as the light theme's cream so the two
 * read as one product; primary text is the existing `#F2EDE3` cream token.
 *
 * The category tiles are the interesting case: a 90%-lightness pastel on a dark
 * background glares. Each tile is instead re-cut at ~20% lightness in the *same*
 * hue, with the icon flipped to a light tint of that hue — so "the green one"
 * and "the purple one" stay recognisable without shouting.
 */
const dark: DiscoveryPalette = {
  background: '#14120E',
  surface: '#1C1915',
  surfaceMuted: '#24201A',
  onBackground: '#F2EDE3',
  onBackgroundMuted: '#A69D8D',
  border: 'rgba(255,255,255,0.12)',
  // Lifted from the light #238C3D so the pill separates from a dark backdrop.
  badge: '#2C9E48',
  onBadge: '#FFFFFF',
  locationChipBg: '#17321F',
  locationChipIcon: '#7FCB95',
  dot: 'rgba(255,255,255,0.45)',
  dotActive: '#FFFFFF',
  scrimColor: '#000000',
  scrimMaxOpacity: 0.95,
  categories: {
    mosques: { bg: '#1B3323', icon: '#8FD3A2' },
    learning: { bg: '#2B2338', icon: '#C9B2DC' },
    events: { bg: '#3A2C1B', icon: '#F0C89A' },
    food: { bg: '#15343A', icon: '#8FDCD6' },
    thingsToDo: { bg: '#38203A', icon: '#E0A8DB' },
    stays: { bg: '#1D2B42', icon: '#A8C4EC' },
  },
};

export const palettes = { light, dark } as const;

/** The active palette for the current colour scheme. */
export function useColors(): DiscoveryPalette {
  return useColorScheme() === 'dark' ? dark : light;
}

/** True when the dark palette is active — for status bars and image scrims. */
export function useIsDark(): boolean {
  return useColorScheme() === 'dark';
}

// ---- Geometry lifted from the Figma ----------------------------------------
export const discoveryRadii = {
  card: 20,
  tile: 32,
  promo: 24,
  badge: 4,
  pill: 999,
} as const;
