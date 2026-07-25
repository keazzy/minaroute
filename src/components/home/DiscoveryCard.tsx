/**
 * The card used by all three Home carousels. One component, three sizes — the
 * Figma varies only the image box (212×133, 251×300, 251×223); everything below
 * the image is identical.
 *
 * Deliberate deviations from the Figma, per docs/home-redesign-brief.md:
 *  - distance renders in **km**, not miles
 *  - price is NGN-first, never a hardcoded `$`
 *  - the badge is **omitted entirely when its value is absent** — no zero, no
 *    placeholder. Most places will have no rating at launch.
 * The Figma's "Badge" and "Favorite icon" image overlays are switched off in
 * node 270:2338, so they are not built here.
 */
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { discoveryRadii, useColors } from '@/src/theme/palette';

import { CardImageCarousel } from './CardImageCarousel';
import { useHomeType } from './type';

/** Image box sizes, straight from the Figma. */
export const CARD_SIZES = {
  place: { width: 212, imageHeight: 133 },
  event: { width: 251, imageHeight: 300 },
  activity: { width: 251, imageHeight: 223 },
} as const;

export type CardSize = keyof typeof CARD_SIZES;

export type DiscoveryCardItem = {
  id: string;
  title: string;
  /** One entry per carousel slide. Empty renders a neutral placeholder box. */
  images: ImageSourcePropType[];
  /** Rating (0–10, one decimal) or an attendance count. Omit to hide the pill. */
  badgeValue?: string;
  /** The phrase beside the pill, e.g. "One of the best (1 source)". */
  badgeCaption?: string;
  /** Footer left, e.g. "2.4 km from you" or "from". */
  footerLead?: string;
  /** Footer right, e.g. "₦5,000/person". */
  footerValue?: string;
};

export type DiscoveryCardProps = {
  item: DiscoveryCardItem;
  size?: CardSize;
  /** Allow a two-line title, as the Figma's "Things to do" card does. */
  titleLines?: number;
  onPress?: (id: string) => void;
};

export function DiscoveryCard({ item, size = 'place', titleLines = 1, onPress }: DiscoveryCardProps) {
  const c = useColors();
  const type = useHomeType();
  const { width, imageHeight } = CARD_SIZES[size];

  const handlePress = useCallback(() => onPress?.(item.id), [onPress, item.id]);

  return (
    <View style={[styles.card, { width }]} testID={`discovery-card-${item.id}`}>
      <CardImageCarousel
        images={item.images}
        width={width}
        height={imageHeight}
        accessibilityLabel={item.title}
        onPress={handlePress}
      />

      <Pressable accessibilityRole="button" accessibilityLabel={item.title} onPress={handlePress}>
        <View style={styles.content}>
          <Text numberOfLines={titleLines} style={[type.cardTitle, { color: c.onBackground }]}>
            {item.title}
          </Text>

          {item.badgeValue ? (
            <View style={styles.infoRow}>
              <View style={[styles.badge, { backgroundColor: c.badge }]}>
                <Text style={[type.badge, { color: c.onBadge }]}>{item.badgeValue}</Text>
              </View>
              {item.badgeCaption ? (
                <Text numberOfLines={1} style={[type.cardMeta, { color: c.onBackground }]}>
                  {item.badgeCaption}
                </Text>
              ) : null}
            </View>
          ) : null}

          {item.footerLead || item.footerValue ? (
            <View style={styles.footerRow}>
              {item.footerLead ? (
                <Text style={[type.cardFooter, { color: c.onBackgroundMuted }]}>
                  {item.footerLead}
                </Text>
              ) : null}
              {item.footerValue ? (
                <Text style={[type.cardFooter, { color: c.onBackgroundMuted }]}>
                  {item.footerValue}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8 },
  content: { gap: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: discoveryRadii.badge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
