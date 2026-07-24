import { AppleMaps } from 'expo-maps';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

export type MapViewHandle = {
  animateToRegion: (
    region: {
      latitude: number;
      longitude: number;
      latitudeDelta?: number;
      longitudeDelta?: number;
    },
    durationMs?: number,
  ) => void;
  resetBearing: () => void;
};

type Coordinate = {
  latitude: number;
  longitude: number;
};

type MarkerProps = {
  coordinate: Coordinate;
  title?: string;
  description?: string;
  pinColor?: string;
  onPress?: () => void;
};

type CameraMoveEvent = {
  coordinates: { latitude: number; longitude: number };
  zoom: number;
  bearing: number;
  tilt: number;
};

type MapViewProps = {
  style?: ViewStyle;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  provider?: string;
  children?: React.ReactNode;
  onCameraMove?: (event: CameraMoveEvent) => void;
};

// Convert latitudeDelta to approximate zoom level
function deltaToZoom(latitudeDelta: number): number {
  // Rough approximation: zoom = log2(360 / latitudeDelta)
  // Clamped between 1 and 20
  const zoom = Math.log2(360 / latitudeDelta);
  return Math.max(1, Math.min(20, zoom));
}

export const PROVIDER_DEFAULT = 'default';
export const PROVIDER_GOOGLE = 'google';

// Marker component - collects props, actual rendering happens in MapView
export function Marker(_props: MarkerProps) {
  return null;
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  { style, initialRegion, showsUserLocation, children, onCameraMove },
  ref
) {
  const mapRef = useRef<AppleMaps.MapView>(null);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region) => {
      mapRef.current?.setCameraPosition({
        coordinates: {
          latitude: region.latitude,
          longitude: region.longitude,
        },
        zoom: deltaToZoom(region.latitudeDelta ?? 0.05),
      });
    },
    resetBearing: () => {
      mapRef.current?.setCameraPosition({
        bearing: 0,
      });
    },
  }));

  // Extract marker data from children
  const markers: AppleMaps.Marker[] = [];
  const markerCallbacks: Record<string, () => void> = {};

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === Marker) {
      const props = child.props as MarkerProps;
      const markerId = `marker-${props.coordinate.latitude}-${props.coordinate.longitude}`;
      
      markers.push({
        id: markerId,
        coordinates: {
          latitude: props.coordinate.latitude,
          longitude: props.coordinate.longitude,
        },
        title: props.title,
        tintColor: props.pinColor,
      });

      if (props.onPress) {
        markerCallbacks[markerId] = props.onPress;
      }
    }
  });

  const initialZoom = initialRegion
    ? deltaToZoom(initialRegion.latitudeDelta)
    : 12;

  return (
    <AppleMaps.View
      ref={mapRef}
      style={[styles.map, style]}
      cameraPosition={
        initialRegion
          ? {
              coordinates: {
                latitude: initialRegion.latitude,
                longitude: initialRegion.longitude,
              },
              zoom: initialZoom,
            }
          : undefined
      }
      markers={markers}
      properties={{
        isMyLocationEnabled: showsUserLocation ?? false,
        selectionEnabled: true,
      }}
      uiSettings={{
        myLocationButtonEnabled: true,
        compassEnabled: true,
        scaleBarEnabled: true,
        togglePitchEnabled: true,
      }}
      onMarkerClick={(marker) => {
        if (marker.id) {
          markerCallbacks[marker.id]?.();
        }
      }}
      onCameraMove={onCameraMove ? (event) => {
        onCameraMove({
          coordinates: event.coordinates,
          zoom: event.zoom,
          bearing: event.bearing,
          tilt: event.tilt,
        });
      } : undefined}
    />
  );
});

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default MapView;
