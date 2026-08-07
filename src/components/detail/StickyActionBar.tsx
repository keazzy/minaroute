/**
 * The persistent action bar pinned to the bottom of a detail page.
 *
 * Sticky rather than inline because the primary action has to stay reachable
 * from anywhere on a long page — someone three sections deep reading the
 * facilities list should not have to scroll back up to act. This is the pattern
 * the Expedia reference uses, and the reason it uses it.
 *
 * `lead` carries the standing context the action needs — a price for an event,
 * nothing for a place. It sits on the left so the button keeps a fixed position
 * whether or not there is a price.
 *
 * Callers must reserve space for this at the end of their scroll content;
 * `useStickyBarInset()` returns the amount.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { discoveryRadii, useColors } from '@/src/theme/palette';

import { useDetailType } from './type';

/** Bar height excluding the home-indicator inset. */
const BAR_HEIGHT = 72;

/** Bottom padding a scroll view needs so its last content clears the bar. */
export function useStickyBarInset(): number {
  const insets = useSafeAreaInsets();
  return BAR_HEIGHT + insets.bottom + 12;
}

export type StickyActionBarProps = {
  /** Optional standing context, e.g. `{ label: 'from', value: '₦7,500' }`. */
  lead?: { label?: string; value: string };
  actionLabel: string;
  onAction: () => void;
  accessibilityLabel?: string;
  testID?: string;
};

export function StickyActionBar({
  lead,
  actionLabel,
  onAction,
  accessibilityLabel,
  testID,
}: StickyActionBarProps) {
  const c = useColors();
  const type = useDetailType();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: insets.bottom || 12,
          backgroundColor: c.background,
          borderTopColor: c.border,
        },
      ]}
      testID={testID}
    >
      {lead ? (
        <View style={styles.lead}>
          {lead.label ? (
            <Text style={[type.bodySmall, { color: c.onBackgroundMuted }]}>{lead.label}</Text>
          ) : null}
          <Text style={[type.factValue, { color: c.onBackground }]} numberOfLines={1}>
            {lead.value}
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={onAction}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? actionLabel}
        testID={testID ? `${testID}-button` : undefined}
        style={[styles.button, { backgroundColor: c.badge }]}
      >
        <Text style={[type.factValue, { color: c.onBadge }]}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    // Generous: the price needs room to breathe, and since the button flexes
    // into whatever is left, a wider gap also stops it dominating the bar.
    gap: 28,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  // The lead keeps its natural width and shrinks before the button does.
  lead: { flexShrink: 1 },
  // The button always fills the remaining width so its right edge lands on the
  // page margin, with or without a price beside it. Sizing it to its label
  // instead leaves a ragged gap on the right.
  button: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: discoveryRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
