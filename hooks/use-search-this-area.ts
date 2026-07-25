import { useCallback, useRef, useState } from 'react';

import type { CameraIdleEvent, Coordinate, MapBounds } from '@/components/map';
import { isPointInBounds } from '@/components/map';

function haversineKm(a: Coordinate, b: Coordinate) {
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

/**
 * Owner call (2026-07-24): while every place ships to the client and all pins
 * are always on the map (clustered), the pill re-anchors the list but never
 * reveals new pins — so it reads as noise. Hidden until place data is fetched
 * per-viewport (server-side bounds query), at which point flipping this flag
 * restores the full UX below.
 */
export const SEARCH_THIS_AREA_ENABLED = false;

/**
 * TripAdvisor-style "Search this area": watches the map's camera-idle events
 * and flips `visible` once the viewport has drifted meaningfully away from the
 * last-searched spot (≥30% of the visible width, or zoomed out ≥1 level).
 * `markSearched()` consumes the current viewport — the caller filters/queries
 * with the returned bounds — and hides the pill until the camera drifts again.
 *
 * Camera-idle only fires on the Mapbox implementation; on legacy/web the pill
 * simply never appears.
 */
export function useSearchThisArea() {
  const [visible, setVisible] = useState(false);
  const lastSearchedRef = useRef<{ center: Coordinate; zoom: number } | null>(null);
  const lastIdleRef = useRef<CameraIdleEvent | null>(null);

  const onCameraIdle = useCallback((event: CameraIdleEvent) => {
    lastIdleRef.current = event;

    // First settle after mount defines the "already searched" baseline.
    if (!lastSearchedRef.current) {
      lastSearchedRef.current = { center: event.center, zoom: event.zoom };
      return;
    }

    const searched = lastSearchedRef.current;
    const movedKm = haversineKm(event.center, searched.center);
    const viewportWidthKm = haversineKm(
      { latitude: event.center.latitude, longitude: event.bounds.west },
      { latitude: event.center.latitude, longitude: event.bounds.east },
    );
    const drifted = movedKm > viewportWidthKm * 0.3;
    const zoomedOut = searched.zoom - event.zoom >= 1;
    setVisible(drifted || zoomedOut);
  }, []);

  /** Consume the current viewport: hides the pill and returns its bounds. */
  const markSearched = useCallback((): CameraIdleEvent | null => {
    const idle = lastIdleRef.current;
    if (idle) {
      lastSearchedRef.current = { center: idle.center, zoom: idle.zoom };
    }
    setVisible(false);
    return idle;
  }, []);

  /** Forget the area (e.g. after recentering on the user) and hide the pill. */
  const reset = useCallback(() => {
    lastSearchedRef.current = null;
    lastIdleRef.current = null;
    setVisible(false);
  }, []);

  return { visible, onCameraIdle, markSearched, reset };
}

export function placesInBounds<T extends { coordinate: Coordinate | null }>(
  places: T[],
  bounds: MapBounds,
): T[] {
  // Local filter today (all places ship to the client); swap the inside for a
  // Supabase lat/lng-range query when the dataset outgrows a single fetch.
  return places.filter((p) => p.coordinate && isPointInBounds(p.coordinate, bounds));
}
