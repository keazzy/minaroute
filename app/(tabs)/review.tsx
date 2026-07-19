/**
 * Review tab — community contributions and reviews (the data moat): Muslim schools,
 * mosques, halal stays, events, Muslim-owned businesses. The reviews system is new
 * work (no reviews table exists yet); Phase 0 ships a calm placeholder so the shell is
 * complete and navigable.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/src/components/ui/Card';
import { Text } from '@/src/components/ui/Text';
import { colors, spacing } from '@/src/theme/tokens';

export default function ReviewTab() {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="h1">{t('review.title')}</Text>
        <Text variant="body" color="onSurfaceMuted">
          Help others by sharing what you know — mosques, schools, halal food, stays, and
          events.
        </Text>

        <Card style={{ marginTop: spacing.md }}>
          <Text variant="h3">Community reviews</Text>
          <Text variant="body" color="onSurfaceMuted">
            Coming soon.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.sm },
});
