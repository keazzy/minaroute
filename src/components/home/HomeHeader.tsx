/**
 * Home's header block: greeting + avatar, the search stub, and the location row.
 *
 * The search field is a **tappable stub**, not an editable input — tapping routes
 * to /search-results with focus, matching the existing pattern on the map screen.
 * Typing happens there, so Home never owns keyboard state.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DiscoveryIcon } from '@/src/components/icons/DiscoveryIcon';
import { discoveryRadii, useColors } from '@/src/theme/palette';

import { useHomeType } from './type';

export type GreetingRowProps = {
  eyebrow: string;
  title: string;
  onPressAvatar?: () => void;
};

export function GreetingRow({ eyebrow, title, onPressAvatar }: GreetingRowProps) {
  const c = useColors();
  const type = useHomeType();

  return (
    <View style={styles.greetingRow}>
      <View style={styles.greetingText}>
        <Text style={[type.greetingEyebrow, { color: c.onBackground }]}>{eyebrow}</Text>
        <Text style={[type.greetingTitle, { color: c.onBackground }]}>{title}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Your profile"
        onPress={onPressAvatar}
        style={[styles.avatar, { backgroundColor: c.surfaceMuted, borderColor: c.background }]}
        testID="home-avatar"
      >
        <DiscoveryIcon name="user" size={24} color={c.onBackground} />
      </Pressable>
    </View>
  );
}

export type SearchStubProps = {
  placeholder: string;
  onPress?: () => void;
};

export function SearchStub({ placeholder, onPress }: SearchStubProps) {
  const c = useColors();
  const type = useHomeType();

  return (
    <Pressable
      accessibilityRole="search"
      accessibilityLabel={placeholder}
      onPress={onPress}
      style={[styles.search, { backgroundColor: c.surface, borderColor: c.border }]}
      testID="home-search"
    >
      <DiscoveryIcon name="search" size={20} color={c.onBackgroundMuted} />
      <Text numberOfLines={1} style={[type.bodySmall, styles.searchText, { color: c.onBackgroundMuted }]}>
        {placeholder}
      </Text>
    </Pressable>
  );
}

export type LocationRowProps = {
  title: string;
  action: string;
  onPress?: () => void;
};

export function LocationRow({ title, action, onPress }: LocationRowProps) {
  const c = useColors();
  const type = useHomeType();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${action}`}
      onPress={onPress}
      style={styles.locationRow}
      testID="home-location-row"
    >
      <View style={[styles.locationChip, { backgroundColor: c.locationChipBg }]}>
        <DiscoveryIcon name="location" size={24} color={c.locationChipIcon} />
      </View>
      <View style={styles.locationText}>
        <Text style={[type.bodyMedium, { color: c.onBackground }]}>{title}</Text>
        <Text style={[type.bodySmall, { color: c.onBackground }]}>{action}</Text>
      </View>
    </Pressable>
  );
}

const AVATAR = 48;
const CHIP = 49;

const styles = StyleSheet.create({
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 20,
  },
  greetingText: { flex: 1, gap: 5 },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderWidth: 1,
    borderRadius: discoveryRadii.pill,
  },
  searchText: { flex: 1 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 20,
  },
  locationChip: {
    width: CHIP,
    height: CHIP,
    borderRadius: CHIP / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: { flex: 1 },
});
