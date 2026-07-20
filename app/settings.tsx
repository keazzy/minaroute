/**
 * Settings — font choice (design.md § Settings → Font) + a dev-only "reset trip"
 * control to replay the setup flow. Reachable from the Trips hub gear.
 */
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Text } from '@/src/components/ui/Text';
import { resetLocalPilgrimage } from '@/src/lib/storage/progress';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { colors, radii, spacing, type FontChoice } from '@/src/theme/tokens';

const FONTS: { key: FontChoice; label: string }[] = [
  { key: 'quicksand', label: 'Quicksand' },
  { key: 'satoshi', label: 'Satoshi' },
];

export default function SettingsScreen() {
  const { fontChoice, setFontChoice } = useAppTheme();
  const router = useRouter();

  const confirmReset = () => {
    Alert.alert(
      'Reset trip?',
      'This clears your Umrah dates and checklist so you can set up again from the start.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetLocalPilgrimage();
            router.back();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Settings', headerBackButtonDisplayMode: 'minimal' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="caption" color="onSurfaceMuted">
          FONT
        </Text>
        <View style={styles.segment}>
          {FONTS.map((f) => {
            const active = fontChoice === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFontChoice(f.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.seg, active && styles.segActive]}
              >
                <Text variant="bodyStrong" style={{ color: active ? colors.onPrimary : colors.onSurface }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Card style={{ marginTop: spacing.md, gap: spacing.xs }}>
          <Text variant="h2">As-salamu alaykum</Text>
          <Text variant="body" color="onSurfaceMuted">
            Your Umrah countdown, checklist & du'a — all in {FONTS.find((f) => f.key === fontChoice)?.label}.
          </Text>
        </Card>

        <Text variant="caption" color="onSurfaceMuted" style={{ marginTop: spacing.sm }}>
          Note: Satoshi's font files aren't bundled yet, so it currently renders the same as
          Quicksand. Drop Satoshi-Regular/Medium/Bold into assets/fonts/ to see the real switch.
        </Text>

        {__DEV__ ? (
          <>
            <Text variant="caption" color="onSurfaceMuted" style={{ marginTop: spacing.xl }}>
              DEVELOPER
            </Text>
            <Button title="Reset trip" variant="secondary" onPress={confirmReset} style={{ marginTop: spacing.sm }} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSunken,
    borderRadius: radii.pill,
    padding: 4,
    marginTop: spacing.sm,
    gap: 4,
  },
  seg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radii.pill,
    minHeight: 44,
  },
  segActive: { backgroundColor: colors.primary },
});
