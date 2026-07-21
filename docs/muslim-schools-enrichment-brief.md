# Handoff Brief — Muslim Schools Data Enrichment (Minaroute discovery)

> Paste this into a fresh chat (Fable 5) to start the "find more Muslim schools" workstream. It's the discovery/data side of Minaroute — **separate from the pilgrimage (Manasik) build**. Do this on its own branch.

## Goal
Grow the Minaroute `places` directory with **Muslim schools that aren't on Google Maps** (many are scattered across websites, directories, and social media). Build a **repeatable, human-in-the-loop pipeline**: discover candidates from the open web → normalise + geocode → dedupe → land in a **review sheet** → human approves → upload approved rows to Supabase `places`.

## Guardrails — read first
1. **No scraping of locked social platforms** (Instagram/Facebook/TikTok). It violates their ToS, gets blocked, and yields unverifiable data. Find social-scattered schools via **web search** (their handles/pages surface in results, directories, news, WhatsApp/association listings) — not by crawling the platforms.
2. **Human-in-the-loop is mandatory.** Nothing the agent finds goes straight into `places`. It lands in a review surface a human approves first. A directory's whole value is accuracy — treat a wrong/spam entry as a bug.
3. **Research is agentic; the upload is deterministic.** The messy discovery/extraction runs as an agent (search → fetch → extract → judge). The DB write is a plain script over an **approved** sheet, so a bad extraction can never silently corrupt the DB.
4. **Scope tight:** **Lagos + Muslim schools only, first.** Prove the pipeline on one region/category before generalising ("win one community first"). Don't build a generic global scraper.
5. **Images: link, don't re-host** (until rights cleared) — prefer each school's own `og:image` / published photo, stored as a URL with source attribution.

## The pipeline
1. **Discover (agent)** — run web searches (e.g. "Islamiyya/Tahfeez/Muslim school Lekki/Ikorodu/Ketu", Islamic-education association directories, state education registries, news, blogs). **Fetch** promising pages and **LLM-extract** structured candidates. Capture `source_url` for every field.
2. **Normalise + geocode** — category=`School`; fill address/city/state; geocode address → `lat`/`lng` using the **Google Geocoding API** (key in `.env.local`). Flag rows that fail to geocode for manual coords.
3. **Dedupe** against existing `places` — fuzzy name match **and** PostGIS proximity (skip candidates within ~150 m of an existing same-name place). Mark `dedup_status` (new / likely-dup / dup).
4. **Review sheet** — write candidates to a Google Sheet (or CSV) for bulk human review (see schema below).
5. **Upload approved** — a script reads rows where `approved = TRUE` and upserts into Supabase `places` (via the service key). Optionally route through the existing `suggestions` table + admin panel instead (see "Review surface").

## Review sheet schema (columns)
`name` · `category` (=School) · `description` · `address` · `city` · `state` · `lat` · `lng` · `phone` · `email` · `website` · `social_handle` · `image_url` (candidate photo, prefer og:image) · `source_url` (where found) · `confidence` (agent 0–1) · `dedup_status` (new/likely-dup/dup) · `matched_place_id` (if dup) · `approved` (human ✔) · `reviewer_notes`

## Review surface — one decision
- **Google Sheet (recommended for the first big sweep):** best for bulk triage/edit of many rows; then a small upload script → `places`. More to build.
- **Reuse the existing `suggestions` table + admin panel** (`app/admin/suggestions.tsx`): agent inserts candidates as `suggestions`, you approve in the UI you already have, approved → `places`. Least new code; weaker for bulk (one-at-a-time). Good as the *ongoing* engine after the first sweep.

## Images (answered)
Include candidate images — they help the reviewer verify and locate a place. Best source: the school's own website **`og:image`** meta tag (publicly intended for sharing); fallbacks: directory/profile images. Store the **URL + attribution** in the sheet; re-hosting to Supabase storage is a later, rights-aware step. Google Places photos don't apply (these schools aren't on Google).

## Reuse pointers (existing repo)
- `scripts/import-mosques.ts` — the existing Google-Places importer pattern (Supabase upsert, env keys).
- `.env.local` — `SUPABASE_SERVICE_KEY`, `GOOGLE_PLACES_API_KEY` / `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` (Geocoding uses the same Google key).
- Supabase `places` (PostGIS `location` column for proximity), `suggestions` (community submissions + admin approval flow).
- **RLS reminder:** `places` writes are admin/service-role only — do the upload server-side with the service key, never the anon key.

## Suggested build
- A Node/TS script or small agent under `scripts/` (e.g. `scripts/enrich-schools/`): `discover.ts` (search+fetch+extract), `geocode.ts`, `dedupe.ts`, `to-sheet.ts`, `upload-approved.ts`.
- Or drive discovery via an agent loop (search → fetch → structured extract with a zod schema), writing rows to the sheet; keep `upload-approved.ts` a dumb deterministic upsert.
- Add a `source` / `source_url` / `verified_at` column to `places` (migration) if you want provenance tracking.

## Definition of done (first slice)
- Runs for **Lagos schools**, produces a review sheet of **N deduped candidates** with coords + source + a candidate image URL each.
- Human approves a subset; `upload-approved` upserts them into `places`; they appear in Explore.
- Zero unapproved rows reach `places`. No locked-platform scraping. Pipeline is re-runnable for the next region.
