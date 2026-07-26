import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The edition's conformance record: one machine-readable file, `conformance.json`, keyed by claim id, holding
// the per-claim status that used to be prose scattered across the edition README. The README table is
// GENERATED from it between the markers below, so the table cannot disagree with the record.
//
// Status belongs to the edition, not to the catalog (kernel/claims/README.md says so): a claim is one
// invariant, and each edition answers separately whether it has realized it. That is why this file lives here
// and not beside the claims.
//
//   node tools/conformance.mjs --check   validate the record and prove the README table matches it
//   node tools/conformance.mjs --write    regenerate the README table from the record
//
// docs-lint runs the --check half in the loop (TEST-3), so a claim that gains no row cannot merge.
//
// What this proves and what it does not: the record is SELF-REPORTED, so the gate proves internal
// consistency, never truth. A row reading `proven` with an invented mechanism string passes every check here.
// What the gate removes is the failure mode that actually happened: status drifting apart across three prose
// homes, and claims minted by a catalog pass never gaining a row at all. Whether a named mechanism exists and
// covers what the row says it covers is a review act, and the red-green proof discipline in VERIFICATION.md
// is where it is discharged.
//
// Two checks are conditional, and both announce themselves rather than passing silently:
//   - catalog completeness runs only where `../claims` exists, which is the kernel repo. A seeded project
//     carries the edition and not the catalog.
//   - the README table check runs only where a README carries the marker pair. The kernel's edition README
//     holds the table; a seeded project's README is the PRODUCT's, and nothing should force a conformance
//     table into it. A project that wants one adds the markers and gets the same drift gate.

export const STATUSES = ['proven', 'patterned', 'latent', 'owed'];
const BEGIN = '<!-- conformance:begin -->';
const END = '<!-- conformance:end -->';

export function load(editionRoot) {
  const file = join(editionRoot, 'conformance.json');
  if (!existsSync(file)) {
    return { errors: [`conformance.json is missing; the edition's per-claim status lives there.`], record: null };
  }
  let record;
  try {
    record = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    return { errors: [`conformance.json is not valid JSON: ${error.message}`], record: null };
  }

  const errors = [];
  for (const field of ['edition', 'catalogPassDate']) {
    if (typeof record[field] !== 'string' || record[field].length === 0) {
      errors.push(`conformance.json: '${field}' is missing.`);
    }
  }
  if (record.claims === null || typeof record.claims !== 'object') {
    errors.push('conformance.json: no claims object.');
    return { errors, record: null };
  }
  for (const [id, row] of Object.entries(record.claims)) {
    if (!/^[A-Z]+-[0-9]+$/.test(id)) {
      errors.push(`conformance.json: '${id}' is not a claim id.`);
    }
    if (!STATUSES.includes(row.status)) {
      errors.push(`conformance.json: ${id} has status '${row.status ?? ''}'; use one of ${STATUSES.join(', ')}.`);
    }
    if (typeof row.title !== 'string' || row.title.length === 0) {
      errors.push(`conformance.json: ${id} has no title.`);
    }
    // Shape before meaning: an absent `mechanism` or `note` key must be diagnosed here, because renderTable
    // reads both unconditionally and would otherwise fail with a TypeError instead of a sentence.
    for (const field of ['mechanism', 'note']) {
      if (typeof row[field] !== 'string') {
        errors.push(`conformance.json: ${id} has no '${field}' string (use "" where there is nothing to say).`);
      }
    }
    // A realized claim without a named mechanism is the aspirational-claim failure the catalog exists to kill:
    // three of the four states assert something is built, so each owes the name of the thing that proves it.
    if (row.status !== 'owed' && (typeof row.mechanism !== 'string' || row.mechanism.trim().length === 0)) {
      errors.push(`conformance.json: ${id} is '${row.status}' but names no mechanism.`);
    }
    // An owed claim without a trigger is a claim quietly dropped rather than deferred.
    if (row.status === 'owed' && !/trigger:/i.test(row.note ?? '')) {
      errors.push(`conformance.json: ${id} is owed but its note names no trigger.`);
    }
  }
  return { errors, record };
}

