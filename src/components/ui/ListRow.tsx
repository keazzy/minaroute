/**
 * ListRow — a quiet row on surface-raised (design.md § Components: list-row).
 * Optional leading/trailing slots, title + optional subtitle, optional press. Enforces
 * a ≥44pt tap target.
 */
import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/src/theme/tokens';
import { Text } from './Text';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
};

export function ListRow({ title, subtitle, left, right, onPress, style }: ListRowProps) {
  const content = (
    <View style={styles.inner}>
      {left ? <View style={styles.slot}>{left}</View> : null}
      <View style={styles.body}>
        <Text variant="bodyStrong">{title}</Text>
        {subtitle ? (
          <Text variant="caption" color="onSurfaceMuted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.slot}>{right}</View> : null}
    </View>
  );

  if (!onPress) {
    return <View style={[styles.row, style]}>{content}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.surfaceSunken },
  inner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  slot: { justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
});
