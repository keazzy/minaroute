/**
 * Stage 4: emit the human review sheet.
 *
 * Writes data/review-sheet.csv (UTF-8 with BOM — opens cleanly in Google
 * Sheets and Excel). The reviewer fills the `approved` column with TRUE for
 * rows that should be uploaded, optionally fixing lat/lng or other fields —
 * upload-approved.ts reads the edited CSV back, so sheet edits win.
 *
 * Rows already marked `dup` are included (sorted last) for transparency but
 * should normally stay unapproved.
 *
 * Usage: npm run schools:sheet
 */

import { writeFileSync } from 'fs';
import {
  CANDIDATES_JSON,
  REVIEW_SHEET_CSV,
  readJson,
  requireFile,
  toCsv,
} from './lib';
import { Candidate, SHEET_COLUMNS } from './schema';

const ORDER: Record<Candidate['dedup_status'], number> = {
  new: 0,
  'likely-dup': 1,
  pending: 2,
  dup: 3,
};

function main() {
  requireFile(CANDIDATES_JSON, 'Run the earlier stages first.');
  const candidates = readJson<Candidate[]>(CANDIDATES_JSON);

  const rows = [...candidates]
    .sort(
      (a, b) =>
        ORDER[a.dedup_status] - ORDER[b.dedup_status] || b.confidence - a.confidence,
    )
    .map((c) => ({
      ...c,
      approved: '', // reviewer sets TRUE
      reviewer_notes: '',
    }));

  writeFileSync(REVIEW_SHEET_CSV, toCsv(SHEET_COLUMNS, rows), 'utf8');

  const counts = candidates.reduce(
    (acc, c) => ((acc[c.dedup_status] = (acc[c.dedup_status] ?? 0) + 1), acc),
    {} as Record<string, number>,
  );
  console.log(`✅ ${rows.length} rows → ${REVIEW_SHEET_CSV}`);
  console.log(`   by dedup_status: ${JSON.stringify(counts)}`);
  console.log(
    '\nNext: open the CSV (Google Sheets: File → Import), review, set approved=TRUE,',
  );
  console.log('save back as CSV, then run: npm run schools:upload');
}

main();
