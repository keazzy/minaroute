# OTA updates (EAS Update)

Pushing JavaScript and asset changes to installed builds without going through
TestFlight again. Most of the Home and detail-page work is JS-only, so this is
the difference between a 20-minute build-and-review cycle and about 60 seconds.

## Current setup

| Piece | Value |
|---|---|
| `expo-updates` | `~57.0.8`, installed |
| Update URL | `https://u.expo.dev/984fc7a4-af4a-4a43-813a-0e0fdfc614ff` |
| `runtimeVersion` | **`{ "policy": "fingerprint" }`** — currently `2286a457e8bd5f901b597e70d16e3ec401d113fe` |
| Channels | `development`, `preview`, `production` — each set on the matching `eas.json` build profile |

## Runtime version policy

`fingerprint`: the runtime version is a hash of the actual native inputs, so an
update only reaches binaries whose native side matches. Incompatible updates are
never offered, rather than shipped and crashed — which is what `appVersion`
allows, since under it every build sharing a version number looks compatible.

### The trap that cost three builds

Builds 3–5 failed with:

```
Runtime version calculated on local machine not equal to runtime version
calculated during build.
```

**Cause: `app.config.ts` injects `extra.mapboxAccessToken` from
`process.env.MAPBOX_ACCESS_TOKEN`.** That variable was in `.env.local` but had
never been set in the EAS `production` or `preview` environments. So locally the
key was present in the resolved config and on EAS it was absent entirely — two
different configs, two different hashes.

Fixed by `eas env:create --name MAPBOX_ACCESS_TOKEN` for production and preview.
It already existed in `development`, which is why the July development build
succeeded while every production build failed.

**This was also a real shipping bug, independent of fingerprint.** Every
production EAS build to date resolved `extra.mapboxAccessToken` to `undefined`,
so the Mapbox discovery map had no token in TestFlight.

**The rule this leaves:** any environment variable that feeds app config must
exist in *both* `.env.local` and the EAS environment. Today that is
`MAPBOX_ACCESS_TOKEN` and `GOOGLE_MAPS_KEY`. Adding another to `app.config.ts`
without adding it to EAS reproduces this failure exactly.

### Two other things fixed along the way

- **`fingerprint.config.js`** sets `sourceSkips: ['ExpoConfigVersions']`. The
  `production` profile uses `autoIncrement`, so EAS assigns the build number
  server-side; without the skip, version fields alone would diverge the hash.
  Confirmed by measurement.
- **`package-lock.json` had drifted from `node_modules`** (`react-native` 0.86.0
  vs 0.86.2, `expo-updates` 57.0.8 vs 57.0.12, an invalid `expo-image`, six
  extraneous packages). EAS runs `npm ci`, so it was building a different tree.

### How to diagnose this class of failure

Expand **Configure expo-updates** in the build log. EAS prints both hashes *and*
a JSON diff of the differing sources — that diff named the cause immediately.

Do not rely on `eas fingerprint:compare --build-id`: it compares local against
the value the **CLI** recorded, so it reports a match even for a build that
failed on this exact error.

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
