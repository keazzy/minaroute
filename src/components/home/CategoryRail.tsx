/**
 * The six-tile category rail: a 100×100 tinted tile with a 32pt icon, label
 * beneath, scrolling horizontally.
 *
 * The Figma names all six — Mosques, Learning center, Events Nearby, Food,
 * Things to do, Stays — which answers the brief's open question about the two
 * extra tiles. Note only the first four map to a DB category today
 * (`constants/mockData.ts`); "Things to do" and "Stays" have no backing data
 * yet, so they are flagged `comingSoon` rather than quietly routing nowhere.
 *
 * This replaces `components/CategoryCard.tsx` for Home — that one is a 140×150
 * image-background card, a different shape entirely.
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DiscoveryIcon } from '@/src/components/icons/DiscoveryIcon';
import type { DiscoveryIconName } from '@/src/components/icons/discovery-icons';
import { discoveryRadii, useColors, type CategoryKey } from '@/src/theme/palette';

import { useHomeType } from './type';

const TILE = 100;

export type HomeCategory = {
  key: CategoryKey;
  icon: DiscoveryIconName;
  label: string;
  /** Display name sent to /search-results. Absent while unbacked by data. */
  searchCategory?: string;
  comingSoon?: boolean;
};

/** Order and labels are the Figma's. */
export const HOME_CATEGORIES: HomeCategory[] = [
  { key: 'mosques', icon: 'mosques', label: 'Mosques', searchCategory: 'Mosques' },
  { key: 'learning', icon: 'learning', label: 'Learning center', searchCategory: 'Islamic Schools' },
  { key: 'events', icon: 'events', label: 'Events Nearby', searchCategory: 'Events' },
  { key: 'food', icon: 'food', label: 'Food', searchCategory: 'Halal Food' },
  { key: 'thingsToDo', icon: 'thingsToDo', label: 'Things to do', comingSoon: true },
  { key: 'stays', icon: 'stays', label: 'Stays', comingSoon: true },
];

export type CategoryRailProps = {
  categories?: HomeCategory[];
  onSelect?: (category: HomeCategory) => void;
};

export function CategoryRail({ categories = HOME_CATEGORIES, onSelect }: CategoryRailProps) {
  const c = useColors();
  const type = useHomeType();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {categories.map((category) => {
        const swatch = c.categories[category.key];
        return (
          <Pressable
            key={category.key}
            accessibilityRole="button"
            accessibilityLabel={category.label}
            onPress={() => onSelect?.(category)}
            style={styles.item}
            testID={`category-${category.key}`}
          >
            <View style={[styles.tile, { backgroundColor: swatch.bg }]}>
              <DiscoveryIcon name={category.icon} size={32} color={swatch.icon} />
            </View>
            <Text style={[type.tileLabel, { color: c.onBackground }]} numberOfLines={1}>
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, gap: 12, alignItems: 'flex-start' },
  item: { alignItems: 'center', gap: 4, width: TILE },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: discoveryRadii.tile,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
