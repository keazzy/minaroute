/**
 * Domain API over the local SQLite store — the offline source of truth for the
 * pilgrimage core path. Mirrors the shape of `src/lib/supabase/queries.ts` so the
 * Phase-4 sync layer can reconcile the two. All functions work fully offline.
 *
 * Types are declared locally (not imported from the supabase queries module) so the
 * offline path never pulls the network client into its bundle.
 */
import { getDb, nowIso } from './localStore';

export type RiteStatus = 'not_started' | 'in_progress' | 'completed';
export type PilgrimageType = 'umrah' | 'hajj';

export type LocalItinerary = {
  pilgrimage_type: PilgrimageType;
  departure_date: string | null;
  arrival_date: string | null;
  umrah_date: string | null;
  updated_at: string;
};

export type LocalRiteProgress = {
  rite_id: string;
  status: RiteStatus;
  count_completed: number | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
};

export type LocalChecklistItem = {
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

// ---- Itinerary -------------------------------------------------------------

export async function getItinerary(): Promise<LocalItinerary | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<LocalItinerary>(
    `select pilgrimage_type, departure_date, arrival_date, umrah_date, updated_at
       from itinerary where id = 1`,
  );
  return row ?? null;
}

/** Insert or update the single active itinerary, merging with any existing row. */
export async function upsertItinerary(input: ItineraryInput): Promise<LocalItinerary> {
  const db = await getDb();
  const existing = await getItinerary();
  const merged: LocalItinerary = {
    pilgrimage_type: input.pilgrimage_type ?? existing?.pilgrimage_type ?? 'umrah',
    departure_date:
      input.departure_date !== undefined ? input.departure_date : existing?.departure_date ?? null,
    arrival_date:
      input.arrival_date !== undefined ? input.arrival_date : existing?.arrival_date ?? null,
    umrah_date: input.umrah_date !== undefined ? input.umrah_date : existing?.umrah_date ?? null,
    updated_at: nowIso(),
  };
  await db.runAsync(
    `insert into itinerary (id, pilgrimage_type, departure_date, arrival_date, umrah_date, updated_at)
     values (1, ?, ?, ?, ?, ?)
     on conflict(id) do update set
       pilgrimage_type = excluded.pilgrimage_type,
       departure_date  = excluded.departure_date,
       arrival_date    = excluded.arrival_date,
       umrah_date      = excluded.umrah_date,
       updated_at      = excluded.updated_at`,
    [
      merged.pilgrimage_type,
      merged.departure_date,
      merged.arrival_date,
      merged.umrah_date,
      merged.updated_at,
    ],
  );
  return merged;
}

// ---- Rite progress ---------------------------------------------------------

export async function getRiteProgress(): Promise<LocalRiteProgress[]> {
  const db = await getDb();
  return db.getAllAsync<LocalRiteProgress>(
    `select rite_id, status, count_completed, started_at, completed_at, updated_at
       from rite_progress`,
  );
}

export async function getRiteProgressFor(riteId: string): Promise<LocalRiteProgress | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<LocalRiteProgress>(
    `select rite_id, status, count_completed, started_at, completed_at, updated_at
       from rite_progress where rite_id = ?`,
    [riteId],
  );
  return row ?? null;
}

/**
 * Set a rite's status (and optional count). Stamps `started_at` the first time a
 * rite leaves `not_started`, and `completed_at` when it becomes `completed`, so a
 * killed-mid-rite app can resume (FR-008, Edge Cases: "App killed mid-rite").
 */
export async function setRiteStatus(
  riteId: string,
  status: RiteStatus,
  countCompleted?: number | null,
): Promise<LocalRiteProgress> {
  const db = await getDb();
  const prev = await getRiteProgressFor(riteId);
  const now = nowIso();
  const next: LocalRiteProgress = {
    rite_id: riteId,
    status,
    count_completed: countCompleted !== undefined ? countCompleted : prev?.count_completed ?? null,
    started_at:
      prev?.started_at ?? (status !== 'not_started' ? now : null),
    completed_at: status === 'completed' ? prev?.completed_at ?? now : null,
    updated_at: now,
  };
  await db.runAsync(
    `insert into rite_progress (rite_id, status, count_completed, started_at, completed_at, updated_at)
     values (?, ?, ?, ?, ?, ?)
     on conflict(rite_id) do update set
       status          = excluded.status,
       count_completed = excluded.count_completed,
       started_at      = excluded.started_at,
       completed_at    = excluded.completed_at,
       updated_at      = excluded.updated_at`,
    [next.rite_id, next.status, next.count_completed, next.started_at, next.completed_at, next.updated_at],
  );
  return next;
}

// ---- Checklist -------------------------------------------------------------

export async function getChecklist(): Promise<LocalChecklistItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ item_id: string; checked: number; updated_at: string }>(
    `select item_id, checked, updated_at from checklist_progress`,
  );
  return rows.map((r) => ({ item_id: r.item_id, checked: r.checked === 1, updated_at: r.updated_at }));
}

/**
 * Toggle (or explicitly set) a checklist item. When `checked` is omitted, flips the
 * current value (defaulting an unseen item to true).
 */
export async function toggleChecklistItem(
  itemId: string,
  checked?: boolean,
): Promise<LocalChecklistItem> {
  const db = await getDb();
  let next = checked;
  if (next === undefined) {
    const cur = await db.getFirstAsync<{ checked: number }>(
      `select checked from checklist_progress where item_id = ?`,
      [itemId],
    );
    next = cur ? cur.checked !== 1 : true;
  }
  const updatedAt = nowIso();
  await db.runAsync(
    `insert into checklist_progress (item_id, checked, updated_at)
     values (?, ?, ?)
     on conflict(item_id) do update set
       checked    = excluded.checked,
       updated_at = excluded.updated_at`,
    [itemId, next ? 1 : 0, updatedAt],
  );
  return { item_id: itemId, checked: next, updated_at: updatedAt };
}
