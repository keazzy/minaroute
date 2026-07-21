/**
 * Stage 5: upload human-approved rows to Supabase `places`.
 *
 * Deliberately dumb and deterministic — no discovery logic here. Reads the
 * reviewed CSV, takes ONLY rows where approved=TRUE, validates them, skips
 * anything that already exists (same fuzzy name within ~150 m), and inserts
 * with the service key (places writes are service-role only under RLS).
 *
 * The sheet is the source of truth: reviewer edits to lat/lng/name/etc. are
 * what get uploaded. Rows with dedup_status=dup are refused even if approved.
 *
 * Optional columns (source_url, website, phone, email, verified_at — see
 * supabase/migrations/0002_places_provenance.sql) are included only when the
 * live schema has them; otherwise they're dropped with a warning.
 *
 * Usage:
 *   npm run schools:upload             # uploads data/review-sheet.csv
 *   npm run schools:upload -- --dry-run
 *   npm run schools:upload -- --file path/to/sheet.csv
 */

import { readFileSync } from 'fs';
import {
  REVIEW_SHEET_CSV,
  getServiceClient,
  haversineMeters,
  nameSimilarity,
  parseCsv,
  requireFile,
} from './lib';

const PROXIMITY_METERS = 150;
const SAME_NAME = 0.8;

const OPTIONAL_COLUMNS = ['source_url', 'website', 'phone', 'email', 'verified_at'];

function isApproved(value: string): boolean {
  return ['true', 'yes', 'y', '1', '✔', 'x'].includes(value.trim().toLowerCase());
}

function orNull(value: string | undefined): string | null {
  const t = (value ?? '').trim();
  return t.length ? t : null;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fileIdx = args.indexOf('--file');
  const csvPath = fileIdx >= 0 && args[fileIdx + 1] ? args[fileIdx + 1] : REVIEW_SHEET_CSV;

  requireFile(csvPath, 'Run schools:sheet, review it, then upload.');
  const rows = parseCsv(readFileSync(csvPath, 'utf8'));
  const approved = rows.filter((r) => isApproved(r.approved ?? ''));

  console.log(`📄 ${csvPath}`);
  console.log(`   ${rows.length} rows, ${approved.length} approved\n`);

  const unverified = approved.filter((r) => (r.needs_verification ?? '') === 'true');
  if (unverified.length) {
    console.log(
      `⚠️  ${unverified.length} approved row(s) are flagged needs_verification ` +
        `(social-surfaced):\n` +
        unverified.map((r) => `   • ${r.name}`).join('\n') +
        '\n   Approving means you opened the page and confirmed the details.\n',
    );
  }
  if (approved.length === 0) {
    console.log('Nothing approved — set approved=TRUE on rows to upload.');
    return;
  }

  const supabase = getServiceClient();

  // Probe which optional (migration 0002) columns exist on the live schema
  const available = new Set<string>();
  for (const col of OPTIONAL_COLUMNS) {
    const { error } = await supabase.from('places').select(col).limit(1);
    if (!error) available.add(col);
  }
  const missing = OPTIONAL_COLUMNS.filter((c) => !available.has(c));
  if (missing.length) {
    console.log(
      `⚠️  places is missing optional columns: ${missing.join(', ')}` +
        `\n   Apply supabase/migrations/0002_places_provenance.sql to keep that data.\n`,
    );
  }

  // Existing places for idempotency (re-running the upload must not duplicate)
  const existing: { name: string; latitude: number | null; longitude: number | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('places')
      .select('name,latitude,longitude')
      .range(from, from + 999);
    if (error) {
      console.error('❌ Failed to fetch places:', error.message);
      process.exit(1);
    }
    existing.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  const payloads: Record<string, unknown>[] = [];
  let refused = 0;
  let skippedExisting = 0;

  for (const r of approved) {
    const name = orNull(r.name);
    const lat = Number(r.lat);
    const lng = Number(r.lng);

    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      console.log(`   ❌ refused "${r.name ?? '?'}": missing name or valid lat/lng`);
      refused++;
      continue;
    }
    if ((r.dedup_status ?? '').trim() === 'dup') {
      console.log(`   ❌ refused "${name}": dedup_status=dup (matched ${r.matched_place_name})`);
      refused++;
      continue;
    }
    const already = existing.find(
      (p) =>
        p.latitude != null &&
        p.longitude != null &&
        nameSimilarity(name, p.name) >= SAME_NAME &&
        haversineMeters(lat, lng, p.latitude, p.longitude) <= PROXIMITY_METERS,
    );
    if (already) {
      console.log(`   ⏭️  skipped "${name}": already in places as "${already.name}"`);
      skippedExisting++;
      continue;
    }

    const image = orNull(r.image_url);
    const payload: Record<string, unknown> = {
      name,
      category: 'School',
      description: orNull(r.description),
      address: orNull(r.address),
      city: orNull(r.city),
      state: orNull(r.state) ?? 'Lagos',
      latitude: lat,
      longitude: lng,
      tags: ['islamic-school'],
      photos: image ? [image] : null,
      verified: false,
      source: 'web_research',
    };
    if (available.has('source_url')) payload.source_url = orNull(r.source_url);
    if (available.has('website')) payload.website = orNull(r.website);
    if (available.has('phone')) payload.phone = orNull(r.phone);
    if (available.has('email')) payload.email = orNull(r.email);
    if (available.has('verified_at')) payload.verified_at = new Date().toISOString();

    payloads.push(payload);
    // Guard against duplicate approved rows within the same sheet
    existing.push({ name, latitude: lat, longitude: lng });
  }

  console.log(
    `\n📊 ${payloads.length} to insert, ${skippedExisting} already present, ${refused} refused`,
  );
  if (dryRun) {
    console.log('\n🔎 Dry run — nothing written. Payloads:');
    for (const p of payloads) console.log(`   • ${p.name} (${p.latitude}, ${p.longitude})`);
    return;
  }
  if (payloads.length === 0) return;

  let inserted = 0;
  for (let i = 0; i < payloads.length; i += 50) {
    const batch = payloads.slice(i, i + 50);
    const { error } = await supabase.from('places').insert(batch);
    if (error) {
      console.error(`❌ Batch insert failed: ${error.message}`);
      console.error('   Nothing in this batch was written; earlier batches stand.');
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`   ✅ inserted ${inserted}/${payloads.length}`);
  }

  console.log(`\n✅ Upload complete: ${inserted} new schools in places.`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
