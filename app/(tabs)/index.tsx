/**
 * Home tab — the discovery-first browse surface, per Figma node 270:2338.
 *
 * UI ONLY for now: every section renders PLACEHOLDER content from
 * `placeholder-content.ts`. Nothing here reads Supabase yet, because the
 * sections cannot be built for real until the migrations land — `events` has no
 * dates to order "coming up soon" by, and `places` has no rating column. See
 * docs/home-redesign-brief.md § Build order, steps 2–3.
 *
 * Wiring it up later is a small change: swap the placeholder arrays for
 * `useNearbyPlaces()` / `useEvents()` from `@/src/lib/places` and map rows into
 * `DiscoveryCardItem`.
 *
 * Explore (`app/home.tsx`) remains the map. Home never renders a MapView.
 */
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryRail, type HomeCategory } from '@/src/components/home/CategoryRail';
import { GreetingRow, LocationRow, SearchStub } from '@/src/components/home/HomeHeader';
import {
  PLACEHOLDER_ACTIVITIES,
  PLACEHOLDER_EVENTS,
  PLACEHOLDER_PLACES,
  PLACEHOLDER_PROMO_IMAGE,
} from '@/src/components/home/placeholder-content';
import { SectionCarousel } from '@/src/components/home/SectionCarousel';
import { TripPromoCard } from '@/src/components/home/TripPromoCard';
import { useColors, useIsDark } from '@/src/theme/palette';

export default function HomeTab() {
  const router = useRouter();
  const c = useColors();
  const isDark = useIsDark();

  const openSearch = useCallback(() => {
    router.push({ pathname: '/search-results', params: { focus: '1' } });
  }, [router]);

  const openCategory = useCallback(
    (category: HomeCategory) => {
      // "Things to do" and "Stays" have no DB category yet — send those to plain
      // search rather than filtering on a value that matches nothing.
      router.push({
        pathname: '/search-results',
        params: category.searchCategory ? { category: category.searchCategory } : {},
      });
    },
    [router],
  );

  // Card taps deep-link to the pin on the Explore map until the place detail
  // screen exists (deferred — owner is providing that UI separately). Keeping
  // this in one place makes swapping the destination a one-line change.
  const openItem = useCallback(
    (id: string) => {
      router.push({ pathname: '/home', params: { placeId: id } });
    },
    [router],
  );

  const openTripPlanner = useCallback(() => {
    router.push('/(tabs)/trips');
  }, [router]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GreetingRow eyebrow="As salam alykum" title="Where to?" />

        <SearchStub placeholder="Search mosques, halal food, schools…" onPress={openSearch} />

        {/* Not-yet-granted state, as drawn. The granted and denied variants are
            still unspecified — see the brief's "States the Figma doesn't show". */}
        <LocationRow
          title="Looking for something nearby?"
          action="Allow location access"
          onPress={openSearch}
        />

        <View style={styles.sections}>
          <CategoryRail onSelect={openCategory} />

          <SectionCarousel
            title="Places around you"
            items={PLACEHOLDER_PLACES}
            size="place"
            onPressItem={openItem}
          />

          <SectionCarousel
            title="Events coming up soon"
            items={PLACEHOLDER_EVENTS}
            size="event"
            onPressItem={openItem}
          />

          <SectionCarousel
            title="Things to do this weekend in Lagos"
            items={PLACEHOLDER_ACTIVITIES}
            size="activity"
            titleLines={2}
            onPressItem={openItem}
          />
        </View>

        <TripPromoCard
          eyebrow="Trip planner"
          title="Going to Umrah soon? Let’s help you plan every step of the way"
          cta="Plan trip"
          image={PLACEHOLDER_PROMO_IMAGE}
          onPress={openTripPlanner}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingTop: 8, paddingBottom: 40, gap: 24 },
  // The Figma's 43pt gap between the category rail and the first section, and
  // the rhythm between sections thereafter.
  sections: { gap: 43 },
});
