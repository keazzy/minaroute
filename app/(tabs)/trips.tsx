/**
 * Trips tab — the pilgrimage hub (Hajj/Umrah only; no leisure travel). At MVP this is
 * the entry point into the Manasik full-screen takeover, which is built in later
 * phases (Prepare → Guide → Active rite → Wayfinding). For Phase 0 it is a calm
 * placeholder that names the mode and shows where guided Umrah will launch.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Text } from '@/src/components/ui/Text';
import { colors, spacing } from '@/src/theme/tokens';

export default function TripsTab() {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="h1">{t('trips.title')}</Text>
        <Text variant="body" color="onSurfaceMuted">
          Prepare for your Umrah and, when you arrive, be guided rite by rite — calm and
          offline.
        </Text>

        <Card style={{ gap: spacing.md, marginTop: spacing.md }}>
          <Text variant="h3">{t('common.pilgrimageMode')}</Text>
          <Text variant="body" color="onSurfaceMuted">
            Guided Umrah opens here. The full experience arrives in the next phases.
          </Text>
          <Button title={t('trips.startGuidedUmrah')} disabled onPress={() => {}} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.sm },
});
