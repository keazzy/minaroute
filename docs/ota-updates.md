# OTA updates (EAS Update)

Pushing JavaScript and asset changes to installed builds without going through
TestFlight again. Most of the Home and detail-page work is JS-only, so this is
the difference between a 20-minute build-and-review cycle and about 60 seconds.

## Current setup

| Piece | Value |
|---|---|
| `expo-updates` | `~57.0.8`, installed |
| Update URL | `https://u.expo.dev/984fc7a4-af4a-4a43-813a-0e0fdfc614ff` |
| `runtimeVersion` | `{ "policy": "appVersion" }` — runtime version is `1.0.0` |
| Channels | `development`, `preview`, `production` — each set on the matching `eas.json` build profile |

## Runtime version policy — and a failed attempt at `fingerprint`

Currently `appVersion`: the runtime version is the app version, `1.0.0`. Any
build with that version can receive any update built for it.

**Known limitation.** Change something native, rebuild without bumping
`version`, and an update built afterwards is still offered to older `1.0.0`
binaries that lack the native side. The JS expects a module that isn't there and
breaks at runtime. Guard against this by bumping `version` whenever native
config changes — which is worth doing anyway.

**`fingerprint` was tried on 2026-08-08 and reverted after three failed builds**
(EAS builds 3, 4 and 5), all with:

```
Runtime version calculated on local machine not equal to runtime version
calculated during build.
```

What was ruled out along the way, each by measurement rather than inference:

- **Local `ios/`/`android/` present but absent on the builder** — not the cause.
  Those directories are gitignored, so fingerprint excludes them; the
  `bareNativeDir` source carries `hash: null` and removing the folders left the
  hash byte-identical.
- **Version fields hashed into the config** — real, and confirmed (adding a
  build number locally changed the hash), which matters because `autoIncrement`
  assigns build numbers server-side. `sourceSkips: ['ExpoConfigVersions']` in a
  `fingerprint.config.js` fixed it and the hash went stable across `version` and
  `buildNumber` edits. Build 4 still failed, so this was not the blocker.
- **`node_modules` drifted from `package-lock.json`** — real and worth fixing on
  its own (`react-native` 0.86.0 vs 0.86.2, `expo-updates` 57.0.8 vs 57.0.12, an
  invalid `expo-image`, six extraneous packages). EAS runs `npm ci`, so the two
  sides genuinely had different trees. **That fix is kept** — see the lockfile
  commit. Build 5 still failed.

So something else still diverges, and it has not been identified. The next step
is not another guess: get the **server-computed** fingerprint from the build log
(expand the *Configure expo-updates* step — EAS prints both hashes, and usually
the differing sources) and diff it against
`npx expo-updates fingerprint:generate --platform ios`. `eas fingerprint:compare
--build-id <id>` is not sufficient on its own: it compares local against the
value the **CLI** recorded, so it reports a match even for a build that failed.

Until then `appVersion` is what ships — it is what the app has always used and
what every successful build to date has used.

## Publishing an update

```bash
eas update --branch production --message "what changed"
```

Clients on the `production` channel pick it up on next launch. Use `preview` for
internal-distribution builds.

Check what's live:

```bash
eas update:list --branch production
```

## What can and cannot go over the air

**Can:** anything in JS or bundled assets — React components, styles, the
placeholder content modules, the images under `assets/images/home/`, copy
changes, layout fixes, the attribute vocabularies.

**Cannot:** anything native. Changing these needs a new build:

- `app.json` → `plugins`, `infoPlist`, permissions, `LSApplicationQueriesSchemes`
- adding or upgrading a native module
- Expo SDK upgrades
- app icon, splash, bundle ID, app name

If a change touches native, the fingerprint changes, and `eas update` will target
a runtime version no installed build has — so the update is published but nothing
receives it. That's the guardrail working, not a failure, but it is confusing the
first time.

**Right now this applies:** the `waze` entry added to
`LSApplicationQueriesSchemes` for the directions chooser is a native change. It
only takes effect in the next build — an OTA update cannot deliver it.

## Sequence from here

1. `eas build --platform ios --profile production --auto-submit` — the build that
   carries the current native config (including `waze`) and establishes the
   fingerprint that later updates target.
2. Everything JS-only after that: `eas update --branch production`.
3. Any native change: back to step 1.
