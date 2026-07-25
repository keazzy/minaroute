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

**Three independent research sweeps ran (2026-07-25) and converged on the same answer: Lagos Islamic events are not on ticketing rails at all.** They are free, mosque- and organisation-hosted, and promoted via WhatsApp and Instagram. The strategic consequence: **automated ingestion is a UK/US capability; Lagos — the primary market — is human curation.** If the roadmap assumes automated Lagos ingest, retire that assumption now.

The two hardest data points, both from exhaustive enumeration rather than sampling:

- `allevents.in` returns **zero** Islamic events not only in Lagos but in Kano, Sokoto, Maiduguri, Ilorin and Kaduna — the majority-Muslim north. Zero coverage there is the strongest signal in the whole survey.
- `tix.africa`'s **entire** Nigerian catalogue (192 events) scanned against 30 Islamic keywords: **zero hits**.

#### Lagos (primary market)

1. **Manual entry — the product, not a fallback.** Lagos's biggest Islamic events run bespoke microsites and appear on no platform. MSSN Lagos runs the **115th** Islamic Vacation Course (25 Dec–1 Jan, Epe, ₦9,000–20,000) at `event.mssnlagos.net` — the 115th iteration of a recurring event, on zero ticketing rails. NASFAT, Nigeria's largest Muslim organisation, publishes no structured events. The sharpest single finding: **Lekki Central Mosque has The Events Calendar plugin installed and its REST endpoint returns `{"events":[],"total":0}`** — the infrastructure exists in Lagos; the data doesn't. Manual-entry *quality* is the product here. Budget it as core surface alongside `app/admin/events.tsx`.
2. **Tickethub.ng** — lowest yield (1 Islamic event found) but **the best legal footing of any source surveyed**: its `robots.txt` explicitly allows ClaudeBot and it publishes an `llms.txt`. That is affirmative permission, which nothing else here has. `rx.tickethub.ng/api/v1/events?q=&per_page=100`, no auth (use `q=`, not `search=` — the latter is silently ignored). Worth wiring precisely *because* we're permitted to.
3. **Bitooqoh** (`bitooqoh.com`) — best yield: unauthenticated JSON at `bitooqoh-server-prod.onrender.com/api/v1/event/get-events/all`, ~25 events, ~16 of 20 upcoming genuinely Islamic, 11 Lagos venues, NGN, growing ~11/month. Organisers include MSSN UI, Alhabibiyyah Islamic Centre, Muslimah's Haven, AMALEN. Rich ticket tiers; URLs constructible as `bitooqoh.com/explore/<slug>`.
   **Resolve before shipping:** the API is undocumented and unsanctioned — no `/terms`, `/privacy` or `/developers` page exists. Nothing forbids use; nothing permits it either. **Email for written permission first**, consistent with the project's existing human-in-the-loop sourcing guardrails. A young Muslim-focused startup will likely welcome the distribution, turning a fragile scrape into a partnership.
4. **Curation inputs, not feeds:** `muslimnews.com.ng` has live RSS with permissive robots.txt — announcements to curate by hand. `masjid.imaanity.com` lists 68+ Lagos masjids with Jumu'ah times; no API, but a strong **venue seed list and partnership target**. Direct relationships with MSSN Lagos, NASFAT, MULAN, MYSF and Lekki Muslim Ummah will outperform every API here combined.

**Seed these manually** — all verified real, none on an ingestible feed: MSSN Lagos 115th Islamic Vacation Course (25 Dec–1 Jan, Epe); Ibn Awf Conference (1 Aug 2026, Ikorodu — Shariah-compliant finance); Project Code-Hijabi PCH Ball (LASU, 14 Nov 2026).

#### UK/US (later phase — do not build for launch)

