/**
 * Handing off to the platform's maps app for turn-by-turn.
 *
 * Shared because both the location block and the sticky action bar need it, and
 * because the per-platform URL shapes are easy to get subtly wrong: Apple Maps
 * wants `daddr`, Android wants a `geo:` URI with the label in parentheses, and
 * the web fallback wants Google's `dir/?api=1` form.
 */
import { Linking, Platform } from 'react-native';

export function openDirections(latitude: number, longitude: number, label: string) {
  const encoded = encodeURIComponent(label);
  const url = Platform.select({
    ios: `http://maps.apple.com/?daddr=${latitude},${longitude}&q=${encoded}`,
    android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encoded})`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
  });
  if (url) Linking.openURL(url).catch(() => undefined);
}
