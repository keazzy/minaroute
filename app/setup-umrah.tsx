/**
 * "Set up your Umrah" — the pilgrimage onboarding, reached from the Trips hub (kept out
 * of the everyday first-launch per "modes, not a blend"). Captures trip type (Umrah;
 * Hajj coming soon) + travel date, persists to the OFFLINE local store, and returns to
 * the hub where the countdown appears. Dates are optional — "skip" still sets up generic
 * prep (FR-001, US-001 edge case).
 */
import { Picker } from '@react-native-picker/picker';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Text } from '@/src/components/ui/Text';
import { upsertItinerary } from '@/src/lib/storage/progress';
import { colors, radii, spacing } from '@/src/theme/tokens';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n: number) => String(n).padStart(2, '0');

export default function SetupUmrahScreen() {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1); // 1..12
  const [day, setDay] = useState(now.getDate()); // 1..31
  const [year, setYear] = useState(now.getFullYear());
  const [saving, setSaving] = useState(false);

  const years = [year, now.getFullYear(), now.getFullYear() + 1, now.getFullYear() + 2].filter(
    (v, i, a) => a.indexOf(v) === i,
  );

  const save = async (withDate: boolean) => {
    setSaving(true);
    try {
      await upsertItinerary({
        pilgrimage_type: 'umrah',
        umrah_date: withDate ? `${year}-${pad(month)}-${pad(day)}` : null,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Set up your Umrah', headerBackButtonDisplayMode: 'minimal' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="body" color="onSurfaceMuted">
          Sets your countdown and prep plan. You can change or add this anytime.
        </Text>

        {/* Trip type — Umrah now, Hajj later */}
        <View style={styles.typeRow}>
          <View style={[styles.typePill, styles.typePillActive]}>
            <Text variant="bodyStrong" style={{ color: colors.onPrimary }}>
              Umrah
            </Text>
            <Text variant="caption" style={{ color: colors.primarySoft }}>
              Saudi Arabia
            </Text>
          </View>
          <View style={[styles.typePill, styles.typePillDisabled]}>
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
          A rough date is fine — you can refine it later.
        </Text>

        <Card padded={false} style={styles.pickerCard}>
          <View style={styles.pickerRow}>
            <Picker selectedValue={month} onValueChange={setMonth} style={styles.picker}>
              {MONTHS.map((m, i) => (
                <Picker.Item key={m} label={m} value={i + 1} />
              ))}
            </Picker>
            <Picker selectedValue={day} onValueChange={setDay} style={styles.pickerNarrow}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <Picker.Item key={d} label={String(d)} value={d} />
              ))}
            </Picker>
            <Picker selectedValue={year} onValueChange={setYear} style={styles.pickerNarrow}>
              {years.map((y) => (
                <Picker.Item key={y} label={String(y)} value={y} />
              ))}
            </Picker>
          </View>
        </Card>

        <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          <Button title="Save & see my countdown" loading={saving} onPress={() => save(true)} fullWidth />
          <Button title="I'll add dates later" variant="ghost" disabled={saving} onPress={() => save(false)} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.sm },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  typePill: { flex: 1, borderRadius: radii.md, borderWidth: 1, padding: spacing.md, gap: 2 },
  typePillActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  typePillDisabled: { backgroundColor: colors.surfaceSunken, borderColor: colors.border },
  pickerCard: { marginTop: spacing.sm, overflow: 'hidden' },
  pickerRow: { flexDirection: 'row', alignItems: 'center' },
  picker: { flex: 1.4, color: colors.onSurface },
  pickerNarrow: { flex: 1, color: colors.onSurface },
});
