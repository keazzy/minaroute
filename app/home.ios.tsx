// iOS-specific home screen with native SwiftUI bottom sheet
import EventDetailsContent from '@/components/event-details-content';
import { Glass } from '@/components/Glass';
import { HomeSheetContent } from '@/components/HomeSheetContent';
import { SearchThisAreaButton } from '@/components/SearchThisAreaButton';
import { placesInBounds, SEARCH_THIS_AREA_ENABLED, useSearchThisArea } from '@/hooks/use-search-this-area';
import { BottomSheetScrollView, NativeSheet, NativeSheetRef } from '@/components/NativeSheet';
import { PersistentSheet } from '@/components/PersistentSheet';
import { SubmitPlaceSheetContent } from '@/components/SubmitPlaceSheetContent';
import * as Storage from '@/constants/storage';
import { Colors } from '@/constants/theme';
import { haversineKm } from '@/src/lib/geo';
import { useEvents, usePlaces, type DiscoveryItem, type Place } from '@/src/lib/places';
import { useTheme } from '@/hooks/use-theme';
import { useFocusEffect } from 'expo-router';
import * as ExpoLocation from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import LottieView from 'lottie-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MapBounds, MapViewHandle } from '../components/map';
import MapView, { Marker, PROVIDER_DEFAULT } from '../components/map';

