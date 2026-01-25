// iOS-specific Glass component using native Liquid Glass on iOS 26+
// Falls back to translucent View if expo-glass-effect native module is not available
import { View, ViewProps, StyleSheet } from 'react-native';

// Try to import expo-glass-effect - it may fail if native module isn't built
let GlassView: any = null;
let isLiquidGlassAvailable: (() => boolean) | null = null;

try {
  const glassEffect = require('expo-glass-effect');
  GlassView = glassEffect.GlassView;
  isLiquidGlassAvailable = glassEffect.isLiquidGlassAvailable;
} catch {
  // expo-glass-effect not available, will use fallback
}

export type GlassProps = ViewProps & {
  /** Intensity of the glass effect (0-100). Only used for fallback. */
  intensity?: number;
  /** Style of glass effect: 'clear' for more transparent, 'regular' for standard glass. */
  glassStyle?: 'clear' | 'regular';
  /** Whether the glass should be interactive (responds to touch). */
  interactive?: boolean;
};

export function Glass({
  style,
  children,
  glassStyle = 'regular',
  interactive = false,
  ...props
}: GlassProps) {
  // Use native GlassView on iOS 26+ if available
  if (GlassView && isLiquidGlassAvailable && isLiquidGlassAvailable()) {
    return (
      <GlassView
        style={style}
        glassEffectStyle={glassStyle}
        isInteractive={interactive}
        {...props}
      >
        {children}
      </GlassView>
    );
  }

  // Fallback for older iOS versions or when native module not available
  return (
    <View style={[styles.glassFallback, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glassFallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
});
