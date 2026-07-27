import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkAgainstCatalog, checkTable, load } from './conformance.mjs';

// DOC-1 documentation lifecycle gate, plus the TEN-5 ledger coupling, the DEP-1 ledger-completeness check,
// the DEP-1 container-image pin check (INV-05), the DEP-1 kernel-provenance pin check, the DEC-1
// decision-provenance check, the conformance-record check (every catalog claim owes a status row, and the
// README table is generated from it), and the standing-constraint dash check (MET-08). Plain node, no
// dependencies. Runs from anywhere; paths resolve relative to the edition root.
//
// Usage:
//   node tools/docs-lint.mjs              lint the edition and exit non-zero on any failure
//   node tools/docs-lint.mjs --self-test  run the predicates against their own controls and exit
//
// `--self-test` exists for a measured reason (E-28). A lint that walks a clean tree reports ok whether its
// predicates reach everything or nothing, so a green run is evidence about the tree and none at all about the
// guard. Measured 2026-07-27: narrowing the ledger row scrape so it could match no line left every gate green,
// a real violation planted underneath included, and the change was made the way the build brief says to change
// a shared file. `compose --check` compares the copies and cannot see that all three stopped working. The answer
// is the one `secret-scan.mjs` already carries: the predicates are isolated from the filesystem, and their
// extent is asserted rather than described.
const editionRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const selfTest = process.argv.includes('--self-test');
const invokedDirectly = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
const errors = [];
const notes = [];
const fail = (message) => errors.push(message);

const ROOT_MARKDOWN = new Set(['README.md', 'CLAUDE.md', 'BUILD-BRIEF.md', 'VERIFICATION.md', 'VERSIONS.md']);
const FOLDER_KIND = { claims: 'claim', decisions: 'decision', contracts: 'contract', runbooks: 'runbook', work: 'work' };
const STATUSES = new Set(['authoritative', 'working', 'archived']);
const SKIP_DIRS = new Set(['node_modules', 'bin', 'obj', 'dist', '.git']);

// Vendored submodules are third-party by definition (INV-08): any path registered in .gitmodules is skipped
// wholesale. The edition ships none; the first project that vendors one is this mechanism's first real run.
const submodulePaths = new Set();
const gitmodulesFile = join(editionRoot, '.gitmodules');
if (existsSync(gitmodulesFile)) {
  for (const match of readFileSync(gitmodulesFile, 'utf8').matchAll(/^\s*path\s*=\s*(.+?)\s*$/gm)) {
    submodulePaths.add(match[1]);
  }
}

// design/ is governed narrowly (INV-08, the narrow ruling): imported artifacts (the DC source, the _ds export,
// the behaviour spec) are exempt from every check; the authored provenance README (the lock record) and the
// derived per-slice ledgers are governed. These exclusions are declared in the edition README.
function designRule(rel) {
  if (rel === 'design/prototype/README.md') {
    return { kind: 'provenance' };
  }
  if (/^design\/ledger\/[^/]+\.md$/.test(rel)) {
    return { kind: 'ledger', slice: true };
  }
  return null; // everything else under design/ is an imported or design-input artifact: exempt.
}

function isExempt(rel) {
  if ([...submodulePaths].some((p) => rel === p || rel.startsWith(`${p}/`))) {
    return true;
  }
  if (rel.startsWith('design/') && designRule(rel) === null) {
    return true;
  }
  return false;
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    if (SKIP_DIRS.has(entry)) {
      return [];
    }
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function frontMatter(text) {
  if (!text.startsWith('---')) {
    return null;
  }
  const end = text.indexOf('\n---', 3);
  if (end < 0) {
    return null;
  }
  const parsed = {};
  for (const line of text.slice(3, end).split('\n')) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*:\s*(.+?)\s*$/);
    if (match) {
      parsed[match[1]] = match[2];
    }
  }
  return parsed;
}

// ---------------------------------------------------------------------------------------------------------
// The predicates, isolated from the filesystem so `--self-test` drives exactly what the scan drives. Each takes
// the text (and the path, where placement is part of the rule) and returns the messages it would report. The
// scans above are a loop over files and these functions and nothing else, which is the property that makes the
// controls below worth anything: a narrowing that silences the scan silences these too, and they are asserted.

const IMAGE_SCAN_EXTENSIONS = ['.md', '.yml', '.yaml', '.sh', '.cs', '.mjs', '.ts', '.tsx', '.json'];
const imageRef = /(?:mcr\.microsoft\.com|docker\.io|ghcr\.io|quay\.io)\/[A-Za-z0-9._/-]+(?::[A-Za-z0-9._-]+)?(?:@sha256:[a-f0-9]{64})?/g;

export function docLifecycleFindings(rel, text) {
  const out = [];
  const parts = rel.split('/');

  if (parts.length === 1) {
    if (!ROOT_MARKDOWN.has(parts[0])) {
      out.push(`${rel}: markdown at the edition root must be one of ${[...ROOT_MARKDOWN].join(', ')} (DOC-1).`);
    }
    return out;
  }

  // The governed design/ files carry their own kinds (a deliberate registry addition, DOC-1).
  if (parts[0] === 'design') {
    const design = designRule(rel);
    const fm = frontMatter(text);
    if (!fm) {
      out.push(`${rel}: missing front matter (DOC-1).`);
      return out;
    }
    if (fm.kind !== design.kind) {
      out.push(`${rel}: kind '${fm.kind ?? ''}' should be '${design.kind}' (DOC-1).`);
    }
    if (!STATUSES.has(fm.status)) {
      out.push(`${rel}: status '${fm.status ?? ''}' must be authoritative, working, or archived (DOC-1).`);
    }
    if (design.slice && !fm.slice) {
      out.push(`${rel}: fidelity ledgers must carry a slice id (DOC-1).`);
    }
    return out;
  }

  if (parts[0] !== 'docs') {
    out.push(`${rel}: markdown is outside docs/ and is not an allowed root file (DOC-1).`);
    return out;
  }

  const expectedKind = FOLDER_KIND[parts[1]];
  if (!expectedKind) {
    out.push(`${rel}: docs/${parts[1]}/ is not a legal documentation root (DOC-1).`);
    return out;
  }

  const fm = frontMatter(text);
  if (!fm) {
    out.push(`${rel}: missing front matter (DOC-1).`);
    return out;
  }
  if (fm.kind !== expectedKind) {
    out.push(`${rel}: kind '${fm.kind ?? ''}' should be '${expectedKind}' for docs/${parts[1]}/ (DOC-1).`);
  }
  if (!STATUSES.has(fm.status)) {
    out.push(`${rel}: status '${fm.status ?? ''}' must be authoritative, working, or archived (DOC-1).`);
  }
  if (parts[1] === 'work' && !fm.slice) {
    out.push(`${rel}: work docs must carry a slice id (DOC-1).`);
  }
  // DEC-1 (upward link): a decision names the story, epic, or claim it serves. Code traces to a decision,
  // a decision traces to what it serves; a D-0xx without provenance is the unrecorded-decision failure.
  if (parts[1] === 'decisions' && !fm.provenance) {
    out.push(`${rel}: decisions must carry a provenance field naming the story, epic, or claim served (DEC-1).`);
  }
  return out;
}

