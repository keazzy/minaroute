/**
 * The one place the Supabase project URL and anon key are defined.
 *
 * These were previously pasted into six files (`lib/supabase.native.ts`,
 * `lib/supabase.web.ts`, both home screens, both search screens and
 * `app/submit-place.tsx`), so rotating the key or pointing at a staging project
 * meant finding every copy.
 *
 * The anon key is public by design — it ships inside the app bundle and is
 * extractable. Row-Level Security is what actually protects the data, not the
 * secrecy of this string. Never put the *service* key here.
 *
 * `EXPO_PUBLIC_*` overrides let a build target a different project without a
 * code change; the literals remain the default so no build configuration is
 * required.
 */
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://spjlyhmgqtkcqhpvgxci.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwamx5aG1ncXRrY3FocHZneGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MzYzODIsImV4cCI6MjA4MTIxMjM4Mn0.CJz-iTGuoKCmhRQc0vausUPPLR2341GL8JCncMk9i1k';
