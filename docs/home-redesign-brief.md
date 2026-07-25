# Handoff Brief — Home tab: discovery-first redesign

> Paste into a fresh chat to build the Home tab on its own branch (`feat/home-redesign`). This is the **Home tab** (`app/(tabs)/index.tsx`) — *not* the map discovery screen (`app/home.tsx` → Explore). Owner provides the remaining screen states and the place-detail UI in-chat.

**Figma:** `https://www.figma.com/design/uZHyS8lJY0wuHrDI1FgQ59/Untitled?node-id=270-2338` (node `270:2338`, iPhone 16, 393×2096)

## Goal

Replace the placeholder Home tab with the discovery-first home from the Figma: greeting + search + category rail + three content carousels + an Umrah entry point. Home becomes the curated browse surface; Explore stays the map.

## Scope boundary — read first

- **`app/(tabs)/index.tsx` only.** The map screen (`app/home.tsx` / `home.ios.tsx`, reached via the Explore tab and the `/home` route) is **out of scope** — do not touch it. It has a live Mapbox migration parked on `feat/mapbox-discovery-map`; edits here will conflict.
- **Home does not become a map.** No `MapView` on this screen.
- The place **detail** screen is deliberately deferred (see *Deferred*). Card taps use the existing map-pin deep link in the interim.

## Current state

`app/(tabs)/index.tsx` is an 85-line placeholder: greeting, a Trips hero card, an Explore card, and four hardcoded chip labels that all `router.push('/(tabs)/explore')`. **No data fetching, no search, no real categories.** Nothing depends on it — replace it wholesale.

It is already on the **new** token system (`src/theme/tokens.ts`), unlike the map stack which uses the older `constants/theme.ts` + `hooks/use-theme.ts` palette. Keep Home on the new tokens; that split stays quarantined in Explore and is not this brief's problem.

## Decisions locked

| Decision | Call |
|---|---|
| Home's identity | **Discovery-first**, per the Figma. `docs/prd.md` and `docs/screens.md` currently spec Home as the pilgrimage countdown screen — **both are stale and must be updated as part of this work.** `docs/product-architecture.md` already agrees with the Figma. |
| Rating scale | **0–10**, one decimal (matches the `9.0` in the Figma). Not 0–5 stars. Bake into schema *and* component. |
| Missing ratings | Nullable. Badge renders **only** when a rating exists — no placeholder, no zero. Most places will have none at launch. |
| Price | Belongs to **events/things-to-do only** (third-party ticketed). Never on mosques/schools. |
| Umrah countdown | The bottom promo card is the **no-trip** state. When a trip exists, a **countdown card appears near the top** (below the location row, above the category rail) and the bottom promo drops away. Clickable → Trips. |
| Distance units | **km**, not miles. The Figma's "~15 miles" is placeholder copy. |
| Google Places | **Ruled out** as a data source — both API keys denied, *and* Google's ToS forbids displaying Google-derived POI data on a non-Google map (we're on Mapbox). Do not plan around it. |

## Step 0 — extract the data layer before building UI

**Do this first.** Today `app/home.tsx`, `app/home.ios.tsx`, `app/search-results.tsx` and `app/search-results.ios.tsx` **each contain their own copy** of the Supabase URL, anon key, and a raw `fetch` against the REST API. Home would be a fifth copy — and this brief adds columns to both tables, so every copy would need the same edit.

Extract to a shared module (suggested: `src/lib/places/`):

- `usePlaces()` — all places, one fetch, shared
- `useNearbyPlaces(coords, limit)` — distance-sorted, wraps `usePlaces`
- `useEvents({ upcoming, limit })` — date-filtered
- `useUserLocation()` — lifts the `{ userCoords, permissionStatus }` pattern currently duplicated across six files

Route these through the installed `@supabase/supabase-js` client (`lib/supabase.native.ts` / `.web.ts`) rather than raw `fetch`. Move `haversineKm()` — currently duplicated in three files — into one util.

No caching library is installed (`react-query`/`SWR` are absent). Either add one or hand-roll a simple module-level cache; either is fine, but Home switching tabs must not refetch every time.

**Migrate the existing four screens onto the hooks in the same pass.** Leaving them on raw `fetch` recreates the problem this step exists to solve.

*Separate, not blocking:* confirm RLS is enabled on `places` and `events`. The anon key is public by design; RLS is what actually protects the data.

## Data gaps and how we close them

