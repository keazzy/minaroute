import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { Category } from '@/constants/mockData';

type Props = {
  category: Category;
  onPress?: () => void;
};

export default function CategoryCard({ category, onPress }: Props) {
  const { name, icon, image, color, textColor } = category;

  return (
    <TouchableOpacity
      style={[styles.card, !image && { backgroundColor: color }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      {image ? (
        // Use the pre-designed card image
        <Image source={image} style={styles.cardImage} contentFit="cover" />
      ) : (
        // Fallback: emoji icon with solid background
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      )}

      {/* Category name overlay */}
      <View style={styles.labelContainer}>
        <Text style={[styles.label, textColor && { color: textColor }]}>
          {name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    height: 150,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  iconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 30, // Space for label
  },
  icon: {
    fontSize: 48,
  },
  labelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 16,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Quicksand_500Medium',
    textAlign: 'center',
  },
});
