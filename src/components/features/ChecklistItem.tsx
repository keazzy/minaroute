/**
 * ChecklistItem — a single prep/packing item with a tappable checkbox (FR-003).
 * Toggling persists offline via the caller. ≥44pt tap target, calm (no gamification).
 */
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/src/components/ui/Text';
import { colors, radii, spacing } from '@/src/theme/tokens';

export function ChecklistItem({
  label,
  note,
  checked,
  onToggle,
}: {
  label: string;
  note?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={styles.row}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? (
          <Text style={styles.tick} allowFontScaling={false}>
            ✓
          </Text>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text variant="body" style={checked ? { color: colors.onSurfaceMuted } : undefined}>
          {label}
        </Text>
        {note ? (
          <Text variant="caption" color="onSurfaceMuted">
            {note}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: radii.xs,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  tick: { color: colors.onPrimary, fontSize: 16, fontWeight: '700', lineHeight: 18 },
  body: { flex: 1, gap: 2 },
});