### Ratings — schema now, data later

Nothing in `places` carries a rating today, and there is no reviews table (`supabase/migrations/` has only pilgrimage, provenance, and category-normalization migrations).

Add to `places`:

| Column | Type | Notes |
|---|---|---|
| `rating` | `numeric(3,1)` nullable | 0.0–10.0 |
| `rating_count` | `int` default 0 | drives "(N sources)" / "(N reviews)" |
| `rating_source` | `text` nullable | `'first_party' \| 'foursquare' \| …` — never mix scales silently |

Sourcing, in priority order:

1. **First-party reviews.** The Review tab already exists in the nav (`app/(tabs)/review.tsx`), so this is in the product plan. It's the compounding asset — nobody else will have review data on Lagos mosques and Muslim schools. Cold-start is the cost.
2. **Foursquare Places API.** The one third-party source that licenses ratings for display and uses a native 0–10 scale. Lagos coverage is weaker than Google's but non-zero; would seed the badge for larger/commercial places.
3. **Provenance as a separate signal.** `places` already has `source_url`, `verified`, `verified_at`, `source_notes` from the schools-enrichment pipeline. "Verified" / "3 sources agree" is trustworthy information we uniquely have — surface it as its **own chip**, not as a rating. Note the verification model is deliberately conservative: `verified=false` at upload, badge only via on-ground/owner verification.

The Figma's "One of the best (1 source)" line conflates these. Keep them separate: rating badge = rating; provenance chip = provenance.

### Events — third-party ingestion + manual entry

`events` today has: `id, title, description, location_name, city, state, photo` (single), `approved`, `tags` (comma-separated string), and **no dates, no coordinates, no price, no attendance**. "Events coming up soon" and "things to do this weekend" cannot be ordered or filtered at all until this is fixed.

Owner is integrating third-party sources **plus manual entry**. Schema must serve both — every third-party field nullable so a hand-added event is valid.

**Source research is complete, and the honest finding is that no major platform has usable Lagos Islamic event coverage.** Ranked plan:

1. **Bitooqoh** (`bitooqoh.com`) — a Nigerian, Muslim-focused ticketing platform, and by far the best fit in the landscape. Unauthenticated public JSON endpoint (`bitooqoh-server-prod.onrender.com/api/v1/event/get-events/all`) returning ~25 events, ~16 of 20 upcoming genuinely Islamic, 11 Lagos venues, NGN, growing ~11/month. Real organisers: MSSN UI, Alhabibiyyah Islamic Centre, Muslimah's Haven, AMALEN. Rich ticket tiers. Public URL is constructible as `bitooqoh.com/explore/<slug>`.
   **Caveat — resolve before shipping:** the API is undocumented and unsanctioned; the site has no `/terms`, `/privacy` or `/developers` page. Nothing forbids use, but nothing permits it either. **Email them for written permission first.** This is consistent with the project's existing human-in-the-loop sourcing guardrails, and a young Muslim-focused startup will likely welcome the distribution — which converts a fragile scrape into a real partnership.
2. **Manual entry — first-class admin surface, not a fallback.** Lagos's biggest Islamic events run their own bespoke portals and appear on no aggregator: MSSN Lagos Annual Conference (`mac.mssnlagos.net`), 1Ummah Peace & Unity Convention (`1ummahng.org`). No iCal feeds anywhere. Manual entry is the only path to the highest-value events in the city — budget it as core product, alongside the existing `app/admin/events.tsx`.
3. **Per-organiser adapters, one at a time.** `1ummahng.org` exposes a public WooCommerce Store API with live ticket products and prices. Only worth building once an organiser recurs; do not build a generic scraper.

**Do not integrate Eventbrite or Luma.** Verified against the live APIs, not the docs: Eventbrite's `/v3/events/search/` returns **404 — the discovery endpoint is gone**, other organisers' events 403 without org membership, and its API Terms forbid storing past-event content, require a crawlable non-`nofollow` backlink (incoherent for a mobile app), and §3.6(9) bars building a product that competes with Eventbrite — which Minaroute does. Lagos coverage is ~1–2 genuinely Islamic events regardless. Luma (note: `lu.ma` now redirects to `luma.com`) requires a paid Luma Plus subscription, is own-calendar-only with no discovery, and has **zero** Islamic events in Lagos. AllEvents.in is enterprise sales-gated *and* returns zero Islamic Lagos events. Facebook Events has been ungranted since 2018 and is barred by our own guardrail anyway.

