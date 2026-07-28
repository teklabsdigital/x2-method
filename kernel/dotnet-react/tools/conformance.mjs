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

// The four states, written strongest first. That order is not decoration: it IS the strength order the
// per-obligation roll-up reads, so a row carrying obligations takes the status of the one furthest down this
// list. Stated here rather than in a second constant, because two orders that must agree are one order that
// will eventually disagree.
export const STATUSES = ['proven', 'patterned', 'latent', 'owed'];
export const BEGIN = '<!-- conformance:begin -->';
export const END = '<!-- conformance:end -->';

// A row may carry an `obligations` array: one entry per separable duty the claim's statement names and this
// edition answers separately, each with its own status and its own sentence. Adjudication ruling 3 of
// 2026-07-26, answering S-8.
//
// What it fixes, measured: 4 of 5 built claims in the second edition sit at `owed` with a red-green-proven
// half, and 9 rows in the first edition already wrote a second status inside a parenthetical because the
// four-word vocabulary had nowhere else to put it. The vocabulary was being worked around in prose for 27
// percent of the realized claims before anyone named the defect.
//
// The roll-up is the WEAKEST obligation, by owner ruling: the conservative direction is the one a security
// claim should be read in, and a tally that summed the strongest halves would repeat the lie by summation that
// splitting `built` into four states was minted to kill. The roll-up is not computed into the row; the row
// DECLARES its status and the roll-up is checked against it, so a hand-edited row cannot quietly disagree with
// its own obligations.
//
// A row without the array means exactly what it meant before: one claim, one status. That is the majority and
// it is deliberately untouched.
export function rollUp(obligations) {
  return STATUSES[Math.max(...obligations.map((obligation) => STATUSES.indexOf(obligation.status)))];
}

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
    errors.push(...obligationErrors(id, row));
  }
  return { errors, record };
}

// The obligations half of a row's validation, and the trigger rule for the whole row, because the two cannot
// be separated: an owed row discharges the trigger obligation on its note, and an owed row that ROLLS UP from
// obligations discharges it per obligation, since that is where the deferral is actually described. Requiring
// both would force every trigger to be written twice, and a fact written twice is a fact that drifts.
function obligationErrors(id, row) {
  const errors = [];
  const triggerOnNote = () => {
    if (row.status === 'owed' && !/trigger:/i.test(row.note ?? '')) {
      errors.push(`conformance.json: ${id} is owed but its note names no trigger.`);
    }
  };

  if (row.obligations === undefined) {
    triggerOnNote();
    return errors;
  }
  // Fewer than two is refused rather than tolerated: a single obligation is the row's own status wearing a
  // second costume, and it would let a row claim per-obligation precision while carrying none.
  if (!Array.isArray(row.obligations) || row.obligations.length < 2) {
    errors.push(
      `conformance.json: ${id} has an 'obligations' array that is not a list of at least two entries; a claim with one obligation is a flat row, so drop the array.`,
    );
    triggerOnNote();
    return errors;
  }

  const names = new Set();
  let shaped = true;
  for (const [index, obligation] of row.obligations.entries()) {
    const where = `${id} obligation ${index + 1}`;
    if (typeof obligation?.name !== 'string' || obligation.name.trim().length === 0) {
      errors.push(`conformance.json: ${where} has no name; an obligation nobody can cite is not machine-readable.`);
      shaped = false;
    } else if (names.has(obligation.name)) {
      errors.push(`conformance.json: ${id} carries two obligations named '${obligation.name}'; the name is how a row's halves are told apart.`);
    } else {
      names.add(obligation.name);
    }
    if (!STATUSES.includes(obligation?.status)) {
      errors.push(`conformance.json: ${where} has status '${obligation?.status ?? ''}'; use one of ${STATUSES.join(', ')}.`);
      shaped = false;
    }
    // The whole point of the array is that a second status stops being prose. An obligation with a status and
    // no sentence moves the prose out without moving anything in.
    if (typeof obligation?.text !== 'string' || obligation.text.trim().length === 0) {
      errors.push(`conformance.json: ${where} has no text; the status says how much is built and the text says what.`);
    } else if (obligation?.status === 'owed' && !/trigger:/i.test(obligation.text)) {
      errors.push(`conformance.json: ${where} is owed but names no trigger; an obligation quietly dropped reads the same as one deferred.`);
    }
  }

  if (!shaped) {
    return errors;
  }
  const weakest = rollUp(row.obligations);
  if (row.status !== weakest) {
    const name = row.obligations.find((obligation) => obligation.status === weakest).name;
    errors.push(
      `conformance.json: ${id} reads '${row.status}' but its weakest obligation ('${name}') is '${weakest}'; the row status is the roll-up and the weakest obligation wins.`,
    );
  }
  // The same rule the row-level check applies, one level down: if any obligation asserts something is built,
  // the row owes the name of what proves it. Without this a row could roll up to `owed`, escape the row-level
  // mechanism rule, and still assert a proven half with nothing named.
  if (row.obligations.some((obligation) => obligation.status !== 'owed') && (row.mechanism ?? '').trim().length === 0) {
    errors.push(`conformance.json: ${id} has an obligation that is not owed but the row names no mechanism.`);
  }
  return errors;
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
  const split = Object.values(record.claims).filter((r) => Array.isArray(r.obligations)).length;
  const lines = [
    BEGIN,
    `Generated from \`conformance.json\` by \`tools/conformance.mjs\`; edit the JSON, not the table.`,
    `${Object.keys(record.claims).length} claims at catalog pass ${record.catalogPassDate}: ${tally.join(', ')}.`,
  ];
  if (split > 0) {
    lines.push(
      '',
      `${split} of those rows state a status per obligation; the row's own status is the weakest of them, so the tally above reads a split row at its weakest half and never at its strongest.`,
    );
  }
  lines.push('', '| Claim | Edition mechanism | Status |', '|-------|-------------------|--------|');
  for (const [id, row] of Object.entries(record.claims)) {
    const mechanism = row.mechanism.trim().length > 0 ? row.mechanism : 'not built';
    lines.push(`| ${id} ${lowerFirst(row.title)} | ${mechanism} | ${renderStatus(row)} |`);
  }
  lines.push(END);
  return lines.join('\n');
}

