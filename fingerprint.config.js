/**
 * Fingerprint configuration for the `runtimeVersion: { policy: "fingerprint" }`
 * set in app.json.
 *
 * Why this file has to exist:
 *
 * The `production` build profile uses `autoIncrement: true` with
 * `appVersionSource: "remote"`, so EAS assigns the build number **on its
 * servers** during the build. By default the fingerprint hashes the whole
 * resolved Expo config, version fields included — so the hash computed locally
 * (no build number yet) never matches the one computed during the build (build
 * number assigned). EAS compares the two and fails the build with:
 *
 *   Runtime version calculated on local machine not equal to runtime version
 *   calculated during build.
 *
 * `ExpoConfigVersions` skips `version`, `ios.buildNumber` and
 * `android.versionCode` when hashing the config. That is exactly right here:
 * those fields say nothing about **native compatibility**, which is the only
 * thing the runtime version is meant to express. Two builds differing only by
 * build number can safely share an update; that is the whole point of
 * decoupling the runtime version from the marketing version.
 */

/** @type {import('@expo/fingerprint').Config} */
module.exports = {
  sourceSkips: ['ExpoConfigVersions'],
};
