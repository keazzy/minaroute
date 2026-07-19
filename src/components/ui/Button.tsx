/**
 * Button — pill-shaped, one call-to-action per screen (design.md § Components).
 * Variants: `primary` (emerald), `secondary` (white pill + hairline border, emerald
 * label), `ghost` (text-only). Enforces the design's 52px height (≥44pt tap target)
 * and token-driven color/radius. Pressed and disabled states per the tokens.
 */
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { colors, radii } from '@/src/theme/tokens';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

export function Button({
  title,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'ghost' ? styles.ghost : styles.solid,
        variant === 'secondary' && styles.secondary,
        fullWidth && styles.fullWidth,
        backgroundFor(variant, pressed, isDisabled),
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={labelColor(variant, isDisabled)} />
      ) : (
        <View style={styles.content}>
          <Text variant="button" style={{ color: labelColor(variant, isDisabled) }}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function backgroundFor(variant: ButtonVariant, pressed: boolean, disabled: boolean): ViewStyle {
  if (disabled) {
    return variant === 'primary'
      ? { backgroundColor: colors.border }
      : { backgroundColor: 'transparent' };
  }
  switch (variant) {
    case 'primary':
      return { backgroundColor: pressed ? colors.primaryDark : colors.primary };
    case 'secondary':
      return { backgroundColor: pressed ? colors.surfaceSunken : colors.surfaceRaised };
    case 'ghost':
      return { backgroundColor: pressed ? colors.primarySoft : 'transparent' };
  }
}

function labelColor(variant: ButtonVariant, disabled: boolean): string {
  if (disabled) return colors.onSurfaceMuted;
  return variant === 'primary' ? colors.onPrimary : colors.primary;
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  solid: { height: 52 },
  ghost: { paddingVertical: 12, paddingHorizontal: 16 },
  secondary: { borderWidth: 1, borderColor: colors.border },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