// The completeness gate the second edition made necessary: every claim in the catalog owes a row here, and no
// row may name a claim the catalog does not have. Only runnable where the catalog is present, which is the
// kernel repo; a seeded project carries the edition, not the catalog, so there it is skipped and said to be.
export function checkAgainstCatalog(record, catalogDir) {
  if (!existsSync(catalogDir)) {
    return null;
  }
  const errors = [];
  const catalogIds = readdirSync(catalogDir)
    .filter((f) => /^[A-Z]+-[0-9]+-.*\.md$/.test(f))
    .map((f) => f.match(/^([A-Z]+-[0-9]+)-/)[1]);
  const rows = new Set(Object.keys(record.claims));
  for (const id of catalogIds) {
    if (!rows.has(id)) {
      errors.push(`conformance.json: catalog claim ${id} has no row; every claim owes an honest status here.`);
    }
  }
  for (const id of rows) {
    if (!catalogIds.includes(id)) {
      errors.push(`conformance.json: row ${id} names no claim in the catalog.`);
    }
  }
  // The catalog's version IS the date of its latest pass, and the dated pass paragraphs are its changelog, so
  // the pin must name a pass and not merely a date the catalog happens to mention. Scoped to lines that talk
  // about a pass: taking every date in the file would validate the 2026-07-10 adjudication, which is a ruling
  // the catalog cites, not a version anything can pin to.
  const passDates = new Set(
    readFileSync(join(catalogDir, 'README.md'), 'utf8')
      .split('\n')
      .filter((line) => /\bpass\b/i.test(line))
      .flatMap((line) => [...line.matchAll(/\b(20\d\d-\d\d-\d\d)\b/g)].map((m) => m[1])),
  );
  if (!passDates.has(record.catalogPassDate)) {
    errors.push(
      `conformance.json: catalogPassDate '${record.catalogPassDate}' names no pass in the catalog changelog (known passes: ${[...passDates].sort().join(', ')}).`,
    );
  }
  return errors;
}

export function renderTable(record) {
  const tally = STATUSES.map((s) => `${Object.values(record.claims).filter((r) => r.status === s).length} \`${s}\``);
  const lines = [
    BEGIN,
    `Generated from \`conformance.json\` by \`tools/conformance.mjs\`; edit the JSON, not the table.`,
    `${Object.keys(record.claims).length} claims at catalog pass ${record.catalogPassDate}: ${tally.join(', ')}.`,
    '',
    '| Claim | Edition mechanism | Status |',
    '|-------|-------------------|--------|',
  ];
  for (const [id, row] of Object.entries(record.claims)) {
    const mechanism = row.mechanism.trim().length > 0 ? row.mechanism : 'not built';
    const status = row.note.trim().length > 0 ? `${row.status}; ${row.note}` : row.status;
    lines.push(`| ${id} ${lowerFirst(row.title)} | ${mechanism} | ${status} |`);
  }
  lines.push(END);
  return lines.join('\n');
}

