/**
 * Renders an icon exported from the Home Figma. Vector data lives in
 * `discovery-icons.ts` and is never hand-authored — see that file's header.
 *
 * `color` overrides the design's own fill/stroke. Light mode should normally
 * omit it (the exported colour IS the design); dark mode passes the tint from
 * `useColors()`, because the tinted tiles invert.
 */
import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { DISCOVERY_ICONS, type DiscoveryIconName } from './discovery-icons';

export type DiscoveryIconProps = {
  name: DiscoveryIconName;
  size?: number;
  color?: string;
};

export function DiscoveryIcon({ name, size = 24, color }: DiscoveryIconProps) {
  const icon = DISCOVERY_ICONS[name];
  const tint = color ?? icon.defaultColor;

  return (
    <Svg width={size} height={size} viewBox={icon.viewBox} fill="none">
      {icon.mode === 'stroke' ? (
        <Path
          d={icon.d}
          stroke={tint}
          strokeWidth={'strokeWidth' in icon ? icon.strokeWidth : 1.5}
          strokeLinecap={'strokeLinecap' in icon ? icon.strokeLinecap : 'round'}
          strokeLinejoin={'strokeLinejoin' in icon ? icon.strokeLinejoin : 'round'}
        />
      ) : (
        <Path d={icon.d} fill={tint} />
      )}
    </Svg>
  );
}
