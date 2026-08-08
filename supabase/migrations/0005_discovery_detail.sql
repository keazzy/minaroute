-- Columns the Home redesign and the place/event detail pages actually consume.
--
-- Written *after* building those screens, deliberately: the Home card needs
-- about five fields but the detail pages are the widest consumers of these
-- tables, so specifying the migration from the cards would have meant migrating
-- twice. Everything here is traceable to something rendered in
-- `app/place/[id].tsx` or `app/event/[id].tsx`.
--
-- All columns are nullable (or defaulted) and every statement is idempotent, so
-- existing rows and the currently-deployed app are unaffected. The app does not
-- select these columns yet — wiring happens after this is applied, so the two
-- can land independently and in either order.
--
-- NOTE ON `places` CONTACT COLUMNS: `website`, `phone` and `email` already exist
-- from 0002_places_provenance.sql and are NOT re-added here. Only the channels
-- the contact block adds are new.

-- ---------------------------------------------------------------------------
-- places
-- ---------------------------------------------------------------------------

alter table public.places
  add column if not exists rating numeric(3,1),
  add column if not exists rating_count integer,
  add column if not exists attributes jsonb not null default '{}'::jsonb,
  add column if not exists opening_hours text,
  add column if not exists whatsapp text,
  add column if not exists instagram text,
  add column if not exists facebook text,
  add column if not exists x_handle text;

comment on column public.places.rating is
  'Aggregate rating on a 0-10 scale, one decimal (9.0, not 4.5/5). NULL means unrated — the UI hides the badge entirely rather than showing a zero, which is the expected state for most places at launch.';
comment on column public.places.rating_count is
  'How many *sources* the rating aggregates, not review count — the card renders "One of the best (1 source)". First-party reviews will need their own column.';
comment on column public.places.attributes is
  'Category-specific facts, validated per category by src/lib/places/attributes.ts. A mosque carries jumuah_time/womens_section/wudu_facilities; a school carries levels/boarding/fees_from. Modelled as jsonb rather than ~8 columns per category, each null for every row of every other category. Booleans render as chips only when true; false and absent are both silence.';
comment on column public.places.opening_hours is
  'Free text for now ("Open daily, 5:00 am - 9:30 pm"). A structured weekly schedule is a later migration — do not parse this.';
comment on column public.places.whatsapp is 'Phone number in international format; the app builds a wa.me link.';
comment on column public.places.instagram is 'Bare handle, no @ and no URL — the app renders @handle and builds the link. Overlaps with the enrichment pipeline''s social_handle; see the backfill note at the end of this file.';
comment on column public.places.facebook is 'Bare page handle, no URL.';
comment on column public.places.x_handle is 'Bare handle for X. Named x_handle rather than x because a single-letter column is unreadable in queries.';

-- 0-10 with one decimal, matching the locked rating scale.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'places_rating_range') then
    alter table public.places
      add constraint places_rating_range check (rating is null or (rating >= 0 and rating <= 10));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'places_rating_count_positive') then
    alter table public.places
      add constraint places_rating_count_positive check (rating_count is null or rating_count >= 0);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- events
--
-- This table has never appeared in a migration — it was created outside this
-- folder — so every statement below is defensive.
--
-- The two gaps that made the event detail page impossible:
--   * no date at all, which is also why Home cannot order "coming up soon"
--   * `photo` is singular, so there was no gallery and no card carousel
-- ---------------------------------------------------------------------------

alter table public.events
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists photos text[],
  add column if not exists attributes jsonb not null default '{}'::jsonb,
  add column if not exists price_from numeric(12,2),
  add column if not exists currency text not null default 'NGN',
  add column if not exists ticket_url text,
  add column if not exists organiser_name text,
  add column if not exists phone text,
  add column if not exists whatsapp text,
  add column if not exists email text,
  add column if not exists website text,
  add column if not exists instagram text,
  add column if not exists facebook text,
  add column if not exists x_handle text;

comment on column public.events.starts_at is
  'Event start, timestamptz. Deliberately a timestamp rather than a date + time pair so a future recurring "activity" type (sip and paint, cooking class) can reuse this table with a recurrence rule instead of needing a third one.';
comment on column public.events.ends_at is
  'Optional end. When it falls on a different day the UI shows a date range and no time range, because "12-13 Sep, 9:00 am - 6:00 pm" misdescribes a two-day event.';
comment on column public.events.latitude is
  'Events had no coordinates at all, so none could be mapped. Populate by geocoding location_name + city at ingest; the detail page hides its map when this is null.';
comment on column public.events.photos is
  'Gallery. Supersedes the singular `photo`, which is retained so existing screens keep working — see the backfill below. Prefer photos going forward.';
comment on column public.events.attributes is
  'Event facets, validated by resolveEventAttributes() in src/lib/places/attributes.ts: audience (sisters/brothers/mixed/family), childcare, prayer_space, halal_catering, free_entry, wheelchair_access, language. For this audience "sisters only" decides whether the event is relevant at all, so it is first-class data rather than prose.';
comment on column public.events.price_from is
  'Cheapest ticket. NULL means free — the free_entry chip in attributes carries that in the UI. Kept independent of ticket_url so a free event that still needs registration is representable.';
comment on column public.events.currency is 'ISO 4217. NGN default; events outside Nigeria (Nairobi, London) set their own.';
comment on column public.events.organiser_name is 'Shown as the contact section heading ("Organised by Hearthub Solution").';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'events_price_from_positive') then
    alter table public.events
      add constraint events_price_from_positive check (price_from is null or price_from >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'events_ends_after_starts') then
    alter table public.events
      add constraint events_ends_after_starts check (ends_at is null or starts_at is null or ends_at >= starts_at);
  end if;
end $$;

-- Backfill the gallery from the legacy single photo. Idempotent: only touches
-- rows that have a photo and no gallery yet.
update public.events
   set photos = array[photo]
 where photo is not null
   and photo <> ''
   and (photos is null or cardinality(photos) = 0);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- "Events coming up soon" orders approved, future events by start time. Partial
-- on approved because unapproved rows are never listed.
create index if not exists events_starts_at_idx
  on public.events (starts_at)
  where approved is true;

-- Detail-page recommendations are "same category, nearest first".
create index if not exists places_category_idx on public.places (category);

-- ---------------------------------------------------------------------------
-- Follow-ups this migration deliberately does NOT do
--
-- 1. RLS. `places` and `events` are not covered by any policy in this folder —
--    only the pilgrimage tables from 0001 have RLS enabled. Turning it on here
--    without policies would instantly break every read in the app, so it needs
--    its own reviewed migration. Worth treating as urgent: without RLS, the
--    anon key that ships inside the app may carry write access to both tables.
--
-- 2. Proximity indexing. Recommendations and "places around you" sort by
--    distance. A btree on (latitude, longitude) does not serve that; it wants a
--    geography column plus a GiST index, which is a schema change worth doing
--    alongside the query that needs it.
--
-- 3. `social_handle` -> `instagram` backfill. 0002 added a generic
--    social_handle for the schools pipeline and most values look like Instagram
--    handles, but not all — a blind copy would put Facebook pages in the
--    Instagram column. Needs a look at the data first.
--
-- 4. `events.tags` is comma-separated text while `places.tags` is a real array.
--    Normalising is worthwhile but touches existing read paths.
-- ---------------------------------------------------------------------------
