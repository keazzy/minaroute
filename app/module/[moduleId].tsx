/**
 * Learning module reader — renders a bite-size bundled module, fully offline (TASK-019).
 * Surfaces the scholar-source citation so content provenance is always visible.
 */
import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/src/components/ui/Text';
import { getModule } from '@/src/lib/content/loader';
import { colors, spacing } from '@/src/theme/tokens';

export default function ModuleReaderScreen() {
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();
  const mod = getModule(String(moduleId));

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: mod?.title ?? 'Learning', headerBackTitle: 'Back' }} />
      <ScrollView contentContainerStyle={styles.content}>
        {mod ? (
          <>
            <Text variant="h1">{mod.title}</Text>
            <Text variant="body" style={{ lineHeight: 26 }}>
              {mod.body}
            </Text>
            {mod.scholarSource ? (
              <Text variant="caption" color="onSurfaceMuted" style={{ marginTop: spacing.lg }}>
                Source: {mod.scholarSource}
              </Text>
            ) : null}
          </>
        ) : (
          <Text variant="body" color="onSurfaceMuted">
            This module isn’t available. Everything else is still here with you.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
});
