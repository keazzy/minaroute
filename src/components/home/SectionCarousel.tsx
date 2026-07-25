/**
 * A titled horizontal rail of DiscoveryCards.
 *
 * Renders nothing when `items` is empty. Per the brief, a visible heading with
 * nothing beneath it reads worse than no section at all — and with roughly 17
 * ingestible Lagos events in total, empty sections are the expected case at
 * launch, not an edge case. Pass `keepWhenEmpty` to override once real
 * empty-state copy is designed.
 */
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/src/theme/palette';

import { DiscoveryCard, type CardSize, type DiscoveryCardItem } from './DiscoveryCard';
import { useHomeType } from './type';

export type SectionCarouselProps = {
  title: string;
  items: DiscoveryCardItem[];
  size?: CardSize;
  titleLines?: number;
  keepWhenEmpty?: boolean;
  onPressItem?: (id: string) => void;
};

export function SectionCarousel({
  title,
  items,
  size = 'place',
  titleLines = 1,
  keepWhenEmpty = false,
  onPressItem,
}: SectionCarouselProps) {
  const c = useColors();
  const type = useHomeType();

  if (items.length === 0 && !keepWhenEmpty) return null;

  return (
    <View style={styles.section}>
      <Text style={[type.sectionTitle, styles.title, { color: c.onBackground }]}>{title}</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <DiscoveryCard item={item} size={size} titleLines={titleLines} onPress={onPressItem} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 16 },
  title: { paddingHorizontal: 16 },
  list: { paddingHorizontal: 16, gap: 12 },
});
