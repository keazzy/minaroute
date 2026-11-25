# Setting up Minaroute on a new machine

Git carries the code. It deliberately does **not** carry the files below — copy
them across by hand (AirDrop, Migration Assistant, or an encrypted drive). Never
commit them or paste them into chat.

## Must copy — not recoverable from git

| File | What it is | If lost |
|---|---|---|
| `.env.local` | `GOOGLE_PLACES_API_KEY`, `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`, `SUPABASE_SERVICE_KEY`, `GOOGLE_MAPS_KEY`, `MAPBOX_ACCESS_TOKEN`, `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` | Re-collect each from its dashboard. `SUPABASE_SERVICE_KEY` is under Supabase → Settings → API. |
| `@adelekeazeez__minaroute.jks` | Android signing keystore | **Treat as irreplaceable.** If it's the Play upload key, losing it blocks app updates. Check `eas credentials -p android` to confirm EAS also holds it. |

The `EXPO_PUBLIC_*`, `MAPBOX_ACCESS_TOKEN` and `GOOGLE_MAPS_KEY` values also live
in EAS env vars (production/preview), so cloud builds work regardless — but local
dev needs `.env.local`.

## Nice to copy

- `.claude/settings.local.json` — local Claude Code permission settings.
- `~/.claude/projects/-Users-<you>-minaroute/memory/` — Claude's notes about this
  project. The folder name is derived from the repo path, so it only matches if
  the repo sits at the same path under the same username.

## Regenerates itself — don't bother copying

- `admin-web/.env.local` — `cp admin-web/.env.local.example admin-web/.env.local`
  and paste the anon key (it is in `lib/supabase-config.ts`).
- `node_modules/`, `ios/`, `android/`, `.expo/`, `supabase/.temp/`.

## Bring it up

```bash
git clone https://github.com/keazzy/minaroute.git && cd minaroute
git checkout feat/home-redesign
npm install
(cd admin-web && npm install)
```

Then drop `.env.local` and the keystore into the repo root, and:

```bash
npx eas login
LANG=en_US.UTF-8 npx expo run:ios      # CocoaPods needs a UTF-8 locale
```

Admin dashboard: `cd admin-web && npm run dev` → http://localhost:5273.
Add that URL to Supabase → Authentication → URL Configuration → Redirect URLs
if the port changes.

## Checks before wiping the old machine

```bash
git status                     # clean
git log --branches --not --remotes --oneline   # prints nothing
git stash list                 # empty
```
