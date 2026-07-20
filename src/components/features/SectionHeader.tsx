/**
 * SectionHeader — a checklist/content section title with an optional per-section
 * progress bar (design.md: section-header + progress-bar).
 */
import React from 'react';
import { View } from 'react-native';

import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { Text } from '@/src/components/ui/Text';
import { spacing } from '@/src/theme/tokens';

export function SectionHeader({
  title,
  done,
  total,
}: {
  title: string;
  done?: number;
  total?: number;
}) {
  const showProgress = typeof done === 'number' && typeof total === 'number' && total > 0;
  return (
    <View style={{ gap: spacing.xs, marginTop: spacing.lg, marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Text variant="h3">{title}</Text>
        {showProgress ? (
          <Text variant="caption" color="onSurfaceMuted">
            {done}/{total}
          </Text>
        ) : null}
      </View>
      {showProgress ? <ProgressBar value={done! / total!} /> : null}
    </View>
  );
}
