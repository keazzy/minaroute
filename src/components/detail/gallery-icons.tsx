/**
 * The two glyphs that float over the gallery.
 *
 * Hand-drawn rather than pulled from Figma — unlike the Home category icons,
 * these have no Figma source yet (there is no details frame in the file). They
 * are intentionally simple strokes so they can be replaced wholesale once a
 * design exists, without anything else changing.
 *
 * Both are drawn in near-black, since they sit on a light translucent disc.
 */
import React from 'react';
import Svg, { Path } from 'react-native-svg';

const INK = '#111111';

export function BackIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 4 7 12l8 8"
        stroke={INK}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShareIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v13M12 3 8 7M12 3l4 4"
        stroke={INK}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
        stroke={INK}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
