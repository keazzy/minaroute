-- Fix (review finding): 0003's trigger normalized case/whitespace but did not
-- apply the display-name→slug mapping, so an old app build submitting
-- "Mosques" or "Islamic Schools" would store 'mosques'/'islamic_schools' —
-- non-canonical values the one-time cleanup had already eliminated.
-- Replacing the function updates both existing triggers in place.

create or replace function public.normalize_category()
returns trigger
language plpgsql
as $$
begin
  if new.category is not null then
    new.category := replace(lower(trim(new.category)), ' ', '_');
    new.category := case new.category
      when 'mosques' then 'mosque'
      when 'schools' then 'school'
      when 'islamic_school' then 'school'
      when 'islamic_schools' then 'school'
      when 'events' then 'event'
      when 'halal_foods' then 'halal_food'
      else new.category
    end;
  end if;
  return new;
end;
$$;
