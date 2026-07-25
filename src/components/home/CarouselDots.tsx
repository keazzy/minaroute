/**
 * Photo-count dots overlaid at the bottom of a card image.
 *
 * The Figma draws five 5.44pt dots on a translucent pill. Renders nothing for a
 * single photo — a lone dot communicates nothing. Purely presentational: paging
 * lands with the real image carousel.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useColors } from '@/src/theme/palette';

const DOT = 5.44;
const MAX_DOTS = 5;

export type CarouselDotsProps = {
  count: number;
  activeIndex?: number;
};

export function CarouselDots({ count, activeIndex = 0 }: CarouselDotsProps) {
  const c = useColors();
  if (count < 2) return null;

  const shown = Math.min(count, MAX_DOTS);

  return (
    <View style={styles.wrap} pointerEvents="none">
      {Array.from({ length: shown }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: i === activeIndex ? c.dotActive : c.dot },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 11,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
});
