/**
 * Foreground location as a single shared store.
 *
 * `expo-location` is currently called directly from six places (both map
 * screens, both search screens, the permission screen and the tab gate), each
 * with its own `userCoords` / `permissionStatus` state. This hook is the shared
 * replacement: one permission check, one position read, shared by every
 * consumer.
 *
 * Note it deliberately knows nothing about navigation or maps. Screens that
 * want to re-check permission when the user returns from Settings should call
 * `refreshPermission()` from their own `useFocusEffect`.
 */
import * as ExpoLocation from 'expo-location';
import { useEffect, useSyncExternalStore } from 'react';

import type { Coords } from '@/src/lib/geo';

type Status = ExpoLocation.PermissionStatus | null;

type State = {
  coords: Coords | null;
  status: Status;
  /** True while a permission prompt or position read is outstanding. */
  isResolving: boolean;
};

let state: State = { coords: null, status: null, isResolving: false };
const listeners = new Set<() => void>();

function setState(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => state;

/** Read the current position. Assumes permission is already granted. */
async function readPosition(): Promise<Coords | null> {
  try {
    const position = await ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.Balanced,
    });
    const coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    setState({ coords });
    return coords;
  } catch {
    // A position read can fail transiently (no fix yet, airplane mode). Keep
    // whatever coords we already had rather than blanking the UI.
    return state.coords;
  }
}

/** Re-read the permission status, fetching coords if it is (now) granted. */
async function refreshPermission(): Promise<Status> {
  try {
    const result = await ExpoLocation.getForegroundPermissionsAsync();
    setState({ status: result.status });
    if (result.status === ExpoLocation.PermissionStatus.GRANTED && !state.coords) {
      await readPosition();
    }
    return result.status;
  } catch {
    return state.status;
  }
}

/** Prompt for permission. No-op beyond a status refresh if already decided. */
async function request(): Promise<Status> {
  setState({ isResolving: true });
  try {
    const result = await ExpoLocation.requestForegroundPermissionsAsync();
    setState({ status: result.status });
    if (result.status === ExpoLocation.PermissionStatus.GRANTED) {
      await readPosition();
    }
    return result.status;
  } catch {
    setState({ status: ExpoLocation.PermissionStatus.DENIED });
    return ExpoLocation.PermissionStatus.DENIED;
  } finally {
    setState({ isResolving: false });
  }
}

// Resolve the initial status once per app session rather than per consumer.
let bootstrapped = false;
function bootstrap() {
  if (bootstrapped) return;
  bootstrapped = true;
  void refreshPermission();
}

export type UseUserLocationResult = State & {
  isGranted: boolean;
  /** Prompt for permission (and read position on grant). */
  request: () => Promise<Status>;
  /** Re-check permission — call on focus after sending the user to Settings. */
  refreshPermission: () => Promise<Status>;
  /** Re-read coordinates. */
  refreshCoords: () => Promise<Coords | null>;
};

export function useUserLocation(): UseUserLocationResult {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(bootstrap, []);

  // The three actions are module-scoped and already referentially stable, so
  // they need no useCallback.
  return {
    ...snapshot,
    isGranted: snapshot.status === ExpoLocation.PermissionStatus.GRANTED,
    request,
    refreshPermission,
    refreshCoords: readPosition,
  };
}
