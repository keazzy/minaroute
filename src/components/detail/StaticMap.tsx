/**
 * The location block: a static map image that hands off to native directions.
 *
 * Deliberately NOT an interactive map. Three reasons, in ascending order of
 * importance:
 *  1. A live map nested in a scrolling page fights the scroll — it claims pans
 *     in both axes, which is worse than the card-carousel trade-off.
 *  2. It costs real memory on a screen that already holds a photo gallery.
 *  3. Mapbox's Static Images API is a plain URL returning a PNG, so this needs
 *     **no native module** and works on the current dev client — the interactive
 *     Mapbox migration is still waiting on an EAS build.
 *
 * Tapping opens Apple/Google Maps for turn-by-turn, which is the actual job when
 * someone is deciding whether they can reach a mosque before jama'ah. It carries
 * no button of its own — the sticky action bar owns that action prominently, and
 * two identical CTAs on one screen is noise.
 *
 * TOKEN: Expo only inlines `EXPO_PUBLIC_*` vars into the client bundle. The repo
 * currently defines `MAPBOX_ACCESS_TOKEN`, which the app cannot read at runtime —
 * add `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` alongside it. Without one, this renders a
 * labelled fallback rather than a broken image, so the page is never blocked on
 * config.
 */
import { Image } from 'expo-image';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { discoveryRadii, useColors, useIsDark } from '@/src/theme/palette';

import { openDirections } from './directions';
import { useDetailType } from './type';

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;

export type StaticMapProps = {
  latitude: number;
  longitude: number;
  /** Used as the destination label in the native maps app. */
  label: string;
  height?: number;
  zoom?: number;
};

/** Mapbox Static Images API. Theme-matched style, retina, with a pin. */
function staticMapUrl(opts: {
  lat: number;
  lng: number;
  dark: boolean;
  width: number;
  height: number;
  zoom: number;
}) {
  const style = opts.dark ? 'mapbox/dark-v11' : 'mapbox/streets-v12';
  const pin = `pin-l+238c3d(${opts.lng},${opts.lat})`;
  const box = `${opts.lng},${opts.lat},${opts.zoom},0`;
  return (
    `https://api.mapbox.com/styles/v1/${style}/static/${pin}/${box}` +
    `/${Math.round(opts.width)}x${Math.round(opts.height)}@2x?access_token=${TOKEN}`
  );
}

export function StaticMap({ latitude, longitude, label, height = 160, zoom = 14 }: StaticMapProps) {
  const c = useColors();
  const dark = useIsDark();
  const type = useDetailType();

  const onPress = useCallback(
    () => openDirections(latitude, longitude, label),
    [latitude, longitude, label],
  );

  // Requested at a fixed width; the image scales to the container. 640 is wide
  // enough for any phone at @2x without paying for a needlessly large request.
  const uri = TOKEN
    ? staticMapUrl({ lat: latitude, lng: longitude, dark, width: 640, height: height * 2, zoom })
    : undefined;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Get directions to ${label}`}
      testID="detail-static-map"
      style={[styles.wrap, { height, borderColor: c.border, backgroundColor: c.surfaceMuted }]}
    >
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.fallback]}>
          <Text style={[type.bodySmall, { color: c.onBackgroundMuted }]}>
            Map preview needs EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
          </Text>
        </View>
      )}

    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: discoveryRadii.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  fallback: { alignItems: 'center', justifyContent: 'center', padding: 16 },
});
