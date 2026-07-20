/**
 * Everyday shell — the 4-tab bottom nav (Home · Explore · Trips · Review) per
 * docs/product-architecture.md. This layout also carries the entry gate that used to
 * live in app/index.tsx: on first run it routes to onboarding, then location
 * permission, before the shell renders. The pilgrimage takeover (Manasik) launches
 * from the Trips tab in later phases and is a full-screen route outside these tabs.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ExpoLocation from 'expo-location';
import { Redirect, Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as Storage from '@/constants/storage';
import { colors } from '@/src/theme/tokens';

const ONBOARDING_SEEN_KEY = 'onboarding_seen_v2';
const LOCATION_PERMISSION_SKIP_KEY = 'location_permission_skip_v2';

type Gate = 'loading' | 'onboarding' | 'permission' | 'ok';

export default function TabsLayout() {
  const { t } = useTranslation();
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
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceMuted,
        tabBarStyle: { backgroundColor: colors.surfaceRaised, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: 'Quicksand_500Medium', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('tabs.explore'),
          tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: t('tabs.trips'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="navigate-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: t('tabs.review'),
          tabBarIcon: ({ color, size }) => <Ionicons name="star-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
