/**
 * Phosphor icons as an @expo/vector-icons icon SET (font-backed), so they can render
 * on the native tab bar. NativeTabs only rasterizes `VectorIcon` elements (via a
 * family's `getImageSource`) — a raw react-native-svg element renders blank — so the
 * icons must come from a glyph font, not phosphor-react-native's SVG components.
 *
 * Fonts + codepoints are from `@phosphor-icons/web` (selection.json). Codepoints are
 * shared across weights, so one glyph map drives both the regular (outline) and fill
 * fonts. To add a tab icon: add its name→codepoint here (look it up in
 * node_modules/@phosphor-icons/web/src/regular/selection.json).
 */
import { createIconSet } from '@expo/vector-icons';

const glyphMap = {
  house: 0xe2c2,
  'map-trifold': 0xe31a,
  path: 0xe39c,
  star: 0xe46a,
} as const;

export type PhosphorGlyph = keyof typeof glyphMap;

/** Outline weight — used for inactive tabs. */
export const PhosphorRegular = createIconSet(glyphMap, 'Phosphor', require('@/assets/fonts/Phosphor-Regular.ttf'));

/** Filled weight — used for the active tab. */
export const PhosphorFill = createIconSet(glyphMap, 'PhosphorFill', require('@/assets/fonts/Phosphor-Fill.ttf'));
