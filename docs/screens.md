# Manasik Pilgrimage Mode — Screens & Userflows (MVP)

> **Product note:** These are the screens of the **Manasik pilgrimage mode** inside **Minaroute**. They live behind the **Trips** tab: the Trips hub (setup → countdown → next steps) sits in the everyday 4-tab shell, and "Start guided Umrah" launches this full-screen takeover (tabs hidden). For the hub + mode-switch, see `design/minaroute-trips-hub-wireframe.html`; for the merged-product definition, see `docs/product-architecture.md`.

> End-to-end screen spec for the Umrah-first MVP. Pairs with `docs/prd.md` (§ UI/UX Requirements), `docs/design.md` (tokens & components), and the wireframe at `design/manasik-wireframe-prototype.html`. Fidelity here is structural — visual styling comes from `docs/design.md`. Component names in **bold** reference that file.

## Flow overview

The MVP has four connected flows and a persistent bottom tab bar (Home · Prepare · Guide · More):

1. **Onboarding** — Welcome → Language → Travel dates → Home. No account required; target under 2 minutes.
2. **Prepare at home** (primary magic moment) — Home → Prepare (checklist/packing) → Learning module. Fully offline.
3. **On-ground rite guidance** (signature) — Guide → (geofence or "I'm here") → Arrival prompt → Active rite (steps · du'a · audio · counter) → Mark complete → Next step. Fully offline.
4. **Wayfinding** — Next step → Map (next site + gate) → arrive → Active rite.

Global rules: one clear action per screen; audio-first and glanceable; everything on the core path works offline; the gentle voice from `product-vision.md § Voice & Tone` applies to all copy.

---

## 1. Welcome
Route: `/(onboarding)/welcome` · Flow: Onboarding
Purpose: Warm first impression; establish the companion tone; start onboarding without friction.
Layout: Centered — app mark, greeting ("As-salamu alaykum"), one-line value prop, primary action, ghost secondary.
States: Single state. (First-launch only; returning users skip to Home.)
Interactions: "Get started" → Language. "I'll sign in later" → Home (anonymous). No account, no gate.
Components: **button-primary**, **button-ghost**.
Copy: "Your companion for Umrah — ready from home, guided every step."

## 2. Language
Route: `/(onboarding)/language` · Flow: Onboarding
Purpose: Pick language before any content renders (English at MVP; others architected).
Layout: Title, helper line, wrap of selectable **chip**s, primary continue.
States: Default (English pre-selected) · Selected (one chip active). Adding a language must need no code change (FR-010).
Interactions: Tap chip → selects (single). "Continue" → Dates. Back → Welcome.
Components: **chip** (selectable), **button-primary**, back control.
Notes: Show native names (العربية, اردو, Bahasa, Hausa, Français). RTL flips layout when Arabic is chosen.

## 3. Travel dates
Route: `/(onboarding)/dates` · Flow: Onboarding
Purpose: Capture Umrah/departure dates to power the countdown and prep plan.
Layout: Title, helper, two date rows (Departure, Planned Umrah day), primary + skip.
States: Empty (no dates) · Filled · Error (past date → gentle inline message). Skippable — generic prep if skipped (FR-001).
Interactions: Tap row → date picker. "Continue" → Home (persists locally). "Skip for now" → Home.
Components: **input-text**/date row, **chip**, **button-primary**, **button-ghost**.
Data: Writes `itinerary.departureDate` / `umrahDate` to the local store (works offline, no account).

## 4. Home
Route: `/(tabs)/index` · Flow: hub
Purpose: Orient the pilgrim — countdown before travel, single next step during the trip.
Layout: Greeting + name/type; prominent **card** countdown (or next-step card on-trip); "Next step" card; "On the ground" entry to Guide.
States:
- Empty (no dates) → prompt to add dates instead of countdown.
- Pre-trip → countdown ("Your Umrah in 32 days") + next prep step.
- On-trip → the single next rite as the hero next-step card.
- Loading → skeleton card. Error/offline → reassuring line, content still shows.
Interactions: Tap next-step card → relevant screen (Prepare or Active rite). Tap "Begin guided Umrah" → Guide. Tab bar persists.
Components: **card**, **next-step-card**, **countdown**, **button-primary**, tab bar.
Rule: Always exactly one clear next step.

## 5. Prepare
Route: `/(tabs)/prepare` · Flow: Prepare at home
Purpose: Deliver readiness — checklist, packing, and learning — so the pilgrim feels "I've got this."
Layout: Title; sectioned lists (Packing, Documents, etc.) with per-section progress; Learn section of module cards.
States: Empty (all unchecked) · Partial (with **progress-bar**) · Complete (calm celebration, never gamified). Works fully offline.
Interactions: Tap **checklist-item** → toggle (persists offline). Tap module card → Learning module.
Components: **checklist-item**, **section-header**, **progress-bar**, **card**, **chip**.
Anti-pattern guard: no streaks, points, or scores (see `design.md` Don'ts).

## 6. Learning module
Route: `/module/[moduleId]` · Flow: Prepare at home
Purpose: Bite-size, plain-spoken learning (What is Umrah, Ihram & rules, rite overviews).
Layout: Back to Prepare, **chip** (topic · duration), title, illustration, readable body, done action.
States: Populated (content is bundled/local) · rarely Loading · Error (offline reassurance — content is local so should never fail).
Interactions: Read/scroll; "Done" → Prepare. Loads offline (FR-003).
Components: **card**, **chip**, **button-secondary**. Body uses `body` type; any Arabic uses **dua-block**/`arabic`.

## 7. Guide (rite list)
Route: `/(tabs)/guide` · Flow: On-ground rite guidance
Purpose: Show the Umrah sequence, progress, and let the pilgrim enter any rite; anchor the manual "I'm here".
Layout: Title; ordered vertical **list-row** stepper of rites with status **badge**s (done / now / upcoming) and site subtitles; sticky "I'm here" **button-primary** above the tab bar.
States: Per-rite not_started / in_progress / completed. Error → manual selection always available.
Interactions: Tap a rite → Active rite. Tap "📍 I'm here" → Arrival prompt (manual trigger). Geofence arrival also raises the Arrival prompt.
Components: **list-row**, **status-badge**, **button-primary** (sticky), **bottom-sheet** (arrival), tab bar.
Rule: The manual fallback is always present; the app never depends solely on GPS (FR-005).

## 8. Arrival prompt (overlay)
Surface: **bottom-sheet** over Guide/Home · Flow: On-ground rite guidance
Trigger: Geofence entry while app is open, or tapping "I'm here".
Purpose: Offer the detected rite without hijacking the screen.
Layout: Grabber, "You've reached [Site]", one-line context, confirm + dismiss. Soft shadow (floating element).
States: Hidden · Presented. Dismiss leaves the underlying screen intact. On a misfire, never force-opens (Edge Cases).
Interactions: "Begin [Rite]" → Active rite. "Not yet" → dismiss. Tap scrim → dismiss.
Components: **bottom-sheet**, **button-primary**, **button-ghost**, scrim.

## 9. Active rite
Route: `/rite/[riteId]` · Flow: On-ground rite guidance
Purpose: Guide one rite end to end — steps, du'a with audio, counting, completion.
Layout: Back to Guide; **chip** ("Rite 2 of 6 · Site"); title; short instruction; large **counter** (for Tawaf/Sa'i); **dua-block** (Arabic + transliteration + translation + play); "Mark complete" footer.
States:
- Populated (content local) · Completed → routes to next step.
- Offline (status shows "✈︎ offline"; everything still works — audio from bundle).
- Counting: increment on tap to target (7); undo/decrement; "Mark complete" emphasized only at target (FR-006).
- Error: audio load fails → show text du'a, non-blocking retry.
Interactions: Tap **counter** → +1 circuit/lap; "undo" → −1. Tap Play → offline audio (FR-007). "Mark complete" → Rite complete. Resume mid-rite after app kill (FR-008).
Components: **rite-card**, **counter**, **dua-block**, **button-primary**, **chip**.
Rule: Glanceable, audio-first, one action — never cluttered during worship.

## 10. Rite complete (state / interstitial)
Route: state of `/rite/[riteId]` → next · Flow: On-ground rite guidance
Purpose: Gentle acknowledgement and a clear handoff to the next step.
Layout: Calm confirmation mark, "Tawaf complete", warm line ("May Allah accept it"), Next **card**, guide/skip actions.
States: Single state; content of "Next" reflects the sequence.
Interactions: "Guide me there" → Map. "Back to steps" → Guide. Next rite becomes the Home next-step.
Components: **card**, **button-primary**, **button-ghost**.
Anti-pattern guard: acknowledgement is reverent, not a score or streak.

## 11. Map / Wayfinding
Route: `/map` · Flow: Wayfinding
Purpose: Guide the pilgrim to the next site and the recommended gate.
Layout: Full **map-view** (bundled static Haram map, always offline), pilgrim position, destination pin, back control; **bottom-sheet** with destination + **chip** gate + ETA + "I've arrived".
States: Populated (tiles present) · Fallback (no tiles → **direction-arrow** + gate text) · Locating (loading) · Permission denied (instructions; manual flow still works).
Interactions: Recenter; tap gate → highlight; "I've arrived" → Active rite (or arrival re-triggers). Back → Rite complete.
Components: **map-view**, **bottom-sheet**, **gate-chip**, **direction-arrow**.
Rule: Offline-capable; degrades to arrow + gate text (FR-009).

## 12. More / Settings
Route: `/(tabs)/more` · Flow: hub
Purpose: Optional sign-in, language, offline maps, sources, about.
Layout: Grouped **card**/list rows.
States: Signed-out (default; "Sign in to sync") · Signed-in (name shown).
Interactions: "Sign in to sync" → Supabase Auth sign-in (optional; app stays usable signed-out, FR-011). "Sources & scholars" → Sources. Change language. Toggle font (Quicksand/Satoshi). Download offline maps.
Components: **list-row**, **card**, **chip**, **button-secondary**, tab bar.

## 13. Sources & scholars
Route: `/more/sources` · Flow: hub
Purpose: Surface scholar-source citations — the trust backbone.
Layout: Back to More; title; per-rite **card** with citation + "Reviewed" **chip**.
States: Populated. Every rite must have a citation (content fails validation otherwise).
Interactions: Scroll; tap a source → detail.
Components: **card**, **chip**.
Rule: Reinforces "correctness is sacred" — endorsement/citations visible before public launch.

---

## Screen inventory & status map

| # | Screen | Flow | Key components | PRD refs |
|---|--------|------|----------------|----------|
| 1 | Welcome | Onboarding | button-primary, button-ghost | FR-001 |
| 2 | Language | Onboarding | chip, button-primary | FR-001, FR-010 |
| 3 | Travel dates | Onboarding | input-text, button-primary | FR-001, FR-002 |
| 4 | Home | hub | card, countdown, next-step | FR-003, FR-008 |
| 5 | Prepare | Prepare | checklist-item, progress-bar | FR-003 |
| 6 | Learning module | Prepare | card, chip | FR-003 |
| 7 | Guide (rite list) | Rite guidance | list-row, status-badge, button-primary | FR-004, FR-005, FR-008 |
| 8 | Arrival prompt | Rite guidance | bottom-sheet | FR-005 |
| 9 | Active rite | Rite guidance | counter, dua-block | FR-004, FR-006, FR-007 |
| 10 | Rite complete | Rite guidance | card | FR-008 |
| 11 | Map / Wayfinding | Wayfinding | map-view, gate-chip | FR-009 |
| 12 | More / Settings | hub | list-row | FR-011, FR-010 |
| 13 | Sources & scholars | hub | card, chip | FR-004 |

## Open UX decisions to resolve during styling

- **Phone use during worship.** Keep the Active rite screen audio-first and near-interaction-free; consider a large single-tap counter and a "screen-dim / one-glance" mode so the phone whispers rather than demands (`prd.md § 14 #2`, Vision § Risks).
- **Counter input method.** Tap vs. motion/step detection for circuits — tap is the reliable MVP default; explore motion post-MVP.
- **Onboarding length.** Keep to three steps (language, dates, done). Anything more risks the under-2-minute target.
- **Arrival prompt vs. notification.** In-app sheet when open; notification when backgrounded — confirm background behavior after real-site testing.
- **RTL.** Verify full mirrored layout when Arabic UI is selected, not just the du'a blocks.
