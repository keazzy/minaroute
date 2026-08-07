/**
 * The detail page's type scale.
 *
 * Same approach as `home/type.ts` — sizes resolved against the swappable font
 * token so the page flips between Quicksand and Satoshi with everything else.
 * A few sizes are shared with Home; they are restated rather than imported so
 * the two scales can drift apart without one silently changing the other.
 */
import { useMemo } from 'react';
import type { TextStyle } from 'react-native';

import { useAppTheme } from '@/src/theme/ThemeProvider';
import { uiFontFamily } from '@/src/theme/tokens';

export type DetailTextStyles = {
  /** "MOSQUE" — the type label above the title. */
  eyebrow: TextStyle;
  /** Place name — 28, heaviest. */
  title: TextStyle;
  /** Section headings — 18, bold. */
  sectionTitle: TextStyle;
  /** Description and long copy — 15/24. */
  body: TextStyle;
  /** Secondary lines, captions — 13. */
  bodySmall: TextStyle;
  /** Attribute chip — 13, medium. */
  chip: TextStyle;
  /** Fact row label — 13. */
  factLabel: TextStyle;
  /** Fact row value — 14, medium. */
  factValue: TextStyle;
  /** "Read more" and other inline actions — 14, medium. */
  link: TextStyle;
};

export function useDetailType(): DetailTextStyles {
  const { fontChoice } = useAppTheme();

  return useMemo(() => {
    const f = (weight: 400 | 500 | 600 | 700) => uiFontFamily(fontChoice, weight);

    return {
      eyebrow: {
        fontFamily: f(500),
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
      },
      title: { fontFamily: f(700), fontSize: 28, lineHeight: 34 },
      sectionTitle: { fontFamily: f(700), fontSize: 18, lineHeight: 24 },
      body: { fontFamily: f(400), fontSize: 15, lineHeight: 24 },
      bodySmall: { fontFamily: f(400), fontSize: 13, lineHeight: 20 },
      chip: { fontFamily: f(500), fontSize: 13, lineHeight: 18 },
      factLabel: { fontFamily: f(400), fontSize: 13, lineHeight: 20 },
      factValue: { fontFamily: f(500), fontSize: 14, lineHeight: 20 },
      link: { fontFamily: f(500), fontSize: 14, lineHeight: 20 },
    };
  }, [fontChoice]);
}
