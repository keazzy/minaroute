/**
 * Category-specific place attributes.
 *
 * The problem this solves: a mosque and a school share almost everything on a
 * detail page — photos, address, map, hours, contact, reviews — and differ only
 * in a short list of *facts*. Jumu'ah time and "women's section" for one;
 * "boarding or day" and "levels taught" for the other.
 *
 * Modelling those as columns would mean ~8 columns per category across a growing
 * set of categories, each null for every row of every other category. Instead
 * they live in a single `places.attributes` jsonb column, and each category
 * declares a zod schema plus how each key renders. A new category is a new entry
 * here — no migration.
 *
 * Two display kinds, matching the reference design:
 *  - `chip`  — a boolean, rendered as a pill *only when true*. Absent and false
 *              both render nothing: "no women's section" is not a claim we want
 *              to make from missing data.
 *  - `fact`  — a value, rendered as a labelled row.
 *
 * Validation happens at ingest, not at render: a place row with junk in
 * `attributes` should be caught when it is written, and degrade to "no
 * attributes" rather than crash a screen if it slips through.
 */
import { z } from 'zod';

/** The category keys the app knows about. Mirrors the Home category rail. */
export type PlaceCategoryKey = 'mosques' | 'learning' | 'food' | 'stays' | 'thingsToDo';

export type AttributeKind = 'chip' | 'fact';

/**
 * What control edits this attribute.
 *
 * Declared here rather than in the admin so the two cannot drift: if the admin
 * restated this list, it could write a field the app never renders, or the app
 * could expect one the admin cannot set — and neither fails loudly, it just
 * silently does not appear. One definition drives both the display and the form.
 *
 * `chip` attributes are always booleans by construction, so they need no
 * declaration; only `fact` entries carry one.
 */
export type AttributeInput =
  | { control: 'boolean' }
  | { control: 'text'; placeholder?: string }
  | { control: 'number'; min?: number; suffix?: string }
  | { control: 'enum'; options: { value: string; label: string }[] }
  | { control: 'tags'; suggestions?: string[] };

export type AttributeDisplay = {
  label: string;
  kind: AttributeKind;
  /** Lower sorts first, within its kind. */
  order: number;
  /** Renders a `fact` value. Defaults to String(). */
  format?: (value: unknown) => string;
  /** Editor control. Defaults to a boolean for chips, text for facts. */
  input?: AttributeInput;
};

/** A field ready to render in a form: identity, label and control. */
export type AttributeField = {
  key: string;
  label: string;
  kind: AttributeKind;
  order: number;
  input: AttributeInput;
};

// ---- Schemas ----------------------------------------------------------------
// Every field is optional. Real data is patchy — a mosque we know nothing about
// beyond its name is still a valid mosque, and the page must render it.

const mosqueSchema = z.object({
  jumuah_time: z.string().optional(),
  jamaah_times: z.boolean().optional(),
  womens_section: z.boolean().optional(),
  wudu_facilities: z.boolean().optional(),
  parking: z.boolean().optional(),
  madrasah: z.boolean().optional(),
  eid_prayers: z.boolean().optional(),
  wheelchair_access: z.boolean().optional(),
  capacity: z.number().int().positive().optional(),
});

const learningSchema = z.object({
  levels: z.array(z.string()).optional(),
  gender: z.enum(['boys', 'girls', 'mixed']).optional(),
  boarding: z.boolean().optional(),
  day_school: z.boolean().optional(),
  quran_memorisation: z.boolean().optional(),
  national_curriculum: z.boolean().optional(),
  fees_from: z.number().nonnegative().optional(),
  admission_open: z.boolean().optional(),
});

const foodSchema = z.object({
  halal_certified: z.boolean().optional(),
  cuisine: z.array(z.string()).optional(),
  delivery: z.boolean().optional(),
  dine_in: z.boolean().optional(),
  family_section: z.boolean().optional(),
  price_from: z.number().nonnegative().optional(),
});

const naira = (v: unknown) => `₦${Number(v).toLocaleString('en-NG')}`;
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const CATEGORIES: Record<
  PlaceCategoryKey,
  { schema: z.ZodTypeAny; display: Record<string, AttributeDisplay> } | undefined
