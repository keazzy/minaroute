/**
 * Stage 2: geocode candidates.
 *
 * Provider chain — each is skipped automatically once it returns a
 * permission/activation error:
 *   1. Google Geocoding API   (precise; needs the API enabled on the project)
 *   2. Google Places Text Search (same key as import-mosques)
 *   3. OSM Nominatim          (free fallback, 1 req/s, area-level precision)
 *
 * Reads data/candidates.json, fills lat/lng + geocode_status, writes back in
 * place. Already-geocoded rows are skipped, so the script is re-runnable —
 * e.g. enable the Geocoding API later and run with --retry to redo
 * approx/failed rows at higher precision.
 *
 *  - ok:      street address geocoded by Google, exact match, inside Lagos
 *  - approx:  name/area-based, partial match, or Nominatim — eyeball coords
 *  - failed:  nothing found inside Lagos — set coords manually in the sheet
 *
 * Usage:
 *   npm run schools:geocode
 *   npm run schools:geocode -- --retry          # redo approx + failed rows
 *   npm run schools:geocode -- --retry-failed   # redo failed rows only
 */

import {
  CANDIDATES_JSON,
  getGoogleKey,
  readJson,
  requireFile,
  sleep,
  writeJson,
} from './lib';
import { Candidate } from './schema';

// Lagos State bounding box (generous: Badagry → Epe)
const BOUNDS = { minLat: 6.2, maxLat: 6.85, minLng: 2.6, maxLng: 4.2 };
const NOMINATIM_UA = 'minaroute-schools-enrichment/1.0 (hello@halvestco.com)';

interface Hit {
  lat: number;
  lng: number;
  precise: boolean; // street/rooftop-level from a full-address Google match
  provider: string;
}

const denied = new Set<string>();
let lastNominatim = 0;

/**
 * Discovery agents write compound areas like "Agungi, Lekki (Eti-Osa)" or
 * "Awoyaya (Ajah/Ibeju-Lekki axis)". Geocoders miss on those verbatim —
 * split into clean tokens ("Agungi", "Lekki", "Eti-Osa") to try in order.
 */
function areaTokens(area: string): string[] {
  const lifted = area.replace(/\(([^)]*)\)/g, ', $1');
  const tokens = lifted
    .split(/[,/]/)
    .map((t) => t.trim().replace(/\s+(axis|area|environs)$/i, ''))
    .filter((t) => t.length > 2);
  return [...new Set(tokens)].slice(0, 3);
}

function inLagos(lat: number, lng: number): boolean {
  return lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat && lng >= BOUNDS.minLng && lng <= BOUNDS.maxLng;
}

async function googleGeocode(query: string, key: string, fromAddress: boolean): Promise<Hit | null> {
  const params = new URLSearchParams({
    address: query,
    components: 'country:NG|administrative_area:Lagos',
    key,
  });
  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
  const data = (await res.json()) as {
    status: string;
    error_message?: string;
    results?: { geometry: { location: { lat: number; lng: number }; location_type: string }; partial_match?: boolean }[];
  };
  if (data.status === 'REQUEST_DENIED') {
    denied.add('google-geocoding');
    console.log(`   ℹ️  Google Geocoding unavailable (${data.error_message ?? 'denied'}) — falling back`);
    return null;
  }
  if (data.status === 'ZERO_RESULTS') return null;
  if (data.status !== 'OK') throw new Error(`Geocoding ${data.status}: ${data.error_message ?? ''}`);
  const top = data.results?.[0];
  if (!top) return null;
  return {
    lat: top.geometry.location.lat,
    lng: top.geometry.location.lng,
    precise: fromAddress && !top.partial_match && top.geometry.location_type !== 'APPROXIMATE',
    provider: 'google-geocoding',
  };
}

async function googlePlaces(query: string, key: string): Promise<Hit | null> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.location',
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
  });
  const data = (await res.json()) as {
    error?: { status?: string; message?: string };
    places?: { location?: { latitude: number; longitude: number } }[];
  };
  if (data.error) {
    if (data.error.status === 'PERMISSION_DENIED') {
      denied.add('google-places');
      console.log('   ℹ️  Google Places unavailable — falling back');
      return null;
    }
    throw new Error(`Places ${data.error.status}: ${data.error.message ?? ''}`);
  }
  const loc = data.places?.[0]?.location;
  if (!loc) return null;
  // Places text search matched a known POI — treat as approx (could be a
  // different business at a similar name); reviewer confirms.
  return { lat: loc.latitude, lng: loc.longitude, precise: false, provider: 'google-places' };
}

