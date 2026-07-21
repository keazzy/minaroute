-- Provenance + contact columns for places (Muslim-schools enrichment pipeline).
-- All nullable; existing rows and app code are unaffected.
-- scripts/enrich-schools/upload-approved.ts probes for these columns and
-- degrades gracefully if this migration has not been applied.

alter table public.places
  add column if not exists source_url text,
  add column if not exists website text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists verified_at timestamptz;

comment on column public.places.source_url is 'URL where this place''s data was found (web-research provenance)';
comment on column public.places.verified_at is 'When the data was last human-reviewed/approved';
