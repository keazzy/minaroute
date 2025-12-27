import { Image } from 'expo-image';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type CardType = 'Mosque' | 'School' | 'Event' | 'Halal Food';

const CARD_IMAGES: Record<Exclude<CardType, 'Halal Food'>, string> = {
  Mosque: 'https://www.figma.com/api/mcp/asset/8d90a6e9-2168-4a93-83f1-ba3c07915c25',
  School: 'https://www.figma.com/api/mcp/asset/845e89c3-45e5-44b8-b972-578eca0cd609',
  Event: 'https://www.figma.com/api/mcp/asset/c43b3cc1-7062-4bb3-bc78-77be8247b7ad',
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

  const imageUri = useMemo(() => {
    const normalizedPreferred = typeof preferredImageUri === 'string' ? preferredImageUri.trim() : '';
    if (normalizedPreferred) return normalizedPreferred;
    if (type === 'Halal Food') return null;
    return CARD_IMAGES[type as Exclude<CardType, 'Halal Food'>] ?? null;
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
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.fallbackImage} />
        )}
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
  },
  image: {
    width: 86,
    height: 86,
  },
  fallbackImage: {
    width: 86,
    height: 86,
    backgroundColor: '#ececec',
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
