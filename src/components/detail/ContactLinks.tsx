/**
 * The contact block — one tappable row per channel, each with its glyph.
 *
 * Built to be shared by the place page and the (not yet built) event page,
 * because an event's organiser has exactly the same channels as a school's
 * office. Callers pass a sparse object; only the channels present render, in
 * the fixed order below rather than in object-key order, so the block reads the
 * same everywhere.
 *
 * Each kind knows how to turn its stored value into a URL. Handles are stored
 * bare ("minaroute", not a full profile URL) so they can be displayed as
 * @handle and still open correctly — storing whole URLs would make the label
 * unreadable and the value impossible to validate.
 */
import React, { useCallback } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/src/theme/palette';

import { ContactIcon, type ContactKind } from './contact-icons';
import { useDetailType } from './type';

export type Contacts = Partial<Record<ContactKind, string>>;

/** Fixed render order: the channels people actually try first, first. */
const ORDER: ContactKind[] = ['phone', 'whatsapp', 'email', 'website', 'instagram', 'facebook', 'x'];

const stripHandle = (v: string) => v.replace(/^@/, '').trim();

function hrefFor(kind: ContactKind, value: string): string {
  switch (kind) {
    case 'phone':
      return `tel:${value.replace(/[^\d+]/g, '')}`;
    case 'whatsapp':
      return `https://wa.me/${value.replace(/[^\d]/g, '')}`;
    case 'email':
      return `mailto:${value}`;
    case 'website':
      return /^https?:\/\//i.test(value) ? value : `https://${value}`;
    case 'instagram':
      return `https://instagram.com/${stripHandle(value)}`;
    case 'facebook':
      return `https://facebook.com/${stripHandle(value)}`;
    case 'x':
      return `https://x.com/${stripHandle(value)}`;
  }
}

function labelFor(kind: ContactKind, value: string): string {
  switch (kind) {
    case 'instagram':
    case 'facebook':
    case 'x':
      return `@${stripHandle(value)}`;
    case 'website':
      // The scheme and any trailing slash are noise in a label.
      return value.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    default:
      return value;
  }
}

const A11Y: Record<ContactKind, string> = {
  phone: 'Call',
  whatsapp: 'Message on WhatsApp',
  email: 'Send an email',
  website: 'Open the website',
  instagram: 'Open Instagram',
  facebook: 'Open Facebook',
  x: 'Open X',
};

export function ContactLinks({ contacts }: { contacts: Contacts }) {
  const c = useColors();
  const type = useDetailType();

  const open = useCallback((kind: ContactKind, value: string) => {
    Linking.openURL(hrefFor(kind, value)).catch(() => undefined);
  }, []);

  const rows = ORDER.filter((k) => {
    const v = contacts[k];
    return typeof v === 'string' && v.trim().length > 0;
  });

  if (rows.length === 0) return null;

  return (
    <View testID="detail-contacts">
      {rows.map((kind, i) => {
        const value = contacts[kind] as string;
        return (
          <Pressable
            key={kind}
            onPress={() => open(kind, value)}
            accessibilityRole="link"
            accessibilityLabel={`${A11Y[kind]}: ${labelFor(kind, value)}`}
            style={[
              styles.row,
              // No rule under the last row — it would read as a section divider.
              i < rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
            ]}
          >
            <View style={[styles.iconWell, { backgroundColor: c.surfaceMuted }]}>
              <ContactIcon kind={kind} color={c.onBackground} />
            </View>
            <Text style={[type.factValue, styles.label, { color: c.onBackground }]} numberOfLines={1}>
              {labelFor(kind, value)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  iconWell: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1 },
});
