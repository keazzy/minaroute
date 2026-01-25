// iOS-specific home screen with native SwiftUI bottom sheet
import EventDetailsContent from '@/components/event-details-content';
import { HomeSheetContent } from '@/components/HomeSheetContent';
import { BottomSheetScrollView, NativeSheet, NativeSheetRef } from '@/components/NativeSheet';
import { SubmitPlaceSheetContent } from '@/components/SubmitPlaceSheetContent';
import { Location } from '@/constants/mockData';
import * as Storage from '@/constants/storage';
import { Colors } from '@/constants/theme';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as ExpoLocation from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionSheetIOS, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MapViewHandle } from '../components/map';
import MapView, { Marker, PROVIDER_DEFAULT } from '../components/map';

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
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<HomeListItem[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Extract<HomeListItem, { type: 'Event' }> | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<ExpoLocation.PermissionStatus | null>(null);
  const [homeSheetReady, setHomeSheetReady] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

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
    console.log('handleSheetChanges', index);
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
    homeSheetRef.current?.dismiss();
    submitPlaceSheetRef.current?.present();
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
    const googleAppUrl = `comgooglemaps://?q=${label}&center=${lat},${lng}`;

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

  // Handler for category press from SwiftUI HomeSheetContent
  const handleCategoryPress = useCallback((categoryName: string) => {
    openSearchResults({ category: categoryName });
  }, [openSearchResults]);

  // Handler for place press from SwiftUI HomeSheetContent
  const handlePlacePress = useCallback((place: { id: string }) => {
    const fullPlace = nearbyPlaces.find(p => p.id === place.id);
    if (fullPlace) {
      handleLocationItemPress(fullPlace);
    }
  }, [nearbyPlaces]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
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
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              <Image source={ASSETS.avatar} style={styles.avatarCollar} />
              <Image source={ASSETS.avatarHead} style={styles.avatarHead} />
            </View>
          </View>
          <TouchableOpacity
            style={styles.searchContainer}
            activeOpacity={0.85}
            onPress={() => {
              router.push({ pathname: '/search-results', params: { focus: '1' } });
            }}
          >
            <MingcuteIcon name="search_line" size={24} color="#000" />
            <TextInput
              ref={searchInputRef}
              value=""
              editable={false}
              selectTextOnFocus={false}
              placeholder="Search mosques, halal food, schools…"
              placeholderTextColor="#6a6c6a"
              style={styles.searchInput}
              pointerEvents="none"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton} onPress={openSubmitPlaceExplainer} activeOpacity={0.85}>
            <MingcuteIcon name="question_line" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {locationPermissionStatus === ExpoLocation.PermissionStatus.DENIED && (
          <View style={styles.locationDeniedCtaRow}>
            <Text style={styles.locationDeniedCtaText}>Enable location to center the map</Text>
            <TouchableOpacity
              style={styles.locationDeniedCtaButton}
              onPress={() => {
                void Linking.openSettings();
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

      {/* Home Sheet with pure SwiftUI content */}
      <NativeSheet
        ref={homeSheetRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backgroundStyle={styles.bottomSheetBackground}
        enablePanDownToClose={false}
        enableOverDrag={false}
        topInset={insets.top}
        allowFullExpansion={false}
      >
        <HomeSheetContent
          places={nearbyPlaces.map(p => ({
            id: p.id,
            name: p.name,
            address: p.address || '',
            type: p.type,
            distance: userCoords ? `${haversineKm(userCoords, p.coordinate).toFixed(1)}km` : undefined,
            image: p.image,
            tags: p.tags,
          }))}
          isLoading={placesLoading}
          onCategoryPress={handleCategoryPress}
          onPlacePress={handlePlacePress}
        />
      </NativeSheet>

      <NativeSheet
        ref={eventDetailsSheetRef}
        index={0}
        snapPoints={eventDetailsSnapPoints}
        backgroundStyle={styles.bottomSheetBackground}
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
            />
          )}
        </BottomSheetScrollView>
      </NativeSheet>

      <NativeSheet
        ref={submitPlaceSheetRef}
        index={0}
        snapPoints={submitPlaceSnapPoints}
        backgroundStyle={styles.bottomSheetBackground}
        onDismiss={handleSubmitPlaceExplainerDismiss}
        enableOverDrag={false}
        enablePanDownToClose
        enableBackdropDismiss
        expandedOnly
      >
        <SubmitPlaceSheetContent onSubmitPress={handleSubmitPlacePress} />
      </NativeSheet>

      <NativeSheet
        ref={placeDetailsSheetRef}
        index={0}
        snapPoints={detailsSnapPoints}
        backgroundStyle={styles.bottomSheetBackground}
        onDismiss={handlePlaceDetailsDismiss}
        enableBackdropDismiss
      >
        <BottomSheetScrollView contentContainerStyle={styles.placeDetailsContent}>
          <TouchableOpacity style={styles.openInMapsButton} onPress={handleOpenInMaps}>
            <Text style={styles.openInMapsButtonText}>Open in Maps</Text>
          </TouchableOpacity>

          <Text style={styles.placeDetailsName}>{selectedPlace?.name ?? ''}</Text>
          <Text style={styles.placeDetailsAddress}>{selectedPlace?.address ?? ''}</Text>

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
  placeDetailsContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
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
