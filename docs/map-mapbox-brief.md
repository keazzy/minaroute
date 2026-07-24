# Handoff Brief — Map: migrate to Mapbox + marker/UX updates

> Paste into a fresh chat to do the map work on its own branch + EAS dev build. This is the **everyday discovery** map (Explore / search-results) — not the pilgrimage Haram map. Owner will provide marker/style specifics in-chat.

## Goal
Move the everyday discovery map from **expo-maps (native) + Leaflet (web)** to **Mapbox**, restyle the markers, and polish a few map interactions.

## Scope boundary — read first
- **Discovery map only** (Explore + search-results). The **pilgrimage wayfinding** Haram map stays a bundled, offline, purpose-built map per the locked pilgrimage decision — Mapbox is not for the sacred offline path. (That map isn't built yet — Phase 3 — so there's nothing to break; just don't repurpose this Mapbox work for it.)
- **Keep the component API stable.** Consumers (`app/home.tsx`, `app/home.ios.tsx`, `app/search-results.ios.tsx`) use a `MapView` + `Marker` interface from `components/map*`. Swap the *internals*, keep the exported props, so those screens need minimal change.

## Current state
- **Native:** `expo-maps` — `components/map.ios.tsx` (AppleMaps), `map.android.tsx` (GoogleMaps), `map.tsx` (shared types/handle: `MapViewHandle`, `Marker`, `PROVIDER_*`).
- **Web:** Leaflet / react-leaflet — `components/map.web.tsx` (OpenStreetMap tiles).
- **Consumers:** `app/home.tsx` / `home.ios.tsx` (Explore: map + bottom sheet, category filter, current-location button, `INITIAL_REGION` = Lagos, pin → place card), `app/search-results.ios.tsx`.
- Pins come from Supabase `places` (900+ mosques + growing schools).

## Recommended tech
- **Native: `@rnmapbox/maps`** (official RN Mapbox SDK). It's a **native module** → needs a **config plugin + a fresh EAS dev build** (not a JS-only swap, not Expo Go). Requires a Mapbox **public access token** (runtime) *and* a **secret download token** (native install).
- **Web:** either `mapbox-gl` (vector, richer) or keep **Leaflet with Mapbox raster tiles** (lighter). Decide based on how much web parity you want.
- Preserve the platform-split file pattern (`map.ios/android/web`).

## Tokens / config
- `MAPBOX_ACCESS_TOKEN` is **already in `.env.local`** (added by the schools geocoding work) — the public runtime token.
- `@rnmapbox/maps` also needs a **secret download token** (`RNMapboxMapsDownloadToken`) for install — put it in the config plugin via **EAS secret / env**, **never commit it**.
- Once expo-maps is removed, **retire the Google Maps key** in `app.config.ts` (the restricted `GOOGLE_MAPS_KEY` we wired) — no longer needed for native rendering.

## The "map experience" to preserve/upgrade
- Keep: map + bottom sheet, category filtering, tap-pin → place card, recenter/current-location, Lagos initial region.
- **Markers:** restyle per owner spec (custom category icons + selected state).
- **Clustering:** with 900+ places (and growing), add Mapbox clustering for performance + legibility.

## Guardrails
- **Locked-stack deviation:** the docs chose *expo-maps for discovery, no Mapbox* (`docs/minaroute-codebase-notes.md`, `docs/product-architecture.md`). This changes that — **update those two docs' map decision when done**. (Mapbox is already the geocoder, so the stack is already partly Mapbox — this is a sanctioned evolution, just record it.)
- **Native + tokens → branch + fresh EAS dev build**; verify on device (owner builds via EAS as before; local `expo run:ios` is blocked by the Xcode-27-beta UIScene issue documented in the build log).
- Don't commit any Mapbox **secret/download** token.

## Reuse pointers
- `components/map.tsx` / `.ios.tsx` / `.android.tsx` / `.web.tsx` — the split to replace.
- `app/home.tsx` — main consumer (INITIAL_REGION, marker rendering, pin tap handlers, category filter).
- `.env.local` → `MAPBOX_ACCESS_TOKEN`.
- `docs/build-log.md` — log the migration + the doc-deviation there.

## Owner provides in-chat
Marker design (icons per category, selected state), Mapbox **style URL** (light/custom), clustering preference, web-parity choice (mapbox-gl vs Leaflet+tiles), and the other small UX tweaks.
