/**
 * Countdown — days until the pilgrim's Umrah. The calm centerpiece of the Trips hub
 * (US-002). Renders only when a target date exists; the hub shows a prompt otherwise.
 */
import React from 'react';
import { View } from 'react-native';

import { Card } from '@/src/components/ui/Card';
import { Text } from '@/src/components/ui/Text';
import { daysUntil } from '@/src/lib/prep/prep';
import { colors, spacing } from '@/src/theme/tokens';

export function Countdown({ targetDate }: { targetDate: string }) {
  const days = daysUntil(targetDate);

  let big: string;
  let label: string;
  if (days > 1) {
    big = String(days);
    label = 'days until your Umrah';
  } else if (days === 1) {
    big = '1';
    label = 'day until your Umrah — nearly there';
  } else if (days === 0) {
    big = 'Today';
    label = 'May Allah accept your Umrah';
  } else {
    big = 'In progress';
    label = 'May your journey be accepted';
  }

  return (
    <Card style={{ backgroundColor: colors.primary, borderColor: colors.primaryDark, alignItems: 'center', paddingVertical: spacing.xl }}>
      <View style={{ alignItems: 'center', gap: spacing.xs }}>
        <Text variant="display" style={{ color: colors.onPrimary, fontSize: days > 1 ? 56 : 34, lineHeight: days > 1 ? 60 : 40 }}>
          {big}
        </Text>
        <Text variant="body" style={{ color: colors.primarySoft, textAlign: 'center' }}>
          {label}
        </Text>
      </View>
    </Card>
  );
}