Add to `events`:

| Column | Type | Notes |
|---|---|---|
| `starts_at` / `ends_at` | `timestamptz` | **the unblocker** — required for both sections |
| `timezone` | `text` | events are local-time things |
| `latitude` / `longitude` | `double precision` nullable | events have no coords today, and **no source provides them** — every event pin must come from our own geocoding |
| `photos` | `text[]` | replaces single `photo`; enables the carousel dots. Keep `photo` during migration, backfill, then drop |
| `price_min` / `price_max` | `numeric` nullable | null = free or unknown |
| `currency` | `text` | **NGN default** — do not hardcode `$` as the Figma does |
| `attendee_count` | `int` nullable | **no source provides this** — manual entry only. See the design note below. |
| `category` | `text` nullable | **no source provides this either** — we classify on ingest |
| `ticket_url` | `text` nullable | |
| `source` | `text` | `'manual' \| 'eventbrite' \| …` |
| `external_id` | `text` nullable | + unique index on `(source, external_id)` for idempotent re-ingest |

Validate every external payload with **`zod`** (already installed) at the ingestion boundary. Never trust a third-party shape.

**Two design consequences that change the Figma:**

- **The "5,000 People attending" badge cannot be populated.** No source in the landscape — Bitooqoh, WooCommerce, or otherwise — exposes attendance or interest counts. Either cut the badge, replace it with something we *do* have (price, ticket tiers, organiser, "free"), or accept it only ever renders for hand-entered events. **Owner decision.**
- **Event categories must be derived.** No source tags events by category, so the "Events Nearby" filter and any event categorisation depend on our own classification at ingest.

**Geocoding:** since no source ships coordinates, event pins come from our own Mapbox geocoding — and Mapbox's terms make geocoding *temporary by default*. To store lat/lng in our DB the call **must** use `permanent=true` ($5/1k vs $0.75/1k; negligible at this volume). The schools pipeline already runs Mapbox permanent geocoding — reuse that path rather than writing a second one.

## States the Figma doesn't show

The Figma is a single populated light-mode frame. All of the following need specifying — owner and implementer to work through together:

**Per section:** loading (skeleton — `HomeSheetContent.ios.tsx` already has a shimmer pattern to copy), empty, error. **Decide per section whether empty hides the section entirely** — a visible "Events coming up soon" header with nothing under it is worse than no section.

**Location row** — the Figma shows only the *not-yet-granted* state:
- not asked → "Looking for something nearby? / Allow location access" (as drawn)
- **granted → what?** Proposed: collapses to "Lagos, Nigeria · Change". Needs owner call.
- denied → needs a distinct state with a route to Settings (`Linking.openSettings()`)
- **"Places around you" has no meaning without location.** Decide the fallback: hide the section, or show city-wide/popular places with the distance line omitted.

**Trip state** — none (bottom promo, as drawn) / planned (top countdown card) / in-progress. Note `docs/screens.md`'s "always exactly one clear next step" rule should survive for mid-trip users.

**Data-conditional:** rating present/absent, attendance present/absent, price present/absent, single photo (no dots) vs multiple, missing image (`place-card.tsx` already has per-type local fallbacks — reuse them).

**Also unspecified:** Android, tablet/large-text, RTL (i18n has `isRTL()` and Arabic is a target language), offline.

## Dark mode

**`src/theme/tokens.ts` has no dark mode.** `primaryDark`/`accentDark` are darker *brand* shades, not a dark theme, and `ThemeProvider` only swaps fonts. The old `hooks/use-theme.ts` has light/dark, but Home is on the new system.

To make Home dark-capable, `tokens.ts` needs restructuring into two palettes behind a hook:

```ts
const light = { … }; const dark = { … };
export const colors = light;              // keeps existing static imports working
export function useColors() { … }         // scheme-aware; new code uses this
```

The static `colors.x` export must stay so the ~dozen existing consumers don't break, but **anything colour-related in Home must read from the hook** — values captured in `StyleSheet.create` at module load cannot react to a scheme change.

**Owner design input needed:** the light palette is warm cream (`surfaceSunken #F2EDE3`, `border #E8E2D6`). A dark counterpart should be *warm* dark, not the generic `#151718` the old system uses. Those values are a design decision, not an implementation one.

Suggested scope: ship Home light-first but **built against `useColors()` from day one**, with the dark palette landing in the same brief. Retrofitting a screen that hardcoded light values is far more expensive.

