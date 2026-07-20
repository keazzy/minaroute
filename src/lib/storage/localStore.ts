/**
 * Local offline store (expo-sqlite).
 *
 * This is the on-device home for itinerary, checklist, and rite progress. It is the
 * PRIMARY store for anonymous users and the offline mirror for signed-in users — the
 * pilgrimage core path reads/writes here and never depends on the network. A sync
 * layer (Phase 4) reconciles this up to Supabase on sign-in.
 *
 * The DB connection is opened LAZILY on first use so merely importing this module
 * never triggers native/wasm loading at bundle time. Schema is created once, idempotently.
 */
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'manasik.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const SCHEMA = `
  pragma journal_mode = WAL;

  create table if not exists itinerary (
    id              integer primary key check (id = 1),  -- single active itinerary (MVP)
    pilgrimage_type text    not null default 'umrah',
    departure_date  text,
    arrival_date    text,
    umrah_date      text,
    updated_at      text    not null
  );

  create table if not exists rite_progress (
    rite_id         text primary key,
    status          text    not null default 'not_started',
    count_completed integer,
    started_at      text,
    completed_at    text,
    updated_at      text    not null
  );

  create table if not exists checklist_progress (
    item_id    text primary key,
    checked    integer not null default 0,
    updated_at text    not null
  );
`;

/** Open (once) and migrate the local database. */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(SCHEMA);
      return db;
    })().catch((err) => {
      // Reset so a later call can retry (e.g. transient open failure).
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

/** Current ISO timestamp for `updated_at` bookkeeping. */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Test/maintenance helper — wipe all local pilgrimage data. Does NOT touch the
 * Supabase copy. Kept here so tests and a future "reset" setting share one path.
 */
export async function clearLocalStore(): Promise<void> {
  const db = await getDb();
  await db.execAsync(
    'delete from itinerary; delete from rite_progress; delete from checklist_progress;',
  );
}
