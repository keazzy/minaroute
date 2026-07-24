import Mapbox, {
  Camera,
  CircleLayer,
  Images,
  MapView as MapboxMapView,
  ShapeSource,
  SymbolLayer,
  UserLocation,
} from '@rnmapbox/maps';
import Constants from 'expo-constants';
import type { Feature, FeatureCollection, Point } from 'geojson';
import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';

import type {
  MapViewHandle,
  MapViewProps,
  MarkerProps,
} from './map-types';
import { PROVIDER_DEFAULT, PROVIDER_GOOGLE } from './map-types';

export type { MapViewHandle } from './map-types';
export { PROVIDER_DEFAULT, PROVIDER_GOOGLE };

const accessToken =
  (Constants.expoConfig?.extra as { mapboxAccessToken?: string } | undefined)
    ?.mapboxAccessToken ?? null;
void Mapbox.setAccessToken(accessToken);

const STYLE_URL = 'mapbox://styles/mapbox/light-v11';
const GREEN = '#12664F';

// Sprites from scripts/gen-map-markers.mjs — "<category>" chip + "<category>-selected" teardrop.
// Keys are "mr-"-prefixed because the style's own sprite catalog has images
// named e.g. 'school', and registering over them logs a MapLoad error.
const MARKER_IMAGES = {
  'mr-mosque': require('@/assets/images/map-markers/mosque.png'),
  'mr-mosque-selected': require('@/assets/images/map-markers/mosque-selected.png'),
  'mr-school': require('@/assets/images/map-markers/school.png'),
  'mr-school-selected': require('@/assets/images/map-markers/school-selected.png'),
  'mr-halal-food': require('@/assets/images/map-markers/halal-food.png'),
  'mr-halal-food-selected': require('@/assets/images/map-markers/halal-food-selected.png'),
  'mr-event': require('@/assets/images/map-markers/event.png'),
  'mr-event-selected': require('@/assets/images/map-markers/event-selected.png'),
  'mr-place': require('@/assets/images/map-markers/place.png'),
  'mr-place-selected': require('@/assets/images/map-markers/place-selected.png'),
};

const CATEGORY_ICON: Record<string, string> = {
  'mosque': 'mosque',
  'school': 'school',
  'halal food': 'halal-food',
  'event': 'event',
};

function iconKeyFor(marker: MarkerProps): string {
  const category = (marker.category ?? marker.description ?? '').toLowerCase();
  return `mr-${CATEGORY_ICON[category] ?? 'place'}`;
}

// Same approximation both legacy implementations used.
function deltaToZoom(latitudeDelta: number): number {
  const zoom = Math.log2(360 / latitudeDelta);
  return Math.max(1, Math.min(20, zoom));
}

// Marker component - collects props, actual rendering happens in MapView
export function Marker(_props: MarkerProps) {
  return null;
}

type PlaceFeature = Feature<Point, { idx: number; icon: string }>;

// Structural stand-in for @rnmapbox/maps' OnPressEvent, which isn't exported.
type SourcePressEvent = {
  features: Feature[];
};

