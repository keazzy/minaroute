/**
 * Shapes for the discovery data (`places` + `events`).
 *
 * `*Row` types mirror the Supabase columns we select; the mapped types are what
 * screens actually render. These used to be redeclared in four screen files —
 * see `src/lib/places/mappers.ts` for the conversion.
 */

export type PlaceRow = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  tags: string[] | null;
  photos: string[] | null;
};

export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location_name: string | null;
  city: string | null;
  state: string | null;
  photo: string | null;
  approved: boolean | null;
  /** Comma-separated in the DB, unlike `places.tags` which is a real array. */
  tags: string | null;
};

export type PlaceType = 'Mosque' | 'School' | 'Event' | 'Halal Food';

export type Place = {
  id: string;
  name: string;
  address: string;
  description: string;
  image: string;
  /** Full gallery. `image` is `photos[0]`, kept for existing card components. */
  photos: string[];
  type: PlaceType;
  tags: string[];
  /** Legacy display string. Empty unless a screen fills it in; prefer `distanceKm`. */
  distance: string;
  coordinate: Coordinate;
};

export type EventItem = {
  id: string;
  name: string;
  address: string;
  description: string;
  image: string;
  photos: string[];
  type: 'Event';
  tags: string[];
  distance: string;
  city?: string;
  /** Events carry no coordinates today — see docs/home-redesign-brief.md. */
  coordinate: null;
};

export type Coordinate = { latitude: number; longitude: number };

/** A place or an event, as the mixed discovery lists render them. */
export type DiscoveryItem = Place | EventItem;

export type PlaceWithDistance = Place & { distanceKm: number };

export const isEvent = (item: DiscoveryItem): item is EventItem => item.type === 'Event';
