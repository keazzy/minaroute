// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite's web build (wa-sqlite) imports a `.wasm` asset. Teach Metro to treat
// wasm as a bundleable asset so `expo export -p web` (the Vercel build) can resolve it.
config.resolver.assetExts.push('wasm');

module.exports = config;