> = {
  mosques: {
    schema: mosqueSchema,
    display: {
      womens_section: { label: "Women's section", kind: 'chip', order: 1 },
      wudu_facilities: { label: 'Wudu facilities', kind: 'chip', order: 2 },
      parking: { label: 'Parking', kind: 'chip', order: 3 },
      madrasah: { label: 'Madrasah on site', kind: 'chip', order: 4 },
      eid_prayers: { label: 'Eid prayers', kind: 'chip', order: 5 },
      wheelchair_access: { label: 'Wheelchair access', kind: 'chip', order: 6 },
      jamaah_times: { label: 'Daily jama‘ah', kind: 'chip', order: 7 },
      jumuah_time: {
        label: 'Jumu‘ah',
        kind: 'fact',
        order: 1,
        input: { control: 'text', placeholder: '1:30 pm' },
      },
      capacity: {
        label: 'Capacity',
        kind: 'fact',
        order: 2,
        format: (v) => `${Number(v).toLocaleString('en-NG')} worshippers`,
        input: { control: 'number', min: 0, suffix: 'worshippers' },
      },
    },
  },
  learning: {
    schema: learningSchema,
    display: {
      boarding: { label: 'Boarding', kind: 'chip', order: 1 },
      day_school: { label: 'Day school', kind: 'chip', order: 2 },
      quran_memorisation: { label: 'Qur’an memorisation', kind: 'chip', order: 3 },
      national_curriculum: { label: 'National curriculum', kind: 'chip', order: 4 },
      admission_open: { label: 'Admissions open', kind: 'chip', order: 5 },
      levels: {
        label: 'Levels',
        kind: 'fact',
        order: 1,
        format: (v) => (Array.isArray(v) ? v.map(String).map(titleCase).join(', ') : String(v)),
        input: { control: 'tags', suggestions: ['nursery', 'primary', 'secondary'] },
      },
      gender: {
        label: 'Intake',
        kind: 'fact',
        order: 2,
        format: (v) => titleCase(String(v)),
        input: {
          control: 'enum',
          options: [
            { value: 'boys', label: 'Boys' },
            { value: 'girls', label: 'Girls' },
            { value: 'mixed', label: 'Mixed' },
          ],
        },
      },
      fees_from: {
        label: 'Fees from',
        kind: 'fact',
        order: 3,
        format: naira,
        input: { control: 'number', min: 0, suffix: '₦ per term' },
      },
    },
  },
  food: {
    schema: foodSchema,
    display: {
      halal_certified: { label: 'Halal certified', kind: 'chip', order: 1 },
      dine_in: { label: 'Dine in', kind: 'chip', order: 2 },
      delivery: { label: 'Delivery', kind: 'chip', order: 3 },
      family_section: { label: 'Family section', kind: 'chip', order: 4 },
      cuisine: {
        label: 'Cuisine',
        kind: 'fact',
        order: 1,
        format: (v) => (Array.isArray(v) ? v.map(String).map(titleCase).join(', ') : String(v)),
        input: { control: 'tags', suggestions: ['nigerian', 'lebanese', 'turkish', 'indian'] },
      },
      price_from: {
        label: 'From',
        kind: 'fact',
        order: 2,
        format: naira,
        input: { control: 'number', min: 0, suffix: '₦' },
      },
    },
  },
  // No attribute vocabulary yet — these render the shared spine only.
  stays: undefined,
  thingsToDo: undefined,
};

/**
 * Events get the same treatment, with their own vocabulary.
 *
 * These are the facets that actually decide whether someone can attend: who the
 * event is open to, whether there is childcare, whether it is free. For this
 * audience "Sisters only" is not a nice-to-have detail — it is the difference
 * between the event being relevant and not.
 */
const eventSchema = z.object({
  audience: z.enum(['sisters', 'brothers', 'mixed', 'family']).optional(),
  free_entry: z.boolean().optional(),
  registration_required: z.boolean().optional(),
  childcare: z.boolean().optional(),
  prayer_space: z.boolean().optional(),
  halal_catering: z.boolean().optional(),
  parking: z.boolean().optional(),
  wheelchair_access: z.boolean().optional(),
  language: z.array(z.string()).optional(),
});

const AUDIENCE_LABEL: Record<string, string> = {
  sisters: 'Sisters only',
  brothers: 'Brothers only',
  mixed: 'Open to all',
  family: 'Family friendly',
};

const EVENT_VOCAB = {
  schema: eventSchema,
  display: {
    free_entry: { label: 'Free entry', kind: 'chip', order: 1 },
    childcare: { label: 'Childcare', kind: 'chip', order: 2 },
    prayer_space: { label: 'Prayer space', kind: 'chip', order: 3 },
    halal_catering: { label: 'Halal catering', kind: 'chip', order: 4 },
    parking: { label: 'Parking', kind: 'chip', order: 5 },
    wheelchair_access: { label: 'Wheelchair access', kind: 'chip', order: 6 },
    registration_required: { label: 'Registration required', kind: 'chip', order: 7 },
    audience: {
      label: 'Open to',
      kind: 'fact',
      order: 1,
      format: (v: unknown) => AUDIENCE_LABEL[String(v)] ?? String(v),
      input: {
        control: 'enum',
        options: Object.entries(AUDIENCE_LABEL).map(([value, label]) => ({ value, label })),
      },
    },
    language: {
      label: 'Language',
      kind: 'fact',
      order: 2,
      format: (v: unknown) => (Array.isArray(v) ? v.map(String).map(titleCase).join(', ') : String(v)),
      input: { control: 'tags', suggestions: ['english', 'yoruba', 'hausa', 'arabic', 'swahili'] },
    },
  } as Record<string, AttributeDisplay>,
};

export type ResolvedAttributes = {
  chips: string[];
  facts: { key: string; label: string; value: string }[];
};

const EMPTY: ResolvedAttributes = { chips: [], facts: [] };

