// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite's web build (wa-sqlite) imports a `.wasm` asset. Teach Metro to treat
// wasm as a bundleable asset so `expo export -p web` (the Vercel build) can resolve it.
config.resolver.assetExts.push('wasm');

// `admin-web/` is a separate Vite + React app in this repo (see docs/admin-web.md).
// Metro crawls from the project root, so without this it would walk that app's
// own node_modules — slowing every bundle and, worse, finding a *second* copy of
// React. Two Reacts in one bundle produce "Invalid hook call" errors that look
// like a bug in your components. Nothing in the Expo app imports from there.
config.resolver.blockList = [/admin-web[\\/].*/];

module.exports = config;
