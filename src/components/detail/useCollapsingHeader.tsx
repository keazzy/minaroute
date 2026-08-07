/**
 * The collapsing native header shared by every detail page.
 *
 * Transparent over the gallery, fading into a solid title bar as the gallery
 * scrolls away. Extracted the moment a second detail page needed it — the fade
 * threshold, the native-driver interpolation and the tint flip are all easy to
 * get subtly wrong twice.
 *
 * Returns the `Stack.Screen` options and the scroll handler to spread onto an
 * `Animated.ScrollView`. The caller owns the scroll view so it can add its own
 * content insets.
 *
 * Two implementation notes:
 *  - The Animated.Value is created with a lazy `useState`, not `useRef`. React
 *    Compiler is enabled in this project and rejects reading a ref during
 *    render, which building the interpolation does.
 *  - Icon tint cannot be animated (the native header takes a plain colour), so
 *    it flips once at the threshold via a scroll listener instead of tracking
 *    the fade. Two renders per traversal, not one per frame.
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/src/theme/palette';

import { ShareIcon } from './gallery-icons';
import { useDetailType } from './type';

/** Header bar height, excluding the status bar. */
const BAR = Platform.OS === 'ios' ? 44 : 56;
/** How much scroll the fade takes. */
const FADE_DISTANCE = 80;

export type CollapsingHeaderOptions = {
  /** Shown in the bar once collapsed, and used as the share message. */
  title: string;
  /** Height of the media the header floats over. */
  mediaHeight: number;
};

export function useCollapsingHeader({ title, mediaHeight }: CollapsingHeaderOptions) {
  const c = useColors();
  const type = useDetailType();
  const insets = useSafeAreaInsets();

  const [scrollY] = useState(() => new Animated.Value(0));
  const [collapsed, setCollapsed] = useState(false);

  // The bar lands solid as the media's bottom edge meets it.
  const collapseEnd = mediaHeight - (insets.top + BAR);

  const barOpacity = scrollY.interpolate({
    inputRange: [Math.max(0, collapseEnd - FADE_DISTANCE), Math.max(1, collapseEnd)],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const next = e.nativeEvent.contentOffset.y >= collapseEnd - 40;
          setCollapsed((prev) => (prev === next ? prev : next));
        },
      }),
    [scrollY, collapseEnd],
  );

  const onShare = useCallback(() => {
    // No public URL to share yet; shares the name. Swap in a deep link later.
    Share.share({ message: title }).catch(() => undefined);
  }, [title]);

  // White over photography, palette colour once the bar is solid.
  const tint = collapsed ? c.onBackground : '#FFFFFF';

  const headerOptions = useMemo(
    () => ({
      headerShown: true,
      headerTransparent: true,
      headerTintColor: tint,
      // iOS: chevron only, no "Back" label, per the design.
      headerBackButtonDisplayMode: 'minimal' as const,
      headerBackTitle: '',
      headerTitleAlign: 'center' as const,
      headerTitle: () => (
        <Animated.Text
          numberOfLines={1}
          style={[type.factValue, { color: c.onBackground, opacity: barOpacity }]}
        >
          {title}
        </Animated.Text>
      ),
      headerBackground: () => (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: barOpacity,
              backgroundColor: c.background,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: c.border,
            },
          ]}
        />
      ),
      headerRight: () => (
        <Pressable
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel={`Share ${title}`}
          testID="detail-share"
          hitSlop={12}
        >
          <ShareIcon color={tint} />
        </Pressable>
      ),
    }),
    [tint, type.factValue, c.onBackground, c.background, c.border, barOpacity, title, onShare],
  );

  return { headerOptions, onScroll };
}