export function bypassLedgerFindings(text) {
  const out = [];
  const rows = text
    .split('\n')
    .filter((line) => line.trim().startsWith('|'))
    .slice(2); // skip the header and separator rows
  for (const row of rows) {
    const test = (row.split('|')[3] ?? '').trim();
    if (test.length === 0) {
      out.push('tenant-bypass-ledger.md: a bypass row names no sole-reader test (TEN-5).');
    }
  }
  return out;
}

/// A `FROM` line in a Dockerfile, whatever the registry host. This is the E-38 closure and it is deliberately
/// narrow: the four-host allowlist above cannot see Docker Hub shorthand (`node:22-alpine`), which is the
/// obligation's own stated violation shape, and widening the allowlist to bare `name:tag` would match every
/// `key: value` in the tree.
///
/// It is gated on the file being a Dockerfile, and that gate was added because the first version was not. Run
/// against the real tree, an ungated pattern reported `container image 'reflection' floats` and `container image
/// 'the' floats`, from two English sentences in VERIFICATION.md that happen to begin a line with the word "from".
/// The self-test passed both before and after, because every case in it was a Dockerfile line: a control set
/// drawn only from the shape you are trying to catch cannot tell you what else you caught.
const dockerFrom = /^\s*FROM\s+(?:--\S+\s+)*(\S+)/gim;
const isDockerfile = (rel) => {
  const name = rel.split('/').pop();
  return name === 'Dockerfile' || name.startsWith('Dockerfile.');
};

export function imageFindings(rel, text, hasLedgerRow) {
  const out = [];
  const refs = [...text.matchAll(imageRef)].map((match) => match[0]);

  // A Dockerfile's FROM lines, added to whatever the host allowlist already found. Deduplicated, because an
  // `mcr.microsoft.com` image on a FROM line matches both patterns and one defect is one message.
  if (isDockerfile(rel)) {
    for (const match of text.matchAll(dockerFrom)) {
      const ref = match[1];
      if (!refs.includes(ref) && ref.toLowerCase() !== 'scratch') {
        refs.push(ref);
      }
    }
  }

  for (const ref of refs) {
    const digestSplit = ref.split('@sha256:');
    const repoAndTag = digestSplit[0];
    const hasDigest = digestSplit.length === 2;
    const tag = repoAndTag.includes(':') ? repoAndTag.split(':').pop() : null;
    if (tag === null || tag === 'latest' || tag.endsWith('-latest')) {
      out.push(`${rel}: container image '${ref}' floats; pin an exact tag plus digest (DEP-1 / INV-05).`);
      continue;
    }
    if (!hasDigest) {
      out.push(`${rel}: container image '${ref}' has no @sha256 digest; the pinned form is tag@digest (DEP-1 / INV-05).`);
    }
    if (!hasLedgerRow(repoAndTag.toLowerCase())) {
      out.push(`VERSIONS.md: no ledger row for container image '${repoAndTag}' (DEP-1 / INV-05).`);
    }
  }
  return out;
}

/// DEP-1: one image value across every surface naming an image.
///
/// The per-file check above asks whether each reference is pinned and ledgered. It cannot ask the question this
/// obligation is about, because that question is not about any one file: five surfaces name the SQL Server image
/// in this edition (the ledger row, the Testcontainers fixture, the runbook, `db-up.sh` and the CI workflow), and
/// every one of them was individually pinned, individually ledgered, and individually green while nothing
/// compared them to each other (E-37, E-64). Bumping the engine in four places and missing the fifth produces
/// three tiers running two different builds, with the whole DEP-1 mechanism reporting success.
///
/// Keyed by repository, so two tags of one repository are a disagreement and need an argued exemption. That is
/// the direction the obligation's own trigger names, and the strict one: a build image and a runtime image from
/// the same repository is a real pattern, and it is rare enough to be worth stating out loud when it happens.
export function imageAgreementFindings(sightings) {
  const byRepo = new Map();

  for (const { rel, ref } of sightings) {
    const repo = ref.split('@')[0].split(':')[0];
    const values = byRepo.get(repo) ?? new Map();
    values.set(ref, [...(values.get(ref) ?? []), rel]);
    byRepo.set(repo, values);
  }

  const out = [];
  for (const [repo, values] of byRepo) {
    if (values.size > 1) {
      const detail = [...values]
        .map(([ref, files]) => `'${ref}' in ${[...new Set(files)].sort().join(', ')}`)
        .sort()
        .join('; ');
      out.push(`container image '${repo}' is named with ${values.size} different values across the tree: ${detail}. One image value across every surface (DEP-1 / INV-05).`);
    }
  }
  return out;
}

/// DEP-1: the cooling-off window number lives in exactly one place.
///
/// The number was asserted independently in six files and read by none of them (E-37), so cutting the window
/// would have left five stale statements of the old number, each reading as current. The check does not ban
/// restating it, which would falsify dated historical records that legitimately name the window in force at the
/// time; it makes restating it unable to DRIFT. A cut to the window turns every restatement red, and whoever
/// makes the cut then decides site by site whether each one is history to be reworded or a live rule to be
/// corrected. That decision is the point.
const WINDOW_ASSERTION = /(\d+)[\s-]day(?:\s+cooling[\s-]off)?\s+window|cooling[\s-]off\s+window\s+is\s+(\d+)\s*days?/gi;

export function declaredWindow(versionsText) {
  const match = /cooling[\s-]off\s+window\s+is\s+(\d+)\s*days?/i.exec(versionsText);
  return match ? Number(match[1]) : null;
}

export function windowFindings(rel, text, declared) {
  const out = [];
  if (declared === null) {
    return out;
  }
  for (const match of text.matchAll(WINDOW_ASSERTION)) {
    const stated = Number(match[1] ?? match[2]);
    if (stated !== declared) {
      out.push(`${rel}: states a ${stated}-day cooling-off window; the VERSIONS.md header declares ${declared}. The number lives in that header and every other mention agrees with it or cites it (DEP-1).`);
    }
  }
  return out;
}

