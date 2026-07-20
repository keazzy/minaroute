/**
 * DateCalendar — Airbnb-style month calendar for picking a single Umrah date.
 * Renders a vertical run of months (current + a few ahead); tap a day to select.
 * Past days are disabled. Fully custom (no calendar dep) and on the design system.
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/src/components/ui/Text';
import { colors, radii, spacing } from '@/src/theme/tokens';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m0: number, d: number) => `${y}-${pad(m0 + 1)}-${pad(d)}`;

function MonthView({
  year,
  month0,
  value,
  todayIso,
  onSelect,
}: {
  year: number;
  month0: number;
  value: string | null;
  todayIso: string;
  onSelect: (dateIso: string) => void;
}) {
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const leadingBlanks = new Date(year, month0, 1).getDay(); // 0=Sun
  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View style={styles.month}>
      <Text variant="h3">
        {MONTHS[month0]} {year}
      </Text>
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`b${i}`} style={styles.cell} />;
          const cellIso = iso(year, month0, day);
          const isPast = cellIso < todayIso;
          const isSelected = cellIso === value;
          return (
            <Pressable
              key={cellIso}
              disabled={isPast}
              onPress={() => onSelect(cellIso)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: isPast }}
              style={styles.cell}
            >
              <View style={[styles.dayInner, isSelected && styles.daySelected]}>
                <Text
                  variant="body"
                  style={{
                    color: isSelected ? colors.onPrimary : isPast ? colors.border : colors.onSurface,
                  }}
                >
                  {day}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function DateCalendar({
  value,
  onChange,
  monthsAhead = 6,
}: {
  value: string | null;
  onChange: (dateIso: string) => void;
  monthsAhead?: number;
}) {
  const now = new Date();
  const todayIso = iso(now.getFullYear(), now.getMonth(), now.getDate());

  const months = Array.from({ length: monthsAhead + 1 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return { year: d.getFullYear(), month0: d.getMonth() };
  });

  return (
    <View style={styles.container}>
      {/* Fixed weekday row (a normal row, not a sticky header) sits above the scroll */}
      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <Text key={i} variant="caption" color="onSurfaceMuted" style={styles.weekLabel}>
            {w}
          </Text>
        ))}
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {months.map((m) => (
          <MonthView
            key={`${m.year}-${m.month0}`}
            year={m.year}
            month0={m.month0}
            value={value}
            todayIso={todayIso}
            onSelect={onChange}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const CELL = `${100 / 7}%`;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.lg },
  weekRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  weekLabel: { flex: 1, textAlign: 'center' },
  month: { gap: spacing.sm, marginTop: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  dayInner: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: { backgroundColor: colors.primary },
});
