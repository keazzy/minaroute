/**
 * Phosphor icons as an @expo/vector-icons icon SET (font-backed), so they can render
 * on the native tab bar. NativeTabs only rasterizes `VectorIcon` elements (via a
 * family's `getImageSource`) — a raw react-native-svg element renders blank — so the
 * icons must come from a glyph font, not phosphor-react-native's SVG components.
 *
 * Single (regular/outline) weight: the native bar tints the active tab emerald via
 * `tintColor`. We intentionally do NOT provide a separate filled selected-icon —
 * RNScreens requires `icon` and `selectedIcon` to be the same type, and mixing two
 * fonts trips `"[RNScreens] icon and selectedIcon must be same type."`.
 *
 * Fonts + codepoints are from `@phosphor-icons/web` (selection.json). To add/change a
 * tab icon: add its name→codepoint here (look it up in
 * node_modules/@phosphor-icons/web/src/regular/selection.json).
 */
import { createIconSet } from '@expo/vector-icons';

const glyphMap = {
  house: 0xe2c2,
  compass: 0xe1c8,
  'road-horizon': 0xe838,
  'chat-text': 0xe17a,
} as const;

export type PhosphorGlyph = keyof typeof glyphMap;

export const Phosphor = createIconSet(glyphMap, 'Phosphor', require('@/assets/fonts/Phosphor-Regular.ttf'));
