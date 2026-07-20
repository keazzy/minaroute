/**
 * Component gallery / design-token sample screen (dev + QA).
 *
 * Verifies TASK-008 + TASK-009: every primitive reads design tokens (no hardcoded
 * values), the single font token flips the whole UI Quicksand↔Satoshi, and Amiri
 * renders Arabic. Reachable at `/gallery`.
 */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ListRow } from '@/src/components/ui/ListRow';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { Text } from '@/src/components/ui/Text';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { colors, spacing } from '@/src/theme/tokens';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="h3" color="onSurfaceMuted">
        {title}
      </Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export default function GalleryScreen() {
  const { fontChoice, setFontChoice } = useAppTheme();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="display">As-salamu alaykum</Text>
        <Text variant="body" color="onSurfaceMuted">
          Minaroute design system — primitives &amp; tokens.
        </Text>

        <Section title="Font token (swappable)">
          <Text variant="body">
            Active UI font: <Text variant="bodyStrong">{fontChoice}</Text>
          </Text>
          <Button
            title={`Switch to ${fontChoice === 'quicksand' ? 'Satoshi' : 'Quicksand'}`}
            variant="secondary"
            onPress={() => setFontChoice(fontChoice === 'quicksand' ? 'satoshi' : 'quicksand')}
          />
        </Section>

        <Section title="Typography">
          <Text variant="display">Display</Text>
          <Text variant="h1">Heading 1</Text>
          <Text variant="h2">Heading 2</Text>
          <Text variant="h3">Heading 3</Text>
          <Text variant="body">Body — a calm, knowledgeable companion.</Text>
          <Text variant="bodyStrong">Body strong</Text>
          <Text variant="caption" color="onSurfaceMuted">
            Caption / metadata
          </Text>
        </Section>

        <Section title="Arabic (Amiri)">
          <Card>
            <Text variant="arabicDisplay">لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ</Text>
            <Text variant="arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
          </Card>
        </Section>

        <Section title="Buttons">
          <Button title="Primary action" onPress={() => {}} />
          <Button title="Secondary action" variant="secondary" onPress={() => {}} />
          <Button title="Ghost action" variant="ghost" onPress={() => {}} />
          <Button title="Disabled" disabled onPress={() => {}} />
          <Button title="Loading" loading onPress={() => {}} />
        </Section>

        <Section title="Cards">
          <Card>
            <Text variant="h3">Content card</Text>
            <Text variant="body" color="onSurfaceMuted">
              md radius, hairline border, no shadow.
            </Text>
          </Card>
          <Card variant="flat">
            <Text variant="bodyStrong">Flat listing card</Text>
            <Text variant="caption" color="onSurfaceMuted">
              xs radius, for dense rows.
            </Text>
          </Card>
        </Section>

        <Section title="List rows">
          <ListRow title="Mosques" subtitle="Find a masjid near you" onPress={() => {}} />
          <ListRow title="Halal Food" subtitle="Restaurants &amp; groceries" onPress={() => {}} />
          <ListRow title="Static row (no press)" />
        </Section>

        <Section title="Progress">
          <ProgressBar value={0.25} />
          <ProgressBar value={0.6} />
          <ProgressBar value={1} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.sm },
  section: { marginTop: spacing.xl, gap: spacing.sm },
  sectionBody: { gap: spacing.sm },
});
