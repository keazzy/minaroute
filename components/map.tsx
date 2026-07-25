import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { MapViewProps, MarkerProps } from './map-types';

/**
 * Inert fallback for platforms without a real implementation (map.native.tsx
 * handles iOS/Android via Mapbox, map.web.tsx handles web via Leaflet).
 */

export type {
  CameraIdleEvent,
  CameraMoveEvent,
  Coordinate,
  MapBounds,
  MapViewHandle,
  MapViewProps,
  MarkerProps,
  Region,
} from './map-types';
export { isPointInBounds, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from './map-types';

export function Marker(_props: MarkerProps) {
  return null;
}

export default function MapView({ style }: MapViewProps) {
  return <View style={[styles.mapFallback, style]} />;
}

const styles = StyleSheet.create({
  mapFallback: {
    flex: 1,
    backgroundColor: '#e9e9e9',
  },
});
