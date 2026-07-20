# Claude Code — Phase 0 Kickoff Prompt

Paste the block below into Claude Code, run from the **Minaroute repo root**.

---

You are building inside the existing **Minaroute** Expo / React Native repo (this folder). We are adding the **Manasik pilgrimage mode** to the app — not creating a new app. Do NOT re-scaffold. Reuse the existing Expo app, the Supabase client (`lib/supabase.native.ts` / `.web.ts`), the existing Supabase admin auth, and the `places` / `events` data.

Read these first, in order:
1. `docs/product-architecture.md` — what we're building (Minaroute everyday shell + Manasik pilgrimage mode; the principle is "modes, not a blend" — worship is a full-screen takeover, not a tab).
2. `docs/minaroute-codebase-notes.md` — the current codebase and the locked stack decisions.
3. `docs/product-roadmap.md` — find **Phase 0** and work its tasks in order.
4. For each task, read only the referenced sections of `docs/prd.md` and `docs/design.md` that the phase lists — not the whole files.

Locked stack (already present in Minaroute or decided):
- Expo + Expo Router (iOS, Android, web).
- **Supabase** (Postgres/PostGIS) + **Supabase Auth** — anonymous-first sign-in, **Row-Level Security** for ownership. No Convex, no Clerk.
- **expo-maps** for everyday discovery; a **bundled static Haram map** (sites + gates, always offline) for pilgrimage wayfinding. No Mapbox.
- **Quicksand** is the default UI font, wired through a single swappable font token (**Satoshi** is the alternate); **Amiri** for Arabic/sacred text.
- Rite content is **bundled on-device** as versioned JSON (works fully offline); Supabase is only a sync/enhancement layer, never a dependency on the rite path.

How to work:
- Start at the **first unchecked task** in Phase 0 and go in order — don't skip.
- After finishing each task, change its `- [ ]` to `- [x]` in `docs/product-roadmap.md` and update the status line.
- Append a short dated entry to `docs/build-log.md` after each task or meaningful decision. If you deviate from the spec or make a real UI/design change, note it there AND update the relevant doc (`design.md` / `screens.md` / `prd.md`) so it doesn't drift.
- Test the core and offline paths in airplane mode where relevant.
- Before finishing Phase 0, **audit that Row-Level Security is enabled on every user table** (the Supabase anon key is public; RLS is the only protection).
- When Phase 0 is complete, create a branch `phase-0/foundation`, commit, push, and open a PR.

Begin now: read the docs above, confirm the first unchecked Phase 0 task, then start.

---
