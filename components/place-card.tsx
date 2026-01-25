import { Image, ImageSource } from 'expo-image';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type CardType = 'Mosque' | 'School' | 'Event' | 'Halal Food';

// Fallback images for place cards when no photo is provided (local assets)
const CARD_IMAGES: Record<CardType, ImageSource> = {
  Mosque: require('../assets/images/app/mosque.png'),
  School: require('../assets/images/app/school.png'),
  Event: require('../assets/images/app/event.png'),
  'Halal Food': require('../assets/images/app/mosque.png'), // Using mosque as placeholder until halal food asset is added
};

type Props = {
  title: string;
  subtitle: string;
  type: CardType;
  distanceLabel?: string;
  tags?: string[];
  onPress?: () => void;
  imageUri?: string;
};

function estimatePillWidth(label: string) {
  const approxCharWidth = 7;
  const horizontalPadding = 16;
  const minWidth = 44;
  return Math.max(minWidth, horizontalPadding + label.length * approxCharWidth);
}

export default function PlaceCard({ title, subtitle, type, distanceLabel, tags = [], onPress, imageUri: preferredImageUri }: Props) {
  const [badgesWidth, setBadgesWidth] = useState<number>(0);

  // Get the image source - prefer database photo URL, fall back to local asset by type
  const imageSource = useMemo((): ImageSource => {
    const trimmed = typeof preferredImageUri === 'string' ? preferredImageUri.trim() : '';
    // If we have a valid URL from database, use it
    if (trimmed) {
      return { uri: trimmed };
    }
    // Otherwise use local asset fallback
    return CARD_IMAGES[type];
  }, [preferredImageUri, type]);

  const distancePill = distanceLabel ? `📍 ${distanceLabel}` : '';

  const { visibleTags, overflowCount } = useMemo(() => {
    const pills: string[] = [];

    const available = badgesWidth || 0;
    if (!available) {
      const first = tags[0] ? [tags[0]] : [];
      return { visibleTags: first, overflowCount: Math.max(0, tags.length - first.length) };
    }

    const gap = 6;
    let used = 0;

    if (distancePill) {
      used += estimatePillWidth(distancePill) + gap;
    }

    for (let i = 0; i < tags.length; i++) {
      const w = estimatePillWidth(tags[i]);
      const nextUsed = pills.length === 0 ? used + w : used + w;
      if (nextUsed > available) break;
      pills.push(tags[i]);
      used = nextUsed + gap;
    }

    const remaining = tags.length - pills.length;
    if (remaining > 0) {
      const plusLabel = `+${remaining}`;
      const plusWidth = estimatePillWidth(plusLabel);
      const wouldFit = used + plusWidth <= available;

      if (!wouldFit && pills.length > 0) {
        pills.pop();
      }

      const newRemaining = tags.length - pills.length;
      return { visibleTags: pills, overflowCount: newRemaining };
    }

    return { visibleTags: pills, overflowCount: 0 };
  }, [badgesWidth, distancePill, tags]);

  const handleBadgesLayout = useCallback((e: any) => {
    const w = e?.nativeEvent?.layout?.width;
    if (typeof w === 'number' && Number.isFinite(w)) {
      setBadgesWidth(w);
    }
  }, []);

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={styles.card} activeOpacity={0.85} onPress={onPress as any}>
      <View style={styles.imageContainer}>
        <Image
          source={imageSource}
          style={styles.image}
          contentFit="cover"
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          transition={200}
        />
      </View>

      <View style={styles.body}>
        <View>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        <View style={styles.badgesRow} onLayout={handleBadgesLayout}>
          {!!distancePill && (
            <View style={styles.badge}>
              <Text style={styles.badgeText} numberOfLines={1}>
                {distancePill}
              </Text>
            </View>
          )}

          {visibleTags.map((t) => (
            <View key={t} style={styles.badge}>
              <Text style={styles.badgeText} numberOfLines={1}>
                {t}
              </Text>
            </View>
          ))}

          {overflowCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{`+${overflowCount}`}</Text>
            </View>
          )}
        </View>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f9f6f4',
    borderRadius: 24,
    padding: 8,
    flexDirection: 'row',
    gap: 10,
    height: 102,
    overflow: 'hidden',
  },
  imageContainer: {
    width: 86,
    height: 86,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e8e8e8', // Placeholder color while loading
  },
  image: {
    width: 86,
    height: 86,
  },
  body: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  title: {
    fontSize: 16,
    color: '#0c0c0f',
    fontFamily: 'Quicksand_700Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  badge: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#000',
    fontFamily: 'Quicksand_500Medium',
  },
});
