/**
 * Place detail — the shared spine, rendered for any place category.
 *
 * Everything here is identical for a mosque, a school or a restaurant: gallery,
 * title block, chips, description, location, hours, contact, recommendations.
 * The one category-specific part is the facts block, driven by the per-category
 * vocabulary in `src/lib/places/attributes.ts`. Adding a category means adding a
 * schema there, not editing this file.
 *
 * The header is the **native** stack header, transparent over the gallery and
 * fading into a solid title bar as it scrolls away — so the back chevron keeps
 * the system's tint, the iOS edge-swipe affordance, and (per the design) no
 * back-button label.
 *
 * UI only — content comes from `placeholder-place.ts`. Wiring this to Supabase
 * needs columns that do not exist yet, which is exactly what building this page
 * first was meant to surface. See docs/build-log.md.
 */
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SectionCarousel } from '@/src/components/home/SectionCarousel';
import { PLACEHOLDER_PLACES } from '@/src/components/home/placeholder-content';
import { resolveAttributes } from '@/src/lib/places/attributes';
import { discoveryRadii, useColors } from '@/src/theme/palette';

import { AttributeChips, DetailSection, ExpandableText, FactList } from '@/src/components/detail/blocks';
import { ContactLinks } from '@/src/components/detail/ContactLinks';
import { GALLERY_HEIGHT, PhotoGallery } from '@/src/components/detail/PhotoGallery';
import { ShareIcon } from '@/src/components/detail/gallery-icons';
import { StaticMap } from '@/src/components/detail/StaticMap';
import { placeholderPlace } from '@/src/components/detail/placeholder-place';
import { useDetailType } from '@/src/components/detail/type';

/** Header bar height, excluding the status bar. */
const BAR = Platform.OS === 'ios' ? 44 : 56;

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

  const scrollY = useRef(new Animated.Value(0)).current;

  // The bar fades in over the last stretch of the gallery, landing solid just
  // as the gallery's bottom edge meets the bar.
  const collapseEnd = GALLERY_HEIGHT - (insets.top + BAR);
  const barOpacity = scrollY.interpolate({
    inputRange: [Math.max(0, collapseEnd - 80), Math.max(1, collapseEnd)],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Icon tint can't be animated — the native header takes a plain colour — so
  // it flips once at the threshold instead of tracking the fade. Two renders
  // per traversal, not one per frame.
  const [collapsed, setCollapsed] = useState(false);
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: (e: any) => {
          const next = e.nativeEvent.contentOffset.y >= collapseEnd - 40;
          setCollapsed((prev) => (prev === next ? prev : next));
        },
      }),
    [scrollY, collapseEnd],
  );

  const onShare = useCallback(() => {
    // No public URL to share yet; shares the name. Swap in a deep link later.
    Share.share({ message: place.name }).catch(() => undefined);
  }, [place.name]);

  // Over photography the glyphs must stay white; once the bar is solid they
  // follow the palette.
  const tint = collapsed ? c.onBackground : '#FFFFFF';

  const recommendations = useMemo(
    () => PLACEHOLDER_PLACES.filter((p) => p.id !== place.id),
    [place.id],
  );

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTintColor: tint,
          // iOS: chevron only, no "Back" label, per the design.
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitle: '',
          headerTitleAlign: 'center',
          headerTitle: () => (
            <Animated.Text
              numberOfLines={1}
              style={[type.factValue, { color: c.onBackground, opacity: barOpacity }]}
            >
              {place.name}
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
              accessibilityLabel={`Share ${place.name}`}
              testID="detail-share"
              hitSlop={12}
            >
              <ShareIcon color={tint} />
            </Pressable>
          ),
        }}
      />

      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        // The gallery sits under the transparent header by design.
        contentInsetAdjustmentBehavior="never"
      >
        <PhotoGallery images={place.photos} />

        <View style={styles.body}>
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
            <StaticMap latitude={place.latitude} longitude={place.longitude} label={place.name} />
            <Text style={[type.bodySmall, { color: c.onBackgroundMuted }]}>
              {place.address}, {place.city}
            </Text>
          </DetailSection>

          {place.openingHours ? (
            <DetailSection title="Opening hours">
              <Text style={[type.body, { color: c.onBackground }]}>{place.openingHours}</Text>
            </DetailSection>
          ) : null}

          <DetailSection title="Contact">
            <ContactLinks contacts={place.contacts} />
          </DetailSection>

          <SectionCarousel
            title="Similar places nearby"
            items={recommendations}
            onPressItem={(nextId) => router.push({ pathname: '/place/[id]', params: { id: nextId } })}
          />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingTop: 20, gap: 28 },
  titleBlock: { paddingHorizontal: 16, gap: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: discoveryRadii.badge },
});
