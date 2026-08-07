/**
 * Place detail — the shared spine, rendered for any place category.
 *
 * Everything here is identical for a mosque, a school or a restaurant: gallery,
 * title block, chips, description, location, hours, contact, recommendations.
 * The one category-specific part is the facts block, driven by the per-category
 * vocabulary in `src/lib/places/attributes.ts`. Adding a category means adding a
 * schema there, not editing this file.
 *
 * UI only — content comes from `placeholder-place.ts`. Wiring this to Supabase
 * needs columns that do not exist yet (rating, attributes, phone, hours), which
 * is exactly what building this page first was meant to surface. See
 * docs/build-log.md.
 */
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SectionCarousel } from '@/src/components/home/SectionCarousel';
import { PLACEHOLDER_PLACES } from '@/src/components/home/placeholder-content';
import { resolveAttributes } from '@/src/lib/places/attributes';
import { discoveryRadii, useColors } from '@/src/theme/palette';

import { AttributeChips, DetailSection, ExpandableText, FactList } from '@/src/components/detail/blocks';
import { PhotoGallery } from '@/src/components/detail/PhotoGallery';
import { StaticMap } from '@/src/components/detail/StaticMap';
import { placeholderPlace } from '@/src/components/detail/placeholder-place';
import { useDetailType } from '@/src/components/detail/type';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useColors();
  const type = useDetailType();
  const insets = useSafeAreaInsets();

  const place = useMemo(() => placeholderPlace(id), [id]);
  const { chips, facts } = useMemo(
    () => resolveAttributes(place.category, place.attributes),
    [place.category, place.attributes],
  );

  const onBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  const onCall = useCallback(() => {
    if (place.phone) Linking.openURL(`tel:${place.phone.replace(/\s/g, '')}`).catch(() => undefined);
  }, [place.phone]);

  // "Other mosques near this one" — category + proximity, which PostGIS already
  // supports. Not a behavioural signal: there is no traffic to derive one from.
  const recommendations = useMemo(
    () => PLACEHOLDER_PLACES.filter((p) => p.id !== place.id),
    [place.id],
  );

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
      >
        <PhotoGallery images={place.photos} title={place.name} onBack={onBack} />

        <View style={styles.body}>
          {/* Title block */}
          <View style={styles.titleBlock}>
            <Text style={[type.eyebrow, { color: c.onBackgroundMuted }]}>{place.categoryLabel}</Text>
            <Text style={[type.title, { color: c.onBackground }]}>{place.name}</Text>

            <View style={styles.ratingRow}>
              {place.rating !== undefined ? (
                <View style={[styles.badge, { backgroundColor: c.badge }]}>
                  <Text style={[type.chip, { color: c.onBadge }]}>{place.rating.toFixed(1)}</Text>
                </View>
              ) : null}
              <Text style={[type.bodySmall, { color: c.onBackgroundMuted }]}>
                {place.rating !== undefined && place.ratingCount
                  ? `${place.ratingCount} ${place.ratingCount === 1 ? 'source' : 'sources'} · `
                  : ''}
                {place.address}, {place.city}
              </Text>
            </View>

            <AttributeChips items={chips} />
          </View>

          <DetailSection>
            <ExpandableText text={place.description} />
          </DetailSection>

          {facts.length > 0 ? (
            <DetailSection title="Good to know">
              <FactList facts={facts} />
            </DetailSection>
          ) : null}

          <DetailSection title="Location">
            <StaticMap
              latitude={place.latitude}
              longitude={place.longitude}
              label={place.name}
            />
            <Text style={[type.bodySmall, { color: c.onBackgroundMuted }]}>
              {place.address}, {place.city}
            </Text>
          </DetailSection>

          {place.openingHours ? (
            <DetailSection title="Opening hours">
              <Text style={[type.body, { color: c.onBackground }]}>{place.openingHours}</Text>
            </DetailSection>
          ) : null}

          {place.phone || place.website ? (
            <DetailSection title="Contact">
              <View style={styles.contactRow}>
                {place.phone ? (
                  <Pressable
                    onPress={onCall}
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${place.name}`}
                    style={[styles.contactPill, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}
                  >
                    <Text style={[type.chip, { color: c.onBackground }]}>{place.phone}</Text>
                  </Pressable>
                ) : null}
                {place.website ? (
                  <Pressable
                    onPress={() => Linking.openURL(place.website!).catch(() => undefined)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open the website for ${place.name}`}
                    style={[styles.contactPill, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}
                  >
                    <Text style={[type.chip, { color: c.onBackground }]}>Website</Text>
                  </Pressable>
                ) : null}
              </View>
            </DetailSection>
          ) : null}

          <SectionCarousel
            title="Similar places nearby"
            items={recommendations}
            onPressItem={(nextId) => router.push({ pathname: '/place/[id]', params: { id: nextId } })}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingTop: 20, gap: 28 },
  titleBlock: { paddingHorizontal: 16, gap: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: discoveryRadii.badge,
  },
  contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  contactPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: discoveryRadii.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
