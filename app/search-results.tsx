import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as ExpoLocation from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Animated, Easing, FlatList, Linking, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { G, Path } from 'react-native-svg';
import EventDetailsContent from '../components/event-details-content';
import PlaceCard from '../components/place-card';
import { Colors } from '../constants/theme';
import { categoryToPlaceType, extractSearchIntent } from '../utils/nlp-search';

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

// Dynamic tags based on selected type
const TAGS_BY_TYPE: Record<PlaceType | 'All', string[]> = {
  All: [],
  Mosque: ['Prayer Room', 'Masjid', 'Jumah', 'Central Mosque'],
  School: ['Tahfeez', 'Quranic', 'Western', 'Madrasah', 'Islamic Studies'],
  Event: ['Lecture/Talk', 'Workshop/Class', 'Social Gathering', 'Fundraiser/Charity', 'Community Iftar', 'Eid Celebration', 'Jummah Gathering', 'Halaqah', 'Conference'],
  'Halal Food': ['Restaurant', 'Cafe', 'Grocery', 'Catering', 'Food Truck'],
};

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
        duration: 900,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
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

// SVG Icon Components from MingCute
function CloseCircleFillIcon({ size = 20, color = '#000' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none">
        <Path d="M24 0v24H0V0zM12.593 23.258l-.011.002-.071.035-.02.004-.014-.004-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113-.013.002-.185.093-.01.01-.003.011.018.43.005.012.008.007.201.093c.012.004.023 0 .029-.008l.004-.014-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014-.034.614c0 .012.007.02.017.024l.015-.002.201-.093.01-.008.004-.011.017-.43-.003-.012-.01-.01z"/>
        <Path fill={color} d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2M9.879 8.464a1 1 0 0 0-1.498 1.32l.084.095 2.12 2.12-2.12 2.122a1 1 0 0 0 1.32 1.498l.094-.083L12 13.414l2.121 2.122a1 1 0 0 0 1.498-1.32l-.083-.095L13.414 12l2.122-2.121a1 1 0 0 0-1.32-1.498l-.095.083L12 10.586z"/>
      </G>
    </Svg>
  );
}

function CheckCircleFillIcon({ size = 20, color = '#000' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none">
        <Path d="M24 0v24H0V0zM12.593 23.258l-.011.002-.071.035-.02.004-.014-.004-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113-.013.002-.185.093-.01.01-.003.011.018.43.005.012.008.007.201.093c.012.004.023 0 .029-.008l.004-.014-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014-.034.614c0 .012.007.02.017.024l.015-.002.201-.093.01-.008.004-.011.017-.43-.003-.012-.01-.01z"/>
        <Path fill={color} d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2m3.535 6.381-4.95 4.95-2.12-2.121a1 1 0 0 0-1.415 1.414l2.758 2.758a1.1 1.1 0 0 0 1.556 0l5.586-5.586a1 1 0 0 0-1.415-1.415"/>
      </G>
    </Svg>
  );
}

