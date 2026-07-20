/**
 * Prepare — the at-home readiness screen reached from the Trips hub (FR-003).
 * Sectioned checklist + packing with persistent offline toggles, plus bite-size
 * learning modules. Works fully offline (bundled content + local store).
 */
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChecklistItem } from '@/src/components/features/ChecklistItem';
import { ModuleCard } from '@/src/components/features/ModuleCard';
import { SectionHeader } from '@/src/components/features/SectionHeader';
import { Text } from '@/src/components/ui/Text';
import { getChecklistSections, getModules } from '@/src/lib/content/loader';
import { getChecklist, toggleChecklistItem } from '@/src/lib/storage/progress';
import { colors, spacing } from '@/src/theme/tokens';

export default function PrepareScreen() {
  const sections = getChecklistSections();
  const modules = getModules();
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const rows = await getChecklist();
    setChecked(new Set(rows.filter((r) => r.checked).map((r) => r.item_id)));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = useCallback((itemId: string) => {
    setChecked((prev) => {
      const willCheck = !prev.has(itemId);
      const next = new Set(prev);
      if (willCheck) next.add(itemId);
      else next.delete(itemId);
      // Persist the EXPLICIT target value (not a store-side flip) so rapid taps stay
      // idempotent and can't desync the UI from the store (last-write-wins).
      void toggleChecklistItem(itemId, willCheck);
      return next;
    });
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Prepare', headerBackButtonDisplayMode: 'minimal' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="body" color="onSurfaceMuted">
          Tick things off as you go — it all saves, even offline.
        </Text>

        {sections.map((section) => {
          const done = section.items.filter((it) => checked.has(it.id)).length;
          return (
            <View key={section.id}>
              <SectionHeader title={section.title} done={done} total={section.items.length} />
              <View style={{ gap: spacing.sm }}>
                {section.items.map((item) => (
                  <ChecklistItem
                    key={item.id}
                    label={item.label}
                    note={item.note}
                    checked={checked.has(item.id)}
                    onToggle={() => toggle(item.id)}
                  />
                ))}
              </View>
            </View>
          );
        })}

        <SectionHeader title="Learning" />
        <View style={{ gap: spacing.sm }}>
          {modules.map((m) => (
            <ModuleCard key={m.id} id={m.id} title={m.title} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
