/**
 * The swipeable image strip inside a DiscoveryCard.
 *
 * Note this is a horizontal pager nested inside the section's horizontal list.
 * Same-axis nesting means a pan starting on the image scrolls the photos, and a
 * pan starting anywhere else scrolls the row — the standard behaviour for this
 * card pattern (Airbnb, Booking). It does mean you cannot fling the row from on
 * top of an image, which is the accepted trade for in-card browsing.
 *
 * Each slide is its own Pressable so tapping a photo still opens the item; a
 * bare ScrollView would swallow those taps.
 */
import { Image } from 'expo-image';
import React, { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { discoveryRadii, useColors } from '@/src/theme/palette';

import { CarouselDots } from './CarouselDots';

export type CardImageCarouselProps = {
  images: ImageSourcePropType[];
  width: number;
  height: number;
  accessibilityLabel?: string;
  onPress?: () => void;
};

export function CardImageCarousel({
  images,
  width,
  height,
  accessibilityLabel,
  onPress,
}: CardImageCarouselProps) {
  const c = useColors();
  const [index, setIndex] = useState(0);
  // Tracked so a fling that lands mid-page still reports the nearest slide.
  const lastIndex = useRef(0);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      if (next !== lastIndex.current) {
        lastIndex.current = next;
        setIndex(next);
      }
    },
    [width],
  );

  const box = { width, height };

  if (images.length === 0) {
    return <View style={[styles.box, box, { backgroundColor: c.surfaceMuted }]} />;
  }

  return (
    <View style={[styles.box, box, { backgroundColor: c.surfaceMuted }]}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        // A single photo should not feel draggable.
        scrollEnabled={images.length > 1}
      >
        {images.map((source, i) => (
          <Pressable
            key={i}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={
              accessibilityLabel
                ? `${accessibilityLabel}, photo ${i + 1} of ${images.length}`
                : undefined
            }
            style={box}
          >
            <Image source={source} style={box} contentFit="cover" transition={160} />
          </Pressable>
        ))}
      </ScrollView>

      <CarouselDots count={images.length} activeIndex={index} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: discoveryRadii.card, overflow: 'hidden' },
});
