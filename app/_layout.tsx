import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts as useExpoFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import '@/src/lib/i18n';
import { AuthContext, useAuthState } from '@/src/lib/supabase/auth';
import { ThemeProvider as AppThemeProvider, useAppFonts } from '@/src/theme/ThemeProvider';
import { Platform } from 'react-native';

SplashScreen.preventAutoHideAsync();

// Register service worker for PWA on web
if (Platform.OS === 'web' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed silently
    });
  });
}

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Anonymous-first auth: best-effort session, never blocks rendering.
  const auth = useAuthState();

  // Quicksand (all weights) + Amiri (Arabic), centralized in the theme layer.
  const appFontsLoaded = useAppFonts();

  const [mingcuteLoaded] = useExpoFonts({
    MingCute: require('mingcute_icon/font/MingCute.ttf'),
  });

  const ready = appFontsLoaded && mingcuteLoaded;

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthContext.Provider value={auth}>
        <AppThemeProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <BottomSheetModalProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="permission" options={{ headerShown: false }} />
            <Stack.Screen name="home" options={{ headerShown: false }} />
            <Stack.Screen name="search-results" options={{ headerShown: false }} />
            <Stack.Screen name="submit-place" options={{ headerShown: false }} />
            <Stack.Screen name="admin" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
            <StatusBar style="auto" />
            </BottomSheetModalProvider>
          </ThemeProvider>
        </AppThemeProvider>
      </AuthContext.Provider>
    </GestureHandlerRootView>
  );
}
