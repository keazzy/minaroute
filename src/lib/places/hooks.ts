/**
 * The discovery data hooks. Every screen that needs places or events should use
 * these rather than fetching for itself.
 *
 * Both resources are module-scoped, so all consumers share one cache and one
 * in-flight request — switching tabs no longer refetches the whole table.
 */
import { useMemo } from 'react';

import { createResource, useResource } from '@/src/lib/data/resource';
import { haversineKm, type Coords } from '@/src/lib/geo';

import { rowToEvent, rowToPlace } from './mappers';
import { fetchEventRows, fetchPlaceRows } from './queries';
import type { EventItem, Place, PlaceWithDistance } from './types';

// Stable empty arrays: returning a fresh `[]` on every render would defeat the
// memoization in every consumer downstream.
const NO_PLACES: Place[] = [];
const NO_EVENTS: EventItem[] = [];
const NO_NEARBY: PlaceWithDistance[] = [];

const placesResource = createResource(async () => {
  const rows = await fetchPlaceRows();
  return rows
    .map(rowToPlace)
    .filter((place): place is Place => place !== null);
});

const eventsResource = createResource(async () => {
  const rows = await fetchEventRows();
  return rows.map(rowToEvent);
});

export function usePlaces() {
  const { data, isLoading, error, refetch } = useResource(placesResource);
  return { places: data ?? NO_PLACES, isLoading, error, refetch };
}

export function useEvents() {
  const { data, isLoading, error, refetch } = useResource(eventsResource);
  return { events: data ?? NO_EVENTS, isLoading, error, refetch };
}

export type NearbyOptions = {
  /** Drop anything further than this. Omit to keep everything. */
  maxKm?: number;
  /** Cap the result count after sorting. */
  limit?: number;
};

/**
 * Places sorted nearest-first, each carrying its `distanceKm`.
 * Returns an empty list until coordinates are available — callers should show
 * their location-permission state rather than an empty list in that case.
 */
export function useNearbyPlaces(
  coords: Coords | null | undefined,
  options: NearbyOptions = {},
) {
  const { places, isLoading, error, refetch } = usePlaces();
  const { maxKm, limit } = options;

  // Depend on the primitives, not the object — callers commonly rebuild the
  // coords object each render.
  const latitude = coords?.latitude;
  const longitude = coords?.longitude;

  const nearby = useMemo(() => {
    if (latitude === undefined || longitude === undefined) return NO_NEARBY;

    const origin = { latitude, longitude };
    const withDistance = places.map((place) => ({
      ...place,
      distanceKm: haversineKm(origin, place.coordinate),
    }));

    const filtered =
      maxKm === undefined
        ? withDistance
        : withDistance.filter((place) => place.distanceKm <= maxKm);

    filtered.sort((a, b) => a.distanceKm - b.distanceKm);

    return limit === undefined ? filtered : filtered.slice(0, limit);
  }, [places, latitude, longitude, maxKm, limit]);

  return { places: nearby, isLoading, error, refetch };
}
