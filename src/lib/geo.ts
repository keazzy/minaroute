/**
 * Geo helpers for the discovery surfaces.
 *
 * `haversineKm` was previously copy-pasted into `app/home.tsx`,
 * `app/home.ios.tsx` and `hooks/use-search-this-area.ts`. Distances are
 * kilometres throughout — Minaroute's primary market is Lagos.
 */
export type Coords = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;
const toRadians = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function haversineKm(a: Coords, b: Coords): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Human-readable distance. Sub-kilometre reads in metres because "0.2 km away"
 * is worse than "200 m away" when you're standing near a mosque.
 */
export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return '';
  if (km < 1) return `${Math.round(km * 100) * 10} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
