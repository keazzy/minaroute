# Minaroute Codebase — Findings & Integration Notes

> A survey of the existing Minaroute app (folder: `minaroute/`) and how the Manasik pilgrimage mode slots into it. This is ground truth for reconciling `docs/prd.md`, `docs/design.md`, and `docs/product-roadmap.md` with what's actually built.

## What Minaroute is today

A working **Expo / React Native** app (Expo Router, React 19, RN 0.83, TypeScript) that finds Muslim-friendly places. It runs on iOS, Android, **and web** (PWA with a service worker, deployed to Vercel; native `android/` and `ios/` folders are prebuilt). Package name: `muslim-finder`.

The current experience: `index → onboarding → permission (location) → home`. Home is a **map with a bottom sheet** ("As-salam alaykum — what would you like to find today?") offering category browse (**Mosques, Islamic Schools, Events, Halal Food**), plus search results, a community **submit-place** flow, and a full **admin panel** (login, places, events, suggestions) for curating data. This matches the screenshot you shared.

Real seed data exists around **Lagos** (Ikorodu, Ketu) — imported from the Google Places API (`scripts/import-mosques.ts`) — with genuine entries like Rabiat Aliu Mosque, Gentle Pearls Schools, and Usoolul-Iman Tahfeez School.

## Actual stack

| Layer | What Minaroute uses |
|---|---|
| Framework | Expo (SDK 55 canary) + Expo Router (file-based), React 19, RN 0.83 |
| Backend / DB | **Supabase** (Postgres) — `lib/supabase.native.ts` / `.web.ts` |
| Auth | **Supabase Auth** + `expo-secure-store` |
| Maps | **expo-maps** (native `map.ios/android.tsx`) + **Leaflet / react-leaflet** (web `map.web.tsx`) |
| Location | expo-location |
| Fonts | **Quicksand** (500/700) + MingCute icons |
| UI kit | `@gorhom/bottom-sheet`, `@lodev09/react-native-true-sheet`, `expo-glass-effect` (Glass), Lottie, react-navigation |
| Data pipeline | Google Places API → Supabase importer |
| Deploy | EAS (native) + Vercel (web PWA) |

## Data model (Supabase tables)

- **`places`** — the core directory (mosques, schools, restaurants; category types: `Mosque`, `School`, `Event`, `Halal Food`).
- **`events`** — Islamic events.
- **`suggestions`** — user-submitted places awaiting admin approval (the community-contribution seed).

There is **no reviews/ratings table yet** — "suggestions" is submission, not TripAdvisor-style reviews. The **Review** tab we designed would be new.

## Key finding: the stack diverges from our specced PRD

Our `docs/prd.md` chose Convex + Clerk + Mapbox + Satoshi + RevenueCat. Minaroute already runs on a *different, working* stack. Since the app exists and rebuilding a working backend is wasteful, the recommended move is to **adopt Minaroute's stack and update our docs to match** — not migrate.

| Our PRD chose | Minaroute uses | Recommendation |
|---|---|---|
| Convex (backend/db) | **Supabase (Postgres)** | **Keep Supabase.** It does everything we need (Postgres, RLS, auth, storage, realtime). Migrating would be pure rework. |
| Clerk (auth) | **Supabase Auth** | **Keep Supabase Auth.** Already integrated with secure storage. |
| Mapbox (maps) | **expo-maps + Leaflet** | **Keep expo-maps** for everyday discovery. ⚠️ Verify offline-tile support for pilgrimage wayfinding at the Haram — if expo-maps can't do reliable offline maps, use Mapbox **only inside pilgrimage mode**, or bundle a static Haram map. |
| Satoshi (UI font) | **Quicksand** | **Decision needed.** Quicksand is very rounded, warm, and already integrated — it actually fits our "very rounded / companionable" direction well. Leaning: keep Quicksand and drop Satoshi. Amiri (Arabic) is still additive. |
| RevenueCat (payments) | none | Fine — deferred anyway. |

**Offline note:** Supabase is cloud, so the pilgrimage **rite content stays bundled on-device** as planned (Supabase powers the directory, reviews, and user data — not the offline rite path). The offline-first strategy in the PRD is unaffected by the Convex→Supabase change.

## How the Manasik mode slots in

**Reused as-is:** Expo/Expo Router app shell, Supabase backend + auth, the `places`/`events` directory and importer, the map components, bottom-sheet UI, and the Lagos seed data. The `places` directory directly powers the "halal places near the Haram" marketplace layer.

**New work (the pilgrimage mode):**
1. Add a **Trips** tab/hub and reorganize the current stack into the 4-tab shell (Home / Explore / Trips / Review) — note the bottom-tab shell and the **Review** tab don't exist yet.
2. Build the **full-screen pilgrimage takeover** (Prepare → Guide → Active rite → Wayfinding) per `docs/screens.md`.
3. Add Supabase tables for **itineraries** and **rite progress** (or on-device store for anonymous users); bundle the **Umrah rite content** (scholar-verified, with du'a audio) on-device for offline use.
4. Apply the `docs/design.md` visual system — the current `constants/theme.ts` is still the default Expo starter palette (teal `#0a7ea4`), so the emerald/sand system is greenfield to apply.

**Refines an earlier assumption:** "the everyday shell already exists" is only partly true. The **data, map, discovery, and backend exist**; the **4-tab structure, the Review/reviews system, and all pilgrimage features are new.**

## Decisions (locked)

1. **Backend & auth: Supabase + Supabase Auth** for both admin and users, with optional / anonymous-first sign-in. Not migrating to Convex/Clerk — Postgres + PostGIS suits the geospatial directory, native RLS ties authorization to the data, and it avoids rewriting a working backend. Rite content stays bundled on-device for offline.
2. **Maps: expo-maps for everyday discovery; a bundled static Haram map** (sites + gates + directional cues) for pilgrimage-mode wayfinding at MVP — always offline, calm, and purpose-built. Add Mapbox with offline tile packs later only if full pan/zoom navigation is needed.
3. **Font: Quicksand stays the default**, wired through a single font token so it can swap to **Satoshi** (Fontshare) smoothly, with a planned **Settings → Font** toggle. **Amiri** for Arabic/sacred text (not swappable).

## Housekeeping observations

- The Supabase **anon key is committed** in `lib/supabase.*.ts`. Anon keys are meant to be public, but this only stays safe if **Row-Level Security** is properly enforced on every table — worth auditing before launch.
- `.env.local` holds the service key and Google Places key (correctly gitignored) — keep it that way.
