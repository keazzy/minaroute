/**
 * "Set up your Umrah" — the pilgrimage onboarding, reached from the Trips hub (kept out
 * of the everyday first-launch per "modes, not a blend"). Captures trip type (Umrah;
 * Hajj coming soon) + travel date via an Airbnb-style calendar, persists to the OFFLINE
 * local store, and returns to the hub where the countdown appears. Dates are optional —
 * "I'll add dates later" still sets up generic prep (FR-001, US-001 edge case).
 */
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateCalendar } from '@/src/components/features/DateCalendar';
import { Button } from '@/src/components/ui/Button';
import { Text } from '@/src/components/ui/Text';
import { upsertItinerary } from '@/src/lib/storage/progress';
import { colors, radii, spacing } from '@/src/theme/tokens';

export default function SetupUmrahScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (withDate: boolean) => {
    setSaving(true);
    try {
      await upsertItinerary({ pilgrimage_type: 'umrah', umrah_date: withDate ? selected : null });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Set up your Umrah', headerBackButtonDisplayMode: 'minimal' }} />
      {/* Fixed top */}
      <View style={styles.top}>
        <Text variant="body" color="onSurfaceMuted">
          Sets your countdown and prep plan. You can change or add this anytime.
        </Text>

        {/* Trip type — segmented toggle (only Umrah active) */}
        <View style={styles.segment}>
          <View style={[styles.seg, styles.segActive]}>
            <Text variant="bodyStrong" style={{ color: colors.onPrimary }}>
              Umrah
            </Text>
          </View>
          <View style={[styles.seg, styles.segDisabled]}>
            <Text variant="bodyStrong" color="onSurfaceMuted">
              Hajj
            </Text>
            <Text variant="caption" color="onSurfaceMuted">
              Coming soon
            </Text>
          </View>
        </View>

        <Text variant="h3" style={{ marginTop: spacing.lg }}>
          When are you going?
        </Text>
        <Text variant="caption" color="onSurfaceMuted">
          Pick a day — a rough date is fine, you can refine it later.
        </Text>
      </View>

      {/* Calendar fills the middle and scrolls internally under the sticky weekdays */}
      <View style={styles.calWrap}>
        <DateCalendar value={selected} onChange={setSelected} monthsAhead={9} />
      </View>

      {/* Sticky footer actions */}
      <View style={styles.footer}>
        <Button
          title="Save & see my countdown"
          loading={saving}
          disabled={!selected}
          onPress={() => save(true)}
          fullWidth
        />
        <Button title="I'll add dates later" variant="ghost" disabled={saving} onPress={() => save(false)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  top: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  calWrap: { flex: 1, paddingHorizontal: spacing.lg },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSunken,
    borderRadius: radii.pill,
    padding: 4,
    marginTop: spacing.md,
    gap: 4,
  },
  seg: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: radii.pill, minHeight: 48 },
  segActive: { backgroundColor: colors.primary },
  segDisabled: { opacity: 0.7 },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
