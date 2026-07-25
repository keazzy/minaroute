/**
 * A tiny shared-cache primitive for read-only remote data.
 *
 * The discovery screens each used to own their own `useState` + `useEffect` +
 * `fetch`, which meant every tab switch refetched the whole `places` table and
 * two screens mounting together issued two identical requests. A resource is
 * created once at module scope, so all its consumers share one cache entry, one
 * in-flight request, and one loading/error state.
 *
 * Deliberately not a caching library: no query keys, no mutations, no
 * background revalidation. If those are ever needed, swap this for TanStack
 * Query — the hook signatures below are compatible on purpose.
 */
import { useCallback, useEffect, useSyncExternalStore } from 'react';

export type ResourceState<T> = {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
};

export type Resource<T> = {
  getSnapshot: () => ResourceState<T>;
  subscribe: (listener: () => void) => () => void;
  /** Fetch if absent or stale. `force` refetches regardless of TTL. */
  load: (force?: boolean) => Promise<void>;
  /** Mark stale so the next `load()` refetches. Does not clear existing data. */
  invalidate: () => void;
};

const DEFAULT_TTL_MS = 5 * 60 * 1000;

export function createResource<T>(
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Resource<T> {
  // Held by reference and only replaced on change, so `getSnapshot` is stable
  // enough for useSyncExternalStore (which bails out of re-rendering when the
  // snapshot is referentially equal).
  let state: ResourceState<T> = { data: undefined, isLoading: false, error: null };
  let fetchedAt = 0;
  let inFlight: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  const setState = (next: Partial<ResourceState<T>>) => {
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  };

  const isStale = () => Date.now() - fetchedAt > ttlMs;

  const load = (force = false): Promise<void> => {
    // Coalesce concurrent callers onto the single outstanding request.
    if (inFlight) return inFlight;
    if (!force && state.data !== undefined && !isStale()) return Promise.resolve();

    setState({ isLoading: true, error: null });

    inFlight = fetcher()
      .then(
        (data) => {
          fetchedAt = Date.now();
          setState({ data, isLoading: false, error: null });
        },
        (cause) => {
          // Keep any previously loaded data on screen — a failed refresh should
          // not blank out a working list.
          setState({
            isLoading: false,
            error: cause instanceof Error ? cause : new Error(String(cause)),
          });
        },
      )
      .finally(() => {
        inFlight = null;
      });

    return inFlight;
  };

  return {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    load,
    invalidate: () => {
      fetchedAt = 0;
    },
  };
}

export type UseResourceResult<T> = ResourceState<T> & { refetch: () => Promise<void> };

/** Subscribe to a resource, triggering the initial load on first mount. */
export function useResource<T>(resource: Resource<T>): UseResourceResult<T> {
  const state = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getSnapshot,
  );

  useEffect(() => {
    void resource.load();
  }, [resource]);

  const refetch = useCallback(() => resource.load(true), [resource]);

  return { ...state, refetch };
}
