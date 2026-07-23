-- Provenance + contact columns for places (Muslim-schools enrichment pipeline).
-- All nullable; existing rows and app code are unaffected.
-- scripts/enrich-schools/upload-approved.ts probes for these columns and
-- degrades gracefully if this migration has not been applied.

alter table public.places
  add column if not exists source_url text,
  add column if not exists website text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists verified_at timestamptz,
  add column if not exists area text,
  add column if not exists social_handle text,
  add column if not exists source_notes text,
  add column if not exists location_precision text;

comment on column public.places.source_url is 'URL where this place''s data was found (web-research provenance)';
comment on column public.places.verified_at is 'When the place was verified (on-ground/owner confirmation) — pairs with verified; NULL until the verification program touches it';
comment on column public.places.area is 'Neighbourhood/LGA within the city, e.g. "Baruwa / Ipaja" — Lagos navigation is area-based';
comment on column public.places.social_handle is 'Primary social media handle, e.g. @sibaamgoldenschool';
comment on column public.places.source_notes is 'Evidence trail from the enrichment pipeline (how the data was confirmed)';
comment on column public.places.location_precision is 'exact (street-level geocode) | approximate (area-level) | manual (reviewer-typed coords)';
