// iOS-specific home sheet content
import CategoryCard from '@/components/CategoryCard';
import PlaceCard, { CardType } from '@/components/place-card';
import { CATEGORIES, Category } from '@/constants/mockData';
import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';

type PlaceItem = {
  id: string;
  name: string;
  address: string;
  type: CardType;
  distance?: string;
  image?: string;
  tags?: string[];
};

type Props = {
  places: PlaceItem[];
  isLoading: boolean;
  onCategoryPress: (categoryName: string) => void;
  onPlacePress: (place: { id: string }) => void;
};

function ShimmerBlock({ style }: { style?: any }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View style={[styles.skeletonBase, style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.skeletonShimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

function NearbySkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <ShimmerBlock style={styles.skeletonImage} />
      <View style={styles.skeletonBody}>
        <View>
          <ShimmerBlock style={styles.skeletonLinePrimary} />
          <ShimmerBlock style={styles.skeletonLineSecondary} />
        </View>
        <View style={styles.skeletonBadgeRow}>
          <ShimmerBlock style={styles.skeletonBadge} />
          <ShimmerBlock style={styles.skeletonBadge} />
        </View>
      </View>
    </View>
  );
}

export function HomeSheetContent({ places, isLoading, onCategoryPress, onPlacePress }: Props) {
  const renderCategoryItem = useCallback(
    ({ item }: { item: Category }) => (
      <CategoryCard
        category={item}
        onPress={() => onCategoryPress(item.name)}
      />
    ),
    [onCategoryPress]
  );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Greeting */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>As salam alykum</Text>
        <Text style={styles.subGreetingText}>What would you like you find today?</Text>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionHeader}>Based on your location</Text>
      </View>

      {/* Places List */}
      {isLoading ? (
        <View style={styles.placesContainer}>
          <NearbySkeletonCard />
          <View style={{ height: 12 }} />
          <NearbySkeletonCard />
          <View style={{ height: 12 }} />
          <NearbySkeletonCard />
        </View>
      ) : places.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No places nearby yet.</Text>
        </View>
      ) : (
        <View style={styles.placesContainer}>
          {places.map((place) => (
            <View key={place.id} style={styles.placeCardWrapper}>
              <PlaceCard
                title={place.name}
                subtitle={place.address}
                type={place.type}
                distanceLabel={place.distance}
                tags={place.tags}
                imageUri={place.image}
                onPress={() => onPlacePress({ id: place.id })}
              />
            </View>
          ))}
        </View>
      )}

      {/* Bottom padding */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 20,
  },
  greetingContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 18,
    color: '#0c0c0f',
    marginBottom: 4,
    fontFamily: 'Quicksand_700Bold',
  },
  subGreetingText: {
    fontSize: 14,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  sectionHeaderContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 18,
    color: '#0c0c0f',
    fontFamily: 'Quicksand_700Bold',
  },
  placesContainer: {
    paddingHorizontal: 20,
  },
  placeCardWrapper: {
    marginBottom: 12,
  },
  emptyContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#454745',
    textAlign: 'center',
    fontFamily: 'Quicksand_500Medium',
  },
  // Skeleton styles
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f6f4',
    borderRadius: 24,
    padding: 8,
    height: 102,
    gap: 12,
  },
  skeletonBody: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  skeletonBadgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  skeletonBase: {
    backgroundColor: '#ececec',
    overflow: 'hidden',
  },
  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.55)',
    opacity: 0.9,
  },
  skeletonImage: {
    width: 86,
    height: 86,
    borderRadius: 18,
  },
  skeletonLinePrimary: {
    height: 14,
    width: '70%',
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonLineSecondary: {
    height: 12,
    width: '55%',
    borderRadius: 8,
  },
  skeletonBadge: {
    height: 20,
    width: 70,
    borderRadius: 12,
  },
});