## Component inventory

**Build new** (none of these exist): search bar (Home's is a *tappable stub* → `/search-results?focus=1`, not an editable input — copy the existing pattern), category tile (pastel, 100×100, 32pt icon — the current `CategoryCard.tsx` is 140×150 image-background, wrong shape), image carousel + dots, rating badge, attendance badge, section header with horizontal `FlatList`, countdown card, promo card, avatar.

**Reuse:** `src/components/ui/` primitives (`Text`, `Card`, `Button`), `SectionHeader`, skeleton shimmer from `HomeSheetContent.ios.tsx`, `place-card.tsx`'s image-fallback logic, `expo-image` (installed) for card imagery.

**Category rail mismatch:** the Figma shows **6** tiles ("Mosques", "Learning center", "Events Nearby", + 3 partly cut off). `constants/mockData.ts` defines **4** (`mosque`, `school`, `event`, `halal_food`). Owner must name the extra two and supply the pastel palette — those colours exist in neither token system and will need adding.

## Build order

1. Data layer extraction + hooks (Step 0), existing screens migrated
2. Migrations: `places.rating*`, `events.*` — plus backfill/ingestion for events
3. `tokens.ts` dark-mode restructure + category palette
4. Presentational components, in isolation (`app/gallery.tsx` is a live component gallery — use it)
5. Home screen assembly
6. Countdown/trip state
7. States: loading, empty, error, permission variants
8. Update `docs/prd.md` + `docs/screens.md` Home sections; log in `docs/build-log.md`

Items 1–3 are unglamorous and land no visible UI. Doing them after the screen means rewriting the screen.

## Guardrails

- **Doc deviation:** this changes Home's purpose as specified in `prd.md` and `screens.md`. Updating both is part of the work, not a follow-up.
- **i18n:** the entire discovery stack is hardcoded English. Home is on the translated side — use `t()` and add keys to `src/content/strings.en.json`. Only four `home.*` keys exist today.
- **No scraping** Instagram/Facebook/TikTok — existing hard guardrail from the schools pipeline; it applies to event sourcing too.
- **Third-party ToS:** verify caching/display rights before storing any external event or rating data. Google is already ruled out on these grounds.
- **No secrets committed.** Event platform API keys go in `.env.local` / EAS secrets.
- Currency is **NGN**-first; don't inherit the Figma's `$`.

## Deferred

- **Place detail screen.** Owner is providing UI separately. Until then, card taps use the existing deep link: `router.push({ pathname: '/home', params: { placeId } })` → opens the pin on the Explore map. Keep the tap handler in one place so swapping the destination is a one-line change.
- Web parity — Home is native-first; `react-native-web` is present but the Figma is a phone frame.

## Reuse pointers

- `app/(tabs)/index.tsx` — the file being replaced
- `src/theme/tokens.ts` — tokens; needs the dark restructure
- `constants/mockData.ts` — `CATEGORIES`, `toCategorySlug()`
- `components/HomeSheetContent.ios.tsx` — closest existing layout (greeting, category rail, nearby list, shimmer)
- `components/place-card.tsx`, `components/CategoryCard.tsx` — shape is wrong for the Figma, but the fallback/tag logic is reusable
- `app/search-results.tsx:228` — route params Home must send: `{ category?, searchQuery?, focus? }`. `category` is a **display name** (`"Islamic Schools"`), not a slug.
- `app/gallery.tsx` — component gallery for building in isolation
- `supabase/migrations/` — `0004` is the latest; new migrations start at `0005`
- `docs/design.md` — token source of truth (tokens.ts is generated from its front matter); § line 186 sets the discovery register
- `docs/build-log.md` — log the work + the doc deviation

## Owner provides in-chat

1. **Bitooqoh permission** — email them for written API permission before we ship the adapter (research done; they're the recommended primary source)
2. **The attendance badge** — cut it, replace it, or accept it renders only for hand-entered events (no API provides the data)
3. **The extra two category tiles** + the pastel tile palette
4. **Dark palette** values (warm-dark, to match the cream light theme)
5. **Location-granted and location-denied** row designs
6. **Empty / loading / error** treatment per section — and whether empty sections hide
7. **Countdown card** design for the top slot (the Figma only has the no-trip promo)
8. **Place detail** UI (deferred — separate discussion)
9. Whether the promo image (Haram at sunset) ships bundled or remote
