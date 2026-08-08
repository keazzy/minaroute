import { createClient } from '@supabase/supabase-js';

/**
 * The same Supabase project the mobile app talks to, with the same anon key.
 *
 * The key is public by design and grants nothing on its own: migration 0006
 * put RLS on `places` and `events`, so writes require a JWT whose email is in
 * `admin_users`. Signing in below is what actually grants access — the key just
 * identifies the project.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.local.example to .env.local and fill it in.',
  );
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});
