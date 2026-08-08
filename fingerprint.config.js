/**
 * Fingerprint configuration for `runtimeVersion: { policy: "fingerprint" }`.
 *
 * The `production` profile uses `autoIncrement: true` with
 * `appVersionSource: "remote"`, so EAS assigns the build number on its servers.
 * By default the fingerprint hashes the whole resolved Expo config, version
 * fields included, so the hash computed locally (no build number yet) can never
 * match the one computed during the build (build number assigned).
 *
 * `ExpoConfigVersions` skips `version`, `ios.buildNumber` and
 * `android.versionCode`. That is correct rather than a workaround: those fields
 * say nothing about **native compatibility**, which is the only thing a runtime
 * version needs to express. Two builds differing only by build number can safely
 * share an update.
 *
 * Related trap, worth knowing because it cost three builds: `app.config.ts`
 * injects `extra.mapboxAccessToken` from `process.env.MAPBOX_ACCESS_TOKEN`. If
 * that variable is set in one place and not the other, the key is present in one
 * resolved config and absent from the other, and the fingerprints diverge. Any
 * env var that feeds app config must exist in **both** `.env.local` and the EAS
 * environment. See docs/ota-updates.md.
 */

/** @type {import('@expo/fingerprint').Config} */
module.exports = {
  sourceSkips: ['ExpoConfigVersions'],
};
