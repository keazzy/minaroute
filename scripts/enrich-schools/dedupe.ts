/**
 * Stage 3: dedupe candidates against the existing Supabase `places` table.
 *
 * Rules (per the brief):
 *  - dup:        fuzzy same name AND within ~150 m of an existing place
 *  - likely-dup: fuzzy same name anywhere in Lagos, OR any-name within 150 m
 *                with some similarity — reviewer decides
 *  - new:        everything else
 *
 * Reads/writes data/candidates.json in place. Read-only against Supabase.
 *
 * Usage: npm run schools:dedupe
 */

import { existsSync } from 'fs';
import { resolve } from 'path';
import {
  CANDIDATES_JSON,
  DATA_DIR,
  getServiceClient,
  haversineMeters,
  nameSimilarity,
  namesLikelySame,
  readJson,
  requireFile,
  writeJson,
} from './lib';
import { Candidate } from './schema';

const PROXIMITY_METERS = 150;
const SAME_NAME = 0.8;
const SIMILAR_NAME = 0.45;

interface ExistingPlace {
  id: string;
  name: string;
  category: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
}

async function fetchAllPlaces(): Promise<ExistingPlace[]> {
  const supabase = getServiceClient();
  const all: ExistingPlace[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('places')
      .select('id,name,category,latitude,longitude,city')
      .range(from, from + PAGE - 1);
    if (error) {
      console.error('❌ Failed to fetch places:', error.message);
      process.exit(1);
    }
    all.push(...((data ?? []) as ExistingPlace[]));
    if (!data || data.length < PAGE) break;
  }
  return all;
}

function main() {
  requireFile(CANDIDATES_JSON, 'Run schools:normalize (and schools:geocode) first.');
  const candidates = readJson<Candidate[]>(CANDIDATES_JSON);

  // Human-reviewed "these are NOT the same place" pairs — e.g. Ansar-Ud-Deen
  // Primary School (Alakoro) vs the Society's Grammar School in Surulere.
  const notDupsPath = resolve(DATA_DIR, 'not-dups.json');
  const notDups = new Set<string>(
    existsSync(notDupsPath)
      ? readJson<{ candidate_id: string; place_id: string }[]>(notDupsPath).map(
          (p) => `${p.candidate_id}::${p.place_id}`,
        )
      : [],
  );
  if (notDups.size) console.log(`🚫 ${notDups.size} reviewed not-dup pairs loaded`);

  fetchAllPlaces().then((places) => {
    console.log(`📋 ${places.length} existing places fetched`);

    let dup = 0;
    let likely = 0;
    let fresh = 0;

    for (const c of candidates) {
      let status: Candidate['dedup_status'] = 'new';
      let match: ExistingPlace | null = null;

      for (const p of places) {
        if (notDups.has(`${c.id}::${p.id}`)) continue;
        const sameName =
          nameSimilarity(c.name, p.name) >= SAME_NAME ||
          namesLikelySame(c.name, p.name, c.area);
        const hasCoords =
          c.lat != null && c.lng != null && p.latitude != null && p.longitude != null;
        const dist = hasCoords
          ? haversineMeters(c.lat!, c.lng!, p.latitude!, p.longitude!)
          : Infinity;

        if (sameName && dist <= PROXIMITY_METERS) {
          status = 'dup';
          match = p;
          break;
        }
        if (status !== 'dup') {
          if (
            sameName ||
            (dist <= PROXIMITY_METERS && nameSimilarity(c.name, p.name) >= SIMILAR_NAME)
          ) {
            status = 'likely-dup';
            match = match ?? p;
          }
        }
      }

      c.dedup_status = status;
      c.matched_place_id = match?.id ?? null;
      c.matched_place_name = match?.name ?? null;
      if (status === 'dup') dup++;
      else if (status === 'likely-dup') likely++;
      else fresh++;
    }

    writeJson(CANDIDATES_JSON, candidates);
    console.log(
      `\n✅ Dedupe: ${fresh} new, ${likely} likely-dup, ${dup} dup → ${CANDIDATES_JSON}`,
    );
  });
}

main();
