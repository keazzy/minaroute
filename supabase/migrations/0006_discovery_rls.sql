-- Row Level Security for the discovery tables.
--
-- WHY THIS IS URGENT: `places` and `events` had no RLS at all. Supabase grants
-- the `anon` role table access by default, and RLS is the only thing that then
-- constrains it — so the anon key that ships inside the app carried INSERT,
-- UPDATE and DELETE on ~1,000 places and 31 events. Anyone who pulled the key
-- out of the binary (it is not secret; it is designed to be public) could have
-- emptied both tables.
--
-- READ THIS BEFORE RUNNING. A policy mistake here breaks reads for every user
-- at once. Two things make that recoverable:
--   * The Supabase SQL Editor connects with a privileged role that BYPASSES
--     RLS, so you can always undo this. You cannot lock yourself out.
--   * A rollback snippet is at the bottom of this file.
--
-- WHAT KEEPS WORKING, and why:
--   * Public reads of places — unchanged, policy allows everyone.
--   * Public reads of events — now restricted to `approved` rows. The app
--     already filtered client-side; this makes it a server-side guarantee
--     rather than a convention. Unapproved events stop being publicly readable.
--   * The admin screens (app/admin/places.tsx, events.tsx) — they use the
--     normal anon client but authenticate as a real Supabase Auth user, so
--     `auth.jwt()` carries their email and the admin policies match on it.
--   * app/api/import-places+api.ts — uses the service_role key, which bypasses
--     RLS entirely by design.
--   * submit-place.tsx — calls the `submit_suggestion` RPC rather than writing
--     to a table, and touches `suggestions`, which this migration does not
--     alter. See the follow-up note.

-- ---------------------------------------------------------------------------
-- Who counts as an admin
--
-- A table rather than a hardcoded list in each policy, so adding or removing an
-- admin is one INSERT/DELETE instead of a migration. It deliberately mirrors
-- `constants/admin.ts`, which today is only a CLIENT-SIDE gate — it hides the
-- admin UI but never stopped anyone writing to the tables directly. That gate
-- stays for UX; this is the actual boundary.
-- ---------------------------------------------------------------------------

create table if not exists public.admin_users (
  email      text primary key,
  note       text,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Server-side admin allowlist, matched against the JWT email claim. Mirrors constants/admin.ts, which is only a UI gate. Not readable from the client — is_admin() reads it as security definer.';

-- Locked down: RLS on with NO policies means no client role can read or modify
-- the admin list. is_admin() below is security definer, so it still can.
alter table public.admin_users enable row level security;

insert into public.admin_users (email, note)
values ('delekeazzy1@gmail.com', 'Owner. Mirrors constants/admin.ts as of migration 0006.')
on conflict (email) do nothing;

-- `stable` not `volatile` so the planner can cache it per statement rather than
-- re-running it per row. `search_path` is pinned because a security definer
-- function with a mutable search_path is a privilege-escalation vector.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
      from public.admin_users a
     where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

comment on function public.is_admin() is
  'True when the current JWT email is in admin_users. Security definer so it can read a table the caller cannot.';

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- places
-- ---------------------------------------------------------------------------

alter table public.places enable row level security;

-- Policies are dropped first so this file can be re-run safely.
drop policy if exists places_public_read on public.places;
create policy places_public_read
  on public.places
  for select
  to anon, authenticated
  using (true);

drop policy if exists places_admin_write on public.places;
create policy places_admin_write
  on public.places
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- events
--
-- Public reads are limited to approved rows. `approved` is nullable, so the
-- test is `is true` rather than `= true` — a NULL must not be treated as
-- approved.
-- ---------------------------------------------------------------------------

alter table public.events enable row level security;

drop policy if exists events_public_read_approved on public.events;
create policy events_public_read_approved
  on public.events
  for select
  to anon, authenticated
  using (approved is true or public.is_admin());

drop policy if exists events_admin_write on public.events;
create policy events_admin_write
  on public.events
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Verify (run these after applying)
--
--   -- 1. RLS is on and each table has policies
--   select relname, relrowsecurity from pg_class
--    where relname in ('places','events','admin_users');
--
--   select tablename, policyname, cmd, roles
--     from pg_policies where schemaname = 'public'
--    order by tablename, policyname;
--
--   -- 2. Reads still work for the public (should return rows)
--   select count(*) from public.places;
--   select count(*) from public.events where approved is true;
--
--   -- NOTE: the SQL Editor bypasses RLS, so step 2 passing here does not prove
--   -- the app can read. The real check is opening the app: Home and the Explore
--   -- map should still list places. Do that before you consider this done.
--
-- ---------------------------------------------------------------------------
-- Rollback, if the app stops reading
--
--   alter table public.places  disable row level security;
--   alter table public.events  disable row level security;
--
-- That restores the previous (open) behaviour immediately. Policies are left in
-- place and become active again when RLS is re-enabled.
--
-- ---------------------------------------------------------------------------
-- Follow-up deliberately NOT done here
--
-- `suggestions` is also unprotected. It is intentionally left alone because
-- submit-place.tsx writes to it through the `submit_suggestion` RPC using the
-- anon key, and whether public submissions survive RLS depends entirely on
-- whether that function is SECURITY DEFINER — which is defined in the dashboard,
-- not in this folder. Check first:
--
--   select p.proname, p.prosecdef as is_security_definer
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.proname in ('submit_suggestion','approve_suggestion');
--
-- If `is_security_definer` is true, RLS on `suggestions` is safe and the RPC
-- keeps working. If false, enabling RLS breaks public place submissions.
-- ---------------------------------------------------------------------------
