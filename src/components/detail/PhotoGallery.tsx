/**
 * The full-bleed photo gallery at the top of a detail page.
 *
 * Same paging mechanic and the same `CarouselDots` as the Home cards, so the
 * card → detail transition feels continuous: you swipe photos in the card, you
 * swipe photos here, and the dots look identical.
 *
 * Back and share float directly over the image rather than sitting in a solid
 * header — matching the reference. They carry their own translucent discs so
 * they stay legible over a bright sky or a dark interior alike.
 */
import { Image } from 'expo-image';
import React, { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CarouselDots } from '@/src/components/home/CarouselDots';
import { useColors } from '@/src/theme/palette';

import { BackIcon, ShareIcon } from './gallery-icons';

export const GALLERY_HEIGHT = 360;

export type PhotoGalleryProps = {
  images: ImageSourcePropType[];
  /** Included in the share sheet text. */
  title: string;
  onBack?: () => void;
};

export function PhotoGallery({ images, title, onBack }: PhotoGalleryProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
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

  const onShare = useCallback(() => {
    // No public URL to share yet, so this shares the name. Swap in a deep link
    // once the app has one.
    Share.share({ message: title }).catch(() => undefined);
  }, [title]);

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

      <View style={[styles.controls, { top: insets.top + 8 }]} pointerEvents="box-none">
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID="detail-back"
          style={styles.disc}
        >
          <BackIcon />
        </Pressable>
        <Pressable
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel={`Share ${title}`}
          testID="detail-share"
          style={styles.disc}
        >
          <ShareIcon />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  disc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // Fixed translucent white rather than a palette colour: these sit over
    // arbitrary photography, not over the page background.
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
});
