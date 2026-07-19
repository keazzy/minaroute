/**
 * Anonymous-first Supabase Auth for the pilgrim (user) side.
 *
 * The whole app is usable signed-out. On startup we make a BEST-EFFORT anonymous
 * sign-in (`supabase.auth.signInAnonymously()`) so RLS-guarded cloud reads/writes
 * have an `auth.uid()` — but this is a network call, so it must never block the UI
 * or the offline core path. When offline it simply no-ops and the app runs on the
 * local store; it retries when a session is next requested.
 *
 * Later, the pilgrim can sign in with email / Apple / Google; because we start
 * anonymous, linking (`updateUser` / `linkIdentity`) preserves their data.
 *
 * This module is JSX-free on purpose (it lives at `.ts`): it owns the context and
 * hooks; `app/_layout.tsx` renders `<AuthContext.Provider>` with `useAuthState()`.
 */
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

export type AuthContextValue = {
  /** null until the initial session read resolves. */
  session: Session | null;
  user: User | null;
  /** true while the first getSession() is in flight. */
  loading: boolean;
  /** Signed in but only as an anonymous user (no linked identity yet). */
  isAnonymous: boolean;
  /** Send a magic-link / OTP to an email (links onto the anonymous user). */
  signInWithEmailOtp: (email: string) => Promise<void>;
  /** Verify the 6-digit email OTP. */
  verifyEmailOtp: (email: string, token: string) => Promise<void>;
  /** Sign out but keep local progress intact. */
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Best-effort anonymous session. Safe to call repeatedly. Returns the session, or
 * null when offline / sign-in fails (the caller falls back to the local store).
 */
export async function ensureAnonymousSession(): Promise<Session | null> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session;
    const { data: signIn, error } = await supabase.auth.signInAnonymously();
    if (error) return null;
    return signIn.session ?? null;
  } catch {
    // Offline or network error — the app keeps working on the local store.
    return null;
  }
}

/** Send an email OTP / magic link. When called on an anonymous user, verifying it links the account. */
export async function signInWithEmailOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw new Error(error.message);
}

export async function verifyEmailOtp(email: string, token: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

/**
 * Drives auth state for the provider. Reads the persisted session (works offline),
 * subscribes to changes, and kicks off a best-effort anonymous sign-in once.
 */
export function useAuthState(): AuthContextValue {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const bootstrapped = useRef(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
      // No session yet → try to establish an anonymous one in the background.
      if (!data.session && !bootstrapped.current) {
        bootstrapped.current = true;
        void ensureAnonymousSession().then((s) => {
          if (mounted && s) setSession(s);
        });
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (mounted) setSession(next);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;
  const isAnonymous = !!user && (user.is_anonymous ?? user.app_metadata?.provider === 'anonymous');

  return {
    session,
    user,
    loading,
    isAnonymous,
    signInWithEmailOtp,
    verifyEmailOtp,
    signOut,
  };
}

/** Consumer hook. Must be used under <AuthContext.Provider>. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthContext.Provider');
  return ctx;
}
