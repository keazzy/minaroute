# OTA updates (EAS Update)

Pushing JavaScript and asset changes to installed builds without going through
TestFlight again. Most of the Home and detail-page work is JS-only, so this is
the difference between a 20-minute build-and-review cycle and about 60 seconds.

## Current setup

| Piece | Value |
|---|---|
| `expo-updates` | `~57.0.8`, installed |
| Update URL | `https://u.expo.dev/984fc7a4-af4a-4a43-813a-0e0fdfc614ff` |
| `runtimeVersion` | **`{ "policy": "fingerprint" }`** |
| Channels | `development`, `preview`, `production` — each set on the matching `eas.json` build profile |

## Why `fingerprint` and not `appVersion`

This was changed on 2026-08-08, and it matters.

Under the previous `appVersion` policy the runtime version was just `1.0.0`, so
**every** build with that version was considered compatible with every update.
Change something native — add a permission, a config plugin, a native module —
rebuild without bumping `version`, and an update built afterwards would still be
served to older `1.0.0` binaries that lack the native side. The JS expects a
native module that isn't there and the app breaks at runtime, with nothing in the
update to explain why.

`fingerprint` derives the runtime version from a hash of the actual native
inputs — config plugins, native dependencies, app config. An update only reaches
binaries whose native side matches. Incompatible updates are simply not offered
rather than shipped and crashed.

Current fingerprint (iOS): `877036407076f966a65cc5a344d19716662655bd`

**Consequence:** the existing TestFlight build was made under the `appVersion`
policy and will never receive fingerprint-based updates. That's fine — it
predates this redesign entirely. Updates start flowing from the next build.

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
