/**
 * Card — content container. `default` uses the `md` radius (rites, modules, content);
 * `flat` uses the tighter `xs` radius for dense listings (design.md § Shapes/Components).
 * Elevation is quiet: a hairline border over surface-raised, no shadow.
 */
import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/src/theme/tokens';

export type CardProps = ViewProps & {
  variant?: 'default' | 'flat';
  padded?: boolean;
};

export function Card({ variant = 'default', padded = true, style, ...rest }: CardProps) {
  const base: ViewStyle = {
    backgroundColor: colors.surfaceRaised,
    borderRadius: variant === 'flat' ? radii.xs : radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: padded ? spacing.md : 0,
  };
  return <View style={[base, style]} {...rest} />;
}
