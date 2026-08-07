/**
 * Event detail.
 *
 * Same shell as the place page — gallery, collapsing native header, static map,
 * contact block, recommendations rail — with an event-shaped body. The
 * differences are real rather than cosmetic: an event leads with **when**, not
 * with a rating, and it can be attended or not depending on facets a place
 * never has (who it is open to, whether there is childcare).
 *
 * Deliberately no rating badge. Events are one-off; a rating gathered after the
 * fact helps nobody deciding whether to go.
 *
 * UI only — content comes from `placeholder-event.ts`, which documents every
 * column this page needs and `events` does not yet have.
 */
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Animated, Linking, StyleSheet, Text, View } from 'react-native';

import { PLACEHOLDER_EVENTS } from '@/src/components/home/placeholder-content';
import { SectionCarousel } from '@/src/components/home/SectionCarousel';
import { resolveEventAttributes } from '@/src/lib/places/attributes';
import { useColors } from '@/src/theme/palette';

import { AttributeChips, DetailSection, ExpandableText, FactList } from '@/src/components/detail/blocks';
import { ContactLinks } from '@/src/components/detail/ContactLinks';
import { PhotoGallery, useEventGalleryHeight } from '@/src/components/detail/PhotoGallery';
import { StaticMap } from '@/src/components/detail/StaticMap';
import { StickyActionBar, useStickyBarInset } from '@/src/components/detail/StickyActionBar';
import { openDirections } from '@/src/components/detail/directions';
import { formatEventWhen, placeholderEvent } from '@/src/components/detail/placeholder-event';
import { useCollapsingHeader } from '@/src/components/detail/useCollapsingHeader';
import { useDetailType } from '@/src/components/detail/type';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useColors();
  const type = useDetailType();

  const event = useMemo(() => placeholderEvent(id), [id]);
  const { chips, facts } = useMemo(
    () => resolveEventAttributes(event.attributes),
    [event.attributes],
  );
  const when = useMemo(
    () => formatEventWhen(event.startsAt, event.endsAt),
    [event.startsAt, event.endsAt],
  );

  // Taller than a place page: event imagery is portrait poster art, not a venue
  // photo. The header fades against the same height, so the two stay in step.
  const galleryHeight = useEventGalleryHeight();

  const { headerOptions, onScroll } = useCollapsingHeader({
    title: event.title,
    mediaHeight: galleryHeight,
  });

  const price =
    event.priceFrom === undefined
      ? 'Free'
      : `from ₦${event.priceFrom.toLocaleString('en-NG')}`;

  // Ticketed events lead with tickets; everything else leads with getting
  // there, so the bar always carries a useful action rather than disappearing.
  const hasTickets = Boolean(event.ticketUrl);
  const onAction = useCallback(() => {
    if (event.ticketUrl) Linking.openURL(event.ticketUrl).catch(() => undefined);
    else openDirections(event.latitude, event.longitude, event.venueName);
  }, [event.ticketUrl, event.latitude, event.longitude, event.venueName]);

  const stickyInset = useStickyBarInset();

  const recommendations = useMemo(
    () => PLACEHOLDER_EVENTS.filter((e) => e.id !== event.id),
    [event.id],
  );

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <Stack.Screen options={headerOptions} />

      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: stickyInset + 24 }}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="never"
      >
        <PhotoGallery images={event.photos} height={galleryHeight} />

        <View style={styles.body}>
          <View style={styles.titleBlock}>
            <Text style={[type.eyebrow, { color: c.onBackgroundMuted }]}>Event</Text>
            <Text style={[type.title, { color: c.onBackground }]}>{event.title}</Text>

            {/* When leads, because it is the fact that decides everything else. */}
            <Text style={[type.factValue, { color: c.onBackground }]}>{when.date}</Text>
            {when.time ? (
              <Text style={[type.bodySmall, { color: c.onBackgroundMuted }]}>{when.time}</Text>
            ) : null}
            <Text style={[type.bodySmall, { color: c.onBackgroundMuted }]}>
              {event.venueName}, {event.city} · {price}
            </Text>

            <AttributeChips items={chips} />
          </View>

          <DetailSection>
            <ExpandableText text={event.description} />
          </DetailSection>

          {facts.length > 0 ? (
            <DetailSection title="Good to know">
              <FactList facts={facts} />
            </DetailSection>
          ) : null}

          <DetailSection title="Location">
            <StaticMap
              latitude={event.latitude}
              longitude={event.longitude}
              label={event.venueName}
            />
            <Text style={[type.bodySmall, { color: c.onBackgroundMuted }]}>
              {event.address}, {event.city}
            </Text>
          </DetailSection>

          {/* Whole block disappears when an event has no contact channels. */}
          {Object.keys(event.contacts).length > 0 ? (
            <DetailSection title={event.organiserName ? `Organised by ${event.organiserName}` : 'Contact'}>
              <ContactLinks contacts={event.contacts} />
            </DetailSection>
          ) : null}

          <SectionCarousel
            title="Other events coming up"
            items={recommendations}
            size="event"
            onPressItem={(nextId) => router.push({ pathname: '/event/[id]', params: { id: nextId } })}
          />
        </View>
      </Animated.ScrollView>

      <StickyActionBar
        lead={{ label: event.priceFrom === undefined ? undefined : 'Price', value: price }}
        actionLabel={hasTickets ? 'Get tickets' : 'Get directions'}
        accessibilityLabel={
          hasTickets ? `Get tickets for ${event.title}` : `Get directions to ${event.venueName}`
        }
        onAction={onAction}
        testID="event-cta"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingTop: 20, gap: 28 },
  titleBlock: { paddingHorizontal: 16, gap: 8 },
});
