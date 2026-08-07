/**
 * The full-bleed photo gallery at the top of a detail page.
 *
 * Same paging mechanic and the same `CarouselDots` as the Home cards, so the
 * card → detail transition feels continuous: you swipe photos in the card, you
 * swipe photos here, and the dots look identical.
 *
 * Back and share are NOT here — they belong to the native header, which floats
 * transparently over this and fades into a solid title bar on scroll. Keeping
 * them native means the iOS back-swipe affordance and system tint behaviour
 * come for free.
 */
import { Image } from 'expo-image';
import React, { useCallback, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { CarouselDots } from '@/src/components/home/CarouselDots';
import { useColors } from '@/src/theme/palette';

export const GALLERY_HEIGHT = 360;

export type PhotoGalleryProps = {
  images: ImageSourcePropType[];
};

export function PhotoGallery({ images }: PhotoGalleryProps) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const last = useRef(0);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / width);
      if (next !== last.current) {
        last.current = next;
        setIndex(next);
      }
    },
    [width],
  );

  const box = { width, height: GALLERY_HEIGHT };

  return (
    <View style={[box, { backgroundColor: c.surfaceMuted }]}>
      {images.length > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEnabled={images.length > 1}
        >
          {images.map((source, i) => (
            <Image key={i} source={source} style={box} contentFit="cover" transition={200} />
          ))}
        </ScrollView>
      ) : null}

      <CarouselDots count={images.length} activeIndex={index} />
    </View>
  );
}
