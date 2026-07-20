/**
 * ProgressBar — per-section prep progress (design.md § Components: progress-bar).
 * Quiet track (surface-sunken) with an emerald fill, fully rounded. `value` is 0..1.
 * Exposes an accessibility progressbar role for screen readers.
 */
import React from 'react';
import { View, type ViewStyle } from 'react-native';

import { colors, radii } from '@/src/theme/tokens';

export type ProgressBarProps = {
  /** 0..1 */
  value: number;
  height?: number;
  style?: ViewStyle;
};

export function ProgressBar({ value, height = 8, style }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={[
        { height, borderRadius: radii.pill, backgroundColor: colors.surfaceSunken, overflow: 'hidden' },
        style,
      ]}
    >
      <View
        style={{
          width: `${pct * 100}%`,
          height: '100%',
          borderRadius: radii.pill,
          backgroundColor: colors.primary,
        }}
      />
    </View>
  );
}
