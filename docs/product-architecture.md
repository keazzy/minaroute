# Product Architecture — Minaroute (with the Manasik pilgrimage mode)

> The authoritative definition of what we're building and how the pieces fit. Read this first — it reconciles all other docs in `docs/`. Where an existing doc says "Manasik" as if it were the whole app, read it as **the pilgrimage mode inside Minaroute**.

## What Minaroute is

Minaroute is one app with two connected jobs:

1. **Everyday** — help Muslims find and support **Muslim-friendly places** (mosques, Islamic schools, halal food, events, stays) through a community-driven directory that surfaces places Google doesn't list or clearly label.
2. **Pilgrimage** — prepare pilgrims from home and guide them, location-aware and offline, through every rite of **Umrah and Hajj**.

The everyday layer is the retention hook and acquisition engine (people actively search for Muslim schools, halal food, and events, and it keeps the app installed year-round). The pilgrimage layer is the wedge and moat — the deep, differentiated experience that the everyday app funnels the highest-intent users into.

## Brand

**Minaroute** is the umbrella brand and the everyday identity. **Manasik** (Arabic for "the rites of pilgrimage") is the name of the **pilgrimage mode** — it appears when a user enters guided Umrah/Hajj. Each name sits where its meaning fits: Minaroute (finding your way) for everyday discovery, Manasik (the rites) for the sacred mode.

## The core principle: modes, not a blend

**Browsing lives in tabs. Worship is a takeover.** The everyday shell is lively and dense; the pilgrimage mode is calm, focused, and offline. The rite guide never lives inside the feed. When guidance is active, the everyday chrome disappears so worship stays uncluttered. Both share one backend, one design system, and one community directory — but not the same screen.

## Navigation

### Everyday shell — 4-tab bottom nav

- **Home** — curated launchpad: find places, categories, and suggested pilgrimage (Hajj/Umrah). Can also launch the pilgrimage hub.
- **Explore** — map-first search for Muslim-friendly places near you (the original Minaroute core).
- **Trips** — the **pilgrimage hub** (Hajj/Umrah only; no leisure travel here): set up your pilgrimage, see your countdown, preparation progress, and next steps, and launch the guided experience. Reachable from Home too.
- **Review** — community contributions and reviews: the data moat. Muslim schools, mosques, halal stays, events, Muslim-owned businesses.
- *(Feed — social/video: Hajj vlogs, scholar interviews, recommendations — **shelved for post-MVP.**)*

### Pilgrimage mode (Manasik) — full-screen takeover, no tabs

Launched from the Trips hub via "Start guided Umrah." A brief hand-off ("Entering guided mode · Bismillah"), then a focused space with a minimal top bar and a visible exit (✕ → back to the shell). It contains the flows specced elsewhere: **Prepare** (checklist, learning) → **Guide** (rite list) → **Active rite** (steps · du'a · audio · counter) → **Wayfinding** (map · gate) → exit.

See `design/minaroute-trips-hub-wireframe.html` for the hub + mode-switch, and `design/manasik-wireframe-prototype.html` + `docs/screens.md` for the pilgrimage-mode screens.

## Shared foundation

One backend (**Supabase** — Postgres/PostGIS, already running in Minaroute), one design system (`docs/design.md`), and — critically — **one community directory**. The directory powers everyday Explore/Review **and** the "halal places near the Haram" marketplace layer inside pilgrimage mode. Building it once serves both jobs.

## MVP scope & sequencing

Minaroute's everyday discovery and community directory **already exist**. The MVP build therefore focuses on **the pilgrimage mode (Manasik), dropped into the existing shell as the Trips tab + takeover**, reusing the directory. Everyday discovery keeps running as-is; Feed is deferred. This keeps the differentiated pilgrimage wedge first and the scope achievable for a solo, part-time founder.

The whole pilgrimage-mode plan already written — `product-vision.md`, `prd.md`, `product-roadmap.md`, `design.md`, `screens.md` — remains valid; it describes the Manasik mode. This document is the wrapper that places it inside Minaroute.

## Strategic guardrails

- **Keep the everyday layer narrow.** It's *finding Muslim-friendly places* — a discovery niche. Do not expand into prayer times, Quran, or a full super-app, where Muslim Pro dominates.
- **Protect the sacred mode.** No ads, feeds, or commercial energy inside pilgrimage mode. Tasteful commerce (place listings, near-Haram marketplace) lives in the everyday layer and the marketplace surface, never on a rite screen.
- **Win one community first.** Community data is only useful when dense — nail coverage in Lagos before spreading wide.
- **Pilgrimage is the hero; discovery is the hook.** If that hierarchy ever inverts, we've traded a winnable category for an unwinnable one.

## How the docs map

| Doc | Now describes |
|---|---|
| `product-architecture.md` (this) | The whole product: Minaroute shell + Manasik mode |
| `vision.json` | Source of truth for the merged product |
| `product-vision.md` | Strategy & brand — pilgrimage-heavy; the Manasik mode + brand foundation |
| `prd.md` | Technical spec for the pilgrimage mode (the MVP build) |
| `product-roadmap.md` | Build plan for the pilgrimage mode into the shell |
| `design.md` | Shared design system (both modes) |
| `screens.md` | Pilgrimage-mode screens; shell/hub context |
| `gtm.md` | Go-to-market for the merged product |
