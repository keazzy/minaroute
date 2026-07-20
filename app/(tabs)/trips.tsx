/**
 * Trips tab — the pilgrimage hub (Hajj/Umrah only; no leisure travel, per
 * docs/product-architecture.md). This is the home of the primary "I've got this"
 * magic moment: set up your Umrah → countdown → next step → prepare.
 *
 * Empty (no itinerary) → a warm "Get Started" that opens the Umrah setup.
 * Populated → countdown (or an add-dates prompt) + the single next step + prep entry.
 * The full-screen guided takeover (on-the-ground rites) launches from here in later phases.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Countdown } from '@/src/components/features/Countdown';
import { NextStepCard } from '@/src/components/features/NextStepCard';
import { SectionHeader } from '@/src/components/features/SectionHeader';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Text } from '@/src/components/ui/Text';
import { countdownTarget, usePrepState } from '@/src/lib/prep/prep';
import { colors, radii, spacing } from '@/src/theme/tokens';

export default function TripsTab() {
  const router = useRouter();
  const { loading, itinerary, checkedIds, totalItems, nextStep } = usePrepState();
  const target = countdownTarget(itinerary);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top']}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  // ---- Empty state ----
  if (!itinerary) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Pressable onPress={() => router.push('/settings')} accessibilityRole="button" hitSlop={10} style={styles.emptyGear}>
          <Ionicons name="settings-outline" size={24} color={colors.onSurfaceMuted} />
        </Pressable>
        <View style={styles.emptyWrap}>
          <View style={styles.emptyArt}>
            <Text variant="display" style={{ color: colors.primary }}>
              ﷽
            </Text>
          </View>
          <Text variant="h1" style={{ textAlign: 'center' }}>
            Prepare for your Umrah
          </Text>
          <Text variant="body" color="onSurfaceMuted" style={{ textAlign: 'center' }}>
            A calm companion from home to the Haram — a countdown, a checklist, short
            learning, and gentle guidance once you arrive.
          </Text>
          <Button title="Get started" onPress={() => router.push('/setup-umrah')} style={{ marginTop: spacing.md }} />
        </View>
      </SafeAreaView>
    );
  }

  // ---- Populated hub ----
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text variant="h1">Trips</Text>
          <Pressable onPress={() => router.push('/settings')} accessibilityRole="button" hitSlop={10}>
            <Ionicons name="settings-outline" size={24} color={colors.onSurfaceMuted} />
          </Pressable>
        </View>

        {target ? (
          <Countdown targetDate={target} />
        ) : (
          <Pressable onPress={() => router.push('/setup-umrah')} accessibilityRole="button">
            <Card style={{ gap: spacing.xs }}>
              <Text variant="h3">Add your travel dates</Text>
              <Text variant="body" color="onSurfaceMuted">
                Set a date to see your countdown. Your prep is ready either way.
              </Text>
            </Card>
          </Pressable>
        )}

        <NextStepCard step={nextStep} />

        <SectionHeader title="Preparation" done={checkedIds.size} total={totalItems} />
        <Pressable onPress={() => router.push('/prepare')} accessibilityRole="button">
          <Card>
            <Text variant="bodyStrong">Checklist, packing & learning</Text>
            <Text variant="caption" color="onSurfaceMuted">
              Everything to feel ready before you fly
            </Text>
          </Card>
        </Pressable>

        <View style={styles.guidedCard}>
          <Text variant="bodyStrong">Guided Umrah</Text>
          <Text variant="caption" color="onSurfaceMuted">
            Step-by-step rites, du'a & wayfinding — unlocks on the ground (coming soon)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emptyGear: { position: 'absolute', top: spacing.sm, right: spacing.lg, zIndex: 1, padding: spacing.xs },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  emptyArt: {
    width: 96,
    height: 96,
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  guidedCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
});