// Titles are catalog headings ("Tenant comes from the credential only"); in a table cell they read as a
// continuation of the id, so the leading capital goes. Acronyms and code spans keep theirs.
function lowerFirst(title) {
  return /^([A-Z]{2,}|`)/.test(title) ? title : title.charAt(0).toLowerCase() + title.slice(1);
}

// A marker is a LINE whose entire content is the marker, never a substring.
//
// Matching anywhere in the text was a real defect with real damage: the edition README documents the opt-in by
// quoting the marker strings inside a sentence, `indexOf` found that mention first, and `--write` spliced the
// whole generated table into the middle of the sentence. The actual table further down was then never
// rewritten, and the drift check compared the same wrong span and passed, so the gate that exists to keep the
// table honest was silently guarding the wrong sixty lines. Documenting a mechanism should not be capable of
// breaking it.
//
// Two markers of the same kind on their own lines are ambiguous rather than harmless, so that is refused too.
function findMarkers(readme) {
  const lines = readme.split('\n');
  const begins = [];
  const ends = [];
  lines.forEach((line, index) => {
    if (line.trim() === BEGIN) {
      begins.push(index);
    }
    if (line.trim() === END) {
      ends.push(index);
    }
  });
  if (begins.length === 0 || ends.length === 0) {
    return null;
  }
  if (begins.length > 1 || ends.length > 1) {
    return { ambiguous: `README.md carries ${begins.length} begin and ${ends.length} end conformance markers on their own lines; exactly one pair is required.` };
  }
  if (ends[0] < begins[0]) {
    return { ambiguous: 'README.md carries the conformance end marker before the begin marker.' };
  }
  return { lines, begin: begins[0], end: ends[0] };
}

export function hasMarkers(readme) {
  return findMarkers(readme) !== null;
}

export function spliceTable(readme, table) {
  const found = findMarkers(readme);
  if (found === null) {
    return null;
  }
  if (found.ambiguous) {
    return { error: found.ambiguous };
  }
  const { lines, begin, end } = found;
  return [...lines.slice(0, begin), ...table.split('\n'), ...lines.slice(end + 1)].join('\n');
}

// The README table check, in the one form both callers use. Skipping is a reported outcome, never a silent
// pass: `skipped` carries the reason so the caller can say it out loud.
//
// The gate is keyed on the MARKERS, not on the file. The kernel's edition README holds the table and is
// gated. A seeded project's README belongs to the product, and forcing a generated conformance table into it
// would be the edition dictating the shape of a document it does not own; the record still validates, and a
// project that wants the table adds the marker pair and gets the identical drift gate. `conformance.json`
// travels either way, which is what the project's conformance statement actually rests on.
export function checkTable(editionRoot, record, { write = false } = {}) {
  const readmeFile = join(editionRoot, 'README.md');
  if (!existsSync(readmeFile)) {
    return { errors: [], skipped: 'no README.md at the edition root, so there is no table to hold' };
  }
  const readme = readFileSync(readmeFile, 'utf8');
  if (!hasMarkers(readme)) {
    return { errors: [], skipped: 'README.md carries no conformance markers, so it holds no generated table' };
  }
  const next = spliceTable(readme, renderTable(record));
  if (next !== null && typeof next === 'object' && next.error) {
    return { errors: [next.error], skipped: null };
  }
  if (write) {
    writeFileSync(readmeFile, next);
    return { errors: [], skipped: null, written: true };
  }
  if (next !== readme) {
    return {
      errors: [`README.md: the conformance table has drifted from conformance.json; run 'node tools/conformance.mjs --write'.`],
      skipped: null,
    };
  }
  return { errors: [], skipped: null };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const editionRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
  const write = process.argv.includes('--write');
  const { errors, record } = load(editionRoot);
  // Shape before meaning, as in docs-lint: a malformed row is diagnosed by load(), not by the renderer.
  const usable = record !== null && errors.length === 0;
  const catalogErrors = usable ? checkAgainstCatalog(record, join(editionRoot, '../claims')) : null;
  const all = [...errors, ...(catalogErrors ?? [])];
  const notes = [];

  if (catalogErrors === null && usable) {
    notes.push('catalog not present, so per-claim completeness was NOT checked (expected in a seeded project)');
  }
  if (all.length === 0) {
    const table = checkTable(editionRoot, record, { write });
    all.push(...table.errors);
    if (table.written) {
      console.log(`conformance: wrote ${Object.keys(record.claims).length} rows into README.md`);
    } else if (table.skipped) {
      notes.push(`README table NOT checked: ${table.skipped}`);
    }
  }

  if (all.length > 0) {
    for (const error of all) {
      console.error(`conformance: ${error}`);
    }
    process.exit(1);
  }
  for (const note of notes) {
    console.log(`conformance: note: ${note}`);
  }
  if (!write) {
    console.log(`conformance: ok (${Object.keys(record.claims).length} rows)`);
  }
}
