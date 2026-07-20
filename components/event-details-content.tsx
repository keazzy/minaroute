import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  tags?: string[];
  city?: string;
  photos?: string[];
  description?: string;
  isDark?: boolean;
};

export default function EventDetailsContent({ title, tags = [], city, photos = [], description = '', isDark = false }: Props) {
  const dynamicColors = useMemo(() => ({
    text: isDark ? '#fff' : '#000',
    textSecondary: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
    tagBg: isDark ? 'rgba(255,255,255,0.1)' : '#fff',
    tagBorder: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
  }), [isDark]);
  const pills = useMemo(() => {
    const list: string[] = [];
    if (tags.length) list.push(...tags);
    if (city) list.push(`🌍 ${city}`);
    return list;
  }, [city, tags]);

  const imageData = useMemo(() => {
    return photos.map((p) => (typeof p === 'string' ? p.trim() : '')).filter(Boolean);
  }, [photos]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: dynamicColors.text }]}>{title}</Text>
      </View>

      {!!pills.length && (
        <View style={styles.tagsContainer}>
          {pills.map((t) => (
            <View key={t} style={[styles.tagPill, { backgroundColor: dynamicColors.tagBg, borderColor: dynamicColors.tagBorder }]}>
              <Text style={[styles.tagText, { color: dynamicColors.text }]} numberOfLines={1}>
                {t}
              </Text>
            </View>
          ))}
        </View>
      )}

      {!!imageData.length && (
        <FlatList
          horizontal
          data={imageData}
          keyExtractor={(uri) => uri}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imagesContainer}
          renderItem={({ item }) => (
            <View style={styles.imageWrap}>
              <Image source={{ uri: item }} style={styles.image} contentFit="cover" />
            </View>
          )}
        />
      )}

      {!!description && (
        <View style={styles.descriptionContainer}>
          <Text style={[styles.descriptionText, { color: dynamicColors.text }]}>{description}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  title: {
    fontSize: 24,
    color: '#000',
    fontFamily: 'Quicksand_700Bold',
  },
  tagsContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tagPill: {
    height: 32,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'Quicksand_500Medium',
  },
  imagesContainer: {
    paddingHorizontal: 16,
    gap: 12,
    paddingVertical: 8,
  },
  imageWrap: {
    width: 128,
    height: 90,
    borderRadius: 14,
    overflow: 'hidden',
  },
  image: {
    width: 128,
    height: 90,
  },
  descriptionContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000',
    fontFamily: 'Quicksand_500Medium',
  },
});
