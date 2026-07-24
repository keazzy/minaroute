/**
 * Discovery-map entry point (native). Routes to the Mapbox implementation by
 * default; set EXPO_PUBLIC_MAP_IMPL=legacy (and restart Metro) to fall back to
 * the previous expo-maps implementation while the migration is validated in
 * the same dev build. The conditional require keeps the inactive module — and
 * its native dependency — from loading, so legacy mode still runs on dev
 * clients built before @rnmapbox/maps was added.
 *
 * Delete this switch, map-legacy.*, and expo-maps once Mapbox is signed off.
 */
import type { ForwardRefExoticComponent, PropsWithoutRef, RefAttributes } from 'react';

import type { MapViewHandle, MapViewProps, MarkerProps } from './map-types';

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

type MapModule = {
  default: ForwardRefExoticComponent<PropsWithoutRef<MapViewProps> & RefAttributes<MapViewHandle>>;
  Marker: (props: MarkerProps) => null;
};

// require() so only the active implementation's module (and native dependency)
// is ever loaded — see the header comment.
const impl: MapModule =
  process.env.EXPO_PUBLIC_MAP_IMPL === 'legacy'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./map-legacy')
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('./map-mapbox');

export const Marker = impl.Marker;
export default impl.default;
