/**
 * Coordinate sanity audit for uploaded school rows.
 *
 * Anchors each school to its area using a gazetteer derived from the
 * Google-imported mosque rows already in `places` (their coords are
 * street-accurate): for each area token, the median position of mosques whose
 * address/city mentions that token. Falls back to Nominatim restricted to
 * real place types (suburb/neighbourhood/town — never streets, which is how
 * "Baruwa" once resolved to a Mushin street and corrupted validation).
 *
 * Rows further than DRIFT_METERS from their anchor are reported; with --fix
 * they are snapped to the anchor, downgraded to location_precision
 * 'approximate', annotated in source_notes, and mirrored into
 * data/verified-overrides.json so pipeline re-runs agree with the DB.
 *
 * Usage:
 *   npx tsx scripts/enrich-schools/audit-coords.ts          # report only
 *   npx tsx scripts/enrich-schools/audit-coords.ts --fix    # apply snaps
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import {
  DATA_DIR,
  getServiceClient,
  haversineMeters,
  readJson,
  sleep,
} from './lib';

const DRIFT_METERS = 3000;

/**
 * Areas OSM has no place entry for (and too few mosque refs). Each anchor is
 * sourced from a verified Nominatim result for the wider corridor — the Ipaja
 * Road corridor point and the Alimosho suburb point — good to area precision.
 */
const CURATED_ANCHORS: Record<string, { lat: number; lng: number; src: string }> = {
  ipaja: { lat: 6.6059, lng: 3.2644, src: 'Ipaja Road corridor (nominatim)' },
  baruwa: { lat: 6.6059, lng: 3.2644, src: 'Ipaja Road corridor (nominatim)' },
  ayobo: { lat: 6.6064, lng: 3.2349, src: 'Ayobo PHC (nominatim)' },
  'iyana-ipaja': { lat: 6.6113, lng: 3.2953, src: 'Alimosho suburb (nominatim)' },
  'iyana ipaja': { lat: 6.6113, lng: 3.2953, src: 'Alimosho suburb (nominatim)' },
  'gowon estate': { lat: 6.6113, lng: 3.2953, src: 'Alimosho suburb (nominatim)' },
  egbeda: { lat: 6.6113, lng: 3.2953, src: 'Alimosho suburb (nominatim)' },
};
const NOMINATIM_UA = 'minaroute-schools-enrichment/1.0 (hello@halvestco.com)';
const OVERRIDES_PATH = resolve(DATA_DIR, 'verified-overrides.json');
const CANDIDATES_PATH = resolve(DATA_DIR, 'candidates.json');

interface Row {
  id: string;
  name: string;
  address: string | null;
  area: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  location_precision: string | null;
  source_notes: string | null;
}

interface Anchor {
  lat: number;
  lng: number;
  label: string;
  support: number; // how many gazetteer places back it
}

function areaTokens(area: string): string[] {
  const lifted = area.replace(/\(([^)]*)\)/g, ', $1');
  return [
    ...new Set(
      lifted
        .split(/[,/]/)
        .map((t) => t.trim().replace(/\s+(axis|area|environs|inside)$/i, ''))
        .filter((t) => t.length > 2 && !/^lagos$/i.test(t)),
    ),
  ].slice(0, 4);
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

