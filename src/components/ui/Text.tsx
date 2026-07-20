/**
 * Text — the one text primitive. Every string in the app should render through this
 * so typography and the swappable font token stay consistent. `variant` selects a
 * scale entry from the design tokens; `color` selects a color token. Font scaling is
 * on by default for accessibility (dynamic type).
 */
import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useAppTheme } from '@/src/theme/ThemeProvider';
import { colors, type ColorToken, type TypographyVariant } from '@/src/theme/tokens';

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  color?: ColorToken;
};

export function Text({ variant = 'body', color = 'onSurface', style, ...rest }: TextProps) {
  const { t } = useAppTheme();
  return <RNText style={[t(variant), { color: colors[color] }, style]} {...rest} />;
}
