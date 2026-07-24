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

const OPTIONAL_COLUMNS = [
  'source_url',
  'website',
  'phone',
  'email',
  'verified_at',
  'area',
  'social_handle',
  'source_notes',
  'location_precision',
];

function isApproved(value: string): boolean {
  return ['true', 'yes', 'y', '1', '✔', 'x'].includes(value.trim().toLowerCase());
}

function orNull(value: string | undefined): string | null {
  const t = (value ?? '').trim();
  return t.length ? t : null;
}

/** Blank cells must be null, not 0 — Number('') === 0 would upload Null Island. */
function parseCoord(value: string | undefined): number | null {
  const t = (value ?? '').trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n !== 0 ? n : null;
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

  // Sheets/Excel round-trips uppercase booleans to TRUE/FALSE — compare loosely
  const unverified = approved.filter((r) =>
    ['true', 'yes', '1'].includes((r.needs_verification ?? '').trim().toLowerCase()),
  );
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
  const existing: {
    id: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
  }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('places')
      .select('id,name,latitude,longitude')
      .range(from, from + 999);
    if (error) {
      console.error('❌ Failed to fetch places:', error.message);
      process.exit(1);
    }
    existing.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  const payloads: Record<string, unknown>[] = [];
  const merges: { placeId: string; placeName: string; row: Record<string, string> }[] = [];
  let refused = 0;
  let skippedExisting = 0;

  for (const r of approved) {
    const name = orNull(r.name);
    const lat = parseCoord(r.lat);
    const lng = parseCoord(r.lng);

    if (!name || lat == null || lng == null) {
      console.log(`   ❌ refused "${r.name ?? '?'}": missing name or valid non-zero lat/lng`);
      refused++;
      continue;
    }
    if ((r.dedup_status ?? '').trim() === 'dup') {
      console.log(`   ❌ refused "${name}": dedup_status=dup (matched ${r.matched_place_name})`);
      refused++;
      continue;
    }
    if ((r.dedup_status ?? '').trim() === 'likely-dup') {
      // Approving a likely-dup means "same place — enrich the existing row"
      const placeId = orNull(r.matched_place_id);
      if (!placeId) {
        console.log(`   ❌ refused "${name}": likely-dup but no matched_place_id (re-run dedupe)`);
        refused++;
        continue;
      }
      merges.push({ placeId, placeName: r.matched_place_name ?? placeId, row: r });
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
    // lowercase to match the existing rows' category value
    const payload: Record<string, unknown> = {
      name,
      category: 'school',
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
    // verified/verified_at stay false/null at upload — the verified badge comes
    // from the on-ground/owner verification program, not from data approval.
    if (available.has('area')) payload.area = orNull(r.area);
    if (available.has('social_handle')) payload.social_handle = orNull(r.social_handle);
    if (available.has('source_notes')) payload.source_notes = orNull(r.evidence);
    if (available.has('location_precision')) {
      // ok = street-level geocode; approx = area-level; anything else with
      // valid coords means the reviewer typed them in the sheet
      const status = (r.geocode_status ?? '').trim();
      payload.location_precision =
        status === 'ok' ? 'exact' : status === 'approx' ? 'approximate' : 'manual';
    }

    payloads.push(payload);
    // Guard against duplicate approved rows within the same sheet
    existing.push({ name, latitude: lat, longitude: lng });
  }

  console.log(
    `\n📊 ${payloads.length} to insert, ${merges.length} to enrich (merge into existing), ` +
      `${skippedExisting} already present, ${refused} refused`,
  );
  if (dryRun) {
    console.log('\n🔎 Dry run — nothing written.');
    for (const p of payloads) console.log(`   + insert ${p.name} (${p.latitude}, ${p.longitude})`);
    for (const m of merges) console.log(`   ~ enrich "${m.placeName}" ← ${m.row.name}`);
    return;
  }

  // Enrich matched existing rows: fill ONLY empty columns — approved reviewer
  // data never overwrites curated values, and name/verified are never touched.
  const precisionOf = (r: Record<string, string>) => {
    const s = (r.geocode_status ?? '').trim();
    return s === 'ok' ? 'exact' : s === 'approx' ? 'approximate' : 'manual';
  };
  const MERGE_FIELDS: [string, (r: Record<string, string>) => unknown][] = [
    ['description', (r) => orNull(r.description)],
    ['address', (r) => orNull(r.address)],
    ['city', (r) => orNull(r.city)],
    ['state', (r) => orNull(r.state)],
    ['latitude', (r) => parseCoord(r.lat)],
    ['longitude', (r) => parseCoord(r.lng)],
    ['photos', (r) => (orNull(r.image_url) ? [r.image_url.trim()] : null)],
    ['source_url', (r) => orNull(r.source_url)],
    ['website', (r) => orNull(r.website)],
    ['phone', (r) => orNull(r.phone)],
    ['email', (r) => orNull(r.email)],
    ['area', (r) => orNull(r.area)],
    ['social_handle', (r) => orNull(r.social_handle)],
    ['source_notes', (r) => orNull(r.evidence)],
    ['location_precision', precisionOf],
  ];

  let enriched = 0;
  for (const m of merges) {
    const { data: current, error: fetchErr } = await supabase
      .from('places')
      .select('*')
      .eq('id', m.placeId)
      .single();
    if (fetchErr || !current) {
      console.log(`   ⚠️  enrich "${m.placeName}": could not fetch (${fetchErr?.message})`);
      continue;
    }
    const update: Record<string, unknown> = {};
    for (const [col, getter] of MERGE_FIELDS) {
      if (!(col in current) || (current[col] != null && current[col] !== '')) continue;
      const value = getter(m.row);
      if (value != null) update[col] = value;
    }
    if (Object.keys(update).length === 0) {
      console.log(`   = "${m.placeName}": nothing to enrich`);
      continue;
    }
    const { error: updateErr } = await supabase.from('places').update(update).eq('id', m.placeId);
    if (updateErr) {
      console.log(`   ⚠️  enrich "${m.placeName}" failed: ${updateErr.message}`);
    } else {
      enriched++;
      console.log(`   ~ enriched "${m.placeName}": ${Object.keys(update).join(', ')}`);
    }
  }
  if (merges.length) console.log(`\n📊 ${enriched}/${merges.length} existing rows enriched`);

  if (payloads.length === 0) {
    if (!merges.length) return;
    console.log('\n✅ Upload complete (enrichment only).');
    return;
  }

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
