-- Canonical category slugs: lowercase, singular, underscore-separated
-- ('mosque', 'school', 'event', 'halal_food'). Display names live in the app
-- (i18n-ready), never in the data.
--
-- Two parts: a one-time normalization of existing rows, and a trigger so every
-- future writer (app forms, import scripts, the approve_suggestion RPC) is
-- normalized server-side regardless of what it sends.

-- 1) One-time normalization ---------------------------------------------------

update public.places
set category = lower(trim(category))
where category is not null and category <> lower(trim(category));

update public.suggestions
set category = lower(trim(category))
where category is not null and category <> lower(trim(category));

-- Legacy display-name variants → slugs (idempotent; no-ops once clean)
update public.places set category = 'mosque' where category in ('mosques');
update public.places set category = 'school' where category in ('schools', 'islamic school', 'islamic schools');
update public.places set category = 'event' where category in ('events');
update public.places set category = 'halal_food' where category in ('halal food');

update public.suggestions set category = 'mosque' where category in ('mosques');
update public.suggestions set category = 'school' where category in ('schools', 'islamic school', 'islamic schools');
update public.suggestions set category = 'event' where category in ('events');
update public.suggestions set category = 'halal_food' where category in ('halal food');

-- 2) Keep it canonical forever ------------------------------------------------

create or replace function public.normalize_category()
returns trigger
language plpgsql
as $$
begin
  if new.category is not null then
    new.category := replace(lower(trim(new.category)), ' ', '_');
  end if;
  return new;
end;
$$;

drop trigger if exists places_normalize_category on public.places;
create trigger places_normalize_category
  before insert or update of category on public.places
  for each row execute function public.normalize_category();

drop trigger if exists suggestions_normalize_category on public.suggestions;
create trigger suggestions_normalize_category
  before insert or update of category on public.suggestions
  for each row execute function public.normalize_category();

comment on column public.places.category is 'Canonical lowercase slug: mosque | school | event | halal_food | … (normalized by trigger)';
