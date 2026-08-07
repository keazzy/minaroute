/**
 * Contact channel glyphs.
 *
 * Simplified marks rather than official brand assets — recognisable at 18pt and
 * consistent in weight with the rest of the page, which downloaded logos never
 * are (each ships its own colour, padding and optical size). They inherit the
 * surrounding text colour so they work in both themes without a second set.
 *
 * No Figma source for these yet; drawn to match the stroke weight of
 * `gallery-icons.tsx`. Swap wholesale when a design lands.
 */
import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type ContactKind =
  | 'phone'
  | 'whatsapp'
  | 'email'
  | 'website'
  | 'instagram'
  | 'facebook'
  | 'x';

const S = 2; // stroke width, shared

export function ContactIcon({ kind, color, size = 18 }: { kind: ContactKind; color: string; size?: number }) {
  const common = { stroke: color, strokeWidth: S, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (kind) {
    case 'phone':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3Z"
            {...common}
          />
        </Svg>
      );

    case 'whatsapp':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3.5 20.5 5 16.4A8.2 8.2 0 1 1 8.1 19.5l-4.6 1Z" {...common} />
          <Path d="M9 9.2c.3 1.6 1.2 2.9 2.6 3.9.6.4 1.3.6 1.9.7l.8-1.1 1.7.8-.3 1.3c-1.6.4-3.4-.4-4.8-1.6a7.4 7.4 0 0 1-2.2-3.4l1.2-.7Z" {...common} />
        </Svg>
      );

    case 'email':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={5} width={18} height={14} rx={2.5} {...common} />
          <Path d="m4 7 8 6 8-6" {...common} />
        </Svg>
      );

    case 'website':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} {...common} />
          <Path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" {...common} />
        </Svg>
      );

    case 'instagram':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x={3} y={3} width={18} height={18} rx={5} {...common} />
          <Circle cx={12} cy={12} r={4} {...common} />
          <Circle cx={17.2} cy={6.8} r={1.1} fill={color} />
        </Svg>
      );

    case 'facebook':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M14.5 8.5h2.2V5.2h-2.5c-2.2 0-3.6 1.5-3.6 3.8v1.7H8.3v3.2h2.3V21h3.3v-7.1h2.4l.4-3.2h-2.8V9.4c0-.6.2-.9.6-.9Z" {...common} />
        </Svg>
      );

    case 'x':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 4l16 16M20 4 4 20" {...common} />
        </Svg>
      );
  }
}
