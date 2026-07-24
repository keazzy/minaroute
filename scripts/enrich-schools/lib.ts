/**
 * Shared helpers for the enrich-schools pipeline: env, Supabase client,
 * file paths, CSV read/write (RFC 4180), and fuzzy name matching.
 */

import { config } from 'dotenv';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

config({ path: resolve(__dirname, '../../.env.local') });

export const DATA_DIR = resolve(__dirname, 'data');
export const RAW_DIR = resolve(DATA_DIR, 'raw');
export const CANDIDATES_JSON = resolve(DATA_DIR, 'candidates.json');
export const REVIEW_SHEET_CSV = resolve(DATA_DIR, 'review-sheet.csv');

export const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://spjlyhmgqtkcqhpvgxci.supabase.co';

export function getServiceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_KEY || '';
  if (!key) {
    console.error('❌ SUPABASE_SERVICE_KEY is required (service_role key, .env.local)');
    process.exit(1);
  }
  return createClient(SUPABASE_URL, key);
}

export function getGoogleKey(): string {
  const key =
    process.env.GOOGLE_MAPS_KEY ||
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
    '';
  if (!key) {
    console.error('❌ A Google API key is required for geocoding (.env.local)');
    process.exit(1);
  }
  return key;
}

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

export function writeJson(path: string, value: unknown): void {
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

export function requireFile(path: string, hint: string): void {
  if (!existsSync(path)) {
    console.error(`❌ Missing ${path}\n   ${hint}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// CSV (RFC 4180: quoted fields, escaped quotes, embedded commas/newlines)
// ---------------------------------------------------------------------------

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

export function toCsv(columns: readonly string[], rows: Record<string, unknown>[]): string {
  const lines = [columns.map(csvEscape).join(',')];
  for (const row of rows) {
    lines.push(
      columns
        .map((c) => {
          const v = row[c];
          return csvEscape(v === null || v === undefined ? '' : String(v));
        })
        .join(','),
    );
  }
  // BOM so Excel opens UTF-8 correctly
  return '﻿' + lines.join('\r\n') + '\r\n';
}

export function parseCsv(text: string): Record<string, string>[] {
  const src = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    if (row.length > 1 || row[0] !== '') rows.push(row);
  }

  const [header, ...body] = rows;
  if (!header) return [];
  return body.map((cells) => {
    const rec: Record<string, string> = {};
    header.forEach((h, idx) => {
      rec[h.trim()] = (cells[idx] ?? '').trim();
    });
    return rec;
  });
}

// ---------------------------------------------------------------------------
// Fuzzy name matching + geo distance
// ---------------------------------------------------------------------------

/** Generic words that carry no identity ("school", "islamic", …). */
const STOPWORDS = new Set([
  'school',
  'schools',
  'college',
  'academy',
  'islamic',
  'islamiyya',
  'islamiyyah',
  'muslim',
  'nursery',
  'primary',
  'secondary',
  'international',
  'group',
  'of',
  'and',
  'the',
  'for',
  'centre',
  'center',
  'institute',
  'model',
  'comprehensive',
  'memorial',
  'grammar',
  'high',
  'junior',
  'senior',
]);

export function nameTokens(name: string): Set<string> {
  return new Set(
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1 && !STOPWORDS.has(t)),
  );
}

/** Token-set Jaccard similarity on distinctive tokens; 0 when either side is all-generic. */
export function nameSimilarity(a: string, b: string): number {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (ta.size === 0 || tb.size === 0) {
    // Both names are entirely generic words — compare full normalized strings
    const na = a.toLowerCase().replace(/[^a-z0-9]/g, '');
    const nb = b.toLowerCase().replace(/[^a-z0-9]/g, '');
    return na && na === nb ? 1 : 0;
  }
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / (ta.size + tb.size - inter);
}

/** Lowercased alphanumeric form for whole-name containment checks. */
export function normalizedName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** One normalized name contains the other ("X (LEMU Schools)" ⊃ "X"). */
export function rawContains(a: string, b: string): boolean {
  const na = normalizedName(a);
  const nb = normalizedName(b);
  return na.length > 0 && nb.length > 0 && (na.includes(nb) || nb.includes(na));
}

/**
 * Muslim-association name particles ("Ansar-Ud-Deen …") — dozens of distinct
 * schools share these, so they don't count toward subset-style matching.
 */
const ASSOCIATION_TOKENS = new Set([
  'ansar',
  'ud',
  'deen',
  'anwar',
  'ul',
  'al',
  'islam',
  'nawair',
  'zumratul',
  'jamat',
  'jamaatul',
  'ahmadiyya',
  'nasfat',
  'society',
]);

/**
 * Aggressive same-name test for dedupe against the DB: token Jaccard ≥ 0.8
 * after stripping the candidate's own area words from both sides, OR one
 * side's distinctive tokens fully contained in the other's (≥2 non-association
 * tokens). Catches "Markaz (…), Agege" ↔ "Markaz Arabic and Islamic Training
 * Centre" and "Daarus Salam Tahfidh Int'l Academy (DASTIA)" ↔ the DB row.
 */
export function namesLikelySame(a: string, b: string, area?: string | null): boolean {
  const strip = (tokens: Set<string>) => {
    if (!area) return tokens;
    const areaToks = nameTokens(area);
    return new Set([...tokens].filter((t) => !areaToks.has(t)));
  };
  const ta = strip(nameTokens(a));
  const tb = strip(nameTokens(b));
  if (ta.size === 0 || tb.size === 0) return rawContains(a, b);

  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  if (inter / (ta.size + tb.size - inter) >= 0.8) return true;

  const [small, big] = ta.size <= tb.size ? [ta, tb] : [tb, ta];
  const distinctive = [...small].filter((t) => !ASSOCIATION_TOKENS.has(t));
  return distinctive.length >= 2 && [...small].every((t) => big.has(t));
}

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function slugify(name: string, extra = ''): string {
  const base = (name + (extra ? '-' + extra : ''))
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.slice(0, 80);
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}