function MingcuteIcon({
  name,
  size = 20,
  color = '#000',
  style,
}: {
  name: 'left_line' | 'search_line' | 'right_small_line';
  size?: number;
  color?: string;
  style?: any;
}) {
  const glyph = {
    left_line: 0xeff7,
    search_line: 0xf30d,
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
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const dynamicColors = useMemo(() => ({
    background: isDark ? '#151718' : '#fff',
    text: isDark ? '#fff' : '#000',
    textSecondary: isDark ? '#9BA1A6' : '#454745',
    sheetBg: isDark ? '#1c1c1e' : '#fff',
    cardBg: isDark ? '#2a2a2a' : '#fff',
    border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    inputBg: isDark ? '#2a2a2a' : '#fff',
    placeholder: isDark ? '#9BA1A6' : '#6a6c6a',
    filterChipBg: isDark ? '#2a2a2a' : '#fff',
    filterChipActiveBg: isDark ? '#3a3a3a' : '#0c0c0f',
    dragIndicator: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)',
  }), [isDark]);

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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsSheetOpen, setTagsSheetOpen] = useState(false);
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

  // Get available tags based on selected type
  const availableTags = useMemo(() => {
    return TAGS_BY_TYPE[typeFilter] || [];
  }, [typeFilter]);

  // Clear selected tags when type changes
  useEffect(() => {
    setSelectedTags([]);
  }, [typeFilter]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }, []);

  const clearAllTags = useCallback(() => {
    setSelectedTags([]);
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
    return !initialCategory && !searchText.trim() && typeFilter === 'All';
  }, [initialCategory, searchText, typeFilter]);

  const filteredPlaces = useMemo(() => {
    const q = searchText.trim();
    const categoryType = initialCategory ? mapCategoryToType(initialCategory) : null;

    let list: ListItem[] = [...places, ...events];

    // Apply category from URL params first
    if (categoryType) {
      list = list.filter((p) => p.type === categoryType);
    }

    // Extract NLP intent from search query
    const intent = q ? extractSearchIntent(q) : null;
    
    if (intent && intent.isNaturalLanguage) {
      // Natural language query - use structured filtering
      
      // Filter by extracted category (if not already filtered by URL param)
      if (!categoryType && intent.category) {
        const nlpType = categoryToPlaceType(intent.category);
        if (nlpType) {
          list = list.filter((p) => p.type === nlpType);
        }
      }
      
      // Filter by extracted location (partial match on address)
      if (intent.location) {
        const locationLower = intent.location.toLowerCase();
        list = list.filter((p) => {
          const addressLower = p.address.toLowerCase();
          return addressLower.includes(locationLower);
        });
      }
      
      // Filter by extracted tags
      if (intent.tags.length > 0) {
        list = list.filter((p) => {
          const itemTagsLower = p.tags.map(t => t.toLowerCase());
          const nameAndDescLower = p.name.toLowerCase();
          return intent.tags.some((intentTag: string) => 
            itemTagsLower.some(itemTag => itemTag.includes(intentTag.toLowerCase())) ||
            nameAndDescLower.includes(intentTag.toLowerCase())
          );
        });
      }
      
      // Handle "near me" from NLP - enable nearMe filtering
      const shouldUseNearMe = intent.useUserLocation || nearMe;
      
      if (userCoords && shouldUseNearMe) {
        const withCoords = list.filter((p): p is Place => {
          return (
            (p as Place).coordinate != null &&
            typeof (p as Place).coordinate?.latitude === 'number' &&
            typeof (p as Place).coordinate?.longitude === 'number'
          );
        });
        
        const withDistance = withCoords
          .map((p) => ({ place: p, distanceKm: haversineKm(userCoords, p.coordinate) }))
          .filter((x) => Number.isFinite(x.distanceKm));
        
        return withDistance
          .filter((x) => x.distanceKm <= 10)
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .map((x) => x.place);
      }
    } else if (q) {
      // Simple keyword search - existing behavior
      const qLower = q.toLowerCase();
      list = list.filter((p) => {
        const haystack = `${p.name} ${p.address} ${p.type} ${p.tags.join(' ')}`.toLowerCase();
        return haystack.includes(qLower);
      });
    }

    // Apply manual filters (type pill, amenity pill, tags pill)
    if (typeFilter !== 'All') {
      list = list.filter((p) => p.type === typeFilter);
    }

    if (amenityFilter !== 'All') {
      list = list.filter((p) => p.tags.some((t) => t.toLowerCase() === String(amenityFilter).toLowerCase()));
    }

    if (selectedTags.length > 0) {
      list = list.filter((p) => 
        selectedTags.some((tag) => 
          p.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
        )
      );
    }

    // Distance sorting and near me filtering (for non-NLP queries or when manually enabled)
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
  }, [amenityFilter, events, initialCategory, nearMe, places, searchText, selectedTags, typeFilter, userCoords]);

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
    <View style={[styles.container, { backgroundColor: dynamicColors.background, paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={[styles.headerIconButton, { backgroundColor: dynamicColors.inputBg }]} onPress={() => router.back()} activeOpacity={0.8}>
          <MingcuteIcon name="left_line" size={20} color={dynamicColors.text} />
        </TouchableOpacity>

        <View style={[styles.searchContainer, { backgroundColor: dynamicColors.inputBg, borderColor: dynamicColors.border }]}>
          <MingcuteIcon name="search_line" size={24} color={dynamicColors.text} />
          <TextInput
            ref={searchInputRef}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search mosques, halal food, schools…"
            placeholderTextColor={dynamicColors.placeholder}
            style={[styles.searchInput, { color: dynamicColors.text }]}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity 
              style={styles.searchClearButton} 
              onPress={() => setSearchText('')}
              activeOpacity={0.7}
            >
              <CloseCircleFillIcon size={20} color={dynamicColors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* AI Button */}
          <TouchableOpacity 
            style={[styles.headerIconButton, { backgroundColor: dynamicColors.cardBg, borderColor: dynamicColors.border }]} 
            onPress={() => Alert.alert('Coming Soon', 'AI features are coming soon!')}
            activeOpacity={0.8}
          >
            <LottieView
              source={{ uri: 'https://lottie.host/f70b4dce-b6a5-4e8a-afdc-47acf9c48440/SvXJ2qvt0V.lottie' }}
              autoPlay
              loop
              style={{ width: 56, height: 56 }}
            />
          </TouchableOpacity>
      </View>

      {!isEmptySearchState && (
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsHeaderText, { color: dynamicColors.textSecondary }]}>
            <Text>Showing you results for </Text>
            <Text style={[styles.resultsHeaderBold, { color: dynamicColors.text }]}>{shownQueryLabel}</Text>
          </Text>

          <View style={styles.filtersRow}>
            {/* Near Me pill with X button when active */}
            <TouchableOpacity
              style={[styles.filterChip, { backgroundColor: nearMe ? dynamicColors.filterChipActiveBg : dynamicColors.filterChipBg }]}
              onPress={() => setNearMe((v) => !v)}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterChipText, { color: nearMe ? '#fff' : dynamicColors.text }]}>Near me</Text>
              {nearMe && (
                <View style={styles.filterChipCloseIcon}>
                  <CloseCircleFillIcon size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            {/* Type pill showing selected category */}
            <TouchableOpacity 
              style={[styles.filterChip, { backgroundColor: typeFilter !== 'All' ? dynamicColors.filterChipActiveBg : dynamicColors.filterChipBg }]} 
              onPress={openTypePicker} 
              activeOpacity={0.85}
            >
              <Text style={[styles.filterChipText, { color: typeFilter !== 'All' ? '#fff' : dynamicColors.text }]}>
                {typeFilter === 'All' ? 'Type' : typeFilter}
              </Text>
              <View style={styles.filterChipChevronIcon}>
                <MingcuteIcon name="right_small_line" size={16} color={typeFilter !== 'All' ? '#fff' : dynamicColors.text} style={styles.filterChipChevronGlyph} />
              </View>
            </TouchableOpacity>

            {/* Tags pill - only show when type is selected and has tags */}
            {availableTags.length > 0 && (
              <TouchableOpacity 
                style={[styles.filterChip, { backgroundColor: selectedTags.length > 0 ? dynamicColors.filterChipActiveBg : dynamicColors.filterChipBg }]} 
                onPress={() => setTagsSheetOpen(true)} 
                activeOpacity={0.85}
              >
                <Text style={[styles.filterChipText, { color: selectedTags.length > 0 ? '#fff' : dynamicColors.text }]}>
                  {selectedTags.length > 0 ? `Tags (${selectedTags.length})` : 'Tags'}
                </Text>
                <View style={styles.filterChipChevronIcon}>
                  <MingcuteIcon name="right_small_line" size={16} color={selectedTags.length > 0 ? '#fff' : dynamicColors.text} style={styles.filterChipChevronGlyph} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <View style={styles.listContainer}>
        {isEmptySearchState ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateTextWrap}>
              <Text style={[styles.emptyStateTitle, { color: dynamicColors.text }]}>No result yet</Text>
              <Text style={[styles.emptyStateSubtitle, { color: dynamicColors.textSecondary }]}>
                Start typing to find mosque, schools, madarasah and events around you
              </Text>
            </View>
            <View style={styles.quickSearchContainer}>
              <Text style={[styles.quickSearchLabel, { color: dynamicColors.textSecondary }]}>Quick search</Text>
              <View style={styles.quickSearchButtons}>
                <TouchableOpacity 
                  style={[styles.quickSearchButton, { backgroundColor: dynamicColors.filterChipBg }]} 
                  onPress={() => setTypeFilter('Mosque')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.quickSearchButtonText, { color: dynamicColors.text }]}>Mosques</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.quickSearchButton, { backgroundColor: dynamicColors.filterChipBg }]} 
                  onPress={() => setTypeFilter('School')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.quickSearchButtonText, { color: dynamicColors.text }]}>Schools</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.quickSearchButton, { backgroundColor: dynamicColors.filterChipBg }]} 
                  onPress={() => setTypeFilter('Event')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.quickSearchButtonText, { color: dynamicColors.text }]}>Events</Text>
                </TouchableOpacity>
              </View>
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
                  <Text style={[styles.listStateTitle, { color: dynamicColors.textSecondary }]}>Turn on location to use Near me.</Text>
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
                  <Text style={[styles.listStateTitle, { color: dynamicColors.textSecondary }]}>Nothing nearby right now.</Text>
                  {(selectedTags.length > 0 || typeFilter !== 'All') && (
                    <Text style={[styles.listStateSubtitle, { color: dynamicColors.textSecondary }]}>
                      Try broadening your search with fewer filters.
                    </Text>
                  )}
                  {selectedTags.length > 0 && (
                    <TouchableOpacity activeOpacity={0.85} style={styles.listStateButton} onPress={clearAllTags}>
                      <Text style={styles.listStateButtonText}>Clear Tags</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.listStateContainer}>
                  <Text style={[styles.listStateTitle, { color: dynamicColors.textSecondary }]}>No results found.</Text>
                  {(selectedTags.length > 0 || typeFilter !== 'All') && (
                    <Text style={[styles.listStateSubtitle, { color: dynamicColors.textSecondary }]}>
                      Try broadening your search with fewer filters.
                    </Text>
                  )}
                  {selectedTags.length > 0 && (
                    <TouchableOpacity activeOpacity={0.85} style={styles.listStateButton} onPress={clearAllTags}>
                      <Text style={styles.listStateButtonText}>Clear Tags</Text>
                    </TouchableOpacity>
                  )}
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
              isDark={isDark}
            />
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>

      <Modal visible={typePickerOpen} transparent animationType="slide" onRequestClose={() => setTypePickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setTypePickerOpen(false)}>
          <View />
        </Pressable>

        <View style={[styles.typeSheet, { backgroundColor: isDark ? '#1c1c1e' : '#fff' }]}>
          <View style={styles.tagsSheetHeader}>
            <Text style={[styles.tagsSheetTitle, { color: dynamicColors.text }]}>Select Type</Text>
            <TouchableOpacity onPress={() => setTypePickerOpen(false)} activeOpacity={0.8}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.typeOptionsList}>
            {TYPE_OPTIONS.map((opt) => {
              const isSelected = typeFilter === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.typeOptionRow,
                    { borderBottomColor: dynamicColors.border }
                  ]}
                  onPress={() => {
                    setTypeFilter(opt.value);
                    setTypePickerOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.typeOptionRowText, { color: dynamicColors.text }]}>
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <CheckCircleFillIcon size={20} color={Colors.light.tint} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Tags Selection Modal */}
      <Modal visible={tagsSheetOpen} transparent animationType="slide" onRequestClose={() => setTagsSheetOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setTagsSheetOpen(false)}>
          <View />
        </Pressable>

        <View style={[styles.tagsSheet, { backgroundColor: isDark ? '#1c1c1e' : '#fff' }]}>
          <View style={styles.tagsSheetHeader}>
            <Text style={[styles.tagsSheetTitle, { color: dynamicColors.text }]}>
              {typeFilter === 'All' ? 'Tags' : `${typeFilter} Tags`}
            </Text>
            <TouchableOpacity onPress={() => setTagsSheetOpen(false)} activeOpacity={0.8}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </TouchableOpacity>
          </View>

          {selectedTags.length > 0 && (
            <TouchableOpacity style={styles.clearTagsButton} onPress={clearAllTags} activeOpacity={0.8}>
              <Text style={styles.clearTagsButtonText}>Clear all ({selectedTags.length})</Text>
            </TouchableOpacity>
          )}

          <View style={styles.tagsGrid}>
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagChip,
                    { 
                      backgroundColor: isSelected ? dynamicColors.filterChipActiveBg : dynamicColors.filterChipBg,
                      borderColor: isSelected ? 'transparent' : dynamicColors.border,
                    }
                  ]}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tagChipText, { color: isSelected ? '#fff' : dynamicColors.text }]}>
                    {tag}
                  </Text>
                  {isSelected && (
                    <CheckCircleFillIcon size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {Platform.OS === 'ios' && <View style={styles.iosHomeIndicatorSpacer} />}
    </View>
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
  searchClearButton: {
    padding: 4,
    marginLeft: 4,
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
  filterChipCloseIcon: {
    marginLeft: 2,
  },
  listStateSubtitle: {
    fontSize: 13,
    color: '#454745',
    textAlign: 'center',
    fontFamily: 'Quicksand_500Medium',
    marginTop: 4,
  },
  tagsSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  tagsSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tagsSheetTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
    color: '#000',
  },
  clearTagsButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  clearTagsButtonText: {
    fontSize: 14,
    color: '#0c6ff9',
    fontFamily: 'Quicksand_500Medium',
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagChipText: {
    fontSize: 14,
    fontFamily: 'Quicksand_500Medium',
  },
  typeSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  typeOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeOptionChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeOptionText: {
    fontSize: 15,
    fontFamily: 'Quicksand_600SemiBold',
  },
  typeOptionsList: {
    marginTop: 8,
  },
  typeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  typeOptionRowText: {
    fontSize: 16,
    fontFamily: 'Quicksand_500Medium',
  },
  quickSearchContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  quickSearchLabel: {
    fontSize: 13,
    fontFamily: 'Quicksand_500Medium',
    marginBottom: 12,
  },
  quickSearchButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  quickSearchButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  quickSearchButtonText: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
  },
});
