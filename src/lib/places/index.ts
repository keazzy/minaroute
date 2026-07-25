/**
 * The discovery data layer. Import from here, not from the internals.
 *
 * Replaces the per-screen copies of the Supabase URL, anon key, raw `fetch`,
 * row types and row→view-model mapping that lived in `app/home.tsx`,
 * `app/home.ios.tsx`, `app/search-results.tsx` and `app/search-results.ios.tsx`.
 */
export { usePlaces, useEvents, useNearbyPlaces, type NearbyOptions } from './hooks';
export { dbCategoryToPlaceType, rowToEvent, rowToPlace } from './mappers';
export { fetchEventRows, fetchPlaceRows } from './queries';
export {
  isEvent,
  type Coordinate,
  type DiscoveryItem,
  type EventItem,
  type EventRow,
  type Place,
  type PlaceRow,
  type PlaceType,
  type PlaceWithDistance,
} from './types';