5. **A JSON-LD `Event` extractor** is the highest-leverage single build: standards-based, and one parser unlocks **muslimevent.co.uk** (78 event URLs in sitemap, clean schema.org `Event` markup, 29 UK cities, `robots.txt` permits it, ToS has no scraping/caching/redistribution clauses) plus likely **Qariyb** (Islam-native fields — halal food, gender-based seating, wudu facilities; partnership candidate).
6. **A The Events Calendar connector** — mosques on WordPress + TEC expose `/wp-json/tribe/events/v1/events` unauthenticated, with `modified_utc` for cheap incremental sync and iCal as fallback. Verified live: Islamic Center of Southern California **671** upcoming, MCC East Bay **135**, Cambridge Central Mosque **32**. This is the *same population* as JSON-LD on mosque sites (the plugin emits both), so REST is strictly better. Coverage is partial — ~5 of 16 mosques probed had the plugin. Honour `Crawl-delay` where set.

#### Do not integrate

**`allevents.in`** — ToS explicitly bans crawling/scraping **and** using its content to train ML/AI models; zero Islamic events nationwide regardless. **`tix.africa`** — ToS §9 requires a commercial licence plus attribution, and its schema has no end date, timezone or coordinates. **TIXVNT** — ToS explicitly bans compiling a database. **Eventbrite** — `/v3/events/search/` returns **404**; discovery is deleted, not auth-gated. Other organisers' events 403 without org membership. Terms forbid retaining past-event content, require a crawlable non-`nofollow` backlink (incoherent for a mobile app), and §3.6(9) bars products competing with Eventbrite — which Minaroute is. **Luma** (`lu.ma` now redirects to `luma.com`) — paid Luma Plus tier, own-calendar-only, no discovery, zero Islamic events in Lagos. **Meetup** — ~$30/mo for OAuth access, no Muslim groups in Lagos at all. **Facebook/Instagram Events** — Marketing-Partners-only since 2018, no public location search, barred by our own guardrail regardless; note `pages_events` is a *write* permission for ads conversions, not read access. **Muslim Pro, HalalTrip, Mvslim, Muslim Central** — no event APIs; Mvslim dormant since 2022, Muslim Central is a podcast network. **Nairabox, Selar, Shows.ng, Afritickets, Ticketmaster** — dead, gutted, or no Nigeria coverage.

Ignore any "International Conference on Islamic Culture, Society and Identity — Lagos" listings on conference-index sites — predatory conference-mill entries auto-generated across hundreds of cities, not real events.

#### Dedup is required, not optional

Project Code-Hijabi appears on **both** Bitooqoh and Tickethub. The `(source, external_id)` unique index below handles re-ingest from one source but not the same event arriving from two. Add fuzzy title+date matching — and at these volumes, a **human review step beats clever matching**, consistent with how the schools pipeline already works.

> **Launch-volume reality — read before building three carousels.** The Figma has *three* content sections. Every ingestible Lagos source combined yields roughly **17 upcoming Islamic events**, minus duplicates. That will not convincingly fill "Events coming up soon" **and** "Things to do this weekend in Lagos" on day one. This is the strongest argument for the empty-section decision below, and possibly for **shipping fewer sections at launch** and adding them as curation builds inventory. Worth settling before any carousel is built.

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

1. **Bitooqoh permission** — email them for written API permission before we ship that adapter (Tickethub needs no such ask; its robots.txt already permits us)
2. **How many carousels ship at launch**, given ~17 ingestible Lagos events total — three sections may look empty
3. **The attendance badge** — cut it, replace it, or accept it renders only for hand-entered events (no API provides the data)
4. **The extra two category tiles** + the pastel tile palette
5. **Dark palette** values (warm-dark, to match the cream light theme)
6. **Location-granted and location-denied** row designs
7. **Empty / loading / error** treatment per section — and whether empty sections hide
8. **Countdown card** design for the top slot (the Figma only has the no-trip promo)
9. **Place detail** UI (deferred — separate discussion)
10. Whether the promo image (Haram at sunset) ships bundled or remote