// Controls. Every CATCH case is an input a plant fed these predicates on 2026-07-27 and saw reported by name;
// every IGNORE case is a shape a widening would break. The IGNORE cases marked KNOWN GAP are ones the same round
// measured as passing when the claim wants them caught, and they are written down as PASSING rather than wished
// away, exactly as SecretConfigShapeTests records the cost of token matching. Each is an `owed` obligation with a
// named trigger in conformance.json, so closing it breaks this test and has to be argued, not discovered.
const SELF_TEST_DIGEST = `@sha256:${'a'.repeat(64)}`;
const CATCH = [
  ['a kind that does not match its folder', () => docLifecycleFindings('docs/claims/notes-scratch.md', '---\nkind: notes\nstatus: working\n---\n')],
  ['a claim kind inside docs/decisions/', () => docLifecycleFindings('docs/decisions/ai-trust-tiers.md', '---\nkind: claim\nstatus: authoritative\nprovenance: x\n---\n')],
  ['markdown outside docs/ and not an allowed root file', () => docLifecycleFindings('server/handover.md', '# Handover\n')],
  ['an unlisted file at the edition root', () => docLifecycleFindings('NOTES.md', '# Notes\n')],
  ['no front matter at all', () => docLifecycleFindings('docs/claims/x.md', '# no front matter\n')],
  ['a status outside the enum', () => docLifecycleFindings('docs/claims/x.md', '---\nkind: claim\nstatus: bogus\n---\n')],
  ['a documentation root that does not exist', () => docLifecycleFindings('docs/description/x.md', '---\nkind: claim\nstatus: authoritative\n---\n')],
  ['a work document with no slice id', () => docLifecycleFindings('docs/work/s1-notes.md', '---\nkind: work\nstatus: working\n---\n')],
  ['a decision with no provenance (DEC-1)', () => docLifecycleFindings('docs/decisions/d-001.md', '---\nkind: decision\nstatus: authoritative\n---\n')],
  ['a bypass row whose sole-reader cell is empty', () => bypassLedgerFindings('| Path | Justification | Test |\n|--|--|--|\n| /billing | invoicing | |\n')],
  ['an image on a floating :latest tag', () => imageFindings('x.sh', 'mcr.microsoft.com/mssql/server:latest', () => true)],
  ['an image with no tag at all', () => imageFindings('x.sh', 'mcr.microsoft.com/mssql/server', () => true)],
  ['a tagged image with no digest', () => imageFindings('x.sh', 'mcr.microsoft.com/mssql/server:2022-CU12', () => true)],
  ['a pinned image with no ledger row', () => imageFindings('x.sh', `mcr.microsoft.com/mssql/server:2022-CU12${SELF_TEST_DIGEST}`, () => false)],
  // E-38's first half, closed. This case was an IGNORE marked KNOWN GAP until 2026-07-27; moving it here is the
  // argument the register exists to force, and the argument is that a FROM line is unambiguous where a bare
  // `name:tag` anywhere in the tree is not.
  ['Docker Hub shorthand on a Dockerfile FROM line', () => imageFindings('Dockerfile', 'FROM node:22-alpine\n', () => true)],
  ['a FROM line with no tag at all', () => imageFindings('Dockerfile', 'FROM node\n', () => true)],
  ['a multi-stage FROM with a build alias', () => imageFindings('Dockerfile', 'FROM --platform=$BUILDPLATFORM node:22-alpine AS build\n', () => true)],
  // DEP-1: one image value across every surface.
  ['the same repository pinned to two different digests',
    () => imageAgreementFindings([
      { rel: 'db-up.sh', ref: `mcr.microsoft.com/mssql/server:2022-CU14${SELF_TEST_DIGEST}` },
      { rel: 'ci.yml', ref: `mcr.microsoft.com/mssql/server:2022-CU14@sha256:${'b'.repeat(64)}` },
    ])],
  ['the same repository pinned to two different tags',
    () => imageAgreementFindings([
      { rel: 'db-up.sh', ref: `mcr.microsoft.com/mssql/server:2022-CU14${SELF_TEST_DIGEST}` },
      { rel: 'VERSIONS.md', ref: `mcr.microsoft.com/mssql/server:2022-CU15${SELF_TEST_DIGEST}` },
    ])],
  ['a surface naming the image without the digest the ledger records',
    () => imageAgreementFindings([
      { rel: 'runbook.md', ref: 'mcr.microsoft.com/mssql/server:2022-CU14' },
      { rel: 'VERSIONS.md', ref: `mcr.microsoft.com/mssql/server:2022-CU14${SELF_TEST_DIGEST}` },
    ])],
  // DEP-1: the cooling-off window number lives in exactly one place.
  ['a document restating a window the header does not declare', () => windowFindings('BUILD-BRIEF.md', 'all satisfy the 90-day window as of 2026-07-10', 30)],
  ['the long-hand form of the same drift', () => windowFindings('README.md', 'the cooling-off window is 14 days', 30)],
];
const IGNORE = [
  ['a legal root markdown file', () => docLifecycleFindings('README.md', '# anything\n')],
  ['a correct claim document', () => docLifecycleFindings('docs/claims/x.md', '---\nkind: claim\nstatus: authoritative\n---\n')],
  ['a work document carrying a slice id', () => docLifecycleFindings('docs/work/s1.md', '---\nkind: work\nstatus: working\nslice: S1\n---\n')],
  ['a decision carrying provenance', () => docLifecycleFindings('docs/decisions/d-001.md', '---\nkind: decision\nstatus: authoritative\nprovenance: claim SEC-1\n---\n')],
  ['an empty ledger, which is v1 by design', () => bypassLedgerFindings('| Path | Justification | Test |\n|--|--|--|\n')],
  ['a ledger row naming a test', () => bypassLedgerFindings('| Path | Justification | Test |\n|--|--|--|\n| /billing | invoicing | BillingSweepIsSoleReader |\n')],
  ['a fully pinned and ledgered image', () => imageFindings('x.sh', `mcr.microsoft.com/mssql/server:2022-CU12${SELF_TEST_DIGEST}`, () => true)],
  ['KNOWN GAP (E-34): the named test is never resolved, so a row naming nothing that exists passes',
    () => bypassLedgerFindings('| Path | Justification | Test |\n|--|--|--|\n| /billing | invoicing | NoSuchTestAnywhere |\n')],
  ['KNOWN GAP (E-35): the test cell is read at index 3, so an inserted column moves it out of reach',
    () => bypassLedgerFindings('| Path | Owner | Justification | Test |\n|--|--|--|--|\n| /billing | @a | invoicing | |\n')],
  ['KNOWN GAP (E-35): a row is a line starting with a pipe, so a reformatted ledger has no rows at all',
    () => bypassLedgerFindings('- Path: /billing\n- Justification: invoicing\n- Test: none\n')],
  ['a scratch base, which names no image to pin', () => imageFindings('Dockerfile', 'FROM scratch\n', () => false)],
  // The false positive the real tree found and this control set did not. Every Dockerfile case above is a line
  // shaped like the thing being caught, so none of them could report that ordinary English beginning a line with
  // "from" was being read as a base image. It is a control now.
  ['prose beginning a line with the word from', () => imageFindings('VERIFICATION.md', 'measured\nfrom reflection, not from the record\n', () => false)],
  ['one repository named identically on five surfaces',
    () => imageAgreementFindings(['VERSIONS.md', 'db-up.sh', 'ci.yml', 'runbook.md', 'SqlServerFixture.cs']
      .map((rel) => ({ rel, ref: `mcr.microsoft.com/mssql/server:2022-CU14${SELF_TEST_DIGEST}` })))],
  ['two different repositories, which are two different dependencies',
    () => imageAgreementFindings([
      { rel: 'ci.yml', ref: `mcr.microsoft.com/mssql/server:2022-CU14${SELF_TEST_DIGEST}` },
      { rel: 'ci.yml', ref: `ghcr.io/some/other:1.2.3${SELF_TEST_DIGEST}` },
    ])],
  ['a document restating the window the header declares', () => windowFindings('BUILD-BRIEF.md', 'all satisfy the 30-day window as of 2026-07-10', 30)],
  ['a vendored component naming its own internal window, which is not this one',
    () => windowFindings('VERSIONS.md', 'the teklabs engine uses 15 for its own development', 30)],
  ['no VERSIONS.md header to compare against, which is reported once rather than at every mention',
    () => windowFindings('BUILD-BRIEF.md', 'the 90-day window', null)],
  ['KNOWN GAP (E-38): a bare `name:tag` outside a Dockerfile FROM line is still invisible',
    () => imageFindings('compose.yml', '  image: node:22-alpine\n', () => false)],
];

