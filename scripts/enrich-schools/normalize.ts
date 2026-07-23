/**
 * Stage 1: merge + validate raw discovery output.
 *
 * Reads every data/raw/*.json (arrays of RawCandidate as emitted by the
 * discovery agents), validates against the zod schema, normalises fields,
 * merges intra-batch duplicates (fuzzy same name + same area), and writes
 * data/candidates.json.
 *
 * Usage: npm run schools:normalize
 */

import { existsSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { resolve as resolvePath } from 'path';
import {
  CANDIDATES_JSON,
  DATA_DIR,
  RAW_DIR,
  nameSimilarity,
  readJson,
  requireFile,
  slugify,
  writeJson,
} from './lib';
import { Candidate, RawCandidateSchema } from './schema';

const SAME_NAME_THRESHOLD = 0.8;

/**
 * Locked platforms we never crawl. A row sourced only from one of these came
 * from search-engine snippets — it enters the sheet flagged for human
 * in-browser verification with capped confidence.
 */
const SOCIAL_HOSTS = /(^|\.)(facebook\.com|m\.facebook\.com|instagram\.com|tiktok\.com|x\.com|twitter\.com)$/i;

function isSocialUrl(url: string): boolean {
  try {
    return SOCIAL_HOSTS.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

function normalizeUrl(url: string | null): string | null {
  if (!url) return null;
  const t = url.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return 'https://' + t;
}

function cleanPhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.length >= 7 ? phone.trim() : null;
}

/**
 * Areas match when they share any distinctive token — agents write the same
 * place as "Aboru, Iyana-Ipaja (Alimosho)" or "Iyana Ipaja (Alimosho)".
 * Unknown areas don't block a merge.
 */
function sameArea(a: string | null, b: string | null): boolean {
  if (!a || !b) return true;
  const tokens = (s: string) =>
    new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2));
  const ta = tokens(a);
  for (const t of tokens(b)) if (ta.has(t)) return true;
  return false;
}

function mergeInto(target: Candidate, extra: Candidate): void {
  // Fill nulls from the duplicate; keep the higher-confidence primary record.
  const fields: (keyof Candidate)[] = [
    'description',
    'address',
    'area',
    'city',
    'phone',
    'email',
    'website',
    'social_handle',
    'image_url',
  ];
  for (const f of fields) {
    if (target[f] == null && extra[f] != null) {
      (target as Record<string, unknown>)[f] = extra[f];
    }
  }
  if (extra.source_url && extra.source_url !== target.source_url) {
    const note = `also seen at ${extra.source_url}`;
    target.evidence = target.evidence ? `${target.evidence}; ${note}` : note;
  }
  target.confidence = Math.max(target.confidence, extra.confidence);
}

function main() {
  requireFile(RAW_DIR, 'Run discovery first — agents write data/raw/*.json');

  const files = readdirSync(RAW_DIR).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.error('❌ No data/raw/*.json files found. Run discovery first.');
    process.exit(1);
  }

  const candidates: Candidate[] = [];
  let invalid = 0;

  for (const file of files) {
    const raw = readJson<unknown[]>(resolve(RAW_DIR, file));
    if (!Array.isArray(raw)) {
      console.error(`⚠️  ${file} is not a JSON array — skipping`);
      continue;
    }

    let ok = 0;
    for (const entry of raw) {
      const parsed = RawCandidateSchema.safeParse(entry);
      if (!parsed.success) {
        invalid++;
        const name = (entry as { name?: string })?.name ?? '(unnamed)';
        console.error(`   ⚠️  ${file}: dropped "${name}": ${parsed.error.issues[0]?.message}`);
        continue;
      }

      const r = parsed.data;
      const social = isSocialUrl(r.source_url);
      const candidate: Candidate = {
        ...r,
        id: slugify(r.name, r.area ?? ''),
        category: 'School',
        state: r.state ?? 'Lagos',
        city: r.city ?? r.area ?? 'Lagos',
        website: normalizeUrl(r.website),
        image_url: normalizeUrl(r.image_url),
        phone: cleanPhone(r.phone),
        confidence: social ? Math.min(r.confidence, 0.5) : r.confidence,
        needs_verification: social,
        lat: null,
        lng: null,
        geocode_status: 'pending',
        dedup_status: 'pending',
        matched_place_id: null,
        matched_place_name: null,
      };

      // Intra-batch dedupe: fuzzy same name + same (or unknown) area
      const existing = candidates.find(
        (c) =>
          nameSimilarity(c.name, candidate.name) >= SAME_NAME_THRESHOLD &&
          sameArea(c.area, candidate.area),
      );
      if (existing) {
        mergeInto(existing, candidate);
      } else {
        // Ensure unique ids
        let id = candidate.id;
        let n = 2;
        while (candidates.some((c) => c.id === id)) id = `${candidate.id}-${n++}`;
        candidate.id = id;
        candidates.push(candidate);
        ok++;
      }
    }
    console.log(`📄 ${file}: ${raw.length} rows → ${ok} new candidates`);
  }

  // Verification results (in-browser checks of social-surfaced rows, reviewer
  // corrections) live in data/verified-overrides.json keyed by candidate id —
  // raw/ stays pristine agent output, and overrides survive re-runs.
  // Special key "evidence_append" appends to evidence instead of replacing.
  const overridesPath = resolvePath(DATA_DIR, 'verified-overrides.json');
  try {
    const overrides =
      readJson<Record<string, Record<string, unknown>>>(overridesPath);
    let applied = 0;
    for (const c of candidates) {
      const o = overrides[c.id];
      if (!o) continue;
      const { evidence_append, ...fields } = o;
      Object.assign(c, fields);
      if (typeof evidence_append === 'string') {
        c.evidence = c.evidence ? `${c.evidence}; ${evidence_append}` : evidence_append;
      }
      applied++;
    }
    if (applied) console.log(`🔎 ${applied} verified overrides applied`);
  } catch {
    // no overrides file — fine
  }

  // Re-runs must not wipe later-stage results: carry over geocode/dedupe
  // output from the existing candidates.json for ids that already went through.
  let carried = 0;
  if (existsSync(CANDIDATES_JSON)) {
    const prev = new Map(readJson<Candidate[]>(CANDIDATES_JSON).map((c) => [c.id, c]));
    for (const c of candidates) {
      const old = prev.get(c.id);
      if (old && old.geocode_status !== 'pending') {
        c.lat = old.lat;
        c.lng = old.lng;
        c.geocode_status = old.geocode_status;
        c.dedup_status = old.dedup_status;
        c.matched_place_id = old.matched_place_id;
        c.matched_place_name = old.matched_place_name;
        carried++;
      }
    }
  }

  writeJson(CANDIDATES_JSON, candidates);
  console.log(
    `\n✅ ${candidates.length} unique candidates → ${CANDIDATES_JSON}` +
      (carried ? `\n   ${carried} kept their existing geocode/dedupe results` : '') +
      (invalid ? `\n⚠️  ${invalid} invalid rows dropped (see warnings above)` : ''),
  );
}

main();