// The status cell. A split row renders its roll-up, then one segment per obligation, then the note: the
// obligation's sentence lives in the record now, so the table has to show it or the generated document would
// carry less than the machine-readable file it is generated from.
function renderStatus(row) {
  const parts = [];
  if (Array.isArray(row.obligations)) {
    parts.push(`${row.status} (the weakest of ${row.obligations.length} obligations)`);
    for (const obligation of row.obligations) {
      parts.push(`**${obligation.name}** \`${obligation.status}\`: ${obligation.text}`);
    }
  } else {
    parts.push(row.status);
  }
  if (row.note.trim().length > 0) {
    parts.push(row.note);
  }
  // Segments are joined with a semicolon, so a segment that already ends in a full stop would render `.;`.
  // The last segment keeps its punctuation, because nothing follows it.
  return parts.map((part, index) => (index === parts.length - 1 ? part : part.replace(/\.$/, ''))).join('; ');
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

// The tally has ONE home, the generated table, and this is what makes that true rather than intended.
//
// Measured 2026-07-28, in both editions at once and by reading rather than by any gate. Each README's intro
// restated the record's tally in prose. One had gone on asserting a realized-versus-owed split that the rulings
// of 2026-07-26 and the planting rounds after them had moved almost every row out of; the other stated a row
// count that was wrong by eight and named a status for a claim that had been lifted the day before. Both files
// carried a CURRENT generated table a few sections below the stale sentence, and every gate was green the whole
// time: `checkTable` compares the generated block against the record and cannot see prose, and the catalog's
// stated-count check reads the repository's live documents and the skills, not an edition's README. A status is
// a claim about a mechanism and has a guard. A number in prose is a claim about the tree and had none.
//
// So the remedy is the fourth bucket rather than a second comparison: the tally is not restated here at all,
// and this bans the SHAPE rather than checking the value, because a second copy that agrees today is still a
// second copy and it drifts on the next pass that moves a row. The shape is a number adjacent to a status word,
// optionally bridged by the noun: "32 `owed`", "65 of 69 claims `owed`". A vocabulary definition does not have
// it ("`owed` (not built, with a named trigger)"), and neither does an ordinary sentence about a claim ("SEC-4
// and TEN-6 are owed in both editions"), which is what keeps this from banning prose about the record.
//
// Scope is the file that holds the generated table, outside the markers and outside fenced code blocks. Dated
// records (VERIFICATION.md, BUILD-BRIEF.md, everything in the record layer) are measurements taken at a date
// and are never retouched, so a tally inside one is history and is deliberately left alone.
const TALLY_NUMBER = '(?<![\\w-])(?:\\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen)(?![\\w-])';
const TALLY_BRIDGE = '(?:\\s+(?:of\\s+\\d{1,3}\\s+)?(?:catalog\\s+)?(?:claims?|rows?))?';
const TALLY = new RegExp(`${TALLY_NUMBER}${TALLY_BRIDGE}\\s+\`?(?:${STATUSES.join('|')})\`?`, 'gi');

export function tallyRestatementFindings(readme, where = 'README.md') {
  const lines = readme.split('\n');
  const begin = lines.findIndex((line) => line.trim() === BEGIN);
  const end = lines.findIndex((line) => line.trim() === END);
  const generated = begin !== -1 && end > begin;
  const findings = [];
  let fenced = false;
  lines.forEach((line, index) => {
    if (generated && index >= begin && index <= end) {
      return;
    }
    if (line.trimStart().startsWith('```')) {
      fenced = !fenced;
      return;
    }
    if (fenced) {
      return;
    }
    for (const match of line.matchAll(TALLY)) {
      findings.push(
        `${where}:${index + 1} restates the conformance tally in prose ("${match[0].trim()}"). The tally has one home, the generated table, and a second copy drifts the next time a row moves: cite the table instead of repeating it.`,
      );
    }
  });
  return findings;
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
