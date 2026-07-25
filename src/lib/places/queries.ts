/**
 * Supabase reads for the discovery tables.
 *
 * Wraps the existing platform-resolved client (`@/lib/supabase`), replacing the
 * raw `fetch` + hardcoded URL/anon-key that lived in four screen files. Same
 * pattern as `src/lib/supabase/queries.ts` (the pilgrimage side).
 */
import { supabase } from '@/lib/supabase';

import type { EventRow, PlaceRow } from './types';

const PLACE_COLUMNS =
  'id,name,category,description,address,city,state,latitude,longitude,tags,photos';
const EVENT_COLUMNS = 'id,title,description,location_name,city,state,photo,approved,tags';

/**
 * PostgREST caps a single response (Supabase's default `max-rows` is 1000) and
 * `places` is already past 900 rows and growing, so paginate rather than
 * silently truncating. The previous raw-fetch code did not, and was about to
 * start dropping places without any error.
 */
const PAGE_SIZE = 1000;
const MAX_PAGES = 20; // Backstop against a pathological loop; 20k rows.

export async function fetchPlaceRows(): Promise<PlaceRow[]> {
  const rows: PlaceRow[] = [];

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE_SIZE;
    const { data, error } = await supabase
      .from('places')
      .select(PLACE_COLUMNS)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`Failed to fetch places: ${error.message}`);

    const batch = (data ?? []) as unknown as PlaceRow[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }

  return rows;
}

export async function fetchEventRows(): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1);

  if (error) throw new Error(`Failed to fetch events: ${error.message}`);

  return (data ?? []) as unknown as EventRow[];
}
