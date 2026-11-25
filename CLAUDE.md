# Minaroute

Expo (React Native) app for discovering Muslim-friendly places — mosques, halal
food, Islamic schools, events — starting in Lagos, plus a Manasik (Umrah) mode.
Supabase backend. A separate web admin lives in `admin-web/`.

## Start here

1. **`docs/build-log.md`** — the running record. Read the latest entries first;
   the final one lists the current state of the data and what's next.
2. `docs/home-redesign-brief.md` — the Home/detail-page redesign spec.
3. `docs/ota-updates.md` — EAS Update and the runtime-version (fingerprint) setup.
4. `docs/new-machine-setup.md` — files git doesn't carry (`.env.local`, keystore).

Active branch: `feat/home-redesign` (not yet merged to `main`).

## Things that will bite you

- **CocoaPods needs a UTF-8 locale.** `LANG=en_US.UTF-8 npx expo run:ios`.
- **`ios/` and `android/` are generated** (CNG) and gitignored. Don't commit them.
- **React Compiler is on.** Don't read `useRef(...).current` during render; use a
  lazy `useState` for `Animated.Value`s.
- **Any env var used in `app.config.ts` must also exist in EAS** (all three
  environments), or local and build-time fingerprints diverge and the build fails.
- **`src/lib/places/attributes.ts` is shared with `admin-web`** via a `@shared`
  alias. It defines which attributes each category has and how they're edited —
  change it in one place, never restate it in the admin.
- **Typecheck baseline is 17 pre-existing errors**, none in new code. New work
  must not add to it: `npx tsc --noEmit | grep -c "error TS"`.
- **Supabase CLI `link` is broken** on 2.112 (`LegacyLinkApiKeysNetworkError`).
  Use `--db-url` with the session pooler, or apply SQL in the dashboard SQL Editor.
- **Supabase's built-in email is capped at ~2/hour** until custom SMTP is set up.

## Conventions

- Comments explain *why*, not what. Commit messages do the same.
- Verify UI changes on the simulator (and in the browser for `admin-web`) before
  calling them done — typecheck alone has missed real layout bugs here.
- Placeholder content modules (`*/placeholder-*.ts`) are deliberate: the UI was
  built ahead of the data. Keep them when wiring real data.