const INITIAL_REGION = {
  latitude: 6.6018,
  longitude: 3.3515,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const LOCATION_PERMISSION_SKIP_KEY = 'location_permission_skip_v2';

// Row shapes, mapping and haversine now live in the shared data layer
// (`@/src/lib/places`, `@/src/lib/geo`) — see docs/home-redesign-brief.md § Step 0.
type HomeListItem = DiscoveryItem;

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
  const { colors, isDark } = useTheme();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const { places, isLoading: placesLoading } = usePlaces();
  const { events } = useEvents();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Extract<HomeListItem, { type: 'Event' }> | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<ExpoLocation.PermissionStatus | null>(null);
  const [homeSheetReady, setHomeSheetReady] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapBearing, setMapBearing] = useState(0);
  const [areaBounds, setAreaBounds] = useState<MapBounds | null>(null);
  const {
    visible: searchAreaVisible,
    onCameraIdle: handleCameraIdle,
    markSearched: markAreaSearched,
    reset: resetSearchArea,
  } = useSearchThisArea();

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

  const handleMarkerPress = useCallback((location: Place) => {
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
      setAreaBounds(null);
      resetSearchArea();
      mapRef.current?.animateToRegion({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch {
      // ignore
    }
  }, [resetSearchArea]);

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
    // Delay to allow dismiss animation to complete before presenting
    setTimeout(() => {
      homeSheetRef.current?.present();
      requestAnimationFrame(() => {
        homeSheetRef.current?.snapToIndex(index >= 0 ? index : 0);
      });
    }, 100);
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
    setSelectedLocationId(null);
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
    const googleAppUrl = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;

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

  // Keep the map selection valid when the shared places cache refreshes.
  useEffect(() => {
    setSelectedLocationId((current) =>
      current && !places.some((p) => p.id === current) ? null : current
    );
  }, [places]);

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

  // "Search this area": once the user consumes a panned-to viewport, the sheet
  // lists that area (sorted from its center) instead of the near-me radius.
  const sheetPlaces = useMemo(() => {
    if (!areaBounds) return nearbyPlaces;
    const center = {
      latitude: (areaBounds.north + areaBounds.south) / 2,
      longitude: (areaBounds.east + areaBounds.west) / 2,
    };
    return placesInBounds(places, areaBounds).sort(
      (a, b) => haversineKm(center, a.coordinate) - haversineKm(center, b.coordinate),
    );
  }, [areaBounds, nearbyPlaces, places]);

  const handleSearchThisArea = useCallback(() => {
    const idle = markAreaSearched();
    if (idle) setAreaBounds(idle.bounds);
  }, [markAreaSearched]);

  // Handler for category press from SwiftUI HomeSheetContent
  const handleCategoryPress = useCallback((categoryName: string) => {
    openSearchResults({ category: categoryName });
  }, [openSearchResults]);

  // Handler for place press from SwiftUI HomeSheetContent
  const handlePlacePress = useCallback((place: { id: string }) => {
    const fullPlace = sheetPlaces.find(p => p.id === place.id);
    if (fullPlace) {
      handleLocationItemPress(fullPlace);
    }
  }, [sheetPlaces]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={INITIAL_REGION}
        showsUserLocation={locationPermissionStatus === ExpoLocation.PermissionStatus.GRANTED}
        showsMyLocationButton={false}
        onCameraMove={(event) => setMapBearing(event.bearing)}
        onCameraIdle={handleCameraIdle}
      >
        {places.map((location) => (
          <Marker
            key={location.id}
            coordinate={location.coordinate}
            title={location.name}
            description={location.type}
            category={location.type}
            selected={selectedLocationId === location.id}
            onPress={() => handleLocationItemPress(location)}
            pinColor={selectedLocationId === location.id ? Colors.light.tint : 'red'}
          />
        ))}
      </MapView>

      {/* Floating Header */}
      <View style={[styles.headerContainer, { top: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.aiButtonContainer}
            onPress={() => Alert.alert('Coming Soon', 'AI features are coming soon!')}
            activeOpacity={0.8}
          >
            <Glass style={styles.aiButtonGlass} glassStyle="regular">
              <LottieView
                source={{ uri: 'https://lottie.host/f70b4dce-b6a5-4e8a-afdc-47acf9c48440/SvXJ2qvt0V.lottie' }}
                autoPlay
                loop
                style={{ width: 56, height: 56 }}
              />
            </Glass>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.searchContainerOuter}
            activeOpacity={0.85}
            onPress={() => {
              router.push({ pathname: '/search-results', params: { focus: '1' } });
            }}
          >
            <Glass style={styles.searchContainerGlass} glassStyle="regular">
              <MingcuteIcon name="search_line" size={24} color={isDark ? '#fff' : '#000'} />
              <TextInput
                ref={searchInputRef}
                value=""
                editable={false}
                selectTextOnFocus={false}
                placeholder="Search mosques, halal food, schools…"
                placeholderTextColor={colors.placeholder}
                style={[styles.searchInput, { color: colors.text }]}
                pointerEvents="none"
              />
            </Glass>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButtonOuter} onPress={openSubmitPlaceExplainer} activeOpacity={0.85}>
            <Glass style={styles.settingsButtonGlass} glassStyle="regular">
              <MingcuteIcon name="question_line" size={24} color={isDark ? '#fff' : '#000'} />
            </Glass>
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

      {/* Custom My Location Button - positioned above home sheet, behind it in z-index */}
      {locationPermissionStatus === ExpoLocation.PermissionStatus.GRANTED && userCoords && (
        <TouchableOpacity
          style={[
            styles.mapControlButton,
            { 
              bottom: snapPoints[0] - 40, // Position just above the collapsed home sheet
              right: 16,
              zIndex: 0, // Behind the sheet
            }
          ]}
          onPress={() => {
            setAreaBounds(null);
            resetSearchArea();
            mapRef.current?.animateToRegion({
              latitude: userCoords.latitude,
              longitude: userCoords.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            });
          }}
          activeOpacity={0.8}
          testID="recenter-button"
        >
          <Glass style={styles.mapControlButtonGlass} glassStyle="regular">
            <SymbolView
              name="location.fill"
              tintColor="#007AFF"
              style={{ width: 22, height: 22 }}
            />
          </Glass>
        </TouchableOpacity>
      )}

      {/* "Search this area" pill — appears after panning away, above the collapsed sheet */}
      <SearchThisAreaButton
        visible={SEARCH_THIS_AREA_ENABLED && searchAreaVisible && !selectedPlace && !selectedEvent}
        onPress={handleSearchThisArea}
        style={{ bottom: snapPoints[0] + 12 }}
      />

      {/* Home sheet — JS-driven so the native tab bar stays visible above it */}
      <PersistentSheet
        ref={homeSheetRef}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: colors.sheetBg }]}
        glassBackground
        topInset={insets.top}
        // 49 = UITabBar base height; insets.bottom only covers the home indicator here.
        bottomInset={insets.bottom + 49}
      >
        <HomeSheetContent
          places={sheetPlaces.map(p => ({
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
      </PersistentSheet>

      <NativeSheet
        ref={eventDetailsSheetRef}
        index={0}
        snapPoints={eventDetailsSnapPoints}
        backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: colors.sheetBg }]}
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
        backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: colors.sheetBg }]}
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
        backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: colors.sheetBg }]}
        onDismiss={handlePlaceDetailsDismiss}
        enableBackdropDismiss
      >
        <TouchableOpacity
          style={styles.sheetCloseButton}
          onPress={() => {
            placeDetailsSheetRef.current?.dismiss();
            // Manually trigger dismiss handler since programmatic dismiss doesn't fire onDismiss
            setSelectedPlace(null);
            setSelectedLocationId(null);
            restoreHomeSheet();
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <SymbolView
            name="xmark.circle.fill"
            tintColor={isDark ? '#6e6e73' : '#c7c7cc'}
            style={{ width: 40, height: 40 }}
          />
        </TouchableOpacity>
        <BottomSheetScrollView contentContainerStyle={styles.placeDetailsContent}>
          <TouchableOpacity style={styles.openInMapsButton} onPress={handleOpenInMaps}>
            <Text style={styles.openInMapsButtonText}>Open in Maps</Text>
          </TouchableOpacity>

          <Text style={[styles.placeDetailsName, { color: colors.text }]}>{selectedPlace?.name ?? ''}</Text>
          <Text style={[styles.placeDetailsAddress, { color: colors.textSecondary }]}>{selectedPlace?.address ?? ''}</Text>

          {!!selectedPlace?.tags?.length && (
            <View style={styles.placeDetailsTagsRow}>
              {selectedPlace.tags.map((tag, index) => (
                <View key={`${tag}-${index}`} style={[styles.placeDetailsTag, { backgroundColor: colors.badgeBg }]}>
                  <Text style={[styles.placeDetailsTagText, { color: colors.text }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {!!selectedPlace?.description && (
            <Text style={[styles.placeDetailsDescription, { color: colors.textSecondary }]}>{selectedPlace.description}</Text>
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
  aiButtonContainer: {
    width: 48,
    height: 48,
  },
  aiButtonGlass: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  searchContainerOuter: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  searchContainerGlass: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
    fontFamily: 'Quicksand_500Medium',
  },
  settingsButtonOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  settingsButtonGlass: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  mapControlButton: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  mapControlButtonGlass: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseButton: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 10,
  },
  placeDetailsContent: {
    paddingTop: 16,
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
