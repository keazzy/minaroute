/**
 * Bundled-content schema + validator.
 *
 * "Correctness is sacred" (roadmap Build Philosophy #7): no rite ships without a
 * scholar-source citation, so `scholarSource` is a REQUIRED, non-empty field and this
 * validator FAILS if any rite lacks one. Run it in CI / pre-build:
 *
 *     npm run validate-content        →  tsx src/lib/content/validate.ts
 *
 * NOTE: this file imports Node built-ins (fs/path) for the CLI. The content loader
 * imports only TYPES from here (`import type`), which are erased at build time, so the
 * app bundle never pulls fs/path in. Nothing in the app imports this module at runtime.
 */
import { z } from 'zod';

// ---- Schemas ---------------------------------------------------------------

export const DuaSchema = z.object({
  arabic: z.string().min(1),
  transliteration: z.string().min(1),
  translation: z.string().min(1),
  audioAssetKey: z.string().min(1).optional(),
});

export const RiteSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().nonnegative(),
  title: z.string().min(1),
  summary: z.string().optional(),
  steps: z.array(z.string().min(1)).min(1),
  dua: DuaSchema.optional(),
  repeatCount: z.number().int().positive().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  siteId: z.string().min(1).optional(),
  // REQUIRED citation — this is the guardrail that fails the build.
  scholarSource: z.string().min(1, 'scholarSource is required (no rite ships without a citation)'),
});

export const ModuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  scholarSource: z.string().min(1).optional(),
});

export const GateSchema = z.object({
  name: z.string().min(1),
  note: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const SiteSchema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  geofenceRadiusM: z.number().positive(),
  gates: z.array(GateSchema).default([]),
});

export const RitesFileSchema = z.object({ version: z.number().int().positive(), rites: z.array(RiteSchema).min(1) });
export const ModulesFileSchema = z.object({ version: z.number().int().positive(), modules: z.array(ModuleSchema) });
export const SitesFileSchema = z.object({ version: z.number().int().positive(), sites: z.array(SiteSchema) });

export type Dua = z.infer<typeof DuaSchema>;
export type Rite = z.infer<typeof RiteSchema>;
export type LearningModule = z.infer<typeof ModuleSchema>;
export type Gate = z.infer<typeof GateSchema>;
export type Site = z.infer<typeof SiteSchema>;
export type RitesFile = z.infer<typeof RitesFileSchema>;
export type ModulesFile = z.infer<typeof ModulesFileSchema>;
export type SitesFile = z.infer<typeof SitesFileSchema>;

// ---- Validation ------------------------------------------------------------

export type ValidationResult = { ok: boolean; errors: string[] };

/** Validate already-parsed content objects. Pure — used by the CLI and by tests. */
export function validateContent(input: { rites: unknown; modules: unknown; sites: unknown }): ValidationResult {
  const errors: string[] = [];

  const rites = RitesFileSchema.safeParse(input.rites);
  const modules = ModulesFileSchema.safeParse(input.modules);
  const sites = SitesFileSchema.safeParse(input.sites);

  if (!rites.success) errors.push(...rites.error.issues.map((i) => `umrah-rites: ${i.path.join('.')} — ${i.message}`));
  if (!modules.success) errors.push(...modules.error.issues.map((i) => `learning-modules: ${i.path.join('.')} — ${i.message}`));
  if (!sites.success) errors.push(...sites.error.issues.map((i) => `sites: ${i.path.join('.')} — ${i.message}`));

  // Cross-checks (only when the individual files parsed).
  if (rites.success) {
    // Explicit citation guard (belt-and-suspenders over the schema).
    for (const r of rites.data.rites) {
      if (!r.scholarSource || r.scholarSource.trim() === '') {
        errors.push(`umrah-rites: rite '${r.id}' is missing a scholarSource citation`);
      }
    }
    // Unique, referential order/site checks.
    const orders = rites.data.rites.map((r) => r.order);
    if (new Set(orders).size !== orders.length) errors.push('umrah-rites: duplicate rite `order` values');
    if (sites.success) {
      const siteIds = new Set(sites.data.sites.map((s) => s.siteId));
      for (const r of rites.data.rites) {
        if (r.siteId && !siteIds.has(r.siteId)) {
          errors.push(`umrah-rites: rite '${r.id}' references unknown siteId '${r.siteId}'`);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

// ---- CLI (build check) -----------------------------------------------------

function runCli(): void {
  // Lazy Node imports so only the CLI path touches fs/path.
  const fs = require('node:fs') as typeof import('node:fs');
  const path = require('node:path') as typeof import('node:path');
  const dir = path.join(__dirname, '..', '..', 'content');
  const read = (f: string) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));

  let input: { rites: unknown; modules: unknown; sites: unknown };
  try {
    input = {
      rites: read('umrah-rites.en.json'),
      modules: read('learning-modules.en.json'),
      sites: read('sites.json'),
    };
  } catch (err) {
    console.error('✗ content validation failed to read files:', (err as Error).message);
    process.exit(1);
    return;
  }

  const result = validateContent(input);
  if (result.ok) {
    console.log('✓ content validation passed — all rites carry a scholarSource citation.');
    return;
  }
  console.error('✗ content validation FAILED:\n' + result.errors.map((e) => `  • ${e}`).join('\n'));
  process.exit(1);
}

// tsx runs .ts as CJS (no "type":"module" in package.json), so this is reliable.
if (require.main === module) {
  runCli();
}
