/**
 * Home tab — curated launchpad. Surfaces the pilgrimage entry (Trips) and everyday
 * discovery (Explore). Real countdown / next-step content lands in Phase 1 (TASK-015);
 * this is the calm, token-driven shell it slots into.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/src/components/ui/Card';
import { Text } from '@/src/components/ui/Text';
import { colors, radii, spacing } from '@/src/theme/tokens';

const CATEGORIES = ['Mosques', 'Islamic Schools', 'Events', 'Halal Food'] as const;

export default function HomeTab() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="h1">{t('home.greeting')}</Text>
        <Text variant="body" color="onSurfaceMuted">
          {t('onboarding.welcomeSubtitle')}
        </Text>

        {/* Pilgrimage entry — the hero */}
        <Pressable onPress={() => router.push('/(tabs)/trips')} accessibilityRole="button">
          <Card style={styles.hero}>
            <Text variant="h2" color="onPrimary">
              {t('trips.startGuidedUmrah')}
            </Text>
            <Text variant="body" style={{ color: colors.primarySoft }}>
              {t('onboarding.enterDatesSubtitle')}
            </Text>
          </Card>
        </Pressable>

        {/* Everyday discovery */}
        <Pressable onPress={() => router.push('/(tabs)/explore')} accessibilityRole="button">
          <Card>
            <Text variant="h3">{t('common.appName')}</Text>
            <Text variant="body" color="onSurfaceMuted">
              Find Muslim-friendly places near you.
            </Text>
          </Card>
        </Pressable>

        <Text variant="h3" color="onSurfaceMuted" style={{ marginTop: spacing.md }}>
          Browse
        </Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              accessibilityRole="button"
              onPress={() => router.push('/(tabs)/explore')}
              style={styles.chip}
            >
              <Text variant="caption" style={{ color: colors.accentDark }}>
                {c}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.md },
  hero: { backgroundColor: colors.primary, borderColor: colors.primaryDark, gap: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
});
