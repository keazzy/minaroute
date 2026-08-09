import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // The attribute vocabulary is shared with the Expo app on purpose: it is
      // the contract that decides which fields a mosque has versus a school.
      // Restating it here would let the admin write fields the app never
      // renders, and neither side would fail loudly.
      '@shared': path.resolve(__dirname, '../src/lib/places'),
    },
  },
  // Vite refuses to serve files outside the project root unless told otherwise.
  server: { port: 5273, fs: { allow: [path.resolve(__dirname), path.resolve(__dirname, '../src')] } },
});
