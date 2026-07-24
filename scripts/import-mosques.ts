/**
 * One-time script to import mosques from Google Places API into Supabase.
 *
 * Usage:
 *   npm run import-mosques
 *
 * Setup:
 *   1. Copy .env.local.example to .env.local
 *   2. Fill in your API keys in .env.local
 *   3. Run: npm run import-mosques
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://spjlyhmgqtkcqhpvgxci.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// Cities/areas to search for mosques (add more as needed)
const SEARCH_LOCATIONS: { name: string; lat: number; lng: number; radiusMeters: number }[] = [
  // Nigeria - Lagos: Ikorodu (multiple points for better coverage)
  { name: 'Ikorodu Central, Lagos', lat: 6.6194, lng: 3.5105, radiusMeters: 20000 },
  { name: 'Ikorodu North, Lagos', lat: 6.6500, lng: 3.5200, radiusMeters: 15000 },
  { name: 'Ikorodu South, Lagos', lat: 6.5900, lng: 3.5000, radiusMeters: 15000 },
  
  // Nigeria - Lagos: Ketu (multiple points for better coverage)
  { name: 'Ketu, Lagos', lat: 6.5833, lng: 3.3833, radiusMeters: 15000 },
  { name: 'Ketu Alapere, Lagos', lat: 6.5950, lng: 3.3900, radiusMeters: 10000 },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GooglePlace {
  id: string; // Google Place ID
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  types?: string[];
}

interface PlaceInsert {
  name: string;
  category: string;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string;
  source: string;
  verified: boolean;
  tags: string[];
}

// ---------------------------------------------------------------------------
// Google Places API (New API)
// ---------------------------------------------------------------------------

async function searchMosquesNearby(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<GooglePlace[]> {
  const url = 'https://places.googleapis.com/v1/places:searchNearby';

  const body = {
    includedTypes: ['mosque'],
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radiusMeters,
      },
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Places API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return (data.places || []) as GooglePlace[];
}

async function textSearchMosques(query: string): Promise<GooglePlace[]> {
  const url = 'https://places.googleapis.com/v1/places:searchText';

  const body = {
    textQuery: query,
    maxResultCount: 20,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Places API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return (data.places || []) as GooglePlace[];
}

// ---------------------------------------------------------------------------
// Address Parsing
// ---------------------------------------------------------------------------

function parseAddress(formattedAddress: string): { city: string | null; state: string | null } {
  // Typical US format: "123 Main St, City, ST 12345, USA"
  const parts = formattedAddress.split(',').map((p) => p.trim());

  let city: string | null = null;
  let state: string | null = null;

  if (parts.length >= 3) {
    city = parts[parts.length - 3] || null;
    const stateZip = parts[parts.length - 2] || '';
    const stateMatch = stateZip.match(/^([A-Z]{2})\s/);
    if (stateMatch) {
      state = stateMatch[1];
    }
  }

  return { city, state };
}

// ---------------------------------------------------------------------------
// Main Import Logic
// ---------------------------------------------------------------------------

async function main() {
  console.log('🕌 Mosque Import Script');
  console.log('========================\n');

  // Validate environment
  if (!GOOGLE_PLACES_API_KEY) {
    console.error('❌ GOOGLE_PLACES_API_KEY environment variable is required');
    console.log('\nSet it with: export GOOGLE_PLACES_API_KEY=your_key_here');
    process.exit(1);
  }

  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_KEY environment variable is required');
    console.log('\nUse the service_role key from Supabase Dashboard > Settings > API');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Fetch existing google_place_ids to avoid duplicates
  console.log('📋 Fetching existing mosques from database...');
  const { data: existingPlaces, error: fetchError } = await supabase
    .from('places')
    .select('google_place_id')
    .not('google_place_id', 'is', null);

  if (fetchError) {
    console.error('❌ Failed to fetch existing places:', fetchError.message);
    process.exit(1);
  }

  const existingIds = new Set((existingPlaces || []).map((p) => p.google_place_id));
  console.log(`   Found ${existingIds.size} existing places with Google Place IDs\n`);

  const allMosques: Map<string, PlaceInsert> = new Map();

  // Search each location
  for (const location of SEARCH_LOCATIONS) {
    console.log(`🔍 Searching: ${location.name}...`);

    try {
      // Nearby search
      const nearbyResults = await searchMosquesNearby(
        location.lat,
        location.lng,
        location.radiusMeters
      );

      // Text search as backup to catch more results
      const textResults = await textSearchMosques(`mosques in ${location.name}`);

      const combined = [...nearbyResults, ...textResults];

      for (const place of combined) {
        if (!place.id || existingIds.has(place.id) || allMosques.has(place.id)) {
          continue;
        }

        const { city, state } = parseAddress(place.formattedAddress || '');

        allMosques.set(place.id, {
          name: place.displayName?.text || 'Unknown Mosque',
          category: 'mosque',
          address: place.formattedAddress || null,
          city,
          state,
          latitude: place.location?.latitude || null,
          longitude: place.location?.longitude || null,
          google_place_id: place.id,
          source: 'google_places',
          verified: false,
          tags: [],
        });
      }

      console.log(`   Found ${combined.length} results, ${allMosques.size} unique new mosques so far`);

      // Rate limiting - be nice to the API
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.error(`   ⚠️  Error searching ${location.name}:`, err);
    }
  }

  console.log(`\n📊 Total new mosques to insert: ${allMosques.size}\n`);

  if (allMosques.size === 0) {
    console.log('✅ No new mosques to import. Database is up to date!');
    return;
  }

  // Insert in batches
  const BATCH_SIZE = 50;
  const mosquesArray = Array.from(allMosques.values());
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < mosquesArray.length; i += BATCH_SIZE) {
    const batch = mosquesArray.slice(i, i + BATCH_SIZE);

    const { error: insertError } = await supabase.from('places').insert(batch);

    if (insertError) {
      console.error(`❌ Batch insert error:`, insertError.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      console.log(`   ✅ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} mosques`);
    }
  }

  console.log('\n========================');
  console.log(`✅ Import complete!`);
  console.log(`   - Inserted: ${inserted} mosques`);
  console.log(`   - Errors: ${errors}`);
  console.log(`   - Skipped (duplicates): ${existingIds.size} existing`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
