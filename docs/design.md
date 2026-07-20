---
version: alpha
name: Minaroute
description: The shared design system for Minaroute (everyday Muslim-friendly-places discovery) and its calm, reverent Manasik pilgrimage mode — deep emerald and warm sand, rounded.
colors:
  primary: "#12664F"
  primary-dark: "#0C4F3D"
  primary-soft: "#E4EFEA"
  on-primary: "#FFFFFF"
  accent: "#C79A54"
  accent-dark: "#8A6A2E"
  accent-soft: "#F5ECD9"
  on-accent: "#3A2E17"
  surface: "#FFFFFF"
  surface-raised: "#FFFFFF"
  surface-sunken: "#F2EDE3"
  on-surface: "#1B2A25"
  on-surface-muted: "#64726B"
  border: "#E8E2D6"
  success: "#2E9E6B"
  warning: "#C98A2B"
  error: "#B4462F"
  info: "#3A7CA5"
typography:
  display:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.02em
  h1:
    fontFamily: Quicksand
    fontSize: 26px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.01em
  h2:
    fontFamily: Quicksand
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.25
  h3:
    fontFamily: Quicksand
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-strong:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.5
  caption:
    fontFamily: Quicksand
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
  button:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1
  arabic:
    fontFamily: Amiri
    fontSize: 26px
    fontWeight: 400
    lineHeight: 1.9
  arabic-display:
    fontFamily: Amiri
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.8
rounded:
  xs: 6px
  sm: 10px
  md: 16px
  lg: 24px
  pill: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "14px 24px"
    height: 52px
  button-primary-pressed:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "14px 24px"
    height: 52px
  button-primary-disabled:
    backgroundColor: "{colors.border}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "14px 24px"
    height: 52px
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "14px 24px"
    height: 52px
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "12px 16px"
  card:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  card-flat:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.xs}"
    padding: "{spacing.md}"
  chip:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-dark}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  checklist-item:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "{spacing.md}"
  counter:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary}"
    typography: "{typography.display}"
    rounded: "{rounded.lg}"
    size: 96px
  dua-block:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.on-surface}"
    typography: "{typography.arabic}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  list-row:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "{spacing.md}"
  input-text:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.xs}"
    padding: "12px 14px"
    height: 48px
  bottom-sheet:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
---

# Minaroute Design System

## Overview

This is the shared design system for **Minaroute** (an everyday app for finding Muslim-friendly places) and its focused pilgrimage mode, **Manasik**. The tokens here are tuned for the calm, reverent pilgrimage mode; the everyday discovery shell uses the same foundation at a livelier density and may lean more on imagery and the accent. Manasik is the location-aware companion for Muslims performing Hajj and Umrah — it prepares pilgrims at home and guides them, rite by rite, on the ground. The audience is broad and often anxious: first-timers, solo travelers, and non-native speakers on the most significant journey of their lives. The design must produce one feeling above all: **calm confidence**. It should feel like a warm, knowledgeable companion who has made the journey before — reverent enough to honor the sacredness of worship, and friendly enough to never intimidate. The visual language borrows the structural clarity and trustworthy, image-forward patterns of travel apps like TripAdvisor, but deliberately trades their bright, commercial energy for a quieter, warmer register. Two anti-patterns anchor every decision: it must **never feel cluttered during worship**, and it must **never gamify acts of worship**.

## Colors

The palette is built on a single strategic idea: **green as a bridge**. Green is both the heritage color of trusted travel apps and the color most associated with Islam and Paradise, so `primary` is a deep, calm emerald (`#12664F`) rather than an electric mint — it carries reverence and warmth instead of commercial energy. `primary-dark` is the pressed/active state, and `primary-soft` is a pale emerald tint for selected states, badges, and the rite counter's surface. The `accent` is a warm sand-gold (`#C79A54`) evoking the desert, ihram, and lamplight; use it sparingly for wayfinding highlights (gates), decorative dividers, and moments of quiet celebration — never as a primary call-to-action. Surfaces are warm, not sterile: `surface` (`#FAF7F1`) is a sand-tinted off-white app background, `surface-raised` (`#FFFFFF`) lifts cards above it, and `surface-sunken` (`#F2EDE3`) recesses passages like the du'a block. Text is a deep warm near-black (`on-surface` `#1B2A25`) with `on-surface-muted` for secondary content. Semantic colors are intentionally softened — `error` is a warm terracotta (`#B4462F`) rather than an alarming red, because this is a reassuring context, not a critical dashboard. All text/background pairings meet WCAG AA: `on-surface` on `surface`, and `on-primary` on `primary`, both clear the 4.5:1 threshold.

## Typography

