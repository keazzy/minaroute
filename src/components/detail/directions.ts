/**
 * Handing off to a maps app for turn-by-turn.
 *
 * Offers a choice rather than assuming Apple Maps. Plenty of people in Lagos
 * navigate with Google Maps or Waze and never open Apple Maps — silently
 * picking one is the kind of decision that makes an app feel foreign.
 *
 * How the choice is presented differs by platform, deliberately:
 *  - **iOS** has no system chooser for navigation, so this probes which apps are
 *    installed and shows an action sheet. Only apps actually present are listed;
 *    offering Waze to someone who doesn't have it just fails.
 *  - **Android** already shows a system app chooser for a `geo:` intent, so
 *    adding our own would be a second chooser on top of the real one.
 *
 * iOS gotcha: `canOpenURL` returns false for any scheme not declared in
 * `LSApplicationQueriesSchemes` (app.json → ios.infoPlist), regardless of
 * whether the app is installed — and that list only takes effect after a native
 * rebuild. Adding a provider here means adding its scheme there too.
 */
import { ActionSheetIOS, Linking, Platform } from 'react-native';

type Provider = {
  label: string;
  /** Probe URL for canOpenURL; undefined means "always available". */
  scheme?: string;
  url: (lat: number, lng: number, label: string) => string;
};

const PROVIDERS: Provider[] = [
  {
    label: 'Apple Maps',
    // Always installed on iOS; no probe needed.
    url: (lat, lng, label) => `http://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(label)}`,
  },
  {
    label: 'Google Maps',
    scheme: 'comgooglemaps://',
    url: (lat, lng) => `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
  },
  {
    label: 'Waze',
    scheme: 'waze://',
    url: (lat, lng) => `waze://?ll=${lat},${lng}&navigate=yes`,
  },
];

const open = (url: string) => Linking.openURL(url).catch(() => undefined);

/**
 * Opens directions to a destination, asking which app to use when there is more
 * than one option.
 */
export async function openDirections(latitude: number, longitude: number, label: string) {
  if (Platform.OS !== 'ios') {
    // Android's geo: intent raises the system chooser by itself.
    const encoded = encodeURIComponent(label);
    const url =
      Platform.OS === 'android'
        ? `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encoded})`
        : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    open(url);
    return;
  }

  const available: Provider[] = [];
  for (const p of PROVIDERS) {
    if (!p.scheme) {
      available.push(p);
      continue;
    }
    // A rejected canOpenURL (undeclared scheme) must not take the sheet down.
    const ok = await Linking.canOpenURL(p.scheme).catch(() => false);
    if (ok) available.push(p);
  }

  if (available.length === 0) return;
  if (available.length === 1) {
    open(available[0].url(latitude, longitude, label));
    return;
  }

  ActionSheetIOS.showActionSheetWithOptions(
    {
      title: label,
      message: 'Open directions in',
      options: [...available.map((p) => p.label), 'Cancel'],
      cancelButtonIndex: available.length,
    },
    (index) => {
      const chosen = available[index];
      if (chosen) open(chosen.url(latitude, longitude, label));
    },
  );
}