function collectMarkers(children: React.ReactNode) {
  const markers: MarkerProps[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === Marker) {
      markers.push(child.props as MarkerProps);
    }
  });

  const toFeature = (marker: MarkerProps, idx: number): PlaceFeature => ({
    type: 'Feature',
    id: idx,
    properties: {
      idx,
      icon: `${iconKeyFor(marker)}${marker.selected ? '-selected' : ''}`,
    },
    geometry: {
      type: 'Point',
      coordinates: [marker.coordinate.longitude, marker.coordinate.latitude],
    },
  });

  const base: PlaceFeature[] = [];
  const selected: PlaceFeature[] = [];
  markers.forEach((marker, idx) => {
    (marker.selected ? selected : base).push(toFeature(marker, idx));
  });

  const collection = (features: PlaceFeature[]): FeatureCollection<Point> => ({
    type: 'FeatureCollection',
    features,
  });

  return { markers, baseShape: collection(base), selectedShape: collection(selected) };
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  { style, initialRegion, showsUserLocation, children, onCameraMove, onCameraIdle },
  ref,
) {
  const cameraRef = useRef<Camera>(null);
  const baseSourceRef = useRef<ShapeSource>(null);
  const appliedInitialRegionRef = useRef(false);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region, durationMs = 600) => {
      cameraRef.current?.setCamera({
        centerCoordinate: [region.longitude, region.latitude],
        zoomLevel: deltaToZoom(region.latitudeDelta ?? 0.05),
        animationDuration: durationMs,
        animationMode: 'easeTo',
      });
    },
    resetBearing: () => {
      cameraRef.current?.setCamera({ heading: 0, animationDuration: 300 });
    },
  }));

  const { markers, baseShape, selectedShape } = useMemo(
    () => collectMarkers(children),
    [children],
  );

  // Legacy expo-maps treated `initialRegion` as a live camera prop (search-results
  // re-fits after places load), so mirror updates after mount here.
  const regionKey = initialRegion
    ? `${initialRegion.latitude},${initialRegion.longitude},${initialRegion.latitudeDelta}`
    : '';
  const lastRegionKeyRef = useRef(regionKey);
  React.useEffect(() => {
    if (!appliedInitialRegionRef.current) {
      appliedInitialRegionRef.current = true;
      return;
    }
    if (!initialRegion || regionKey === lastRegionKeyRef.current) return;
    lastRegionKeyRef.current = regionKey;
    cameraRef.current?.setCamera({
      centerCoordinate: [initialRegion.longitude, initialRegion.latitude],
      zoomLevel: deltaToZoom(initialRegion.latitudeDelta),
      animationDuration: 500,
      animationMode: 'easeTo',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionKey]);

  const handleBasePress = async (event: SourcePressEvent) => {
    const feature = event.features?.[0];
    if (!feature) return;

    if (feature.properties?.cluster) {
      const source = baseSourceRef.current;
      const coordinates = (feature.geometry as Point).coordinates;
      let zoom = 14;
      try {
        zoom = (await source?.getClusterExpansionZoom(feature as Feature)) ?? 14;
      } catch {
        // fall back to a fixed zoom-in
      }
      cameraRef.current?.setCamera({
        centerCoordinate: coordinates,
        zoomLevel: Math.min(zoom + 0.5, 18),
        animationDuration: 400,
        animationMode: 'easeTo',
      });
      return;
    }

    const idx = feature.properties?.idx;
    if (typeof idx === 'number') markers[idx]?.onPress?.();
  };

  const handleSelectedPress = (event: SourcePressEvent) => {
    const idx = event.features?.[0]?.properties?.idx;
    if (typeof idx === 'number') markers[idx]?.onPress?.();
  };

  return (
    <MapboxMapView
      testID="discovery-map"
      style={[styles.map, style]}
      styleURL={STYLE_URL}
      compassEnabled
      compassFadeWhenNorth
      scaleBarEnabled={false}
      onCameraChanged={
        onCameraMove
          ? (state) => {
              onCameraMove({
                coordinates: {
                  latitude: state.properties.center[1],
                  longitude: state.properties.center[0],
                },
                zoom: state.properties.zoom,
                bearing: state.properties.heading,
                tilt: state.properties.pitch,
              });
            }
          : undefined
      }
      onMapIdle={
        onCameraIdle
          ? (state) => {
              const { center, bounds, zoom } = state.properties;
              onCameraIdle({
                center: { latitude: center[1], longitude: center[0] },
                zoom,
                bounds: {
                  north: bounds.ne[1],
                  east: bounds.ne[0],
                  south: bounds.sw[1],
                  west: bounds.sw[0],
                },
              });
            }
          : undefined
      }
    >
      <Camera
        ref={cameraRef}
        defaultSettings={
          initialRegion
            ? {
                centerCoordinate: [initialRegion.longitude, initialRegion.latitude],
                zoomLevel: deltaToZoom(initialRegion.latitudeDelta),
              }
            : undefined
        }
      />

      <Images images={MARKER_IMAGES} />

      {showsUserLocation ? <UserLocation visible showsUserHeadingIndicator /> : null}

      <ShapeSource
        id="places"
        ref={baseSourceRef}
        shape={baseShape}
        cluster
        clusterRadius={48}
        clusterMaxZoomLevel={16}
        onPress={handleBasePress}
      >
        <CircleLayer
          id="place-clusters"
          filter={['has', 'point_count']}
          style={{
            circleColor: GREEN,
            circleRadius: ['step', ['get', 'point_count'], 16, 10, 20, 50, 24],
            circleStrokeWidth: 3,
            circleStrokeColor: '#ffffff',
          }}
        />
        <SymbolLayer
          id="place-cluster-count"
          filter={['has', 'point_count']}
          style={{
            textField: ['get', 'point_count_abbreviated'],
            textFont: ['DIN Pro Bold', 'Arial Unicode MS Bold'],
            textSize: 13,
            textColor: '#ffffff',
            textAllowOverlap: true,
            textIgnorePlacement: true,
          }}
        />
        <SymbolLayer
          id="place-icons"
          filter={['!', ['has', 'point_count']]}
          style={{
            iconImage: ['get', 'icon'],
            iconSize: 1,
            iconAllowOverlap: true,
            iconIgnorePlacement: true,
          }}
        />
      </ShapeSource>

      {/* Selected pin lives in its own unclustered source so it always renders on top. */}
      <ShapeSource id="places-selected" shape={selectedShape} onPress={handleSelectedPress}>
        <SymbolLayer
          id="place-selected"
          style={{
            iconImage: ['get', 'icon'],
            iconSize: 1,
            iconAnchor: 'bottom',
            iconAllowOverlap: true,
            iconIgnorePlacement: true,
          }}
        />
      </ShapeSource>
    </MapboxMapView>
  );
});

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default MapView;
