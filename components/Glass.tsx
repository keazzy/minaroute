// Fallback for Android/Web - simple View with translucent background
import { View, ViewProps, StyleSheet } from 'react-native';

export type GlassProps = ViewProps & {
  /** Intensity of the glass effect (0-100). Only used on iOS. */
  intensity?: number;
  /** Style of glass effect. Only used on iOS 26+. */
  glassStyle?: 'clear' | 'regular';
  /** Whether the glass should be interactive. Only used on iOS 26+. */
  interactive?: boolean;
};

export function Glass({ style, children, intensity, glassStyle, interactive, ...props }: GlassProps) {
  return (
    <View style={[styles.glass, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
});
