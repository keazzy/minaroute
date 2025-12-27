import EventDetailsContent from '@/components/event-details-content';
import PlaceCard from '@/components/place-card';
import { Colors } from '@/constants/theme';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Picker } from '@react-native-picker/picker';
import * as ExpoLocation from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, FlatList, Linking, Modal, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const SUPABASE_URL = 'https://spjlyhmgqtkcqhpvgxci.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwamx5aG1ncXRrY3FocHZneGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MzYzODIsImV4cCI6MjA4MTIxMjM4Mn0.CJz-iTGuoKCmhRQc0vausUPPLR2341GL8JCncMk9i1k';

type PlaceRow = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  tags: string[] | null;
  photos: string[] | null;
};

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location_name: string | null;
  city: string | null;
  state: string | null;
  photo: string | null;
  approved: boolean | null;
  tags: string | null;
};

type PlaceType = 'Mosque' | 'School' | 'Event' | 'Halal Food';

type Place = {
  id: string;
  name: string;
  address: string;
  description: string;
  image: string;
  type: PlaceType;
  tags: string[];
  coordinate: {
    latitude: number;
    longitude: number;
  };
};

type ListItem =
  | Place
  | {
      id: string;
      name: string;
      address: string;
      description: string;
      image: string;
      type: 'Event';
      tags: string[];
      city?: string;
      photos?: string[];
      coordinate?: null;
    };

const TYPE_OPTIONS: { label: string; value: PlaceType | 'All' }[] = [
  { label: 'All', value: 'All' },
  { label: 'Mosque', value: 'Mosque' },
  { label: 'Halal Food', value: 'Halal Food' },
  { label: 'Schools', value: 'School' },
  { label: 'Events', value: 'Event' },
];

function mapCategoryToType(category: string): PlaceType | null {
  const lower = category.trim().toLowerCase();
  if (lower.includes('mosque')) return 'Mosque';
  if (lower.includes('halal')) return 'Halal Food';
  if (lower.includes('school')) return 'School';
  if (lower.includes('event')) return 'Event';
  return null;
}