/**
 * Maps a raw `places.category` string onto a known key. The DB values are not
 * guaranteed to match the app's keys, so this is deliberately forgiving —
 * an unrecognised category yields no attributes rather than throwing.
 */
export function categoryKeyFor(category: string | null | undefined): PlaceCategoryKey | undefined {
  if (!category) return undefined;
  const c = category.toLowerCase();
  if (c.includes('mosque') || c.includes('masjid')) return 'mosques';
  if (c.includes('school') || c.includes('learning') || c.includes('madrasah')) return 'learning';
  if (c.includes('food') || c.includes('restaurant') || c.includes('halal')) return 'food';
  if (c.includes('stay') || c.includes('hotel')) return 'stays';
  return undefined;
}

/**
 * Validates a place's raw `attributes` against its category and splits the
 * result into chips and facts, each sorted by declared order.
 *
 * Never throws: bad data yields empty, because a malformed attribute blob must
 * not take down a page whose photos, address and map are perfectly fine.
 */
export function resolveAttributes(
  category: string | null | undefined,
  raw: unknown,
): ResolvedAttributes {
  const key = categoryKeyFor(category);
  const entry = key ? CATEGORIES[key] : undefined;
  return resolveWith(entry, raw);
}

/** The event vocabulary. Same contract, different keys. */
export function resolveEventAttributes(raw: unknown): ResolvedAttributes {
  return resolveWith(EVENT_VOCAB, raw);
}

// ---- Editing ----------------------------------------------------------------
// The admin renders its attribute form from these. Exported so there is exactly
// one place that decides a mosque has a jumu'ah time and a school has terms —
// the app reads it to display, the admin reads it to edit.

function fieldsOf(display: Record<string, AttributeDisplay>): AttributeField[] {
  return Object.entries(display)
    .map(([key, d]) => ({
      key,
      label: d.label,
      kind: d.kind,
      order: d.order,
      // Chips are booleans by construction; facts default to free text.
      input: d.input ?? (d.kind === 'chip' ? { control: 'boolean' } : { control: 'text' }),
    }))
    .sort((a, b) => (a.kind === b.kind ? a.order - b.order : a.kind === 'fact' ? -1 : 1));
}

/**
 * The editable attributes for a place category, facts first then chips.
 *
 * Facts lead because they carry the specific answers someone came to record —
 * the jumu'ah time, the fee — while chips are a quick pass of yes/nos.
 * An unknown category returns an empty list rather than throwing: it simply has
 * no vocabulary yet, which is a real and valid state.
 */
export function attributeFieldsFor(category: string | null | undefined): AttributeField[] {
  const key = categoryKeyFor(category);
  const entry = key ? CATEGORIES[key] : undefined;
  return entry ? fieldsOf(entry.display) : [];
}

/** The editable attributes for an event. */
export function eventAttributeFields(): AttributeField[] {
  return fieldsOf(EVENT_VOCAB.display);
}

/**
 * Validate an attributes object against its category before writing.
 *
 * Returns the parsed value on success, or a list of problems. The admin calls
 * this on save so bad data is refused at the point it is entered rather than
 * silently failing to render weeks later.
 */
export function validateAttributes(
  category: string | null | undefined,
  raw: unknown,
): { ok: true; value: Record<string, unknown> } | { ok: false; errors: string[] } {
  const key = categoryKeyFor(category);
  const entry = key ? CATEGORIES[key] : undefined;
  if (!entry) return { ok: true, value: (raw as Record<string, unknown>) ?? {} };

  const parsed = entry.schema.safeParse(raw ?? {});
  if (parsed.success) return { ok: true, value: parsed.data as Record<string, unknown> };
  return {
    ok: false,
    errors: parsed.error.issues.map((i) => `${i.path.join('.') || 'value'}: ${i.message}`),
  };
}

function resolveWith(
  entry: { schema: z.ZodTypeAny; display: Record<string, AttributeDisplay> } | undefined,
  raw: unknown,
): ResolvedAttributes {
  if (!entry || !raw || typeof raw !== 'object') return EMPTY;

  const parsed = entry.schema.safeParse(raw);
  if (!parsed.success) return EMPTY;

  const chips: { label: string; order: number }[] = [];
  const facts: { key: string; label: string; value: string; order: number }[] = [];

  for (const [k, value] of Object.entries(parsed.data as Record<string, unknown>)) {
    const display = entry.display[k];
    if (!display || value === undefined || value === null) continue;

    if (display.kind === 'chip') {
      // Only a true boolean earns a chip — false and absent are both silence.
      if (value === true) chips.push({ label: display.label, order: display.order });
      continue;
    }

    const formatted = display.format ? display.format(value) : String(value);
    if (formatted) facts.push({ key: k, label: display.label, value: formatted, order: display.order });
  }

  return {
    chips: chips.sort((a, b) => a.order - b.order).map((c) => c.label),
    facts: facts.sort((a, b) => a.order - b.order).map(({ key: k, label, value }) => ({ key: k, label, value })),
  };
}
