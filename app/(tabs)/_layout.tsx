/**
 * Everyday shell — the 4-tab bottom nav (Home · Explore · Trips · Review) per
 * docs/product-architecture.md.
 *
 * Native `NativeTabs` (real UITabBar → iOS 26 liquid glass, native Android tabs).
 * Custom Phosphor icons are supplied as **static PNG image sources** (pre-rendered by
 * `scripts/gen-tab-icons.mjs`): regular weight = inactive, fill = active. Static images
 * are synchronous and both resolve to the same icon type, which avoids the RNScreens
 * "icon and selectedIcon must be same type" error the async VectorIcon path caused.
 * `renderingMode: 'template'` lets the bar tint them — emerald on the active tab.
 *
 * This layout also carries the entry gate (onboarding → permission) before the shell
 * renders.
 */
import * as ExpoLocation from 'expo-location';
import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as Storage from '@/constants/storage';
import { colors } from '@/src/theme/tokens';

const ONBOARDING_SEEN_KEY = 'onboarding_seen_v2';
const LOCATION_PERMISSION_SKIP_KEY = 'location_permission_skip_v2';

// Static PNG icon pairs (inactive outline / active fill). Regenerate via
// `npm run gen:tab-icons`. require() paths must be static literals for Metro.
const ICONS = {
  house: {
    default: require('@/assets/icons/tabs/house-line.png'),
    selected: require('@/assets/icons/tabs/house-line-fill.png'),
  },
  compass: {
    default: require('@/assets/icons/tabs/compass.png'),
    selected: require('@/assets/icons/tabs/compass-fill.png'),
  },
  road: {
    default: require('@/assets/icons/tabs/road-horizon.png'),
    selected: require('@/assets/icons/tabs/road-horizon-fill.png'),
  },
  chat: {
    default: require('@/assets/icons/tabs/chat-centered-text.png'),
    selected: require('@/assets/icons/tabs/chat-centered-text-fill.png'),
  },
};

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
    <NativeTabs tintColor={colors.primary}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon src={ICONS.house} renderingMode="template" />
        <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Icon src={ICONS.compass} renderingMode="template" />
        <NativeTabs.Trigger.Label>{t('tabs.explore')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="trips">
        <NativeTabs.Trigger.Icon src={ICONS.road} renderingMode="template" />
        <NativeTabs.Trigger.Label>{t('tabs.trips')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="review">
        <NativeTabs.Trigger.Icon src={ICONS.chat} renderingMode="template" />
        <NativeTabs.Trigger.Label>{t('tabs.review')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
