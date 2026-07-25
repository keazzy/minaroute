/**
 * A bottom-weighted darkening scrim for image cards, so white text stays
 * legible over arbitrary photography.
 *
 * Implemented as stacked translucent bands rather than a real gradient:
 *  - `expo-linear-gradient` is not installed, and adding it means a native
 *    module and a fresh dev-client build.
 *  - `react-native-svg` IS installed, but its `<Defs>` + `fill="url(#id)"`
 *    gradient reference does not resolve in this version (15.15.4) — the rect
 *    paints solid black, verified on device.
 *
 * With enough bands the stepping is imperceptible, and this is pure RN views:
 * no native dependency, no rebuild, works identically on web.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

// 48 bands over a 400pt card is ~8pt per step — imperceptible even against a
// flat-colour image, which is the worst case for banding.
const BANDS = 48;

export type ScrimProps = {
  /** Base colour, opaque. Alpha is applied per band. */
  color?: string;
  /** Alpha at the very bottom. */
  maxOpacity?: number;
  /** Fraction of the height left fully clear at the top (0–1). */
  start?: number;
};

/** `#RRGGBB` → `rgba(r,g,b,a)`. Falls back to black on anything unexpected. */
function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return `rgba(0,0,0,${alpha})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export function Scrim({ color = '#000000', maxOpacity = 0.92, start = 0.35 }: ScrimProps) {
  const bands = useMemo(
    () =>
      Array.from({ length: BANDS }, (_, i) => {
        // Ease-in so the darkening accelerates toward the bottom, which reads
        // far more like a real gradient than a linear ramp.
        const t = (i + 1) / BANDS;
        return withAlpha(color, maxOpacity * Math.pow(t, 1.7));
      }),
    [color, maxOpacity],
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {start > 0 ? <View style={{ flex: start }} /> : null}
      <View style={styles.ramp}>
        {bands.map((backgroundColor, i) => (
          <View key={i} style={[styles.band, { backgroundColor }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ramp: { flex: 1 },
  band: { flex: 1 },
});
