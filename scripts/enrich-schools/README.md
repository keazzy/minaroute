# Enrich Schools — Muslim schools discovery pipeline

Grows the `places` directory with Muslim schools that aren't on Google Maps.
Human-in-the-loop by design: **nothing reaches `places` without a reviewer
setting `approved=TRUE` in the sheet.** See
[docs/muslim-schools-enrichment-brief.md](../../docs/muslim-schools-enrichment-brief.md).

## Flow

```
discovery agents ──► data/raw/*.json          (agentic — web search, no locked-platform scraping)
schools:normalize ─► data/candidates.json     (zod-validated, intra-batch deduped)
schools:geocode ───► + lat/lng                (Google Geocoding API, Lagos-bounds checked)
schools:dedupe ────► + dedup_status           (fuzzy name + ~150 m vs existing places)
schools:sheet ─────► data/review-sheet.csv    (human review surface)
        │
   HUMAN REVIEW: open CSV in Google Sheets/Excel, fix fields, set approved=TRUE
        │
schools:upload ────► Supabase places          (deterministic, service key, idempotent)
```

`npm run schools:pipeline` runs normalize → geocode → dedupe → sheet in one go.

## Discovery (the agentic part)

Discovery is run by research agents (e.g. Claude Code subagents), not a
crawler. Each agent web-searches a slice (directories/registries, Muslim
associations, area sweeps) and writes a JSON array to `data/raw/<slice>.json`
matching `RawCandidateSchema` in [schema.ts](schema.ts). Rules:

- **Never crawl Instagram/Facebook/TikTok** — record handles as text found via
  search results or third-party pages.
- Every candidate needs a `source_url`. No source, no candidate.
- Only facts stated by the source; `null` for unknowns.
- Prefer the school's own `og:image` for `image_url` (link, don't re-host).

To run discovery for a new region, prompt agents with the contract above and
drop their JSON into `data/raw/`, then re-run the pipeline.

### Social-surfaced lane

Many small schools exist only as a Facebook/Instagram page. Those platforms
are still never crawled; instead a search-snippet lane finds them:

1. An agent runs `site:facebook.com` / `site:instagram.com`-style searches and
   records name/handle/area **from the search snippets only**, with the page
   URL as `source_url`.
2. `normalize` detects locked-platform source URLs, caps `confidence` at 0.5,
   and sets `needs_verification=TRUE` in the sheet.
3. A **human** (optionally assisted by Claude in Chrome on the reviewer's own
   logged-in session, low volume, supervised) opens each page, confirms
   name/address/phone, edits the row, and only then sets `approved=TRUE`.
   `upload` warns if approved rows still carry the flag.

## Review

`data/review-sheet.csv` opens directly in Google Sheets (File → Import) or
Excel. Rows are sorted: `new` first, then `likely-dup` (check
`matched_place_name`), then `dup` (refused by the uploader even if approved).
The reviewer can edit any field — the edited CSV is what gets uploaded. Rows
with `geocode_status=failed` need manual `lat`/`lng`.

## Upload

```
npm run schools:upload -- --dry-run   # show what would be inserted
npm run schools:upload                # insert approved rows
```

Requires `SUPABASE_SERVICE_KEY` in `.env.local` (RLS: `places` writes are
service-role only — never the anon key). Idempotent: re-runs skip anything
already in `places` (fuzzy name within 150 m). Apply
[supabase/migrations/0002_places_provenance.sql](../../supabase/migrations/0002_places_provenance.sql)
first to keep the contact + provenance fields (`source_url`, `website`,
`phone`, `email`, `verified_at`, `area`, `social_handle`, `source_notes`,
`location_precision`) — without it the uploader warns and drops them.

## Env (`.env.local`)

- `SUPABASE_SERVICE_KEY` — dedupe (read) + upload (write)
- `MAPBOX_ACCESS_TOKEN` — preferred geocoder (app map stack is moving to
  Mapbox). Uses permanent mode (storable results, needs billing on the Mapbox
  account); `MAPBOX_PERMANENT=false` for throwaway smoke tests only.
- `GOOGLE_MAPS_KEY` / `GOOGLE_PLACES_API_KEY` — Google geocoding fallback;
  fine only while results are shown on Google maps (ToS)
- No keys at all → OSM Nominatim (free, area-level precision)
