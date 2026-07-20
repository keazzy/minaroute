-- Manasik pilgrimage mode — Supabase schema
-- Adds per-user pilgrimage tables to the existing Minaroute database.
-- Every user-owned table enables Row-Level Security keyed to auth.uid(),
-- because the Supabase anon key is public: RLS is the only thing protecting this data.
--
-- Rite/prep CONTENT is NOT stored here — it is bundled on-device as versioned JSON
-- (src/content/*.json) so the rite path works fully offline. These tables hold only
-- per-user itinerary and progress, synced when the pilgrim optionally signs in.
--
-- Apply with:  supabase db push        (after `supabase link`)
--    or paste into the Supabase Studio SQL editor.

-- ---------------------------------------------------------------------------
-- Helper: keep updated_at fresh on write.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — optional per-user prefs (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  display_name       text,
  preferred_language text        not null default 'en',
  preferred_font     text        not null default 'quicksand',   -- 'quicksand' | 'satoshi'
  created_at         timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are self-readable"   on public.profiles;
drop policy if exists "profiles are self-insertable" on public.profiles;
drop policy if exists "profiles are self-updatable"  on public.profiles;
drop policy if exists "profiles are self-deletable"  on public.profiles;

create policy "profiles are self-readable"   on public.profiles for select using  (auth.uid() = id);
create policy "profiles are self-insertable" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles are self-updatable"  on public.profiles for update using  (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles are self-deletable"  on public.profiles for delete using  (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- itineraries — one active per user (anonymous copy lives in the local store)
-- ---------------------------------------------------------------------------
create table if not exists public.itineraries (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  pilgrimage_type text        not null default 'umrah',   -- 'umrah' | 'hajj' (Hajj later)
  departure_date  date,
  arrival_date    date,
  umrah_date      date,                                   -- planned day to perform Umrah
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- MVP assumes a single active itinerary per user; enables upsert on user_id.
  unique (user_id)
);

create index if not exists itineraries_user_id_idx on public.itineraries (user_id);

drop trigger if exists itineraries_set_updated_at on public.itineraries;
create trigger itineraries_set_updated_at
  before update on public.itineraries
  for each row execute function public.set_updated_at();

alter table public.itineraries enable row level security;

drop policy if exists "itineraries are self-readable"   on public.itineraries;
drop policy if exists "itineraries are self-insertable" on public.itineraries;
drop policy if exists "itineraries are self-updatable"  on public.itineraries;
drop policy if exists "itineraries are self-deletable"  on public.itineraries;

create policy "itineraries are self-readable"   on public.itineraries for select using  (auth.uid() = user_id);
create policy "itineraries are self-insertable" on public.itineraries for insert with check (auth.uid() = user_id);
create policy "itineraries are self-updatable"  on public.itineraries for update using  (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "itineraries are self-deletable"  on public.itineraries for delete using  (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- rite_progress — one row per (user, rite)
-- ---------------------------------------------------------------------------
create table if not exists public.rite_progress (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  rite_id         text        not null,                   -- matches bundled content id, e.g. 'tawaf'
  status          text        not null default 'not_started'
                              check (status in ('not_started', 'in_progress', 'completed')),
  count_completed int,                                    -- circuits/laps done
  started_at      timestamptz,
  completed_at    timestamptz,
  unique (user_id, rite_id)
);

create index if not exists rite_progress_user_id_idx on public.rite_progress (user_id);

alter table public.rite_progress enable row level security;

drop policy if exists "rite_progress is self-readable"   on public.rite_progress;
drop policy if exists "rite_progress is self-insertable" on public.rite_progress;
drop policy if exists "rite_progress is self-updatable"  on public.rite_progress;
drop policy if exists "rite_progress is self-deletable"  on public.rite_progress;

create policy "rite_progress is self-readable"   on public.rite_progress for select using  (auth.uid() = user_id);
create policy "rite_progress is self-insertable" on public.rite_progress for insert with check (auth.uid() = user_id);
create policy "rite_progress is self-updatable"  on public.rite_progress for update using  (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "rite_progress is self-deletable"  on public.rite_progress for delete using  (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- checklist_progress — prep + packing items
-- ---------------------------------------------------------------------------
create table if not exists public.checklist_progress (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  item_id    text        not null,                        -- matches bundled checklist item id
  checked    boolean     not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, item_id)
);

create index if not exists checklist_progress_user_id_idx on public.checklist_progress (user_id);

drop trigger if exists checklist_progress_set_updated_at on public.checklist_progress;
create trigger checklist_progress_set_updated_at
  before update on public.checklist_progress
  for each row execute function public.set_updated_at();

alter table public.checklist_progress enable row level security;

drop policy if exists "checklist_progress is self-readable"   on public.checklist_progress;
drop policy if exists "checklist_progress is self-insertable" on public.checklist_progress;
drop policy if exists "checklist_progress is self-updatable"  on public.checklist_progress;
drop policy if exists "checklist_progress is self-deletable"  on public.checklist_progress;

create policy "checklist_progress is self-readable"   on public.checklist_progress for select using  (auth.uid() = user_id);
create policy "checklist_progress is self-insertable" on public.checklist_progress for insert with check (auth.uid() = user_id);
create policy "checklist_progress is self-updatable"  on public.checklist_progress for update using  (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "checklist_progress is self-deletable"  on public.checklist_progress for delete using  (auth.uid() = user_id);
