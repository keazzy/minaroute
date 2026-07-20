/**
 * Custom floating tab bar for the everyday shell.
 *
 * Why custom instead of NativeTabs: the native UITabBar can't render Phosphor SVGs and
 * its VectorIcon (async image) path trips RNScreens' "icon and selectedIcon must be
 * same type" on this expo-router/screens combo. A custom bar renders Phosphor SVGs
 * directly (plain JS) with full control — outline when inactive, filled + emerald when
 * active — over the same iOS 26 liquid glass we use elsewhere (`components/Glass`).
 */
import { ChatText, Compass, House, RoadHorizon, type Icon } from 'phosphor-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass } from '@/components/Glass';
import { Text } from '@/src/components/ui/Text';
import { colors, radii, spacing } from '@/src/theme/tokens';

const TABS: Record<string, { Icon: Icon; labelKey: string }> = {
  index: { Icon: House, labelKey: 'tabs.home' },
  explore: { Icon: Compass, labelKey: 'tabs.explore' },
  trips: { Icon: RoadHorizon, labelKey: 'tabs.trips' },
  review: { Icon: ChatText, labelKey: 'tabs.review' },
};

/** Minimal shape of the react-navigation bottom-tab bar props we use. */
export type GlassTabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    navigate: (name: string) => void;
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => {
      defaultPrevented: boolean;
    };
  };
};

export function GlassTabBar({ state, navigation }: GlassTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]} pointerEvents="box-none">
      <Glass style={styles.bar} glassStyle="regular">
        {state.routes.map((route, index) => {
          const cfg = TABS[route.name];
          if (!cfg) return null;
          const focused = state.index === index;
          const color = focused ? colors.primary : colors.onSurfaceMuted;
          const { Icon } = cfg;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              style={styles.item}
            >
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <Icon size={24} color={color} weight={focused ? 'fill' : 'regular'} />
              </View>
              <Text variant="caption" style={{ color, marginTop: 2 }}>
                {t(cfg.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  bar: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    overflow: 'hidden',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 0 },
  iconWrap: {
    minWidth: 56,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: colors.primarySoft },
});