function ShimmerBlock({ style }: { style?: any }) {
  const shimmer = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View style={[styles.skeletonBase, style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.skeletonShimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

function ResultSkeletonCard() {
  return (
    <View style={styles.card}>
      <ShimmerBlock style={styles.skeletonImageTile} />
      <View style={styles.cardBody}>
        <View>
          <ShimmerBlock style={styles.skeletonLinePrimary} />
          <ShimmerBlock style={styles.skeletonLineSecondary} />
        </View>
        <View style={styles.badgesRow}>
          <ShimmerBlock style={styles.skeletonBadge} />
          <ShimmerBlock style={styles.skeletonBadge} />
        </View>
      </View>
    </View>
  );
}

function haversineKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function MingcuteIcon({
  name,
  size = 20,
  color = '#000',
  style,
}: {
  name: 'left_line' | 'search_line' | 'settings_6_line' | 'right_small_line';
  size?: number;
  color?: string;
  style?: any;
}) {
  const glyph = {
    left_line: 0xeff7,
    search_line: 0xf30d,
    settings_6_line: 0xf333,
    right_small_line: 0xf291,
  }[name];

  return (
    <Text
      style={[
        {
          fontFamily: 'MingCute',
          fontSize: size,
          color,
          lineHeight: size,
          textAlign: 'center',
        },
        style,
      ]}
    >
      {String.fromCharCode(glyph)}
    </Text>
  );
}

export default function SearchResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; searchQuery?: string; focus?: string }>();

  const initialCategory = typeof params.category === 'string' ? params.category : '';
  const initialSearchQuery = typeof params.searchQuery === 'string' ? params.searchQuery : '';
  const shouldFocus = params.focus === '1';

  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState(initialSearchQuery);
  const [nearMe, setNearMe] = useState(false);
  const [nearMePermissionStatus, setNearMePermissionStatus] = useState<ExpoLocation.PermissionStatus | null>(null);
  const [typeFilter, setTypeFilter] = useState<PlaceType | 'All'>(() => {
    const fromCategory = initialCategory ? mapCategoryToType(initialCategory) : null;
    return fromCategory ?? 'All';
  });
  const [amenityFilter, setAmenityFilter] = useState<string | 'All'>('All');
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<Extract<ListItem, { type: 'Event' }> | null>(null);
  const eventDetailsSheetRef = React.useRef<BottomSheetModal>(null);
  const eventDetailsSnapPoints = useMemo(() => ['90%'], []);

  const renderEventBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.25} />
    ),
    []
  );

  const [pickerOpen, setPickerOpen] = useState<null | 'type' | 'amenities'>(null);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [autoFocused, setAutoFocused] = useState(false);

  const openTypePicker = useCallback(() => {
    setTypePickerOpen(true);
  }, []);

  useEffect(() => {
    if (autoFocused) return;
    if (!shouldFocus) return;
    setAutoFocused(true);
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }, [autoFocused, shouldFocus]);

  const searchInputRef = React.useRef<TextInput>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchPlaces = async () => {
      try {
        setLoading(true);

        const headers = {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Accept: 'application/json',
        };

        const placesUrl = `${SUPABASE_URL}/rest/v1/places?select=id,name,category,description,address,city,state,latitude,longitude,tags,photos&order=created_at.desc`;
        const eventsUrl = `${SUPABASE_URL}/rest/v1/events?select=id,title,description,location_name,city,state,photo,approved,tags&approved=eq.true&order=created_at.desc`;

        const [placesRes, eventsRes] = await Promise.all([
          fetch(placesUrl, { headers }),
          fetch(eventsUrl, { headers }),
        ]);

        if (!placesRes.ok) {
          throw new Error(`Failed to fetch places (${placesRes.status})`);
        }
        if (!eventsRes.ok) {
          throw new Error(`Failed to fetch events (${eventsRes.status})`);
        }

        const placeRows = (await placesRes.json()) as PlaceRow[];
        const eventRows = (await eventsRes.json()) as EventRow[];

        const mappedPlaces: Place[] = placeRows
          .filter((row) => typeof row.latitude === 'number' && typeof row.longitude === 'number')
          .map((row) => {
            const categoryLower = (row.category ?? '').toLowerCase();
            const type: Exclude<PlaceType, 'Event'> | 'Event' = categoryLower.includes('halal')
              ? 'Halal Food'
              : categoryLower.includes('school')
                ? 'School'
                : categoryLower.includes('event')
                  ? 'Event'
                  : 'Mosque';

            const addressParts = [row.address, row.city, row.state].filter(Boolean) as string[];
            const address = addressParts.join(', ');

            return {
              id: row.id,
              name: row.name,
              address: address || '',
              description: row.description ?? '',
              image: row.photos?.[0] ?? '',
              type: type as PlaceType,
              tags: row.tags ?? [],
              coordinate: {
                latitude: row.latitude as number,
                longitude: row.longitude as number,
              },
            };
          });

        const mappedEvents: ListItem[] = eventRows.map((row) => {
          const addressParts = [row.location_name, row.city, row.state].filter(Boolean) as string[];
          const address = addressParts.join(', ');
          const tags = (row.tags ?? '')
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);

          const photo = typeof row.photo === 'string' ? row.photo.trim() : '';

          return {
            id: row.id,
            name: row.title,
            address,
            description: row.description ?? '',
            image: photo,
            type: 'Event',
            tags,
            city: row.city ?? undefined,
            photos: photo ? [photo] : [],
            coordinate: null,
          };
        });

        if (!cancelled) {
          setPlaces(mappedPlaces);
          setEvents(mappedEvents);
        }
      } catch {
        if (!cancelled) {
          setPlaces([]);
          setEvents([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchPlaces();

    return () => {
      cancelled = true;
    };
  }, []);

  const ensureUserCoords = useCallback(async () => {
    if (userCoords) return;

    try {
      const perm = await ExpoLocation.getForegroundPermissionsAsync();
      setNearMePermissionStatus(perm.status);
      if (perm.status !== ExpoLocation.PermissionStatus.GRANTED) return;

      const pos = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
      setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch {
      // ignore
    }
  }, [userCoords]);

  useEffect(() => {
    void ensureUserCoords();
  }, [ensureUserCoords]);

  useEffect(() => {
    if (nearMe) {
      void ensureUserCoords();
    }
  }, [ensureUserCoords, nearMe]);

  const showNearMeDenied = nearMe && nearMePermissionStatus === ExpoLocation.PermissionStatus.DENIED;

  const amenityOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of places) {
      for (const t of p.tags) set.add(t);
    }
    for (const e of events) {
      for (const t of e.tags) set.add(t);
    }
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))] as (string | 'All')[];
  }, [events, places]);

  const shownQueryLabel = useMemo(() => {
    if (initialCategory) return initialCategory;
    if (initialSearchQuery) return initialSearchQuery;
    if (searchText.trim()) return searchText.trim();
    return 'All';
  }, [initialCategory, initialSearchQuery, searchText]);

  const isEmptySearchState = useMemo(() => {
    return !initialCategory && !searchText.trim();
  }, [initialCategory, searchText]);

  const filteredPlaces = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const categoryType = initialCategory ? mapCategoryToType(initialCategory) : null;

    let list: ListItem[] = [...places, ...events];

    if (categoryType) {
      list = list.filter((p) => p.type === categoryType);
    }

    if (q) {
      list = list.filter((p) => {
        const haystack = `${p.name} ${p.address} ${p.type} ${p.tags.join(' ')}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    if (typeFilter !== 'All') {
      list = list.filter((p) => p.type === typeFilter);
    }

    if (amenityFilter !== 'All') {
      list = list.filter((p) => p.tags.some((t) => t.toLowerCase() === String(amenityFilter).toLowerCase()));
    }

    if (userCoords) {
      const withCoords = list.filter((p): p is Place => {
        return (
          (p as Place).coordinate != null &&
          typeof (p as Place).coordinate?.latitude === 'number' &&
          typeof (p as Place).coordinate?.longitude === 'number'
        );
      });
      const withoutCoords = list.filter((p) => !withCoords.some((x) => x.id === p.id));

      const withDistance = withCoords
        .map((p) => ({ place: p, distanceKm: haversineKm(userCoords, p.coordinate) }))
        .filter((x) => Number.isFinite(x.distanceKm));

      if (nearMe) {
        return withDistance
          .filter((x) => x.distanceKm <= 10)
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .map((x) => x.place);
      }

      const sortedByDistance = withDistance.sort((a, b) => a.distanceKm - b.distanceKm).map((x) => x.place);
      const sortedNoCoords = [...withoutCoords].sort((a, b) => a.name.localeCompare(b.name));
      return [...sortedByDistance, ...sortedNoCoords];
    }

    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [amenityFilter, events, initialCategory, nearMe, places, searchText, typeFilter, userCoords]);

  const renderCard = useCallback(
    (place: ListItem) => {
      const distanceLabel = (() => {
        if (place.type === 'Event') return undefined;
        if (nearMePermissionStatus !== ExpoLocation.PermissionStatus.GRANTED) return undefined;
        if (!userCoords) return '—';

        const coord = (place as Place).coordinate;
        if (!coord) return '—';
        const km = haversineKm(userCoords, coord);
        if (!Number.isFinite(km)) return '—';
        if (km <= 2) return `${km.toFixed(1)}km away`;
        if (km <= 5) return 'Near me';
        return '—';
      })();

      return (
        <PlaceCard
          title={place.name}
          subtitle={place.type === 'Event' ? place.description : place.address}
          type={place.type}
          distanceLabel={distanceLabel}
          tags={place.tags}
          imageUri={place.image}
          onPress={() => {
            if (place.type === 'Event') {
              setSelectedEvent(place as Extract<ListItem, { type: 'Event' }>);
              requestAnimationFrame(() => {
                eventDetailsSheetRef.current?.present();
              });
              return;
            }
            router.push({ pathname: '/home', params: { placeId: place.id } });
          }}
        />
      );
    },
    [nearMePermissionStatus, router, userCoords]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()} activeOpacity={0.8}>
          <MingcuteIcon name="left_line" size={20} color="#000" />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <MingcuteIcon name="search_line" size={24} color="#000" />
          <TextInput
            ref={searchInputRef}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search mosques, halal food, schools…"
            placeholderTextColor="#6a6c6a"
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>

        <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.8}>
          <MingcuteIcon name="settings_6_line" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {!isEmptySearchState && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsHeaderText}>
            <Text>Showing you results for </Text>
            <Text style={styles.resultsHeaderBold}>{shownQueryLabel}</Text>
          </Text>

          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={[styles.filterChip, nearMe ? styles.filterChipActive : null]}
              onPress={() => setNearMe((v) => !v)}
              activeOpacity={0.85}
            >
              <Text style={styles.filterChipText}>Near me</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterChip} onPress={openTypePicker} activeOpacity={0.85}>
              <Text style={styles.filterChipText}>Type</Text>
              <View style={styles.filterChipChevronIcon}>
                <MingcuteIcon name="right_small_line" size={16} color="#000" style={styles.filterChipChevronGlyph} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterChip} onPress={() => setPickerOpen('amenities')} activeOpacity={0.85}>
              <Text style={styles.filterChipText}>Ammenties</Text>
              <View style={styles.filterChipChevronIcon}>
                <MingcuteIcon name="right_small_line" size={16} color="#000" style={styles.filterChipChevronGlyph} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.listContainer}>
        {isEmptySearchState ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateTextWrap}>
              <Text style={styles.emptyStateTitle}>No result yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Start typing to find mosque, schools, madarasah and events around you
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={showNearMeDenied ? [] : loading ? [] : filteredPlaces}
            keyExtractor={(item: ListItem) => item.id}
            renderItem={({ item }: { item: ListItem }) => renderCard(item)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              loading ? (
                <View style={{ gap: 10, paddingTop: 4 }}>
                  <ResultSkeletonCard />
                  <ResultSkeletonCard />
                  <ResultSkeletonCard />
                </View>
              ) : showNearMeDenied ? (
                <View style={styles.listStateContainer}>
                  <Text style={styles.listStateTitle}>Turn on location to use Near me.</Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.listStateButton}
                    onPress={() => {
                      if (typeof Linking.openSettings === 'function') {
                        void Linking.openSettings();
                      } else {
                        void Linking.openURL('app-settings:');
                      }
                    }}
                  >
                    <Text style={styles.listStateButtonText}>Open Settings</Text>
                  </TouchableOpacity>
                </View>
              ) : nearMe && userCoords && filteredPlaces.length === 0 ? (
                <View style={styles.listStateContainer}>
                  <Text style={styles.listStateTitle}>Nothing nearby right now.</Text>
                </View>
              ) : (
                <View style={styles.listStateContainer}>
                  <Text style={styles.listStateTitle}>No results.</Text>
                </View>
              )
            }
          />
        )}
      </View>

      <TouchableOpacity style={styles.mapViewButton} activeOpacity={0.9} onPress={() => router.back()}>
        <Text style={styles.mapViewButtonText}>🗺️ Map View</Text>
      </TouchableOpacity>

      <Modal visible={pickerOpen !== null} transparent animationType="fade" onRequestClose={() => setPickerOpen(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(null)}>
          <View />
        </Pressable>

        <View style={styles.modalSheet}>
          {(pickerOpen === 'type' ? TYPE_OPTIONS.map((o) => o.value) : amenityOptions).map((opt) => {
            const label = String(opt);
            const selected =
              pickerOpen === 'type' ? typeFilter === opt : amenityFilter === opt;

            return (
              <TouchableOpacity
                key={label}
                style={styles.modalOption}
                activeOpacity={0.8}
                onPress={() => {
                  if (pickerOpen === 'type') {
                    setTypeFilter(opt as PlaceType | 'All');
                  } else {
                    setAmenityFilter(opt as string | 'All');
                  }
                  setPickerOpen(null);
                }}
              >
                <Text style={[styles.modalOptionText, selected ? styles.modalOptionTextSelected : null]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>

      <BottomSheetModal
        ref={eventDetailsSheetRef}
        index={0}
        snapPoints={eventDetailsSnapPoints}
        backdropComponent={renderEventBackdrop}
        stackBehavior="replace"
        onDismiss={() => setSelectedEvent(null)}
      >
        <BottomSheetScrollView contentContainerStyle={styles.eventDetailsContent}>
          {selectedEvent && (
            <EventDetailsContent
              title={selectedEvent.name}
              tags={selectedEvent.tags}
              city={selectedEvent.city}
              photos={selectedEvent.photos}
              description={selectedEvent.description}
            />
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>

      <Modal visible={typePickerOpen} transparent animationType="slide" onRequestClose={() => setTypePickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setTypePickerOpen(false)}>
          <View />
        </Pressable>

        <View style={styles.pickerSheet}
        >
          <View style={styles.pickerHeaderRow}>
            <TouchableOpacity onPress={() => setTypePickerOpen(false)} activeOpacity={0.8}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </TouchableOpacity>
          </View>

          <Picker
            selectedValue={typeFilter}
            onValueChange={(value) => setTypeFilter(value as PlaceType | 'All')}
            style={styles.nativePicker}
          >
            {TYPE_OPTIONS.map((opt) => (
              <Picker.Item key={opt.label} label={opt.label} value={opt.value} />
            ))}
          </Picker>
        </View>
      </Modal>

      {Platform.OS === 'ios' && <View style={styles.iosHomeIndicatorSpacer} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  headerIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1.2,
    borderColor: 'rgba(120,120,128,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontSize: 20,
    color: '#000',
  },
  searchContainer: {
    flex: 1,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    paddingVertical: 0,
    fontFamily: 'Quicksand_500Medium',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    alignItems: 'center',
    gap: 12,
  },
  resultsHeaderText: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'Quicksand_500Medium',
  },
  resultsHeaderBold: {
    fontFamily: 'Quicksand_700Bold',
  },
  eventDetailsContent: {
    paddingBottom: 24,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#f2f2f2',
  },
  filterChipText: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'Quicksand_500Medium',
  },
  filterChipChevron: {
    fontSize: 16,
    color: '#000',
    marginTop: -2,
  },
  filterChipChevronIcon: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipChevronGlyph: {
    transform: [{ rotate: '90deg' }],
    marginTop: -1,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listContent: {
    gap: 10,
    paddingBottom: 120,
  },
  loadingText: {
    textAlign: 'center',
    color: '#454745',
    paddingTop: 24,
    fontFamily: 'Quicksand_500Medium',
  },
  listStateContainer: {
    paddingTop: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  listStateTitle: {
    fontSize: 14,
    color: '#454745',
    textAlign: 'center',
    fontFamily: 'Quicksand_500Medium',
  },
  listStateButton: {
    marginTop: 10,
    backgroundColor: '#0c0c0f',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  listStateButtonText: {
    fontSize: 13,
    color: '#fff',
    fontFamily: 'Quicksand_700Bold',
  },
  emptyStateContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateTextWrap: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 26,
    lineHeight: 32,
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Quicksand_700Bold',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#454745',
    textAlign: 'center',
    paddingHorizontal: 12,
    fontFamily: 'Quicksand_500Medium',
  },
  card: {
    backgroundColor: '#f9f6f4',
    borderRadius: 24,
    padding: 8,
    flexDirection: 'row',
    gap: 10,
    height: 102,
    overflow: 'hidden',
  },
  cardIconContainer: {
    width: 86,
    height: 86,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardIcon: {
    fontSize: 34,
    color: '#0c0c0f',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  cardTitle: {
    fontSize: 16,
    color: '#0c0c0f',
    fontFamily: 'Quicksand_700Bold',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#000',
    fontFamily: 'Quicksand_500Medium',
  },
  skeletonBase: {
    backgroundColor: '#ececec',
    overflow: 'hidden',
  },
  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.55)',
    opacity: 0.9,
  },
  skeletonImageTile: {
    width: 86,
    height: 86,
    borderRadius: 16,
  },
  skeletonLinePrimary: {
    height: 14,
    width: '70%',
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonLineSecondary: {
    height: 12,
    width: '55%',
    borderRadius: 8,
  },
  skeletonBadge: {
    height: 20,
    width: 70,
    borderRadius: 12,
  },
  mapViewButton: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    backgroundColor: '#0c6ff9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  mapViewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Quicksand_700Bold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  modalSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
    gap: 6,
  },
  pickerSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    overflow: 'hidden',
  },
  pickerHeaderRow: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    alignItems: 'flex-end',
  },
  pickerDoneText: {
    fontSize: 16,
    color: '#0c0c0f',
    fontFamily: 'Quicksand_700Bold',
  },
  nativePicker: {
    width: '100%',
  },
  modalOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#0c0c0f',
    fontFamily: 'Quicksand_500Medium',
  },
  modalOptionTextSelected: {
    color: Colors.light.tint,
    fontFamily: 'Quicksand_700Bold',
  },
  iosHomeIndicatorSpacer: {
    height: 10,
  },
});
