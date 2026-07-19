/**
 * i18n setup (i18next + react-i18next). English at MVP.
 *
 * Adding a language needs NO code beyond this file (FR-010): import its
 * `strings.[lang].json` and add one entry to `resources`. Content JSON
 * (rites, modules) follows the same `.[lang].json` convention and is resolved by the
 * content loader — the schema never changes.
 *
 * RTL scaffolding: `RTL_LANGUAGES` / `isRTL` let the UI flip direction when an RTL
 * language is added. Arabic *content blocks* (du'a) already render RTL via the
 * `arabic` typography token regardless of UI language.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/src/content/strings.en.json';

export const defaultNS = 'translation';

// Add a language here (one line) — no other code change required.
export const resources = {
  en: { translation: en },
} as const;

export type AppLanguage = keyof typeof resources;

/** Languages that require right-to-left layout. */
export const RTL_LANGUAGES = new Set<string>(['ar', 'ur', 'fa', 'he']);

export function isRTL(language: string): boolean {
  return RTL_LANGUAGES.has(language);
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    defaultNS,
    interpolation: { escapeValue: false }, // RN escapes by default
    returnNull: false,
    compatibilityJSON: 'v4',
  });
}

/** Change the active UI language at runtime (persisted by the caller). */
export function setLanguage(language: string): Promise<unknown> {
  return i18n.changeLanguage(language);
}

export default i18n;
