/**
 * ThemeProvider — exposes the design tokens and the swappable UI font choice to the
 * whole app, and centralizes font loading.
 *
 * The single font token (`fontChoice`) flips the entire UI between Quicksand and
 * Satoshi via `t(variant)` (which resolves family through `textStyle`). Arabic always
 * renders in Amiri. The choice is persisted locally (SecureStore) so anonymous
 * pilgrims keep it; a signed-in user's `profiles.preferred_font` is reconciled by the
 * sync layer (Phase 4) — the column already exists in the schema.
 */
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import {
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';
import { useFonts } from 'expo-font';
import * as SecureStore from 'expo-secure-store';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { TextStyle } from 'react-native';

import { colors, radii, spacing, textStyle, type FontChoice, type TypographyVariant } from './tokens';

const FONT_PREF_KEY = 'manasik_preferred_font';

/**
 * Loads every app font. Quicksand (default) + Amiri (Arabic) load now. Satoshi is the
 * alternate: drop `Satoshi-Regular/Medium/Bold` TTFs into `assets/fonts/`, uncomment
 * the requires below, and the `satoshi` font choice renders with no other change.
 */
export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
    Amiri_400Regular,
    Amiri_700Bold,
    // Phosphor icon fonts (outline + fill) for the native tab bar VectorIcons.
    Phosphor: require('@/assets/fonts/Phosphor-Regular.ttf'),
    PhosphorFill: require('@/assets/fonts/Phosphor-Fill.ttf'),
    // --- Satoshi alternate (add TTFs to assets/fonts/, then uncomment) ---
    // 'Satoshi-Regular': require('@/assets/fonts/Satoshi-Regular.otf'),
    // 'Satoshi-Medium': require('@/assets/fonts/Satoshi-Medium.otf'),
    // 'Satoshi-Bold': require('@/assets/fonts/Satoshi-Bold.otf'),
  });
  return loaded;
}

type ThemeContextValue = {
  colors: typeof colors;
  radii: typeof radii;
  spacing: typeof spacing;
  fontChoice: FontChoice;
  setFontChoice: (choice: FontChoice) => void;
  /** Resolve a typography variant to a RN TextStyle bound to the current font choice. */
  t: (variant: TypographyVariant) => TextStyle;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [fontChoice, setChoice] = useState<FontChoice>('quicksand');

  useEffect(() => {
    let mounted = true;
    SecureStore.getItemAsync(FONT_PREF_KEY)
      .then((v) => {
        if (mounted && (v === 'quicksand' || v === 'satoshi')) setChoice(v);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const setFontChoice = useCallback((choice: FontChoice) => {
    setChoice(choice);
    SecureStore.setItemAsync(FONT_PREF_KEY, choice).catch(() => {});
  }, []);

  const t = useCallback((variant: TypographyVariant) => textStyle(variant, fontChoice), [fontChoice]);

  const value = useMemo<ThemeContextValue>(
    () => ({ colors, radii, spacing, fontChoice, setFontChoice, t }),
    [fontChoice, setFontChoice, t],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Access design tokens + the font token. Must be used under <ThemeProvider>. */
export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}