if (invokedDirectly && selfTest) {
  const failures = [];
  for (const [why, probe] of CATCH) {
    if (probe().length === 0) {
      failures.push(`MISSED  ${why}`);
    }
  }
  for (const [why, probe] of IGNORE) {
    const hits = probe();
    if (hits.length > 0) {
      failures.push(`FALSE POSITIVE  ${why} -> ${JSON.stringify(hits)}`);
    }
  }
  if (failures.length > 0) {
    console.error('docs-lint --self-test FAILED:');
    for (const f of failures) {
      console.error(`  ${f}`);
    }
    process.exit(1);
  }
  console.log(`docs-lint --self-test ok: ${CATCH.length} caught, ${IGNORE.length} ignored.`);
  process.exit(0);
}

// Two views of the tree, and the difference is deliberate.
//
// `allFiles` is the governed set: the authored files the documentation and dash checks apply to, with imported
// design artifacts and vendored submodules removed. `everyFile` is the whole tree minus vendored submodules and
// build output, and it exists because a COMPLETENESS check must not inherit a CONTENT check's exemptions. The
// DEP-1 manifest sweep used the governed set and was therefore blind to a `package.json` under `design/`: a real
// manifest, in the tree, exempt from the sweep written to find exactly that. An audit planted one and the build
// stayed green.
const everyFile = walk(editionRoot)
  .map((file) => ({ file, rel: relative(editionRoot, file).split(sep).join('/') }))
  .filter(({ rel }) => ![...submodulePaths].some((p) => rel === p || rel.startsWith(`${p}/`)));
const allFiles = everyFile.filter(({ rel }) => !isExempt(rel));

// Which files are dependency manifests, in the formats this tool can read. Hoisted to module scope because both
// the DEP-1 sweep and the dash check's lockfile exemption need it.
const MANIFEST_SHAPES = [
  { match: (rel) => rel.endsWith('Directory.Packages.props'), kind: 'msbuild-packages' },
  { match: (rel) => rel.endsWith('.config/dotnet-tools.json'), kind: 'dotnet-tools' },
  { match: (rel) => rel === 'package.json' || rel.endsWith('/package.json'), kind: 'npm-package-json' },
];

// DOC-1: the rule is `docLifecycleFindings`, defined below with the other predicates; this is the file walk.
for (const { file, rel } of allFiles.filter(({ rel }) => rel.endsWith('.md'))) {
  for (const message of docLifecycleFindings(rel, readFileSync(file, 'utf8'))) {
    fail(message);
  }
}

// TEN-5: every bypass-ledger row names a sole-reader test. An absent ledger is a TEN-5 failure stated as a
// sentence, not a stack trace from readFileSync: the ledger is where the claim lives, so its absence is the
// claim's absence.
const bypassLedgerFile = join(editionRoot, 'docs/claims/tenant-bypass-ledger.md');
if (!existsSync(bypassLedgerFile)) {
  fail('docs/claims/tenant-bypass-ledger.md is missing; the sanctioned-bypass ledger is where TEN-5 lives.');
} else {
  for (const message of bypassLedgerFindings(readFileSync(bypassLedgerFile, 'utf8'))) {
    fail(message);
  }
}

// DEP-1: every direct dependency has a ledger row in VERSIONS.md.
//
// WHICH files declare direct dependencies is edition property; HOW to read a manifest format is not. This
// tool lives in the shared tier, so it holds the readers and the edition holds the list, declared in
// `edition.json`. Hardcoding `server/Directory.Packages.props` and `server/.config/dotnet-tools.json` here
// made the shared linter silently .NET-only: a second edition has neither file, and the DEP-1 check that is
// supposed to be the catalog's strongest pin would have crashed on it rather than run.
// Readers return the PIN, not just the name. Returning names alone was the whole of a second audit finding:
// the check proved a package was mentioned in the ledger and nothing else, so `"react": "latest"` and
// `"vite": "^6.0.0"` both passed, and a ledger row for one version vouched for every other version of the same
// package. DEP-1's text is exact pins with recorded publish dates, and a mechanism that checks the name is not
// a mechanism for that claim.
const READERS = {
  // MSBuild central package management. Attribute-order-independent: Include and Version may appear in any order.
  'msbuild-packages': (text) =>
    [...text.matchAll(/<PackageVersion\b[^>]*>/g)].map((m) => ({
      name: /\bInclude="([^"]*)"/.exec(m[0])?.[1],
      version: /\bVersion="([^"]*)"/.exec(m[0])?.[1],
    })),
  // npm manifest: runtime and development dependencies are both direct, and so are overrides.
  //
  // Overrides are here because of what DEP-1's advisory rule made them. The rule says a pin taken because an
  // advisory outranks the window carries its own ledger row "whether the dependency is direct or transitive",
  // and the way a transitive pin is taken in npm is an `overrides` entry. VERSIONS.md has an advisory-rule
  // section, `ledgerPins` parsed it, and nothing ever queried it, because an override reached the tree through
  // no dependency surface (E-37). An override is the most deliberate pin in the file: it overrules what a
  // dependency asked for, which is exactly the act that needs a dated row.
  'npm-package-json': (text) => {
    const pkg = JSON.parse(text);
    const flat = [...Object.entries(pkg.dependencies ?? {}), ...Object.entries(pkg.devDependencies ?? {})];
    // npm allows a nested form (`{"vite": {"postcss": "8.5.18"}}`) scoping an override to one parent, so the
    // walk is recursive and the LEAF names the package being pinned.
    const overrides = (node) =>
      Object.entries(node ?? {}).flatMap(([name, spec]) =>
        typeof spec === 'string' ? [[name, spec]] : overrides(spec));
    return [...flat, ...overrides(pkg.overrides)].map(([name, version]) => ({ name, version }));
  },
  // dotnet local tools are a real direct-dependency surface (dotnet-ef lives here).
  'dotnet-tools': (text) =>
    Object.entries(JSON.parse(text).tools ?? {}).map(([name, spec]) => ({ name, version: spec?.version })),
};

// An exact pin and nothing else: no caret, no tilde, no range, no `latest`, no wildcard. Prerelease and build
// metadata are allowed because they are still exact.
const EXACT_VERSION = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

