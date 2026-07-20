/**
 * API route to import places from Google Maps
 * POST /api/import-places
 */

import { createClient } from '@supabase/supabase-js';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://spjlyhmgqtkcqhpvgxci.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

interface GooglePlace {
  id: string;
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

interface ImportRequest {
  locationName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  category: string; // 'Mosque', 'School', etc.
}

interface ImportResponse {
  success: boolean;
  message: string;
  stats?: {
    found: number;
    inserted: number;
    skipped: number;
    errors: number;
  };
}

// Map category to Google Places type
function getCategoryPlaceType(category: string): string {
  switch (category.toLowerCase()) {
    case 'mosque':
      return 'mosque';
    case 'school':
      return 'school';
    case 'restaurant':
      return 'restaurant';
    case 'hospital':
      return 'hospital';
    default:
      return 'point_of_interest';
  }
}

async function searchPlacesNearby(
  lat: number,
  lng: number,
  radiusMeters: number,
  placeType: string
): Promise<GooglePlace[]> {
  const url = 'https://places.googleapis.com/v1/places:searchNearby';

  const body = {
    includedTypes: [placeType],
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

async function textSearchPlaces(query: string): Promise<GooglePlace[]> {
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

function parseAddress(formattedAddress: string): { city: string | null; state: string | null } {
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

export async function POST(request: Request): Promise<Response> {
  try {
    // Validate environment
    if (!GOOGLE_PLACES_API_KEY) {
      return Response.json(
        { success: false, message: 'GOOGLE_PLACES_API_KEY not configured' } as ImportResponse,
        { status: 500 }
      );
    }

    if (!SUPABASE_SERVICE_KEY) {
      return Response.json(
        { success: false, message: 'SUPABASE_SERVICE_KEY not configured' } as ImportResponse,
        { status: 500 }
      );
    }

    const body: ImportRequest = await request.json();
    const { locationName, latitude, longitude, radiusMeters, category } = body;

    // Validate input
    if (!locationName || !latitude || !longitude || !radiusMeters || !category) {
      return Response.json(
        { success: false, message: 'Missing required fields' } as ImportResponse,
        { status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch existing google_place_ids to avoid duplicates
    const { data: existingPlaces, error: fetchError } = await supabase
      .from('places')
      .select('google_place_id')
      .not('google_place_id', 'is', null);

    if (fetchError) {
      return Response.json(
        { success: false, message: `Database error: ${fetchError.message}` } as ImportResponse,
        { status: 500 }
      );
    }

    const existingIds = new Set((existingPlaces || []).map((p) => p.google_place_id));
    const placeType = getCategoryPlaceType(category);
    const allPlaces: Map<string, PlaceInsert> = new Map();

    // Nearby search
    const nearbyResults = await searchPlacesNearby(latitude, longitude, radiusMeters, placeType);

    // Text search as backup
    const textResults = await textSearchPlaces(`${category.toLowerCase()}s in ${locationName}`);

    const combined = [...nearbyResults, ...textResults];
    let skipped = 0;

    for (const place of combined) {
      if (!place.id) continue;
      
      if (existingIds.has(place.id) || allPlaces.has(place.id)) {
        skipped++;
        continue;
      }

      const { city, state } = parseAddress(place.formattedAddress || '');

      allPlaces.set(place.id, {
        name: place.displayName?.text || `Unknown ${category}`,
        category,
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

    if (allPlaces.size === 0) {
      return Response.json({
        success: true,
        message: 'No new places to import. Database is up to date!',
        stats: {
          found: combined.length,
          inserted: 0,
          skipped,
          errors: 0,
        },
      } as ImportResponse);
    }

    // Insert in batches
    const BATCH_SIZE = 50;
    const placesArray = Array.from(allPlaces.values());
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < placesArray.length; i += BATCH_SIZE) {
      const batch = placesArray.slice(i, i + BATCH_SIZE);

      const { error: insertError } = await supabase.from('places').insert(batch);

      if (insertError) {
        errors += batch.length;
      } else {
        inserted += batch.length;
      }
    }

    return Response.json({
      success: true,
      message: `Import complete! Inserted ${inserted} ${category.toLowerCase()}s.`,
      stats: {
        found: combined.length,
        inserted,
        skipped,
        errors,
      },
    } as ImportResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { success: false, message } as ImportResponse,
      { status: 500 }
    );
  }
}
