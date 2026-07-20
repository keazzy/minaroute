/**
 * Prepare-at-home derivation + a small hook that loads the local prep state.
 *
 * The "I've got this" magic moment reads from the OFFLINE local store only:
 * the itinerary (dates) and checklist progress. All pure/offline — no network.
 */
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getChecklistItemCount } from '@/src/lib/content/loader';
import { getChecklist, getItinerary, type LocalItinerary } from '@/src/lib/storage/progress';

/** Parse a 'YYYY-MM-DD' (or ISO) string as a LOCAL calendar date (avoids TZ drift). */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Whole days from today (local midnight) until the target date. Negative if past. */
export function daysUntil(iso: string): number {
  const target = parseLocalDate(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** The date the countdown anchors on — the planned Umrah day, else arrival/departure. */
export function countdownTarget(it: LocalItinerary | null): string | null {
  return it?.umrah_date ?? it?.arrival_date ?? it?.departure_date ?? null;
}

export type NextStep = { key: string; title: string; subtitle: string; href: string };

/**
 * The single next thing to do (US-005: Home always shows exactly one next step).
 * Ordered: set dates → work the checklist → read the intro module → ready.
 */
export function computeNextStep(it: LocalItinerary | null, checkedCount: number, totalItems: number): NextStep {
  if (!it || !countdownTarget(it)) {
    return {
      key: 'dates',
      title: 'Add your Umrah dates',
      subtitle: 'Set up your countdown and prep plan',
      href: '/setup-umrah',
    };
  }
  if (totalItems > 0 && checkedCount < totalItems) {
    return {
      key: 'checklist',
      title: 'Work through your checklist',
      subtitle: `${checkedCount} of ${totalItems} done`,
      href: '/prepare',
    };
  }
  return {
    key: 'learn',
    title: 'Read: What is Umrah?',
    subtitle: 'A calm two-minute overview',
    href: '/module/what-is-umrah',
  };
}

export type PrepState = {
  loading: boolean;
  itinerary: LocalItinerary | null;
  checkedIds: Set<string>;
  totalItems: number;
  checklistProgress: number; // 0..1
  nextStep: NextStep;
  reload: () => Promise<void>;
};

/** Load itinerary + checklist progress from the local store; refreshes on screen focus. */
export function usePrepState(): PrepState {
  const [itinerary, setItinerary] = useState<LocalItinerary | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const [it, checklist] = await Promise.all([getItinerary(), getChecklist()]);
      setItinerary(it);
      setCheckedIds(new Set(checklist.filter((c) => c.checked).map((c) => c.item_id)));
    } catch {
      // Local store unavailable (e.g. web without SQLite) — degrade to empty state
      // rather than leaving the hub stuck on the loading spinner.
      setItinerary(null);
      setCheckedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const totalItems = getChecklistItemCount();
  const checklistProgress = totalItems ? checkedIds.size / totalItems : 0;
  const nextStep = computeNextStep(itinerary, checkedIds.size, totalItems);

  return { loading, itinerary, checkedIds, totalItems, checklistProgress, nextStep, reload };
}
