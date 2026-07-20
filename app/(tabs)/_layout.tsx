/**
 * Everyday shell — the 4-tab bottom nav (Home · Explore · Trips · Review) per
 * docs/product-architecture.md.
 *
 * Uses expo-router `Tabs` with a CUSTOM floating glass tab bar (`GlassTabBar`) so we
 * can render Phosphor SVG icons directly with full control (outline→fill, emerald
 * active) over iOS 26 liquid glass — the native UITabBar can't render Phosphor and its
 * async-image icon path trips an RNScreens error. This layout also carries the entry
 * gate (onboarding → permission) before the shell renders.
 */
import * as ExpoLocation from 'expo-location';
import { Redirect, Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';

import * as Storage from '@/constants/storage';
import { GlassTabBar } from '@/src/components/GlassTabBar';
import { colors } from '@/src/theme/tokens';

const ONBOARDING_SEEN_KEY = 'onboarding_seen_v2';
const LOCATION_PERMISSION_SKIP_KEY = 'location_permission_skip_v2';

type Gate = 'loading' | 'onboarding' | 'permission' | 'ok';

export default function TabsLayout() {
  const [gate, setGate] = useState<Gate>('loading');

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const seen = await Storage.getItemAsync(ONBOARDING_SEEN_KEY);
        if (cancelled) return;
        if (seen !== '1') return setGate('onboarding');

        const skipped = await Storage.getItemAsync(LOCATION_PERMISSION_SKIP_KEY);
        if (cancelled) return;
        if (skipped === '1') return setGate('ok');

        const perm = await ExpoLocation.getForegroundPermissionsAsync();
        if (cancelled) return;
        setGate(perm.status === ExpoLocation.PermissionStatus.GRANTED ? 'ok' : 'permission');
      } catch {
        if (!cancelled) setGate('onboarding');
      }
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (gate === 'loading') return null;
  if (gate === 'onboarding') return <Redirect href="/onboarding" />;
  if (gate === 'permission') return <Redirect href="/permission" />;

  return (
    <Tabs
      tabBar={(props) => <GlassTabBar state={props.state} navigation={props.navigation} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.surface } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="trips" />
      <Tabs.Screen name="review" />
    </Tabs>
  );
}
