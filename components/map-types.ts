import type React from 'react';
import type { ViewStyle } from 'react-native';

/**
 * Shared public surface of the discovery-map component. Both implementations
 * (Mapbox, legacy expo-maps) and every platform entry file conform to this so
 * consumers (`app/home*.tsx`, `app/search-results*.tsx`, explore tab) never
 * care which one is active.
 */

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type CameraMoveEvent = {
  coordinates: Coordinate;
  zoom: number;
  bearing: number;
  tilt: number;
};

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

/** Fired when the camera settles after a gesture/animation. Mapbox impl only. */
export type CameraIdleEvent = {
  center: Coordinate;
  zoom: number;
  bounds: MapBounds;
};

export type MarkerProps = {
  coordinate: Coordinate;
  title?: string;
  description?: string;
  /** Legacy pin tint. The Mapbox impl ignores this — use `category`/`selected`. */
  pinColor?: string;
  /** Drives the marker icon on the Mapbox map. Falls back to `description`. */
  category?: string;
  /** Highlighted teardrop pin, rendered above everything else. Mapbox impl only. */
  selected?: boolean;
  onPress?: () => void;
};

export type MapViewProps = {
  style?: ViewStyle;
  initialRegion?: Region;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  provider?: string;
  children?: React.ReactNode;
  onCameraMove?: (event: CameraMoveEvent) => void;
  /** Mapbox impl only; legacy/web silently ignore it. */
  onCameraIdle?: (event: CameraIdleEvent) => void;
};

export type MapViewHandle = {
  animateToRegion: (
    region: Coordinate & Partial<Pick<Region, 'latitudeDelta' | 'longitudeDelta'>>,
    durationMs?: number,
  ) => void;
  resetBearing: () => void;
};

export const PROVIDER_DEFAULT = 'default';
export const PROVIDER_GOOGLE = 'google';

export function isPointInBounds(point: Coordinate, bounds: MapBounds): boolean {
  if (point.latitude < bounds.south || point.latitude > bounds.north) return false;
  // Handle viewports crossing the antimeridian, where west > east.
  if (bounds.west <= bounds.east) {
    return point.longitude >= bounds.west && point.longitude <= bounds.east;
  }
  return point.longitude >= bounds.west || point.longitude <= bounds.east;
}
