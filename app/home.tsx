import CategoryCard from '@/components/CategoryCard';
import EventDetailsContent from '@/components/event-details-content';
import { BottomSheetFlatList, BottomSheetScrollView, NativeSheet, NativeSheetRef } from '@/components/NativeSheet';
import PlaceCard from '@/components/place-card';
import { SubmitPlaceSheetContent } from '@/components/SubmitPlaceSheetContent';
import { CATEGORIES, Category, Location } from '@/constants/mockData';
import * as Storage from '@/constants/storage';
import { Colors } from '@/constants/theme';
import { useFocusEffect } from '@react-navigation/native';
import * as ExpoLocation from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, Animated, Easing, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MapViewHandle } from '../components/map';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from '../components/map';

// SwiftUI components from @expo/ui - requires Host wrapper for iOS 26+
// TODO: SwiftUI glassEffect button - revisit later (systemImage not rendering with glassEffect)
// import { Host, Button as SwiftUIButton } from '@expo/ui/swift-ui';
// import { glassEffect } from '@expo/ui/swift-ui/modifiers';

const INITIAL_REGION = {
  latitude: 6.6018,
  longitude: 3.3515,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const SUPABASE_URL = 'https://spjlyhmgqtkcqhpvgxci.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwamx5aG1ncXRrY3FocHZneGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MzYzODIsImV4cCI6MjA4MTIxMjM4Mn0.CJz-iTGuoKCmhRQc0vausUPPLR2341GL8JCncMk9i1k';

const LOCATION_PERMISSION_SKIP_KEY = 'location_permission_skip_v2';

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

type Place = Location & {
  description: string;
};

type HomeListItem =
  | Place
  | {
      id: string;
      name: string;
      address: string;
      description: string;
      distance: '';
      type: 'Event';
      tags: string[];
      city?: string;
      photos?: string[];
      coordinate?: null;
      image: string;
    };

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

// Assets from Figma
const ASSETS = {
  avatar: require('../assets/images/app/avatar-head.png'),
  avatarHead: require('../assets/images/app/avatar-head.png'),
  mosqueImage: require('../assets/images/app/mosque.png'),
  schoolImage: require('../assets/images/app/school.png'),
  submitPlaceImage: require('../assets/images/app/event.png'),
};

function MingcuteIcon({
  name,
  size = 20,
  color = '#000',
}: {
  name: 'search_line' | 'question_line';
  size?: number;
  color?: string;
}) {
  const glyph = {
    search_line: 0xf30d,
    question_line: 0xf217,
  }[name];

  return (
    <Text
      style={{
        fontFamily: 'MingCute',
        fontSize: size,
        color,
        lineHeight: size,
        textAlign: 'center',
      }}
    >
      {String.fromCharCode(glyph)}
    </Text>
  );
}

function ShimmerBlock({ style }: { style?: any }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

function NearbySkeletonCard() {
  return (
    <View style={styles.locationCard}>
      <ShimmerBlock style={styles.skeletonImage} />
      <View style={styles.locationInfo}>
        <View>
          <ShimmerBlock style={styles.skeletonLinePrimary} />
          <ShimmerBlock style={styles.skeletonLineSecondary} />
        </View>
        <View style={styles.locationMeta}>
          <ShimmerBlock style={styles.skeletonBadge} />
          <ShimmerBlock style={styles.skeletonBadge} />
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ placeId?: string }>();
  const deepLinkPlaceId = typeof params.placeId === 'string' ? params.placeId : '';
  const handledDeepLinkPlaceIdRef = useRef<string>('');
  const mapRef = useRef<MapViewHandle>(null);
  const homeSheetRef = useRef<NativeSheetRef>(null);
  const placeDetailsSheetRef = useRef<NativeSheetRef>(null);
  const eventDetailsSheetRef = useRef<NativeSheetRef>(null);
  const submitPlaceSheetRef = useRef<NativeSheetRef>(null);
  const submitPlaceNavigatingRef = useRef(false);
  const homeSheetIndexRef = useRef(0);
  const searchInputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Dynamic colors for dark mode
  const dynamicColors = useMemo(() => ({
    background: isDark ? '#151718' : '#fff',
    text: isDark ? '#fff' : '#0c0c0f',
    textSecondary: isDark ? '#9BA1A6' : '#454745',
    sheetBg: isDark ? '#1c1c1e' : '#fff',
    searchBg: isDark ? '#2a2a2a' : '#fff',
    searchBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    buttonBg: isDark ? '#2a2a2a' : '#fff',
    iconColor: isDark ? '#fff' : '#000',
    placeholderColor: isDark ? '#9BA1A6' : '#6a6c6a',
  }), [isDark]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<HomeListItem[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Extract<HomeListItem, { type: 'Event' }> | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<ExpoLocation.PermissionStatus | null>(null);
  const [homeSheetReady, setHomeSheetReady] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Snap points for the bottom sheet
  const snapPoints = useMemo(() => {
    const collapsed = Math.max(280, windowHeight * 0.45);
    const topGap = insets.top + 120;
    const expanded = Math.max(collapsed, windowHeight - topGap);
    return [collapsed, expanded];
  }, [insets.top, windowHeight]);
  const detailsSnapPoints = useMemo(() => ['90%'], []);
  const eventDetailsSnapPoints = useMemo(() => ['90%'], []);
  const submitPlaceSnapPoints = useMemo(() => ['90%'], []);


  const handleSheetChanges = useCallback((index: number) => {
    if (index >= 0) {
      homeSheetIndexRef.current = index;
    }
  }, []);

  const handleMarkerPress = useCallback((location: Location) => {
    setSelectedLocationId(location.id);
    mapRef.current?.animateToRegion({
      latitude: location.coordinate.latitude,
      longitude: location.coordinate.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  }, []);

  const centerMapOnUser = useCallback(async () => {
    try {
      const pos = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      mapRef.current?.animateToRegion({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch {
      // ignore
    }
  }, []);

  const requestForegroundPermission = useCallback(async () => {
    try {
      const res = await ExpoLocation.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(res.status);

      if (res.status === ExpoLocation.PermissionStatus.GRANTED) {
        await centerMapOnUser();
        return;
      }
    } catch {
      setLocationPermissionStatus(ExpoLocation.PermissionStatus.DENIED);
    }
  }, [centerMapOnUser]);

  const openSearchResults = useCallback(
    (args: { category?: string; searchQuery?: string }) => {
      router.push({
        pathname: '/search-results',
        params: {
          ...(args.category ? { category: args.category } : null),
          ...(args.searchQuery ? { searchQuery: args.searchQuery } : null),
        },
      });
    },
    [router]
  );

  const restoreHomeSheet = useCallback(() => {
    const index = homeSheetIndexRef.current;
    homeSheetRef.current?.present();
    requestAnimationFrame(() => {
      homeSheetRef.current?.snapToIndex(index >= 0 ? index : 0);
    });
  }, []);

  const handleSubmitPlaceExplainerDismiss = useCallback(() => {
    const wasNavigating = submitPlaceNavigatingRef.current;
    submitPlaceNavigatingRef.current = false;
    if (wasNavigating) return;
    restoreHomeSheet();
  }, [restoreHomeSheet]);

  const openSubmitPlaceExplainer = useCallback(() => {
    console.log('[Home] openSubmitPlaceExplainer called');
    homeSheetRef.current?.dismiss();
    setTimeout(() => {
      console.log('[Home] Presenting submitPlaceSheet');
      submitPlaceSheetRef.current?.present();
    }, 150);
  }, []);

  const handleSubmitPlacePress = useCallback(() => {
    submitPlaceNavigatingRef.current = true;
    submitPlaceSheetRef.current?.dismiss();
    requestAnimationFrame(() => {
      router.push('/submit-place' as any);
    });
  }, [router]);

  const handleEventDetailsDismiss = useCallback(() => {
    setSelectedEvent(null);
    restoreHomeSheet();
  }, [restoreHomeSheet]);

  const openPlaceDetails = useCallback((place: Place) => {
    setSelectedPlace(place);
    homeSheetRef.current?.dismiss();
    requestAnimationFrame(() => {
      placeDetailsSheetRef.current?.present();
    });
  }, []);

  const handlePlaceDetailsDismiss = useCallback(() => {
    setSelectedPlace(null);
    restoreHomeSheet();
    // Recenter map to user location when closing place details
    if (userCoords && locationPermissionStatus === ExpoLocation.PermissionStatus.GRANTED) {
      mapRef.current?.animateToRegion({
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [locationPermissionStatus, restoreHomeSheet, userCoords]);

  const handleOpenInMaps = useCallback(async () => {
    if (!selectedPlace) return;

    const lat = selectedPlace.coordinate.latitude;
    const lng = selectedPlace.coordinate.longitude;
    const label = encodeURIComponent(selectedPlace.name);
    const appleUrl = `http://maps.apple.com/?ll=${lat},${lng}&q=${label}`;
    const googleWebUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const androidGeoUrl = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
    const googleAppUrl = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;

    if (Platform.OS === 'web') {
      try {
        await Linking.openURL(googleWebUrl);
      } catch {
        if (typeof window !== 'undefined') {
          window.open(googleWebUrl, '_blank', 'noopener,noreferrer');
        }
      }
      return;
    }

    const openApple = async () => {
      try {
        await Linking.openURL(appleUrl);
      } catch {
        await Linking.openURL(googleWebUrl);
      }
    };

    const openGoogle = async () => {
      const canOpenGoogleApp = await Linking.canOpenURL(googleAppUrl);
      try {
        await Linking.openURL(canOpenGoogleApp ? googleAppUrl : googleWebUrl);
      } catch {
        await Linking.openURL(googleWebUrl);
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Apple Maps', 'Google Maps', 'Cancel'],
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            void openApple();
          }
          if (buttonIndex === 1) {
            void openGoogle();
          }
        }
      );
      return;
    }

    try {
      await Linking.openURL(androidGeoUrl);
    } catch {
      await Linking.openURL(googleWebUrl);
    }
  }, [selectedPlace]);

  const handleLocationItemPress = (location: Place) => {
    handleMarkerPress(location);
    openPlaceDetails(location);
  };

  useEffect(() => {
    if (!deepLinkPlaceId) return;
    if (!homeSheetReady) return;
    if (placesLoading) return;
    if (handledDeepLinkPlaceIdRef.current === deepLinkPlaceId) return;

    const match = places.find((p) => p.id === deepLinkPlaceId);
    if (!match) return;

    handledDeepLinkPlaceIdRef.current = deepLinkPlaceId;
    requestAnimationFrame(() => {
      handleMarkerPress(match);
      openPlaceDetails(match);
    });
  }, [deepLinkPlaceId, handleMarkerPress, homeSheetReady, openPlaceDetails, places, placesLoading]);

  useEffect(() => {
    let cancelled = false;

    const fetchPlaces = async () => {
      try {
        setPlacesLoading(true);

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

        const rows = (await placesRes.json()) as PlaceRow[];
        const eventRows = (await eventsRes.json()) as EventRow[];

        const mapped: Place[] = rows
          .filter((row) => typeof row.latitude === 'number' && typeof row.longitude === 'number')
          .map((row) => {
            const categoryLower = (row.category ?? '').toLowerCase();
            const type: Location['type'] = categoryLower.includes('halal')
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
              distance: '',
              type,
              tags: row.tags ?? [],
              coordinate: {
                latitude: row.latitude as number,
                longitude: row.longitude as number,
              },
              image: row.photos?.[0] ?? '',
            };
          });

        const mappedEvents: HomeListItem[] = eventRows.map((row) => {
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
            distance: '',
            type: 'Event',
            tags,
            city: row.city ?? undefined,
            photos: photo ? [photo] : [],
            coordinate: null,
            image: photo,
          };
        });

        if (!cancelled) {
          setPlaces(mapped);
          setEvents(mappedEvents);
          setSelectedLocationId((current) =>
            current && !mapped.some((p) => p.id === current) ? null : current
          );
        }
      } catch {
        if (!cancelled) {
          setPlaces([]);
          setEvents([]);
        }
      } finally {
        if (!cancelled) {
          setPlacesLoading(false);
        }
      }
    };

    fetchPlaces();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const gate = async () => {
      try {
        const skipped = await Storage.getItemAsync(LOCATION_PERMISSION_SKIP_KEY);
        if (cancelled) return;

        const res = await ExpoLocation.getForegroundPermissionsAsync();
        if (cancelled) return;

        setLocationPermissionStatus(res.status);

        if (res.status === ExpoLocation.PermissionStatus.UNDETERMINED && skipped !== '1') {
          router.replace('/permission');
          return;
        }

        if (res.status === ExpoLocation.PermissionStatus.GRANTED) {
          void centerMapOnUser();
        }

        setHomeSheetReady(true);
      } catch {
        if (!cancelled) {
          setLocationPermissionStatus(ExpoLocation.PermissionStatus.DENIED);
          setHomeSheetReady(true);
        }
      }
    };

    void gate();

    return () => {
      cancelled = true;
    };
  }, [centerMapOnUser, router]);

  useFocusEffect(
    useCallback(() => {
      const shouldAutoPresentHomeSheet =
        homeSheetReady &&
        !selectedPlace &&
        !selectedEvent &&
        !(deepLinkPlaceId && handledDeepLinkPlaceIdRef.current !== deepLinkPlaceId);

      if (shouldAutoPresentHomeSheet) {
        requestAnimationFrame(() => {
          homeSheetRef.current?.present();
        });
      }

      return () => {
        homeSheetRef.current?.dismiss();
        placeDetailsSheetRef.current?.dismiss();
      };
    }, [deepLinkPlaceId, homeSheetReady, selectedEvent, selectedPlace])
  );

  const renderCategoryItem = useCallback(
    ({ item }: { item: Category }) => (
      <CategoryCard
        category={item}
        onPress={() => openSearchResults({ category: item.name })}
      />
    ),
    [openSearchResults]
  );

  const homeListHeader = useMemo(() => {
    return (
      <View>
        <View style={styles.greetingContainer}>
           <Text style={[styles.greetingText, { color: dynamicColors.text }]}>As salam alykum</Text>
           <Text style={[styles.subGreetingText, { color: dynamicColors.textSecondary }]}>What would you like you find today?</Text>
        </View>

        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
            nestedScrollEnabled
            scrollEventThrottle={16}
            directionalLockEnabled
            disableIntervalMomentum
          >
            {CATEGORIES.map((item) => (
              <View key={item.id}>
                {renderCategoryItem({ item })}
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.locationsHeaderContainer}>
          <Text style={[styles.locationsHeader, { color: dynamicColors.text }]}>Based on your location</Text>
        </View>
      </View>
    );
  }, [renderCategoryItem, dynamicColors]);

  const nearbyPlaces = useMemo(() => {
    if (locationPermissionStatus !== ExpoLocation.PermissionStatus.GRANTED) return places;
    if (!userCoords) return places;

    const scored = places
      .map((p) => ({
        place: p,
        distanceKm: haversineKm(userCoords, p.coordinate),
      }))
      .filter((x) => Number.isFinite(x.distanceKm))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return scored
      .filter((x) => x.distanceKm <= 2)
      .map((x) => x.place);
  }, [locationPermissionStatus, places, userCoords]);

  const homeListItems = useMemo(() => {
    if (placesLoading) return [] as HomeListItem[];
    if (locationPermissionStatus === ExpoLocation.PermissionStatus.GRANTED && userCoords) {
      return [...(nearbyPlaces as HomeListItem[]), ...events];
    }
    return [...(places as HomeListItem[]), ...events];
  }, [events, locationPermissionStatus, nearbyPlaces, places, placesLoading, userCoords]);

  const renderLocationItem = ({ item }: { item: HomeListItem }) => {
    const distanceLabel = (() => {
      if (item.type === 'Event') return undefined;
      if (locationPermissionStatus !== ExpoLocation.PermissionStatus.GRANTED) return undefined;
      if (!userCoords) return '—';

      const coord = (item as Place).coordinate;
      const km = haversineKm(userCoords, coord);
      if (!Number.isFinite(km)) return '—';
      if (km <= 2) return `${km.toFixed(1)}km away`;
      if (km <= 5) return 'Near me';
      return '—';
    })();

    return (
      <PlaceCard
        title={item.name}
        subtitle={item.type === 'Event' ? item.description : item.address}
        type={item.type}
        distanceLabel={distanceLabel}
        tags={item.tags}
        imageUri={item.image}
        onPress={() => {
          if (item.type === 'Event') {
            setSelectedEvent(item as Extract<HomeListItem, { type: 'Event' }>);
            homeSheetRef.current?.dismiss();
            requestAnimationFrame(() => {
              eventDetailsSheetRef.current?.present();
            });
            return;
          }
          handleLocationItemPress(item as Place);
        }}
      />
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={INITIAL_REGION}
        showsUserLocation={locationPermissionStatus === ExpoLocation.PermissionStatus.GRANTED}
        showsMyLocationButton={false}
      >
        {places.map((location) => (
          <Marker
            key={location.id}
            coordinate={location.coordinate}
            title={location.name}
            description={location.type}
            onPress={() => handleMarkerPress(location)}
            pinColor={selectedLocationId === location.id ? Colors.light.tint : 'red'}
          />
        ))}
      </MapView>

      {/* Floating Header */}
      <View style={[styles.headerContainer, { top: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={[styles.aiButtonContainer, { backgroundColor: dynamicColors.buttonBg, borderColor: dynamicColors.searchBorder }]}
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
          <TouchableOpacity
            style={[styles.searchContainer, { backgroundColor: dynamicColors.searchBg, borderColor: dynamicColors.searchBorder }]}
            activeOpacity={0.85}
            onPress={() => {
              router.push({ pathname: '/search-results', params: { focus: '1' } });
            }}
          >
            <MingcuteIcon name="search_line" size={24} color={dynamicColors.iconColor} />
            <TextInput
              ref={searchInputRef}
              value=""
              editable={false}
              selectTextOnFocus={false}
              placeholder="Search mosques, halal food, schools…"
              placeholderTextColor={dynamicColors.placeholderColor}
              style={[styles.searchInput, { color: dynamicColors.text }]}
              pointerEvents="none"
            />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingsButton, { backgroundColor: dynamicColors.buttonBg }]} onPress={openSubmitPlaceExplainer} activeOpacity={0.85}>
            <MingcuteIcon name="question_line" size={24} color={dynamicColors.iconColor} />
          </TouchableOpacity>
        </View>

        {locationPermissionStatus === ExpoLocation.PermissionStatus.DENIED && (
          <View style={styles.locationDeniedCtaRow}>
            <Text style={styles.locationDeniedCtaText}>Enable location to center the map</Text>
            <TouchableOpacity
              style={styles.locationDeniedCtaButton}
              onPress={() => {
                if (Platform.OS === 'ios' || Platform.OS === 'android') {
                  void Linking.openSettings();
                  return;
                }
                void requestForegroundPermission();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.locationDeniedCtaButtonText}>Enable</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* DEV ONLY: Reset onboarding */}
        {__DEV__ && (
          <TouchableOpacity
            style={styles.devResetButton}
            onPress={() => {
              void Storage.deleteItemAsync('onboarding_seen_v2');
              void Storage.deleteItemAsync('location_permission_skip_v2');
              alert('Onboarding reset! Reload the app.');
            }}
          >
            <Text style={styles.devResetButtonText}>Reset Onboarding</Text>
          </TouchableOpacity>
        )}
      </View>

      <NativeSheet
        ref={homeSheetRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: dynamicColors.sheetBg }]}
        enablePanDownToClose={false}
        enableOverDrag={false}
        topInset={insets.top}
      >
        <BottomSheetFlatList<HomeListItem>
          data={homeListItems}
          keyExtractor={(item: HomeListItem) => item.id}
          renderItem={({ item }: { item: HomeListItem }) => (
            <View style={{ marginBottom: 12, paddingHorizontal: 20 }}>{renderLocationItem({ item })}</View>
          )}
          ListHeaderComponent={homeListHeader}
          ListFooterComponent={<View style={{ height: 40 }} />}
          contentContainerStyle={styles.homeSheetListContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          ListEmptyComponent={
            placesLoading ? (
              <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
                <NearbySkeletonCard />
                <View style={{ height: 12 }} />
                <NearbySkeletonCard />
                <View style={{ height: 12 }} />
                <NearbySkeletonCard />
              </View>
            ) : locationPermissionStatus === ExpoLocation.PermissionStatus.DENIED ? (
              <View style={styles.listStateContainer}>
                <Text style={styles.listStateTitle}>Turn on location to see nearby places.</Text>
              </View>
            ) : (
              <View style={styles.listStateContainer}>
                <Text style={styles.listStateTitle}>No places nearby yet.</Text>
              </View>
            )
          }
        />
      </NativeSheet>

      <NativeSheet
        ref={eventDetailsSheetRef}
        index={0}
        snapPoints={eventDetailsSnapPoints}
        backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: dynamicColors.sheetBg }]}
        onDismiss={handleEventDetailsDismiss}
        enableBackdropDismiss
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
      </NativeSheet>

      <NativeSheet
        ref={submitPlaceSheetRef}
        index={0}
        snapPoints={submitPlaceSnapPoints}
        backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: dynamicColors.sheetBg }]}
        onDismiss={handleSubmitPlaceExplainerDismiss}
        enableOverDrag={false}
        enablePanDownToClose
        enableBackdropDismiss
        expandedOnly
      >
        {/* On iOS, SubmitPlaceSheetContent renders SwiftUI content */}
        <SubmitPlaceSheetContent onSubmitPress={handleSubmitPlacePress} />
      </NativeSheet>

      <NativeSheet
        ref={placeDetailsSheetRef}
        index={0}
        snapPoints={detailsSnapPoints}
        backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: dynamicColors.sheetBg }]}
        onDismiss={handlePlaceDetailsDismiss}
        enableBackdropDismiss
      >
        <BottomSheetScrollView contentContainerStyle={styles.placeDetailsContent}>
          <TouchableOpacity style={styles.openInMapsButton} onPress={handleOpenInMaps}>
            <Text style={styles.openInMapsButtonText}>Open in Maps</Text>
          </TouchableOpacity>

          <Text style={[styles.placeDetailsName, { color: dynamicColors.text }]}>{selectedPlace?.name ?? ''}</Text>
          <Text style={[styles.placeDetailsAddress, { color: dynamicColors.textSecondary }]}>{selectedPlace?.address ?? ''}</Text>

          {!!selectedPlace?.tags?.length && (
            <View style={styles.placeDetailsTagsRow}>
              {selectedPlace.tags.map((tag, index) => (
                <View key={`${tag}-${index}`} style={styles.placeDetailsTag}>
                  <Text style={styles.placeDetailsTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {!!selectedPlace?.description && (
            <Text style={styles.placeDetailsDescription}>{selectedPlace.description}</Text>
          )}
        </BottomSheetScrollView>
      </NativeSheet>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  permissionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0850FD',
    zIndex: 100,
  },
  permissionContent: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permissionTextContainer: {
    marginTop: 140,
    alignItems: 'center',
    gap: 8,
  },
  permissionTitle: {
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Quicksand_700Bold',
  },
  permissionSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.95,
    fontFamily: 'Quicksand_500Medium',
  },
  permissionIllustrationContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionIllustration: {
    width: 375,
    height: 316,
  },
  permissionPrivacyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    maxWidth: 286,
    fontFamily: 'Quicksand_500Medium',
  },
  permissionButtonsContainer: {
    width: '100%',
    gap: 10,
  },
  permissionNativeButtonRow: {
    backgroundColor: '#F9F7F2',
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  permissionPrimaryButton: {
    backgroundColor: '#F9F7F2',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionPrimaryButtonText: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'Quicksand_500Medium',
  },
  permissionSecondaryButton: {
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionSecondaryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Quicksand_500Medium',
  },
  headerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  locationDeniedCtaRow: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  locationDeniedCtaText: {
    flex: 1,
    fontSize: 13,
    color: '#0c0c0f',
    fontFamily: 'Quicksand_500Medium',
  },
  locationDeniedCtaButton: {
    backgroundColor: '#0c0c0f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  locationDeniedCtaButtonText: {
    fontSize: 13,
    color: '#fff',
    fontFamily: 'Quicksand_700Bold',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiButtonContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 30,
    backgroundColor: '#f2e6d6',
    borderWidth: 1.2,
    borderColor: '#fff',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 38,
    height: 44,
    position: 'relative',
  },
  avatarCollar: {
    position: 'absolute',
    width: 20,
    height: 8,
    left: 8,
    top: 36,
  },
  avatarHead: {
    position: 'absolute',
    width: 38,
    height: 37,
    left: 0,
    top: 0,
  },
  searchContainer: {
    flex: 1,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    paddingVertical: 0,
    fontFamily: 'Quicksand_500Medium',
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    width: 24,
    height: 24,
  },
  bottomSheetBackground: {
    backgroundColor: '#fff',
    borderRadius: 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomSheetIndicator: {
    backgroundColor: '#E5E5E5',
    width: 36,
  },
  homeSheetScrollContent: {
    paddingBottom: 20,
  },
  homeSheetListContent: {
    paddingBottom: 20,
  },
  greetingContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 18,
    color: '#0c0c0f',
    marginBottom: 4,
    fontFamily: 'Quicksand_700Bold',
  },
  subGreetingText: {
    fontSize: 14,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryItem: {
    width: 140,
    height: 150,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 16,
    color: '#0c0c0f',
    fontFamily: 'Quicksand_700Bold',
  },
  locationsHeaderContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  locationsHeader: {
    fontSize: 18,
    color: '#0c0c0f',
    fontFamily: 'Quicksand_700Bold',
  },
  locationsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyStateText: {
    paddingVertical: 12,
    color: '#454745',
    fontSize: 14,
    fontFamily: 'Quicksand_500Medium',
  },
  listStateContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
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
  placeDetailsContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  submitPlaceSheetContent: {
    paddingBottom: 24,
  },
  submitPlaceHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 4,
  },
  submitPlaceTitle: {
    fontSize: 26,
    lineHeight: 32,
    color: '#000',
    fontFamily: 'Quicksand_700Bold',
    textAlign: 'center',
  },
  submitPlaceSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
    textAlign: 'center',
    maxWidth: 295,
  },
  submitPlaceImageWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  submitPlaceImage: {
    width: '100%',
    height: 183,
    borderRadius: 14,
    backgroundColor: '#f2f2f2',
  },
  submitPlaceSectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  submitPlaceSectionTitle: {
    fontSize: 22,
    lineHeight: 28,
    color: '#000',
    fontFamily: 'Quicksand_700Bold',
    textAlign: 'center',
  },
  submitPlaceSteps: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 24,
  },
  submitPlaceStepRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  submitPlaceStepBadge: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitPlaceStepBadgeText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Quicksand_700Bold',
  },
  submitPlaceStepTextWrap: {
    flex: 1,
    gap: 4,
  },
  submitPlaceStepTitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000',
    fontFamily: 'Quicksand_700Bold',
  },
  submitPlaceStepSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
  },
  submitPlaceButtonContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  submitPlaceButton: {
    height: 48,
    borderRadius: 999,
    backgroundColor: '#0C6FF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitPlaceButtonText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Quicksand_500Medium',
  },
  openInMapsButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#0c0c0f',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  openInMapsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Quicksand_700Bold',
  },
  placeDetailsName: {
    fontSize: 22,
    color: '#0c0c0f',
    marginBottom: 6,
    fontFamily: 'Quicksand_700Bold',
  },
  placeDetailsAddress: {
    fontSize: 14,
    color: '#454745',
    marginBottom: 14,
    fontFamily: 'Quicksand_500Medium',
  },
  placeDetailsTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  placeDetailsTag: {
    backgroundColor: '#f2f2f2',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  placeDetailsTagText: {
    color: '#0c0c0f',
    fontSize: 13,
    fontFamily: 'Quicksand_500Medium',
  },
  placeDetailsDescription: {
    fontSize: 14,
    color: '#454745',
    lineHeight: 22,
    fontFamily: 'Quicksand_500Medium',
  },
  eventDetailsContent: {
    paddingBottom: 24,
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f6f4', 
    borderRadius: 24,
    padding: 8,
    height: 102,
    gap: 12,
  },
  locationImage: {
    width: 86,
    height: 86,
    borderRadius: 18,
    backgroundColor: '#ccc',
  },
  locationInfo: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  locationName: {
    fontSize: 16,
    color: '#0c0c0f',
    marginBottom: 4,
    fontFamily: 'Quicksand_700Bold',
  },
  locationAddress: {
    fontSize: 13, // Slightly smaller to fit
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
  },
  locationMeta: {
    flexDirection: 'row',
    gap: 6,
  },
  locationBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationBadgeText: {
    fontSize: 12,
    color: '#0c0c0f',
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
  skeletonImage: {
    width: 86,
    height: 86,
    borderRadius: 18,
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
  devResetButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  devResetButtonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Quicksand_500Medium',
  },
});
