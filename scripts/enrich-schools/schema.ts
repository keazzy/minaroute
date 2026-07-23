/**
 * Zod schemas for the Muslim-schools enrichment pipeline.
 *
 * RawCandidate  — what discovery agents emit into data/raw/*.json
 * Candidate     — normalized shape flowing through geocode → dedupe → sheet
 */

import { z } from 'zod';

const nullableTrimmed = z
  .string()
  .nullable()
  .optional()
  .transform((v) => {
    const t = (v ?? '').trim();
    return t.length ? t : null;
  });

export const RawCandidateSchema = z.object({
  name: z.string().min(2),
  description: nullableTrimmed,
  address: nullableTrimmed,
  area: nullableTrimmed,
  city: nullableTrimmed,
  state: nullableTrimmed,
  phone: nullableTrimmed,
  email: nullableTrimmed,
  website: nullableTrimmed,
  social_handle: nullableTrimmed,
  image_url: nullableTrimmed,
  source_url: z.string().url(),
  confidence: z.number().min(0).max(1),
  evidence: nullableTrimmed,
});

export type RawCandidate = z.infer<typeof RawCandidateSchema>;

export const GeocodeStatus = z.enum([
  'ok', // full address geocoded, inside Lagos bounds
  'approx', // geocoded from name/area only, or partial match — coords need eyeballing
  'failed', // no result / outside Lagos bounds — needs manual coords
  'manual', // coords set by a human (override/sheet) — geocode never touches them
  'pending', // not yet geocoded
]);

export const DedupStatus = z.enum(['new', 'likely-dup', 'dup', 'pending']);

export const CandidateSchema = RawCandidateSchema.extend({
  id: z.string(), // stable slug for tracking across pipeline stages
  category: z.literal('School'),
  state: z.string().default('Lagos'),
  lat: z.number().nullable().default(null),
  lng: z.number().nullable().default(null),
  geocode_status: GeocodeStatus.default('pending'),
  dedup_status: DedupStatus.default('pending'),
  matched_place_id: z.string().nullable().default(null),
  matched_place_name: z.string().nullable().default(null),
  // Social-surfaced lane: candidate only known from a locked platform's page
  // (found via search snippets, never crawled) — a human must open the page
  // in a browser and confirm details before approving.
  needs_verification: z.boolean().default(false),
});

export type Candidate = z.infer<typeof CandidateSchema>;

/** Column order of the review sheet CSV (brief's schema + pipeline extras). */
export const SHEET_COLUMNS = [
  'id',
  'name',
  'category',
  'description',
  'address',
  'area',
  'city',
  'state',
  'lat',
  'lng',
  'geocode_status',
  'phone',
  'email',
  'website',
  'social_handle',
  'image_url',
  'source_url',
  'confidence',
  'evidence',
  'dedup_status',
  'matched_place_id',
  'matched_place_name',
  'needs_verification',
  'approved',
  'reviewer_notes',
] as const;

export type SheetColumn = (typeof SHEET_COLUMNS)[number];
