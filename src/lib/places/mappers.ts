/**
 * Row → view-model mapping for discovery data.
 *
 * This logic was duplicated (with small drifts) across `app/home.tsx`,
 * `app/home.ios.tsx`, `app/search-results.tsx` and `app/search-results.ios.tsx`.
 * One copy now, so a schema change lands everywhere at once.
 */
import type { EventItem, EventRow, Place, PlaceRow, PlaceType } from './types';

/**
 * DB `category` → display type. Substring matching mirrors the original screen
 * logic, which tolerates historical variants ('halal_food', 'Halal Food').
 * Canonicalization is enforced DB-side by a trigger — see
 * `supabase/migrations/0003_category_normalization.sql`.
 */
export function dbCategoryToPlaceType(category: string | null | undefined): PlaceType {
  const value = (category ?? '').toLowerCase();
  if (value.includes('halal')) return 'Halal Food';
  if (value.includes('school')) return 'School';
  if (value.includes('event')) return 'Event';
  return 'Mosque';
}

const joinAddress = (...parts: (string | null | undefined)[]) =>
  parts.filter(Boolean).join(', ');

/**
 * Map a place row. Returns `null` for rows without coordinates — the map cannot
 * pin them and the list cannot compute a distance, so every screen dropped them.
 */
export function rowToPlace(row: PlaceRow): Place | null {
  if (typeof row.latitude !== 'number' || typeof row.longitude !== 'number') return null;

  const photos = (row.photos ?? []).filter(Boolean);

  return {
    id: row.id,
    name: row.name,
    address: joinAddress(row.address, row.city, row.state),
    description: row.description ?? '',
    image: photos[0] ?? '',
    photos,
    type: dbCategoryToPlaceType(row.category),
    tags: row.tags ?? [],
    distance: '',
    coordinate: { latitude: row.latitude, longitude: row.longitude },
  };
}

export function rowToEvent(row: EventRow): EventItem {
  const photo = typeof row.photo === 'string' ? row.photo.trim() : '';

  return {
    id: row.id,
    name: row.title,
    address: joinAddress(row.location_name, row.city, row.state),
    description: row.description ?? '',
    image: photo,
    photos: photo ? [photo] : [],
    type: 'Event',
    tags: (row.tags ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    distance: '',
    city: row.city ?? undefined,
    coordinate: null,
  };
}
