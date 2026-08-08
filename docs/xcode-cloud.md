# TestFlight via Xcode Cloud

Getting the current UI in front of testers without EAS (which is blocked on the
owner's Apple account). Xcode Cloud builds and uploads to TestFlight directly.

## What's in the repo

`ci_scripts/ci_post_clone.sh` — installs Node and CocoaPods, runs `npm ci`,
stamps the build number, runs `expo prebuild` to generate `ios/`, then
`pod install`.

**Why prebuild is needed:** this is a managed (CNG) Expo project — `ios/` and
`android/` are gitignored and generated from `app.json`. What Xcode Cloud clones
has no Xcode project in it. Most Xcode Cloud guides assume a committed `ios/`
folder and will mislead you here.

## What only you can do

These need your Apple ID and can't be scripted from here.

1. **App Store Connect record.** Create the app under bundle ID
   `com.minaroute.app`. It must exist before a build can upload.
2. **In Xcode:** Product → Xcode Cloud → Create Workflow. Pick the `minaroute`
   scheme and the `feat/home-redesign` branch (or `main` once merged).
   - Start Condition: Branch Changes, or Manual for now.
   - Action: **Archive**, with deployment prep set to **TestFlight (Internal
     Testing)**.
3. **Grant repository access** when prompted — Xcode Cloud needs to reach the
   GitHub repo.
4. **Set environment variables on the workflow** (see below).
5. **Add internal testers** in App Store Connect → TestFlight. Internal testers
   need no Beta App Review, so the build is available within minutes.

## Environment variables to set on the workflow

`.env.local` is gitignored, so the CI runner has none of it. Anything the app
reads at bundle time has to be set as a workflow environment variable, or it
will be `undefined` in the TestFlight build.

| Variable | Secret? | Why |
|---|---|---|
| `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` | yes | Static maps on the detail pages. Without it they render the labelled fallback instead of a map. |
| `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` | yes | Already used by existing screens. |
| `MAPBOX_DOWNLOADS_TOKEN` | yes | **Only if `pod install` 401s on MapboxMaps.** It resolves without credentials today, so leave it unset until it fails. |

Never set `SUPABASE_SERVICE_KEY` as `EXPO_PUBLIC_*`. The `EXPO_PUBLIC_` prefix
embeds a value in the client bundle where anyone can extract it; the service_role
key bypasses RLS entirely.

## Known rough edges

- **The script is untested in Xcode Cloud.** It's written against the documented
  runner environment. The first run is the real test.
- **CocoaPods and locale.** `pod install` crashes with
  `Unicode Normalization not appropriate for ASCII-8BIT` when the shell has no
  UTF-8 locale — this bit us locally. The script exports `LANG`/`LC_ALL`; if a
  future step shells out separately, it needs them too.
- **Build numbers.** Every TestFlight upload needs an unused build number. The
  script stamps `CI_BUILD_NUMBER` into `app.json` before prebuild, since in a
  managed workflow the value is baked into Info.plist at generation time.
- **What testers will see.** All three sections of Home, plus both detail pages,
  render **placeholder content** — the data layer isn't wired. That's the point
  of this build (UI review), but tell testers, or they'll report the same Lagos
  mosque appearing on every card as a bug.
- **The event posters** in this build are third-party promotional artwork, demo
  only. See `assets/images/home/CREDITS.md` before any wider distribution.
