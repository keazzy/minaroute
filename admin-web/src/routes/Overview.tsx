import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, Loader2, RefreshCw } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Overview — deliberately data *health*, not vanity metrics.
 *
 * "1,010 places" tells you nothing you can act on. "412 places have no
 * coordinates" tells you exactly what tomorrow's work is, and every card here
 * answers a question the product actually has:
 *
 *   - no coordinates  → cannot appear on the map or in "places around you"
 *   - no photos       → renders a grey box on Home and the detail page
 *   - no rating       → the badge is hidden (by design, but worth knowing the scale)
 *   - events with no date → "Events coming up soon" cannot order them, so they
 *                           are invisible on Home no matter how many exist
 *
 * Counts use `head: true` so Postgres returns a count without shipping rows.
 */

type Stat = {
  label: string;
  value: number | null;
  total?: number | null;
  /** True when a non-zero value is a problem rather than an achievement. */
  inverse?: boolean;
  hint?: string;
};

/**
 * Count rows matching a filter without fetching any.
 *
 * `head: true` means Postgres returns the count and no body — important when
 * the answer is "1,010" and we do not want 1,010 rows over the wire.
 *
 * The builder is loosely typed on purpose: without generated database types,
 * PostgrestFilterBuilder's generics add noise here without adding safety. A
 * failed query returns null and the card shows an em dash rather than a zero,
 * because "unknown" and "none" are different answers.
 */
type Filter = (q: any) => any; // eslint-disable-line @typescript-eslint/no-explicit-any

async function countWhere(table: string, apply: Filter = (q) => q): Promise<number | null> {
  const { count: n, error } = await apply(
    supabase.from(table).select('*', { count: 'exact', head: true }),
  );
  return error ? null : (n ?? 0);
}

export function Overview({ onCounts }: { onCounts?: (c: Record<string, number | null>) => void }) {
  const [stats, setStats] = useState<Stat[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const [places, noCoords, noPhotos, noRating, events, approved, noDate, noEventCoords] =
      await Promise.all([
        countWhere('places'),
        countWhere('places', (q) => q.is('latitude', null)),
        countWhere('places', (q) => q.is('photos', null)),
        countWhere('places', (q) => q.is('rating', null)),
        countWhere('events'),
        countWhere('events', (q) => q.is('approved', true)),
        countWhere('events', (q) => q.is('starts_at', null)),
        countWhere('events', (q) => q.is('latitude', null)),
      ]);

    onCounts?.({ places, events });

    setStats([
      { label: 'Places', value: places },
      {
        label: 'Places without coordinates',
        value: noCoords,
        total: places,
        inverse: true,
        hint: 'Cannot appear on the map or in “places around you”.',
      },
      {
        label: 'Places without photos',
        value: noPhotos,
        total: places,
        inverse: true,
        hint: 'Renders a grey box on the card and the detail page.',
      },
      {
        label: 'Places without a rating',
        value: noRating,
        total: places,
        inverse: true,
        hint: 'Badge is hidden by design — this is the size of the gap, not a bug.',
      },
      { label: 'Events', value: events },
      { label: 'Events approved', value: approved, total: events },
      {
        label: 'Events without a date',
        value: noDate,
        total: events,
        inverse: true,
        hint: '“Events coming up soon” sorts by start time — undated events never appear.',
      },
      {
        label: 'Events without coordinates',
        value: noEventCoords,
        total: events,
        inverse: true,
        hint: 'Needs geocoding from the venue name before the detail map works.',
      },
    ]);
    setLoading(false);
  }, [onCounts]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mb-4 flex items-center gap-2">
        <h1 className="text-base font-semibold">Overview</h1>
        <span className="text-xs text-muted-foreground">
          What still needs doing, rather than how much exists.
        </span>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => void load()}>
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(stats ?? Array.from({ length: 8 }, () => null)).map((s, i) => (
          <div key={s?.label ?? i} className="rounded-lg border bg-card p-3">
            {s === null ? (
              <div className="h-12 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      'text-2xl font-semibold',
                      s.inverse && (s.value ?? 0) > 0 && 'text-amber-600 dark:text-amber-500',
                    )}
                  >
                    {s.value === null ? '—' : s.value.toLocaleString()}
                  </span>
                  {typeof s.total === 'number' && s.total > 0 && s.value !== null ? (
                    <span className="text-xs text-muted-foreground">
                      of {s.total.toLocaleString()} ({Math.round((s.value / s.total) * 100)}%)
                    </span>
                  ) : null}
                  {s.inverse && s.value === 0 ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : s.inverse && (s.value ?? 0) > 0 ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                  ) : null}
                </div>
                <div className="mt-0.5 text-sm">{s.label}</div>
                {s.hint ? (
                  <div className="mt-1 text-xs text-muted-foreground">{s.hint}</div>
                ) : null}
              </>
            )}
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        User and review counts are not here yet: they live in the <code>auth</code> schema and behind
        tables that need their own RLS pass before this app can read them.
      </p>
    </div>
  );
}
