/**
 * NextStepCard — the single "what to do next" card (US-005: always exactly one next
 * step). Tapping it routes to that step.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Card } from '@/src/components/ui/Card';
import { Text } from '@/src/components/ui/Text';
import type { NextStep } from '@/src/lib/prep/prep';
import { colors, spacing } from '@/src/theme/tokens';

export function NextStepCard({ step }: { step: NextStep }) {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push(step.href as never)} accessibilityRole="button">
      <Card style={{ gap: spacing.xs }}>
        <Text variant="caption" color="onSurfaceMuted">
          YOUR NEXT STEP
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="h3">{step.title}</Text>
            <Text variant="caption" color="onSurfaceMuted">
              {step.subtitle}
            </Text>
          </View>
          <Text variant="h2" style={{ color: colors.primary }}>
            ›
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