Two families do all the work, and the UI family is **swappable**. **Quicksand** (already integrated in Minaroute — a warm, very-rounded geometric sans) is the **default** UI font and carries the entire interface; it's friendly and legible for non-native and low-literacy readers, and its rounded terminals reinforce the soft shape language. **Satoshi** (a cleaner, more geometric sans from Fontshare) is a supported **alternate** — both are loaded via `expo-font` and driven by a single font token, so switching is a one-line change and can be exposed as a **Settings → Font** toggle for the user. The `fontFamily` values in the YAML above name Quicksand as the default; a Satoshi build simply remaps that token. **Amiri** (a classical Naskh) is reserved exclusively for Arabic and sacred text — du'as and Quranic passages — giving them the traditional, reverent character they deserve and is *not* user-swappable. The scale runs `display` and `h1` for screen titles and the countdown, `h2`/`h3` for section and card headers, `body`/`body-strong` for content, `caption` for metadata and chips, and a dedicated `button` token for pill labels. The Arabic tokens (`arabic`, `arabic-display`) use generous line-height (1.8–1.9) because diacritics and RTL rendering need room to breathe.

## Layout

Density is **comfortable and balanced** — more breathing room than a typical travel app, but efficient enough that discovery and marketplace screens can still show several listings at once. Spacing follows a 4-based rhythm (`xs` 4 through `xxl` 48), with `md` (16px) as the default gap between elements and `lg` (24px) separating major sections. Screens use a single-column mobile layout with generous outer margins (`lg`), and the guiding principle is **one clear thing per screen**: rite screens in particular should isolate a single instruction and action, while browse/prep screens may present scannable vertical lists and horizontal card carousels. Touch targets never fall below 44pt, and the counter and primary actions are deliberately oversized for glanceable, one-handed use in crowds.

## Elevation & Depth

Depth is **quiet and mostly borderless-flat**. The default strategy is a hairline border (`border` `#E8E2D6`) plus the subtle contrast between `surface` and `surface-raised` — no shadow. Soft, diffuse shadows are used **only** where a border genuinely can't convey separation: floating and overlay elements like the arrival bottom-sheet, the persistent "I'm here" button, and modals. This keeps the interface airy and calm, avoids the heavy, layered look that reads as busy, and reserves shadow as a meaningful signal ("this floats above everything") rather than decoration.

## Shapes

The shape language is **soft and rounded**, signaling warmth and gentleness. The radius ramp is intentionally five steps so roundness carries meaning rather than being applied uniformly: `xs` (6px) for inputs, small tags, and denser marketplace/listing cards where heavy rounding would feel childish; `sm` (10px) for list rows and compact elements; `md` (16px) as the default card radius; `lg` (24px) for large cards and the arrival sheet; and `pill` (999px) for all buttons and chips. When in doubt, a content card is `md`; a dense data-forward card is `card-flat` (`xs`); anything interactive-and-tappable-as-a-whole tends toward more rounding, anything information-dense tends toward less.

## Components

Buttons are fully **pill**-shaped: `button-primary` (emerald, white label) is the single call-to-action per screen, with `button-primary-pressed` and `button-primary-disabled` states; `button-secondary` is a white pill with an emerald label and a hairline `border`; `button-ghost` is a text-only action for low-emphasis choices. Cards come in two forms — the default `card` (`md` radius, for rites, modules, and content) and `card-flat` (`xs` radius, for dense marketplace listings and TripAdvisor-style rows). `chip` is a pill in `accent-soft` with `accent-dark` text, used for gate labels and categories. `checklist-item` and `list-row` are quiet rows on `surface-raised`. The `counter` is a large (`96px`) rounded surface in `primary-soft` with emerald `display` numerals — big enough to tap and read mid-Tawaf, and never styled with streak or score mechanics. The `dua-block` recesses sacred text on `surface-sunken` using the `arabic` token with RTL direction. `input-text` uses the tighter `xs` radius. `bottom-sheet` (used for the arrival prompt) is a soft-shadowed `lg`-radius overlay that offers, never blocks. All components draw color, type, radius, and spacing from the tokens above — never hardcoded values.

## Do's and Don'ts

**Do** keep rite screens to one clear instruction and one action — calm over clever. **Do** lead with `primary` emerald for actions and reserve `accent` sand for wayfinding and gentle highlights. **Do** use Amiri for every piece of Arabic/sacred text and the UI font (Quicksand by default, or Satoshi) for everything else. **Do** default to bordered-flat surfaces, adding soft shadow only to floating overlays. **Do** use `card-flat`/`xs` radius for dense listings and `md`+ for content and worship screens. **Do** keep language and iconography warm, human, and reassuring.

**Don't** clutter a worship moment with competing elements, ads, or multiple CTAs. **Don't** gamify worship — no streaks, points, badges, leaderboards, or "completion scores" on rites. **Don't** let the interface feel cold, clinical, or generic — avoid pure white-and-gray sterility; the warm sand surfaces exist to prevent this. **Don't** reintroduce bright, electric commercial green or loud promotional energy on sacred screens. **Don't** apply uniform heavy rounding to everything, and **don't** hardcode colors, type, spacing, or radii — always reference tokens.
