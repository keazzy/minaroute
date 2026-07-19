/**
 * Supabase query helpers for the Manasik pilgrimage tables.
 *
 * These wrap the EXISTING Minaroute client (`@/lib/supabase`, platform-resolved
 * to `.native` / `.web`). They are the cloud side of the offline-first model:
 * anonymous users read/write the local store (see `@/src/lib/storage/*`) and these
 * calls only run for a signed-in session. Authorization is enforced in Postgres by
 * Row-Level Security (`auth.uid() = user_id`), and `user_id` is filled by a DB
 * default (`default auth.uid()`), so the client never sends it — see
 * `supabase/migrations/0001_pilgrimage.sql`.
 */
import { supabase } from '@/lib/supabase';

export type RiteStatus = 'not_started' | 'in_progress' | 'completed';
export type PilgrimageType = 'umrah' | 'hajj';
export type PreferredFont = 'quicksand' | 'satoshi';

export type Profile = {
  id: string;
  display_name: string | null;
  preferred_language: string;
  preferred_font: PreferredFont;
  created_at: string;
};

export type Itinerary = {
  id: string;
  user_id: string;
  pilgrimage_type: PilgrimageType;
  departure_date: string | null;
  arrival_date: string | null;
  umrah_date: string | null;
  created_at: string;
  updated_at: string;
};

export type RiteProgress = {
  id: string;
  user_id: string;
  rite_id: string;
  status: RiteStatus;
  count_completed: number | null;
  started_at: string | null;
  completed_at: string | null;
};

export type ChecklistProgress = {
  id: string;
  user_id: string;
  item_id: string;
  checked: boolean;
  updated_at: string;
};

export type ItineraryInput = {
  pilgrimage_type?: PilgrimageType;
  departure_date?: string | null;
  arrival_date?: string | null;
  umrah_date?: string | null;
};

/** Small helper: unwrap a non-null supabase result, throwing on error. */
function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

// ---- Itinerary -------------------------------------------------------------

export async function getMyItinerary(): Promise<Itinerary | null> {
  const { data, error } = await supabase.from('itineraries').select('*').maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Itinerary | null) ?? null;
}

export async function upsertItinerary(input: ItineraryInput): Promise<Itinerary> {
  return unwrap(
    await supabase
      .from('itineraries')
      .upsert(input, { onConflict: 'user_id' })
      .select()
      .single(),
  );
}

// ---- Rite progress ---------------------------------------------------------

export async function listRiteProgress(): Promise<RiteProgress[]> {
  return unwrap(await supabase.from('rite_progress').select('*'));
}

export async function upsertRiteProgress(input: {
  rite_id: string;
  status: RiteStatus;
  count_completed?: number | null;
}): Promise<RiteProgress> {
  return unwrap(
    await supabase
      .from('rite_progress')
      .upsert(input, { onConflict: 'user_id,rite_id' })
      .select()
      .single(),
  );
}

// ---- Checklist -------------------------------------------------------------

export async function listChecklistProgress(): Promise<ChecklistProgress[]> {
  return unwrap(await supabase.from('checklist_progress').select('*'));
}

export async function toggleChecklistItem(input: {
  item_id: string;
  checked: boolean;
}): Promise<ChecklistProgress> {
  return unwrap(
    await supabase
      .from('checklist_progress')
      .upsert(input, { onConflict: 'user_id,item_id' })
      .select()
      .single(),
  );
}

// ---- Profile ---------------------------------------------------------------

export async function upsertProfile(input: {
  display_name?: string | null;
  preferred_language?: string;
  preferred_font?: PreferredFont;
}): Promise<Profile> {
  const uid = (await supabase.auth.getUser()).data.user?.id;
  if (!uid) throw new Error('Not signed in');
  return unwrap(
    await supabase
      .from('profiles')
      .upsert({ id: uid, ...input }, { onConflict: 'id' })
      .select()
      .single(),
  );
}
