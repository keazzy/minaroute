import { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Dynamic Expo config. Everything static lives in `app.json` and is passed in as
 * `config`; this file only injects the Google Maps Android API key from the
 * environment so it never sits in source/git.
 *
 * The Maps key is a *client* key — it ships inside the APK and is extractable, so
 * Google's protection model is restriction (package `com.minaroute.app` + signing
 * SHA-1s in Google Cloud), not secrecy. Keeping it out of git just stops secret-scanning
 * noise; the real safeguard is the key restriction.
 *
 * Provide the value via:
 *   • local builds  → `.env.local`  (GOOGLE_MAPS_KEY=...)  — gitignored
 *   • EAS builds    → `eas env:create --name GOOGLE_MAPS_KEY ...`
 * If unset, Android maps render blank — set it before an Android build.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'minaroute',
  slug: config.slug ?? 'minaroute',
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_KEY,
      },
    },
  },
});
