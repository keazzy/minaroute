/**
 * ModuleCard — a tappable card linking to a bite-size learning module (TASK-019).
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Card } from '@/src/components/ui/Card';
import { Text } from '@/src/components/ui/Text';
import { colors, spacing } from '@/src/theme/tokens';

export function ModuleCard({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push(`/module/${id}` as never)} accessibilityRole="button">
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
          <Text variant="bodyStrong" style={{ flex: 1 }}>
            {title}
          </Text>
          <Text variant="h3" style={{ color: colors.primary }}>
            ›
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