// The ledger is read as a table, not as a bag of words. A row is (name, version, published, ...), so a pin is
// vouched for only by a row naming that pin, and only if that row records a date: a row with an empty publish
// cell means the cooling-off window was never checked for it, which is the check DEP-1 exists to be.
const versionsFile = join(editionRoot, 'VERSIONS.md');
if (!existsSync(versionsFile)) {
  // Not a crash. TEN-5's ledger gained this guard in an earlier pass and this read did not, so deleting
  // VERSIONS.md produced a raw ENOENT stack trace instead of the sentence the claim deserves.
  fail('VERSIONS.md is missing; it is the DEP-1 ledger and every direct dependency is pinned and dated there.');
}
const versions = existsSync(versionsFile) ? readFileSync(versionsFile, 'utf8') : '';
const ledgerNames = new Set([...versions.matchAll(/^\|\s*([^|\s][^|]*?)\s*\|/gm)].map((m) => m[1].toLowerCase()));
const ledgerPins = new Map();
for (const line of versions.split('\n')) {
  if (!line.trim().startsWith('|')) {
    continue;
  }
  const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
  if (cells.length >= 3 && !/^-+$/.test(cells[1])) {
    ledgerPins.set(`${cells[0]}@${cells[1]}`.toLowerCase(), cells[2]);
  }
}

// The edition declaration, read once: it names the stack-specific facts a shared linter must not assume, which
// today are the dependency manifests (DEP-1) and the homes of the irreversible surfaces (HUM-1).
const editionFile = join(editionRoot, 'edition.json');
let edition = null;
if (!existsSync(editionFile)) {
  fail('edition.json is missing; it declares this edition\'s dependency manifests (DEP-1) and irreversible surfaces (HUM-1).');
} else {
  try {
    edition = JSON.parse(readFileSync(editionFile, 'utf8'));
  } catch (error) {
    edition = null;
    fail(`edition.json is not valid JSON: ${error.message}`);
  }
}

if (edition) {
  const surfaces = edition.dependencySurfaces;
  if (!Array.isArray(surfaces)) {
    fail('edition.json: dependencySurfaces must be an array of { path, kind } (DEP-1).');
  } else {
    // An edition with no declared surface has no DEP-1 coverage at all, which must be loud rather than green.
    if (surfaces.length === 0) {
      fail('edition.json: dependencySurfaces is empty; an edition with no dependency manifest has no DEP-1 ledger check.');
    }
    const declared = [];
    for (const surface of surfaces) {
      const read = READERS[surface?.kind];
      if (!read) {
        fail(`edition.json: unknown dependency surface kind '${surface?.kind ?? ''}'; known kinds are ${Object.keys(READERS).join(', ')}.`);
        continue;
      }
      const surfaceFile = join(editionRoot, surface.path);
      // A declared surface that does not exist is a broken declaration, not an absent dependency: silently
      // skipping it would drop every package it holds out of the ledger check.
      if (!existsSync(surfaceFile)) {
        fail(`edition.json: declared dependency surface '${surface.path}' does not exist (DEP-1).`);
        continue;
      }
      try {
        const pins = read(readFileSync(surfaceFile, 'utf8'));
        // A surface that yields nothing is either an empty manifest, which does not belong in the list, or a
        // manifest paired with the wrong reader in a way that still parses (declaring a package.json as
        // msbuild-packages returns an empty match set, not an error). Both read as full coverage and are not,
        // so zero is refused rather than accepted quietly.
        if (pins.length === 0) {
          fail(`edition.json: '${surface.path}' yielded no dependencies as '${surface.kind}'; either the kind is wrong or the manifest is empty and should not be declared (DEP-1).`);
        }
        declared.push(...pins.map((pin) => ({ ...pin, from: surface.path })));
      } catch (error) {
        fail(`${surface.path}: could not be read as '${surface.kind}': ${error.message}`);
      }
    }
    for (const { name, version, from } of declared) {
      if (typeof name !== 'string' || name.length === 0) {
        fail(`${from}: a dependency entry has no name (DEP-1).`);
        continue;
      }
      if (typeof version !== 'string' || !EXACT_VERSION.test(version)) {
        fail(`${from}: '${name}' is pinned as '${version ?? ''}', which is not an exact version; DEP-1 allows no range, no caret or tilde, no wildcard and no 'latest'.`);
        continue;
      }
      const published = ledgerPins.get(`${name}@${version}`.toLowerCase());
      if (published === undefined) {
        // Deliberately keyed on name AND version. A row for a different version of the same package says
        // nothing about this one, and treating it as coverage is how a second surface pins a version whose
        // publish date nobody ever checked.
        fail(`VERSIONS.md: no ledger row for '${name}' at version '${version}' (${from}); a row for another version of the same package is not a row for this one (DEP-1).`);
      } else if (!/^\d{4}-\d{2}-\d{2}/.test(published)) {
        fail(`VERSIONS.md: the row for '${name}' ${version} records no publish date ('${published}'), so its cooling-off window was never checked (DEP-1).`);
      }
    }

    // The completeness obligation on this mechanism, which the declaration alone does not carry: the check
    // above proves every DECLARED dependency is ledgered, and says nothing about a manifest nobody declared.
    // Dropping a line from edition.json would silently drop every package it holds out of the ledger check
    // while the build stayed green, which is the same shape of hole the catalog's route-scan claims leave
    // unstated. So the tree is swept for manifests in the formats this tool can read, and one that exists
    // without a declaration fails. Adding a stack whose manifest format is not in READERS is a deliberate
    // kernel edit here, by design: an unreadable manifest must not be silently uncovered.
    //
    // The sweep runs over `everyFile`, not `allFiles`. Running it over the governed set gave it the content
    // checks' exemptions, so a manifest under `design/` was invisible to the completeness check written to find
    // manifests. Vendored submodules stay out, because a submodule's dependencies are its own repository's
    // ledger to keep.
    const declaredPaths = new Set(surfaces.map((surface) => surface?.path));
    for (const { rel } of everyFile) {
      const shape = MANIFEST_SHAPES.find((candidate) => candidate.match(rel));
      if (shape && !declaredPaths.has(rel)) {
        fail(`edition.json: '${rel}' is a ${shape.kind} manifest but is not declared in dependencySurfaces, so its dependencies are unledgered (DEP-1).`);
      }
    }
  }
}

// DEP-1 / INV-05: container images are dependencies. Every image reference on the scanned surfaces must be the
// pinned tag-plus-digest form (the tag documents, the digest pins) and must have a VERSIONS.md row keyed by
// repo:tag. A floating tag (:latest or tagless) fails outright: three tiers reach the engine, and a float means
// they may not run the same build. VERSIONS.md itself and this tool are excluded (the ledger names the image).
const imageSightings = [];
for (const { file, rel } of allFiles) {
  const name = rel.split('/').pop();
  // Extensionless `Dockerfile` and `Dockerfile.debug` matched no extension pattern, which is the second half of
  // E-38: the tool could not read the one file type whose entire purpose is naming a base image.
  const scanned = IMAGE_SCAN_EXTENSIONS.some((ext) => rel.endsWith(ext)) || name === 'Dockerfile' || name.startsWith('Dockerfile.');
  if (!scanned || rel === 'tools/docs-lint.mjs') {
    continue;
  }
  const text = readFileSync(file, 'utf8');
  if (rel !== 'VERSIONS.md') {
    for (const message of imageFindings(rel, text, (key) => ledgerNames.has(key))) {
      fail(message);
    }
    for (const match of text.matchAll(imageRef)) {
      imageSightings.push({ rel, ref: match[0] });
    }
  }
}

