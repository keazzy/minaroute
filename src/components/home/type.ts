/**
 * The Home Figma's type scale.
 *
 * The design uses sizes (12/14/16/20/24/28) and a Medium (500) weight that the
 * token `typography` variants don't cover — those are tuned for the pilgrimage
 * screens (13/16/17/20/26/32). Rather than bend either one, this resolves the
 * Figma's sizes against the *same* swappable font token, so Home still flips
 * between Quicksand and Satoshi with everything else.
 *
 * Note the Figma is drawn in Satoshi, including a Black (900) weight for
 * "Where to?" and the promo headline. Satoshi's licensed TTFs are not in the
 * repo (`assets/fonts/` is empty), so the app renders Quicksand and the heaviest
 * available weight is 700. See docs/build-log.md.
 */
import { useMemo } from 'react';
import type { TextStyle } from 'react-native';

import { useAppTheme } from '@/src/theme/ThemeProvider';
import { uiFontFamily } from '@/src/theme/tokens';

export type HomeTextStyles = {
  /** "AS SALAM ALYKUM" — 12, uppercase. */
  greetingEyebrow: TextStyle;
  /** "Where to?" — 28, heaviest weight. */
  greetingTitle: TextStyle;
  /** Search placeholder + location secondary line — 14. */
  bodySmall: TextStyle;
  /** Location primary line — 16, medium. */
  bodyMedium: TextStyle;
  /** Section headings — 20, bold. */
  sectionTitle: TextStyle;
  /** Category tile label — 12, medium. */
  tileLabel: TextStyle;
  /** Card title — 14, medium. */
  cardTitle: TextStyle;
  /** Card qualifier ("One of the best (1 source)") — 12, medium. */
  cardMeta: TextStyle;
  /** Card footer (distance / price) — 12, regular. */
  cardFooter: TextStyle;
  /** Badge digits — 10, medium. */
  badge: TextStyle;
  /** Promo eyebrow — 16, medium. */
  promoEyebrow: TextStyle;
  /** Promo headline — 24, heaviest. */
  promoTitle: TextStyle;
  /** Promo button — 16, medium. */
  promoButton: TextStyle;
};

export function useHomeType(): HomeTextStyles {
  const { fontChoice } = useAppTheme();

  return useMemo(() => {
    const f = (weight: 400 | 500 | 600 | 700) => uiFontFamily(fontChoice, weight);

    return {
      greetingEyebrow: { fontFamily: f(400), fontSize: 12, lineHeight: 14, textTransform: 'uppercase' },
      greetingTitle: { fontFamily: f(700), fontSize: 28, lineHeight: 32 },
      bodySmall: { fontFamily: f(400), fontSize: 14, lineHeight: 22, letterSpacing: 0.14 },
      bodyMedium: { fontFamily: f(500), fontSize: 16, lineHeight: 22, letterSpacing: 0.16 },
      sectionTitle: { fontFamily: f(700), fontSize: 20, lineHeight: 21 },
      tileLabel: { fontFamily: f(500), fontSize: 12, lineHeight: 18 },
      cardTitle: { fontFamily: f(500), fontSize: 14, lineHeight: 19 },
      cardMeta: { fontFamily: f(500), fontSize: 12, lineHeight: 16 },
      cardFooter: { fontFamily: f(400), fontSize: 12, lineHeight: 16 },
      badge: { fontFamily: f(500), fontSize: 10, lineHeight: 14 },
      promoEyebrow: { fontFamily: f(500), fontSize: 16, lineHeight: 18 },
      promoTitle: { fontFamily: f(700), fontSize: 24, lineHeight: 29 },
      promoButton: { fontFamily: f(500), fontSize: 16, lineHeight: 18 },
    };
  }, [fontChoice]);
}