async function nominatim(query: string): Promise<Hit | null> {
  const wait = 1100 - (Date.now() - lastNominatim);
  if (wait > 0) await sleep(wait);
  lastNominatim = Date.now();

  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'ng',
    viewbox: `${BOUNDS.minLng},${BOUNDS.maxLat},${BOUNDS.maxLng},${BOUNDS.minLat}`,
    bounded: '1',
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': NOMINATIM_UA },
  });
  if (res.status === 403 || res.status === 429) {
    denied.add('nominatim');
    console.log('   ℹ️  Nominatim rate-limited/blocked — skipping for this run');
    return null;
  }
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const data = (await res.json()) as { lat: string; lon: string }[];
  const top = data[0];
  if (!top) return null;
  return { lat: Number(top.lat), lng: Number(top.lon), precise: false, provider: 'nominatim' };
}

async function tryProviders(query: string, key: string, fromAddress: boolean): Promise<Hit | null> {
  if (!denied.has('google-geocoding')) {
    const hit = await googleGeocode(query, key, fromAddress);
    if (hit) return hit;
  }
  if (!denied.has('google-places')) {
    const hit = await googlePlaces(query, key);
    if (hit) return hit;
  }
  if (!denied.has('nominatim')) {
    return nominatim(query);
  }
  return null;
}

async function main() {
  requireFile(CANDIDATES_JSON, 'Run schools:normalize first.');
  const retry = process.argv.includes('--retry');
  const retryFailed = process.argv.includes('--retry-failed');
  const key = getGoogleKey();
  const candidates = readJson<Candidate[]>(CANDIDATES_JSON);

  if (retry || retryFailed) {
    for (const c of candidates) {
      if ((retry && c.geocode_status === 'approx') || c.geocode_status === 'failed') {
        c.geocode_status = 'pending';
        c.lat = null;
        c.lng = null;
      }
    }
  }

  let ok = 0;
  let approx = 0;
  let failed = 0;
  let skipped = 0;

  for (const c of candidates) {
    if (c.geocode_status !== 'pending') {
      skipped++;
      continue;
    }

    try {
      const tokens = c.area ? areaTokens(c.area) : [];
      const queries: { q: string; fromAddress: boolean; centroid: boolean }[] = [];
      if (c.address) {
        queries.push({ q: `${c.address}, Lagos, Nigeria`, fromAddress: true, centroid: false });
      }
      queries.push({
        q: `${c.name}, ${tokens[0] ?? c.city ?? ''}, Lagos, Nigeria`,
        fromAddress: false,
        centroid: false,
      });
      for (const t of tokens) {
        queries.push({ q: `${t}, Lagos, Nigeria`, fromAddress: false, centroid: true });
      }

      let hit: Hit | null = null;
      let usedAreaCentroid = false;
      for (const query of queries) {
        hit = await tryProviders(query.q, key, query.fromAddress);
        if (hit && !inLagos(hit.lat, hit.lng)) hit = null;
        if (hit) {
          usedAreaCentroid = query.centroid;
          break;
        }
      }

      if (!hit) {
        c.geocode_status = 'failed';
        failed++;
        console.log(`   ❌ ${c.name}: no result inside Lagos`);
      } else {
        c.lat = Number(hit.lat.toFixed(6));
        c.lng = Number(hit.lng.toFixed(6));
        c.geocode_status = hit.precise ? 'ok' : 'approx';
        if (usedAreaCentroid) {
          const note = `geocode: area centroid via ${hit.provider}`;
          c.evidence = c.evidence ? `${c.evidence}; ${note}` : note;
        }
        hit.precise ? ok++ : approx++;
      }
    } catch (err) {
      console.error(`   ⚠️  ${c.name}: ${err instanceof Error ? err.message : err}`);
      // Left as pending — a re-run retries (e.g. after quota resets)
    }

    await sleep(120);
  }

  writeJson(CANDIDATES_JSON, candidates);
  console.log(
    `\n✅ Geocoding: ${ok} ok, ${approx} approx, ${failed} failed, ${skipped} skipped` +
      `\n   → ${CANDIDATES_JSON}`,
  );
  if (denied.has('google-geocoding')) {
    console.log(
      '\nℹ️  For precise coords: enable the Geocoding API on the Google Cloud project,' +
        '\n   then run: npm run schools:geocode -- --retry',
    );
  }
  const pending = candidates.filter((c) => c.geocode_status === 'pending').length;
  if (pending) console.log(`⚠️  ${pending} still pending (errors above) — re-run to retry`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
