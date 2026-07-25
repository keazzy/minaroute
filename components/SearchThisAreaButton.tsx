import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

/**
 * Floating pill CTA shown when the map has been panned away from the
 * last-searched area. Positioning (bottom offset above the sheet) is the
 * screen's job via `style`.
 */
export function SearchThisAreaButton({
  visible,
  onPress,
  style,
}: {
  visible: boolean;
  onPress: () => void;
  style?: object;
}) {
  if (!visible) return null;

  return (
    <TouchableOpacity
      testID="search-this-area"
      accessibilityRole="button"
      accessibilityLabel="Search this area"
      style={[styles.pill, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={styles.label}>Search this area</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    color: '#12664F',
    fontSize: 15,
    fontFamily: 'Quicksand_700Bold',
  },
});
