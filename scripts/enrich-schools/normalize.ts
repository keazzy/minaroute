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

import { readdirSync } from 'fs';
import { resolve } from 'path';
import {
  CANDIDATES_JSON,
  RAW_DIR,
  nameSimilarity,
  readJson,
  requireFile,
  slugify,
  writeJson,
} from './lib';
import { Candidate, RawCandidateSchema } from './schema';

const SAME_NAME_THRESHOLD = 0.8;

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
      const candidate: Candidate = {
        ...r,
        id: slugify(r.name, r.area ?? ''),
        category: 'School',
        state: r.state ?? 'Lagos',
        city: r.city ?? r.area ?? 'Lagos',
        website: normalizeUrl(r.website),
        image_url: normalizeUrl(r.image_url),
        phone: cleanPhone(r.phone),
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
          (!c.area || !candidate.area || c.area.toLowerCase() === candidate.area.toLowerCase()),
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

  writeJson(CANDIDATES_JSON, candidates);
  console.log(
    `\n✅ ${candidates.length} unique candidates → ${CANDIDATES_JSON}` +
      (invalid ? `\n⚠️  ${invalid} invalid rows dropped (see warnings above)` : ''),
  );
}

main();