// The ledger's own row is a surface naming the image, and it is the surface most worth comparing: it carries the
// digest every other surface is supposed to match. It is read from the table rather than by the reference regex
// because the row keeps repo:tag and the digest in SEPARATE cells, so the regex alone reads the ledger as naming
// a different value from every pinned copy in the tree and every surface disagrees with the ledger by
// construction. Reconstructing the pinned form from the two cells is what makes ledger-versus-code drift visible.
const wholeImageRef = new RegExp(`^${imageRef.source}$`);
for (const line of versions.split('\n')) {
  const cells = line.trim().startsWith('|') ? line.split('|').slice(1, -1).map((cell) => cell.trim()) : [];
  if (cells.length >= 2 && wholeImageRef.test(cells[0]) && /^sha256:[a-f0-9]{64}$/.test(cells[1])) {
    imageSightings.push({ rel: 'VERSIONS.md', ref: `${cells[0]}@${cells[1]}` });
  }
}

for (const message of imageAgreementFindings(imageSightings)) {
  fail(message);
}

// DEP-1: the cooling-off window number lives in exactly one place, and the VERSIONS.md header is that place.
const coolingWindow = declaredWindow(versions);
if (existsSync(versionsFile) && coolingWindow === null) {
  fail('VERSIONS.md: the header states no cooling-off window; it is the one place the number lives and every other mention agrees with it (DEP-1).');
}
for (const { file, rel } of allFiles) {
  if (!IMAGE_SCAN_EXTENSIONS.some((ext) => rel.endsWith(ext)) || rel === 'tools/docs-lint.mjs') {
    continue;
  }
  for (const message of windowFindings(rel, readFileSync(file, 'utf8'), coolingWindow)) {
    fail(message);
  }
}

