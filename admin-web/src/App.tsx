import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppSidebar, type Route } from '@/components/AppSidebar';
import { Overview } from '@/routes/Overview';
import { PlacesTable } from '@/routes/PlacesTable';

/**
 * Shell + auth gate.
 *
 * The gate asks the database whether you are an admin via the `is_admin()` RPC
 * from migration 0006, rather than comparing your email against a list in the
 * bundle. That matters: the mobile admin's ADMIN_EMAILS check only hides UI, and
 * never stopped anyone writing. Here the same predicate that guards every RLS
 * policy also decides what you see, so the UI cannot claim access the database
 * will refuse.
 */
export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [route, setRoute] = useState<Route>('overview');
  const [counts, setCounts] = useState<Partial<Record<Route, number | null>>>({});
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(null);
      return;
    }
    supabase.rpc('is_admin').then(({ data, error }) => {
      // A missing function means 0006 has not been applied — say so plainly
      // rather than showing an empty table and letting it look like no data.
      if (error) {
        console.error('is_admin() failed — has migration 0006 been applied?', error);
        setIsAdmin(false);
        return;
      }
      setIsAdmin(Boolean(data));
    });
  }, [session]);

  if (checking) return <Centered>Loading…</Centered>;
  if (!session) return <SignIn />;
  if (isAdmin === null) return <Centered>Checking access…</Centered>;
  if (!isAdmin) {
    return (
      <Centered>
        <div className="max-w-md space-y-3 text-center">
          <p className="font-medium">{session.user.email} is not an admin.</p>
          <p className="text-sm text-muted-foreground">
            Admins are listed in the <code>admin_users</code> table. If this is wrong, add the
            address there — it is the same allowlist the RLS policies use.
          </p>
          <Button variant="outline" onClick={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </div>
      </Centered>
    );
  }

  return (
    <div className="flex h-full">
      <AppSidebar
        route={route}
        onNavigate={setRoute}
        email={session.user.email}
        counts={counts}
      />
      <main className="min-h-0 min-w-0 flex-1">
        {route === 'overview' && (
          <Overview onCounts={(c) => setCounts((prev) => ({ ...prev, ...c }))} />
        )}
        {route === 'places' && <PlacesTable />}
        {route === 'events' && <Placeholder name="Events" />}
      </main>
    </div>
  );
}

function Placeholder({ name }: { name: string }) {
  return <Centered>{name} — not built yet.</Centered>;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

/**
 * Sign-in.
 *
 * Magic link is the default, and password is the fallback rather than the other
 * way round. For a single-admin internal tool a password is pure overhead —
 * something to remember, store and reset, with a recovery flow that has to be
 * configured correctly to work at all. A link to the address already in
 * `admin_users` proves the same thing with nothing to forget.
 *
 * `emailRedirectTo` is set to this app's own origin so the link lands here
 * rather than on Supabase's configured Site URL. That URL still has to appear
 * in Authentication → URL Configuration → Redirect URLs, or Supabase refuses
 * the redirect and falls back to Site URL.
 */
function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'link' | 'password'>('link');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true);
      setError(null);

      if (mode === 'link') {
        const { error: err } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) setError(err.message);
        else setSent(true);
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) setError(err.message);
      }
      setBusy(false);
    },
    [email, password, mode],
  );

  if (sent) {
    return (
      <Centered>
        <div className="max-w-sm space-y-2 text-center">
          <p className="font-medium text-foreground">Check {email}</p>
          <p className="text-sm">
            The link signs you in here directly. If it lands on a dead page instead, add{' '}
            <code>{window.location.origin}</code> to Supabase → Authentication → URL Configuration →
            Redirect URLs.
          </p>
          <Button variant="ghost" size="sm" onClick={() => setSent(false)}>
            Use a different address
          </Button>
        </div>
      </Centered>
    );
  }

  return (
    <div className="flex h-full items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Minaroute Admin</h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'link'
              ? 'Enter your email and we’ll send a sign-in link.'
              : 'Sign in with your Supabase password.'}
          </p>
        </div>
        <Input
          type="email"
          placeholder="Email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {mode === 'password' ? (
          <Input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button
          type="submit"
          className="w-full"
          disabled={busy || !email || (mode === 'password' && !password)}
        >
          {busy ? 'Working…' : mode === 'link' ? 'Email me a link' : 'Sign in'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => {
            setMode(mode === 'link' ? 'password' : 'link');
            setError(null);
          }}
        >
          {mode === 'link' ? 'Use a password instead' : 'Email me a link instead'}
        </Button>
      </form>
    </div>
  );
}