let lastNominatim = 0;
async function nominatimPlace(token: string): Promise<Anchor | null> {
  const wait = 1100 - (Date.now() - lastNominatim);
  if (wait > 0) await sleep(wait);
  lastNominatim = Date.now();
  const params = new URLSearchParams({
    q: `${token}, Lagos, Nigeria`,
    format: 'jsonv2',
    limit: '3',
    countrycodes: 'ng',
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': NOMINATIM_UA },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    lat: string;
    lon: string;
    category: string;
    type: string;
  }[];
  // Only real places — a street named after an area is how pins go wrong
  const place = data.find(
    (r) => r.category === 'place' || r.category === 'boundary' || r.category === 'landuse',
  );
  if (!place) return null;
  const lat = Number(place.lat);
  const lng = Number(place.lon);
  if (lat < 6.2 || lat > 6.85 || lng < 2.6 || lng > 4.2) return null;
  return { lat, lng, label: `${token} (nominatim ${place.type})`, support: 1 };
}

async function main() {
  const fix = process.argv.includes('--fix');
  const supabase = getServiceClient();

  // Gazetteer source: Google-imported places (street-accurate coords)
  const gaz: { address: string; city: string; lat: number; lng: number }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('places')
      .select('address,city,latitude,longitude,google_place_id')
      .not('google_place_id', 'is', null)
      .not('latitude', 'is', null)
      .range(from, from + 999);
    if (error) {
      console.error('❌', error.message);
      process.exit(1);
    }
    for (const p of data ?? []) {
      // Lagos bounding box only — the DB holds out-of-state and even US rows
      if (p.latitude < 6.2 || p.latitude > 6.85 || p.longitude < 2.6 || p.longitude > 4.2)
        continue;
      gaz.push({
        address: (p.address ?? '').toLowerCase(),
        city: (p.city ?? '').toLowerCase(),
        lat: p.latitude,
        lng: p.longitude,
      });
    }
    if (!data || data.length < 1000) break;
  }
  console.log(`📍 Gazetteer: ${gaz.length} Google-sourced places`);

  const anchorCache = new Map<string, Anchor | null>();
  async function anchorFor(token: string): Promise<Anchor | null> {
    const key = token.toLowerCase();
    if (anchorCache.has(key)) return anchorCache.get(key)!;
    const curated = CURATED_ANCHORS[key] ?? CURATED_ANCHORS[key.replace(/-/g, ' ')];
    if (curated) {
      const a = { lat: curated.lat, lng: curated.lng, label: `${token} (${curated.src})`, support: 2 };
      anchorCache.set(key, a);
      return a;
    }
    // "Iyana-Ipaja" must match addresses written "Iyana Ipaja"
    const variants = [key, key.replace(/-/g, ' ')];
    const hits = gaz.filter((g) =>
      variants.some((v) => g.address.includes(v) || g.city.includes(v)),
    );
    let anchor: Anchor | null = null;
    if (hits.length >= 2) {
      const lat = median(hits.map((h) => h.lat));
      const lng = median(hits.map((h) => h.lng));
      // Dispersion check: an anchor is only trustworthy if the refs agree —
      // ≥2 within 4 km of the median (same-named streets elsewhere scatter)
      const near = hits.filter((h) => haversineMeters(h.lat, h.lng, lat, lng) <= 4000);
      if (near.length >= 2) {
        anchor = {
          lat: median(near.map((h) => h.lat)),
          lng: median(near.map((h) => h.lng)),
          label: `${token} (${near.length}/${hits.length} mosque refs)`,
          support: near.length,
        };
      }
    }
    if (!anchor) anchor = await nominatimPlace(token);
    anchorCache.set(key, anchor);
    return anchor;
  }

  const { data: schools, error } = await supabase
    .from('places')
    .select('id,name,address,area,city,latitude,longitude,location_precision,source_notes')
    .eq('category', 'school')
    .not('latitude', 'is', null);
  if (error) {
    console.error('❌', error.message);
    process.exit(1);
  }

  const outliers: { row: Row; anchor: Anchor; drift: number }[] = [];
  let anchored = 0;
  let noAnchor = 0;

  for (const row of (schools ?? []) as Row[]) {
    if (row.location_precision === 'manual') continue; // human pins are truth
    const tokens = [
      ...(row.area ? areaTokens(row.area) : []),
      ...(row.city && !/^lagos$/i.test(row.city) ? [row.city] : []),
    ];
    if (!tokens.length) {
      noAnchor++;
      continue;
    }
    // Resolve every token; judge by the NEAREST anchor. "Sabo (Ikorodu)" must
    // not be flagged against Yaba's Sabo when the Ikorodu anchor fits.
    const anchors: Anchor[] = [];
    for (const t of tokens) {
      const a = await anchorFor(t);
      if (a) anchors.push(a);
    }
    if (!anchors.length) {
      noAnchor++;
      continue;
    }
    anchored++;
    let best = anchors[0];
    let drift = Infinity;
    for (const a of anchors) {
      const d = haversineMeters(row.latitude!, row.longitude!, a.lat, a.lng);
      if (d < drift) {
        drift = d;
        best = a;
      }
    }
    if (drift > DRIFT_METERS) {
      // Snap target: the highest-support anchor, not the accidentally-nearest
      const target = [...anchors].sort((a, b) => b.support - a.support)[0];
      outliers.push({ row, anchor: target, drift });
    }
  }

  outliers.sort((a, b) => b.drift - a.drift);
  console.log(`\n🔎 ${anchored} rows anchored, ${noAnchor} without an anchor`);
  console.log(`⚠️  ${outliers.length} rows drift > ${DRIFT_METERS / 1000}km from their area:\n`);
  for (const o of outliers) {
    console.log(
      `   ${(o.drift / 1000).toFixed(1).padStart(5)}km  ${o.row.name.slice(0, 45).padEnd(47)} → ${o.anchor.label}`,
    );
  }

  if (!fix || outliers.length === 0) {
    if (outliers.length) console.log('\nRun with --fix to snap these to their area anchors.');
    return;
  }

  // Apply: DB update + mirror into verified-overrides.json (keyed by pipeline id)
  const overrides = existsSync(OVERRIDES_PATH)
    ? JSON.parse(readFileSync(OVERRIDES_PATH, 'utf8'))
    : {};
  const candidates = existsSync(CANDIDATES_PATH)
    ? readJson<{ id: string; name: string }[]>(CANDIDATES_PATH)
    : [];

  let fixed = 0;
  for (const o of outliers) {
    const note = `coords snapped to ${o.anchor.label} anchor by audit 2026-07-24 (was ${(o.drift / 1000).toFixed(1)}km off)`;
    const { error: upErr } = await supabase
      .from('places')
      .update({
        latitude: Number(o.anchor.lat.toFixed(6)),
        longitude: Number(o.anchor.lng.toFixed(6)),
        location_precision: 'approximate',
        source_notes: o.row.source_notes ? `${o.row.source_notes}; ${note}` : note,
      })
      .eq('id', o.row.id);
    if (upErr) {
      console.log(`   ⚠️  ${o.row.name}: ${upErr.message}`);
      continue;
    }
    fixed++;
    const cand = candidates.find((c) => c.name === o.row.name);
    if (cand) {
      overrides[cand.id] = {
        ...(overrides[cand.id] ?? {}),
        lat: Number(o.anchor.lat.toFixed(6)),
        lng: Number(o.anchor.lng.toFixed(6)),
        geocode_status: 'manual',
        evidence_append: note,
      };
    }
  }
  writeFileSync(OVERRIDES_PATH, JSON.stringify(overrides, null, 2) + '\n', 'utf8');
  console.log(`\n✅ ${fixed}/${outliers.length} rows snapped in DB; overrides mirrored`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