// MET-08: the standing constraint is mechanical, so it is enforced here, in the TEST-3 loop: no em or en dash in
// any authored file. Vendored submodules and imported design artifacts are already exempt (isExempt); lockfiles
// are generated third-party metadata and binaries are not text. The characters are built from escapes so this
// file does not flag itself.
// A lockfile is generated third-party metadata wherever it sits, so it is exempt. The exemption has been wrong
// twice in opposite directions and the current form is the narrow one both failures point at.
//
// It began as two literal paths from the .NET edition's layout, which made a second edition's lockfiles into
// authored text that would fail on a dash inside some transitive package's metadata. Widening it to match by
// filename fixed that and opened the reverse hole: an audit put an em dash in an authored `docs/work/yarn.lock`
// and a blanket `*.lock` rule waved it through. A lockfile is only a lockfile if it locks something, so the
// exemption now requires a manifest beside it. An authored file with a lockfile's name and no project next to
// it is authored text, and is scanned.
const LOCKFILE_NAMES = new Set(['package-lock.json', 'packages.lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'yarn.lock', 'Cargo.lock', 'poetry.lock']);
const isProjectManifest = (name) =>
  name === 'package.json' || name === 'Directory.Packages.props' || name === 'dotnet-tools.json' || /\.(cs|fs|vb)proj$/.test(name);
const manifestDirs = new Set(
  everyFile
    .filter(({ rel }) => isProjectManifest(rel.split('/').pop()))
    .map(({ rel }) => rel.slice(0, Math.max(0, rel.lastIndexOf('/')))),
);
const isGeneratedLockfile = (rel) => {
  if (!LOCKFILE_NAMES.has(rel.split('/').pop())) {
    return false;
  }
  const dir = rel.slice(0, Math.max(0, rel.lastIndexOf('/')));
  // `.config/dotnet-tools.json` lives one level below the project it serves, so the parent counts too.
  return manifestDirs.has(dir) || manifestDirs.has(dir.slice(0, Math.max(0, dir.lastIndexOf('/'))));
};
const BINARY_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.ttf', '.otf', '.woff', '.woff2', '.eot', '.pdf', '.zip'];
const EM_DASH = String.fromCharCode(0x2014);
const EN_DASH = String.fromCharCode(0x2013);
for (const { file, rel } of allFiles) {
  if (isGeneratedLockfile(rel) || BINARY_EXTENSIONS.some((ext) => rel.toLowerCase().endsWith(ext))) {
    continue;
  }
  const text = readFileSync(file, 'utf8');
  if (text.includes(EM_DASH) || text.includes(EN_DASH)) {
    fail(`${rel}: contains an em or en dash; the standing constraint bans both everywhere (MET-08).`);
  }
}

// HUM-1: the CODEOWNERS file exists and covers the three irreversible surfaces (the locally testable half of the
// claim; branch protection requiring code-owner review is armed at instantiation).
//
// WHICH surfaces are irreversible is portable and fixed below; WHERE each one lives is edition property and is
// declared in edition.json. Matching the literal fragments 'Migrations/' and 'Contracts/' encoded one stack's
// PascalCase directory convention into a portable gate: a Node edition puts the same two surfaces in
// lowercase directories and would have failed HUM-1 for spelling. The categories cannot be dropped or renamed
// by an edition, so declaring them costs an edition nothing it should have been free to skip.
// The kernel repo is detected by BUILD-BRIEF.md and VERIFICATION.md, which the instantiation manifest keeps
// behind: their presence means this tree is the kernel itself, so structural placeholders are legal here and
// illegal everywhere downstream. Two claims read it, HUM-1's owner placeholder below and DEP-1's provenance pin.
const kernelContext = existsSync(join(editionRoot, 'BUILD-BRIEF.md')) && existsSync(join(editionRoot, 'VERIFICATION.md'));

// The owner the kernel ships is a placeholder by design; step 1 of the instantiation manifest renames it. It
// matches the `\s@\S+` shape an owned entry needs, so before this check a seeded project passed HUM-1's whole
// locally testable half with every irreversible surface owned by nobody (E-23).
const PLACEHOLDER_OWNER = '@OWNER';

const IRREVERSIBLE_SURFACES = {
  'schema-migrations': 'a schema migration is not revertible once it has run against real data',
  'wire-contracts': 'a published contract shape cannot be unpublished from its consumers',
  'contract-docs': 'the contract record is what consumers were told, so changing it changes the promise',
};
if (edition) {
  const homes = edition.irreversibleSurfaces;
  if (homes === null || typeof homes !== 'object' || Array.isArray(homes)) {
    fail('edition.json: irreversibleSurfaces must be an object mapping each surface to its path in this edition (HUM-1).');
  } else {
    const codeownersPath = join(editionRoot, '.github/CODEOWNERS');
    const codeowners = existsSync(codeownersPath)
      ? readFileSync(codeownersPath, 'utf8')
          .split('\n')
          .filter((line) => line.trim().length > 0 && !line.trim().startsWith('#'))
      : null;
    if (codeowners === null) {
      fail('.github/CODEOWNERS is missing; migrations and published contracts need a named owner (HUM-1).');
    }
    for (const [surface, why] of Object.entries(IRREVERSIBLE_SURFACES)) {
      const path = homes[surface];
      if (typeof path !== 'string' || path.trim().length === 0) {
        fail(`edition.json: irreversibleSurfaces has no path for '${surface}' (${why}) (HUM-1).`);
        continue;
      }
      // A declared surface no CODEOWNERS line covers is a surface with no named human, which is the whole of
      // what this half of HUM-1 asserts. The path may name a directory that does not exist yet: naming the owner
      // BEFORE the first migration lands is the point, not an oversight.
      if (codeowners === null) continue;
      const covering = codeowners.filter((line) => line.includes(path) && /\s@\S+/.test(line));
      if (covering.length === 0) {
        fail(`.github/CODEOWNERS: no owned entry covering '${path}' (the ${surface} surface) (HUM-1).`);
        continue;
      }
      // Covered is not owned. An entry naming only the shipped placeholder names no human, so outside the kernel
      // the surface is unowned and the merge gate it feeds has nobody to require a review from.
      const named = covering.some((line) =>
        (line.match(/\s@\S+/g) ?? []).some((owner) => owner.trim() !== PLACEHOLDER_OWNER));
      if (!kernelContext && !named) {
        fail(`.github/CODEOWNERS: '${path}' (the ${surface} surface) is owned only by the placeholder ${PLACEHOLDER_OWNER}, which names no human; instantiation renames it to the product owner (HUM-1).`);
      }
    }
  }
}

// DEP-1: the kernel a project is seeded from is itself a pinned, ledgered dependency. VERSIONS.md carries a
// Kernel provenance section: structural placeholders in the kernel repo, filled mechanically at instantiation.
// The kernel context is detected above, by BUILD-BRIEF.md and VERIFICATION.md, which the instantiation manifest
// keeps behind: their presence means this tree is the kernel itself, and the placeholders are legal.
const provStart = versions.indexOf('## Kernel provenance');
if (provStart < 0) {
  fail('VERSIONS.md: no Kernel provenance section; the kernel is a dependency and its pin lives here (DEP-1).');
} else if (!kernelContext) {
  const nextHeading = versions.indexOf('\n## ', provStart);
  const section = nextHeading < 0 ? versions.slice(provStart) : versions.slice(provStart, nextHeading);
  for (const field of ['Remote', 'Commit', 'Catalog pass date', 'Edition']) {
    const row = section.split('\n').find((line) => line.replace(/\s+/g, ' ').startsWith(`| ${field} |`));
    const value = row ? (row.split('|')[2] ?? '').trim() : '';
    if (value.length === 0 || value.includes('<')) {
      fail(`VERSIONS.md: Kernel provenance field '${field}' is missing or unfilled; instantiation writes the pin mechanically (DEP-1).`);
    }
  }
}

// The edition's conformance record is the single home for per-claim status, and the README table is generated
// from it. Two failures gate here: a record that is malformed or dishonest (a realized claim naming no
// mechanism, an owed claim naming no trigger), and a README table that has drifted from the record.
// In the kernel repo the catalog is one directory up, so completeness is enforced too: a claim minted by a
// catalog pass cannot land without every edition declaring where it stands. That is the whole point of moving
// status here, and it is what makes a future pass unable to complete while an edition stays silent.
const conformance = load(editionRoot);
for (const error of conformance.errors) {
  fail(error);
}
// Shape before meaning: the catalog and table checks read every row's fields directly, so they run only once
// load() has proven the rows well formed. Otherwise a malformed row is reported as a stack trace from the
// renderer instead of the sentence load() already wrote for it.
if (conformance.record && conformance.errors.length === 0) {
  const catalogErrors = checkAgainstCatalog(conformance.record, join(editionRoot, '../claims'));
  for (const error of catalogErrors ?? []) {
    fail(error);
  }
  // A skipped check is announced, never silently passed. Both skips are legitimate in a seeded project and
  // neither is legitimate in the kernel repo, so printing the reason is what lets a reader tell which tree
  // they are looking at, and stops a green run from being read as coverage it does not have.
  if (catalogErrors === null) {
    notes.push('catalog not present, so per-claim completeness was NOT checked (expected in a seeded project)');
  }
  const table = checkTable(editionRoot, conformance.record);
  for (const error of table.errors) {
    fail(error);
  }
  if (table.skipped) {
    notes.push(`README conformance table NOT checked: ${table.skipped}`);
  }
}

// S-2, ruled 2026-07-26: `locus` is an enum of exactly two values and every qualification lives in `locus_note`.
//
// The field was documented as an enum and realized as prose, 22 distinct values across 69 claims. That held as
// long as a human read it, because the qualified values all lead with the word the enum wanted; it stops holding
// the moment anything mechanical needs the comparison, and the comparison a second edition needs is "this claim
// declares centralized and this stack reaches only per-seam". A field nothing checks drifts to whatever the last
// editor felt like writing, which is how 22 values happened.
//
// Conditional and announced, on the same rule as the conformance catalog-completeness check and the finding-id
// check: the catalog lives above the edition in the kernel repo, and a seeded project carries the edition
// without it. Three checks that skip for the same reason state the reason three times rather than sharing a
// flag, because each names the artifact it could not read.
const LOCI = new Set(['centralized', 'per-seam']);
const catalogDir = join(editionRoot, '../claims');
if (!existsSync(catalogDir)) {
  notes.push('the claims catalog is not present, so claim `locus` values were NOT checked (expected in a seeded project)');
} else {
  for (const claimFile of readdirSync(catalogDir).filter((entry) => /^[A-Z]+-[0-9]+-.*\.md$/.test(entry))) {
    const raw = readFileSync(join(catalogDir, claimFile), 'utf8');
    const fm = frontMatter(raw);
    if (fm === null) {
      fail(`claims/${claimFile}: missing front matter, so it declares no locus (DOC-1).`);
      continue;
    }
    if (!LOCI.has(fm.locus)) {
      fail(
        `claims/${claimFile}: locus '${fm.locus ?? ''}' is not one of ${[...LOCI].join(', ')}; a qualification belongs in locus_note (S-2).`,
      );
    }
    // Read from the raw block rather than from the parsed object, and the difference is not pedantry: the
    // parser's value pattern requires at least one character, so `locus_note:` with nothing after it parses as
    // the key being ABSENT. For a mandatory key that is harmless, since absent and empty both fail the same
    // check. For an optional one it is a hole exactly the size of the key, and an empty note is the shape a
    // hybrid claim gets written into when someone means to come back to it.
    const block = raw.slice(3, raw.indexOf('\n---', 3));
    if (/^\s*locus_note\s*:\s*$/m.test(block)) {
      fail(`claims/${claimFile}: locus_note is present and says nothing; drop the key or state what qualifies the locus (S-2).`);
    }
  }
}

// Every finding id an edition cites is defined in the findings register, and no id is cited that the register
// does not define.
//
// The register is the definition site for the edition-build findings, and an edition's conformance rows, its
// README table, its verification log and its source comments all cite them by id. Nothing checked that a cited
// id existed. One did not: an id was cited seven times across four files with no entry anywhere, two of those
// citations in `conformance.json` and in the table generated from it, which are the artifacts that seed into
// every instantiated project. A seeded tree therefore inherited a machine-readable conformance record pointing
// at a finding that existed in no register, and neither the conformance gate (which proves internal consistency
// of the record) nor the documentation gate could see it.
//
// Conditional, and the skip is announced, on the same rule as the catalog-completeness check: the register lives
// in the kernel repo's working records, above the edition, and a seeded project carries the CITATIONS without
// the register. Keyed on the register file itself rather than on the directory, so a project that happens to sit
// beside an unrelated `record/` does not silently get a check against the wrong file.
//
// This tool names no finding id literally, so it needs no exemption from its own check. A scan whose predicate
// is a set of literals cannot be run over the file that declares the set, and the cheapest way out of that is to
// not declare one.
const FINDING_ID = /\b([ABCES]-\d+)\b/g;
const registerFile = join(editionRoot, '../../record/edition-findings.md');
if (!existsSync(registerFile)) {
  notes.push('the findings register is not present, so cited finding ids were NOT checked (expected in a seeded project)');
} else {
  const register = readFileSync(registerFile, 'utf8');
  // A finding is DEFINED by its own heading in the register. Anything else that mentions the id is a citation,
  // including the register's own cross-references, which is why the register is scanned as a citing surface too:
  // the dangling id lived there first and was copied outward.
  const defined = new Set([...register.matchAll(/^###\s+([ABCES]-\d+)\b/gm)].map((match) => match[1]));
  const citing = [
    ...allFiles
      .filter(({ rel }) => !isGeneratedLockfile(rel) && !BINARY_EXTENSIONS.some((ext) => rel.toLowerCase().endsWith(ext)))
      .map(({ file, rel }) => ({ file, label: rel })),
    ...walk(join(editionRoot, '../../record'))
      .filter((file) => file.endsWith('.md'))
      .map((file) => ({ file, label: `record/${relative(join(editionRoot, '../../record'), file).split(sep).join('/')}` })),
  ];
  const dangling = new Map();
  for (const { file, label } of citing) {
    for (const match of readFileSync(file, 'utf8').matchAll(FINDING_ID)) {
      if (!defined.has(match[1])) {
        dangling.set(match[1], (dangling.get(match[1]) ?? new Set()).add(label));
      }
    }
  }
  for (const [id, where] of [...dangling].sort()) {
    fail(`finding id '${id}' is cited in ${[...where].sort().join(', ')} but has no entry in the findings register; a citation is not a definition.`);
  }

  // The register leak report (S-12). REPORTS, never fails, and the distinction is the finding.
  //
  // The delta protocol says a claim's second-edition mechanism is designed from the claim text alone, before its
  // sibling's realization is opened, so that a finding of the form "the claim did not say X" is falsifiable. The
  // quarantine covers the sibling's code. It cannot cover the register, because the register is what a pass must
  // read to know what has already been found, and findings quote realizations to be checkable at all: E-22 exists
  // because the register could name a registry that had never been applied to a body member.
  //
  // What is checkable is the route by which the register informs a claim other than the one a finding is about:
  // the finding names an artifact that the conformance record attributes to a DIFFERENT claim. Two shapes reach
  // this, and the first draft of this check saw only one. A fused realization leaks to every claim that shares
  // it, which is the `EndpointSpineTests` case and the loud one. But a finding also reaches sideways and names a
  // neighbour's artifact it does not share, which is how E-22, a finding about SEC-2 and TEN-1, informed CON-1.
  // Requiring the artifact to be shared missed that entirely, so the rule is owner-differs-from-subject and
  // nothing narrower.
  //
  // Reporting rather than failing is what #2 of the S-12 ruling settled, and a blocking form would have refused
  // both E-6 and E-22, the two findings that did the most work in the whole exercise. What makes the report an
  // instrument rather than a decoration is that its output is DATED into the round's ledger: the register only
  // grows, so a run today over-reports what a step 2 written six rounds ago could have seen. The snapshot is the
  // only honest answer to "was this informed WHEN IT WAS WRITTEN", and it is cheaper and less driftable than a
  // hand-maintained `[informed]` label per claim.
  //
  // Two limits, both stated because a check whose reach is unstated gets read as a proof. It sees QUOTED
  // artifacts, so a finding that describes a sibling's mechanism in prose without naming anything leaks and is
  // invisible here; the report is a lower bound and the residual is the finding author's own honesty. And it
  // over-reports in the other direction, because a mechanism string names framework vocabulary alongside its own
  // artifacts: the Node edition's SEC-2 row cites `allOf` and `anyOf`, so those read as artifacts. Filtering them
  // would mean maintaining a vocabulary registry, which is the drift this catalog already has findings about, and
  // over-reporting into an advisory note is the safe direction. Read the claim list as the instrument and the
  // token list as the citation to check by eye.
  //
  // An artifact is a backticked identifier that is either compound-cased or a file basename. That is deliberately
  // stack-neutral: the .NET rows name test classes, the Node rows name functions, and a Tests-suffix convention
  // would have read one edition and been blind to the other. The extension is stripped on both sides, because
  // `HostSecurityTests.cs` in a finding and `HostSecurityTests` in a mechanism are the same artifact, and
  // comparing them literally is the equality-versus-tokenized-match defect this catalog has now recorded twice.
  if (conformance.record && conformance.errors.length === 0) {
    const ARTIFACT = /`([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)*)`/g;
    // Both the whole token and its leading segment, because a register entry cites an artifact three ways: bare
    // (`HostSecurityTests`), as a file (`HostSecurityTests.cs`), and member-qualified
    // (`WireConventionTests.Unknown_route_returns_problem_json`, which is how CON-1 leaked and how the first
    // draft of this check missed it). The compound-case filter is what keeps the segment split from producing
    // noise: `builder.Build()` and `Type.Name` both yield a lowercase or single-word head and are dropped.
    const artifacts = (text) =>
      [...text.matchAll(ARTIFACT)]
        .flatMap(([, token]) => [token.replace(/\.(cs|ts|tsx|mjs|js|json|md)$/, ''), token.split('.')[0]])
        .filter((token) => /[a-z][A-Z]/.test(token));

    const owner = new Map();
    for (const [id, row] of Object.entries(conformance.record.claims)) {
      for (const token of artifacts(row.mechanism ?? '')) {
        owner.set(token, (owner.get(token) ?? new Set()).add(id));
      }
    }

    // A finding is delimited by the next one, and its subject is its own `Claim:` line. Everything the finding
    // names that some OTHER claim owns is what that other claim's step 2 can no longer un-see.
    const informed = new Map();
    for (const section of register.split(/^### /m).slice(1)) {
      const subject = new Set(section.match(/\*\*Claim:\*\*[^\n]*/)?.[0].match(/\b[A-Z]{2,6}-\d+\b/g) ?? []);
      for (const token of artifacts(section)) {
        for (const claim of owner.get(token) ?? []) {
          if (!subject.has(claim)) {
            informed.set(claim, (informed.get(claim) ?? new Set()).add(token));
          }
        }
      }
    }
    if (informed.size > 0) {
      const listed = [...informed]
        .sort()
        .map(([claim, tokens]) => `${claim} (${[...tokens].sort().join(', ')})`)
        .join('; ');
      notes.push(
        `register leak report (S-12), ${informed.size} of ${Object.keys(conformance.record.claims).length} claims informed by a finding about another claim: ${listed}`,
      );
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`docs-lint: ${error}`);
  }
  process.exit(1);
}
for (const note of notes) {
  console.log(`docs-lint: note: ${note}`);
}
console.log('docs-lint: ok');
