/**
 * Content loader — the offline read API over the bundled JSON. Everything here
 * resolves from on-device assets (static imports), so the rite path never touches the
 * network. Language resolution is a registry: add a `.[lang].json` set + one entry to
 * flip languages (FR-010), no schema change.
 *
 * Types come from `./validate` via `import type` (erased at build), so this module
 * never pulls the validator's Node built-ins into the app bundle.
 */
import checklistEn from '@/src/content/checklist.en.json';
import modulesEn from '@/src/content/learning-modules.en.json';
import sitesJson from '@/src/content/sites.json';
import ritesEn from '@/src/content/umrah-rites.en.json';
import type {
  ChecklistFile,
  ChecklistSection,
  LearningModule,
  ModulesFile,
  Rite,
  RitesFile,
  Site,
  SitesFile,
} from './validate';

type Lang = 'en';

const RITES_BY_LANG: Record<Lang, RitesFile> = { en: ritesEn as RitesFile };
const MODULES_BY_LANG: Record<Lang, ModulesFile> = { en: modulesEn as ModulesFile };
const CHECKLIST_BY_LANG: Record<Lang, ChecklistFile> = { en: checklistEn as ChecklistFile };
const SITES: SitesFile = sitesJson as SitesFile;

function resolveLang(lang: string): Lang {
  return lang in RITES_BY_LANG ? (lang as Lang) : 'en';
}

/** Ordered Umrah rite sequence for a language (falls back to English). */
export function getRites(lang: string = 'en'): Rite[] {
  return [...RITES_BY_LANG[resolveLang(lang)].rites].sort((a, b) => a.order - b.order);
}

export function getRite(id: string, lang: string = 'en'): Rite | undefined {
  return RITES_BY_LANG[resolveLang(lang)].rites.find((r) => r.id === id);
}

export function getModules(lang: string = 'en'): LearningModule[] {
  return MODULES_BY_LANG[resolveLang(lang)].modules;
}

export function getModule(id: string, lang: string = 'en'): LearningModule | undefined {
  return MODULES_BY_LANG[resolveLang(lang)].modules.find((m) => m.id === id);
}

/** Prep + packing checklist sections (falls back to English). */
export function getChecklistSections(lang: string = 'en'): ChecklistSection[] {
  return CHECKLIST_BY_LANG[resolveLang(lang)].sections;
}

/** Total number of checklist items (for progress math). */
export function getChecklistItemCount(lang: string = 'en'): number {
  return getChecklistSections(lang).reduce((n, s) => n + s.items.length, 0);
}

/** Sites are language-independent (coords + gates). */
export function getSites(): Site[] {
  return SITES.sites;
}

export function getSite(siteId: string): Site | undefined {
  return SITES.sites.find((s) => s.siteId === siteId);
}
