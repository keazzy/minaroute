/**
 * The share glyph for the detail header.
 *
 * Back is the platform's own chevron — the native stack header draws it, which
 * is what keeps the iOS edge-swipe affordance and system tint. Only share needs
 * drawing, and it takes its colour from the caller because the header tint
 * flips from white (over photography) to the palette (over the solid bar).
 *
 * No Figma source yet; simple strokes, replaceable wholesale when a design lands.
 */
import React from 'react';
import Svg, { Path } from 'react-native-svg';

export function ShareIcon({ size = 20, color = '#111111' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v13M12 3 8 7M12 3l4 4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
