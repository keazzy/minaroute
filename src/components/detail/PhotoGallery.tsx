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

/** Place pages: a landscape-ish crop that leaves room for the title block. */
export const GALLERY_HEIGHT = 360;

/**
 * Event pages need more height. Event imagery is not photography of a venue —
 * it is a **poster**, drawn portrait (the ones from the Figma are 4:5), and a
 * 360pt box crops the title and date straight off the artwork.
 *
 * So events size to the poster's 4:5, capped at 62% of the screen so the page
 * still shows it is scrollable on a short device. Posters taller than 4:5 — the
 * 1320×2347 one in the set, for instance — still crop; fitting those fully
 * would push the entire body below the fold, which costs more than it buys.
 */
export function useEventGalleryHeight(): number {
  const { width, height } = useWindowDimensions();
  return Math.round(Math.min(width * 1.25, height * 0.62));
}

export type PhotoGalleryProps = {
  images: ImageSourcePropType[];
  /** Defaults to the place height. */
  height?: number;
};

export function PhotoGallery({ images, height = GALLERY_HEIGHT }: PhotoGalleryProps) {
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

  const box = { width, height };

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
