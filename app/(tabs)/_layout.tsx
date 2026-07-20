/**
 * Everyday shell — the 4-tab bottom nav (Home · Explore · Trips · Review) per
 * docs/product-architecture.md.
 *
 * Uses expo-router's NATIVE tabs (real UITabBar / native Android tabs) rather than the
 * JS tab bar, so on iOS 26+ the bar renders with the system **liquid glass** material
 * automatically, and falls back to standard native tabs on older iOS / Android. We
 * deliberately DON'T set backgroundColor/blurEffect — that would override the glass;
 * we only tint the selected item with the brand emerald.
 *
 * This layout also carries the entry gate (onboarding → permission) before the shell
 * renders. The Manasik full-screen takeover launches from Trips in later phases.
 */
import * as ExpoLocation from 'expo-location';
import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as Storage from '@/constants/storage';
import { PhosphorFill, PhosphorRegular, type PhosphorGlyph } from '@/src/theme/phosphor';
import { colors } from '@/src/theme/tokens';

/**
 * Build the `{ default, selected }` icon pair for a tab from a Phosphor glyph name.
 * NativeTabs only rasterizes `VectorIcon` elements onto the native (liquid-glass,
 * iOS 26+) bar, so we render Phosphor from its glyph FONT: outline (regular) when
 * inactive, filled when active. The bar tints them (emerald when selected via
 * `tintColor`). Swap any icon by changing the glyph name in the triggers below.
 */
function tabIcon(name: PhosphorGlyph) {
  return {
    default: <NativeTabs.Trigger.VectorIcon family={PhosphorRegular} name={name} />,
    selected: <NativeTabs.Trigger.VectorIcon family={PhosphorFill} name={name} />,
  };
}

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
    <NativeTabs tintColor={colors.primary}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon src={tabIcon('house')} />
        <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Icon src={tabIcon('map-trifold')} />
        <NativeTabs.Trigger.Label>{t('tabs.explore')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="trips">
        <NativeTabs.Trigger.Icon src={tabIcon('path')} />
        <NativeTabs.Trigger.Label>{t('tabs.trips')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="review">
        <NativeTabs.Trigger.Icon src={tabIcon('star')} />
        <NativeTabs.Trigger.Label>{t('tabs.review')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
