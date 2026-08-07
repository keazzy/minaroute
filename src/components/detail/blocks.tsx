/**
 * The small building blocks of a detail page body: section wrapper, attribute
 * chips, fact list, and expandable copy.
 *
 * Kept in one file because each is a dozen lines and they are only ever used
 * together — splitting them into four files would cost more to navigate than it
 * saves.
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { discoveryRadii, useColors } from '@/src/theme/palette';

import { useDetailType } from './type';

// ---- Section ----------------------------------------------------------------

export type DetailSectionProps = {
  title?: string;
  children: React.ReactNode;
};

/** A titled block. Renders nothing when it has no children — sections whose
 *  data is missing must disappear rather than leave a heading over a void. */
export function DetailSection({ title, children }: DetailSectionProps) {
  const c = useColors();
  const type = useDetailType();

  if (children === null || children === undefined || children === false) return null;

  return (
    <View style={styles.section}>
      {title ? (
        <Text style={[type.sectionTitle, { color: c.onBackground }]}>{title}</Text>
      ) : null}
      {children}
    </View>
  );
}

// ---- Attribute chips --------------------------------------------------------

/**
 * The row of short facts under the title — "Women's section · Wudu · Parking".
 *
 * For someone deciding whether they can pray somewhere, this is the highest-value
 * line on the page, which is why it sits directly beneath the name.
 */
export function AttributeChips({ items }: { items: string[] }) {
  const c = useColors();
  const type = useDetailType();

  if (items.length === 0) return null;

  return (
    <View style={styles.chipRow} testID="detail-chips">
      {items.map((label) => (
        <View
          key={label}
          style={[styles.chip, { backgroundColor: c.surfaceMuted, borderColor: c.border }]}
        >
          <Text style={[type.chip, { color: c.onBackground }]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

// ---- Fact list --------------------------------------------------------------

export type Fact = { key: string; label: string; value: string };

/** Labelled rows for values that don't reduce to a yes/no chip. */
export function FactList({ facts }: { facts: Fact[] }) {
  const c = useColors();
  const type = useDetailType();

  if (facts.length === 0) return null;

  return (
    <View style={styles.facts} testID="detail-facts">
      {facts.map((f) => (
        <View key={f.key} style={[styles.factRow, { borderBottomColor: c.border }]}>
          <Text style={[type.factLabel, { color: c.onBackgroundMuted }]}>{f.label}</Text>
          <Text style={[type.factValue, { color: c.onBackground }]}>{f.value}</Text>
        </View>
      ))}
    </View>
  );
}

// ---- Expandable copy --------------------------------------------------------

/**
 * Description with a "Read more" toggle, as in the reference. Collapses to four
 * lines; the toggle is hidden entirely when the copy is short enough not to clip.
 */
export function ExpandableText({ text, collapsedLines = 4 }: { text: string; collapsedLines?: number }) {
  const c = useColors();
  const type = useDetailType();
  const [expanded, setExpanded] = useState(false);
  const [lineCount, setLineCount] = useState<number | null>(null);

  const clipped = lineCount !== null && lineCount > collapsedLines;

  return (
    <View style={styles.copy}>
      {/*
        Measurement pass. iOS reports only the *rendered* lines from
        onTextLayout once `numberOfLines` is set, so a clamped Text always
        reports exactly the cap and can never detect its own truncation.
        This invisible unclamped copy inherits the container width, counts the
        real total once, then unmounts.
      */}
      {lineCount === null ? (
        <Text
          style={[type.body, styles.measure]}
          onTextLayout={(e) => setLineCount(e.nativeEvent.lines.length)}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {text}
        </Text>
      ) : null}

      <Text
        style={[type.body, { color: c.onBackground }]}
        numberOfLines={expanded ? undefined : collapsedLines}
      >
        {text}
      </Text>

      {clipped ? (
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          accessibilityRole="button"
          testID="detail-read-more"
        >
          <Text style={[type.link, { color: c.badge }]}>
            {expanded ? 'Read less' : 'Read more'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12, paddingHorizontal: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: discoveryRadii.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  facts: { gap: 0 },
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  copy: { gap: 6 },
  // Stretched to the container width so the line count matches the visible copy,
  // but invisible and out of the layout flow.
  measure: { position: 'absolute', left: 0, right: 0, opacity: 0 },
});
