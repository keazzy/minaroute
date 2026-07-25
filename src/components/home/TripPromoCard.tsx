/**
 * The Umrah promo at the bottom of Home — the **no-trip** state.
 *
 * Per docs/home-redesign-brief.md, when a trip exists this drops away and a
 * countdown card appears near the top instead. That countdown is not built yet
 * (the Figma only draws this no-trip variant); the swap point is Home itself.
 *
 * The 360×400 image is a full-bleed photo with a bottom-weighted scrim so the
 * white headline stays legible regardless of the artwork.
 */
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { discoveryRadii, useColors } from '@/src/theme/palette';

import { Scrim } from './Scrim';
import { useHomeType } from './type';

export type TripPromoCardProps = {
  eyebrow: string;
  title: string;
  cta: string;
  image?: ImageSourcePropType;
  onPress?: () => void;
};

export function TripPromoCard({ eyebrow, title, cta, image, onPress }: TripPromoCardProps) {
  const c = useColors();
  const type = useHomeType();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${cta}`}
      onPress={onPress}
      style={[styles.card, { backgroundColor: c.surfaceMuted }]}
      testID="home-trip-promo"
    >
      {image ? (
        <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} />
      ) : null}
      <Scrim color={c.scrimColor} maxOpacity={c.scrimMaxOpacity} start={0.3} />

      <View style={styles.content}>
        <View style={styles.text}>
          <Text style={[type.promoEyebrow, styles.onImage]}>{eyebrow}</Text>
          <Text style={[type.promoTitle, styles.onImage]}>{title}</Text>
        </View>
        <View style={styles.button}>
          <Text style={[type.promoButton, styles.buttonLabel]}>{cta}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    height: 400,
    borderRadius: discoveryRadii.promo,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  content: { padding: 25, gap: 16, alignItems: 'flex-start' },
  text: { gap: 8 },
  // The promo sits on a dark scrim in both themes, so these stay white.
  onImage: { color: '#FFFFFF' },
  button: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: discoveryRadii.pill,
  },
  buttonLabel: { color: '#000000' },
});
