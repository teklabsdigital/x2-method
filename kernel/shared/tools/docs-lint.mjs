import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAgainstCatalog, checkTable, load } from './conformance.mjs';

// DOC-1 documentation lifecycle gate, plus the TEN-5 ledger coupling, the DEP-1 ledger-completeness check,
// the DEP-1 container-image pin check (INV-05), the DEP-1 kernel-provenance pin check, the DEC-1
// decision-provenance check, the conformance-record check (every catalog claim owes a status row, and the
// README table is generated from it), and the standing-constraint dash check (MET-08). Plain node, no
// dependencies. Runs from anywhere; paths resolve relative to the edition root.
const editionRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
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

// DOC-1: placement, front matter, and slice ids.
for (const { file, rel } of allFiles.filter(({ rel }) => rel.endsWith('.md'))) {
  const parts = rel.split('/');

  if (parts.length === 1) {
    if (!ROOT_MARKDOWN.has(parts[0])) {
      fail(`${rel}: markdown at the edition root must be one of ${[...ROOT_MARKDOWN].join(', ')} (DOC-1).`);
    }
    continue;
  }

  // The governed design/ files carry their own kinds (a deliberate registry addition, DOC-1).
  const design = parts[0] === 'design' ? designRule(rel) : null;
  if (parts[0] === 'design') {
    const fm = frontMatter(readFileSync(file, 'utf8'));
    if (!fm) {
      fail(`${rel}: missing front matter (DOC-1).`);
      continue;
    }
    if (fm.kind !== design.kind) {
      fail(`${rel}: kind '${fm.kind ?? ''}' should be '${design.kind}' (DOC-1).`);
    }
    if (!STATUSES.has(fm.status)) {
      fail(`${rel}: status '${fm.status ?? ''}' must be authoritative, working, or archived (DOC-1).`);
    }
    if (design.slice && !fm.slice) {
      fail(`${rel}: fidelity ledgers must carry a slice id (DOC-1).`);
    }
    continue;
  }

  if (parts[0] !== 'docs') {
    fail(`${rel}: markdown is outside docs/ and is not an allowed root file (DOC-1).`);
    continue;
  }

  const expectedKind = FOLDER_KIND[parts[1]];
  if (!expectedKind) {
    fail(`${rel}: docs/${parts[1]}/ is not a legal documentation root (DOC-1).`);
    continue;
  }

  const fm = frontMatter(readFileSync(file, 'utf8'));
  if (!fm) {
    fail(`${rel}: missing front matter (DOC-1).`);
    continue;
  }
  if (fm.kind !== expectedKind) {
    fail(`${rel}: kind '${fm.kind ?? ''}' should be '${expectedKind}' for docs/${parts[1]}/ (DOC-1).`);
  }
  if (!STATUSES.has(fm.status)) {
    fail(`${rel}: status '${fm.status ?? ''}' must be authoritative, working, or archived (DOC-1).`);
  }
  if (parts[1] === 'work' && !fm.slice) {
    fail(`${rel}: work docs must carry a slice id (DOC-1).`);
  }
  // DEC-1 (upward link): a decision names the story, epic, or claim it serves. Code traces to a decision,
  // a decision traces to what it serves; a D-0xx without provenance is the unrecorded-decision failure.
  if (parts[1] === 'decisions' && !fm.provenance) {
    fail(`${rel}: decisions must carry a provenance field naming the story, epic, or claim served (DEC-1).`);
  }
}

// TEN-5: every bypass-ledger row names a sole-reader test. An absent ledger is a TEN-5 failure stated as a
// sentence, not a stack trace from readFileSync: the ledger is where the claim lives, so its absence is the
// claim's absence.
const bypassLedgerFile = join(editionRoot, 'docs/claims/tenant-bypass-ledger.md');
if (!existsSync(bypassLedgerFile)) {
  fail('docs/claims/tenant-bypass-ledger.md is missing; the sanctioned-bypass ledger is where TEN-5 lives.');
} else {
  const ledgerRows = readFileSync(bypassLedgerFile, 'utf8')
    .split('\n')
    .filter((line) => line.trim().startsWith('|'))
    .slice(2); // skip the header and separator rows
  for (const row of ledgerRows) {
    const test = (row.split('|')[3] ?? '').trim();
    if (test.length === 0) {
      fail('tenant-bypass-ledger.md: a bypass row names no sole-reader test (TEN-5).');
    }
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
  // npm manifest: runtime and development dependencies are both direct.
  'npm-package-json': (text) => {
    const pkg = JSON.parse(text);
    return [...Object.entries(pkg.dependencies ?? {}), ...Object.entries(pkg.devDependencies ?? {})].map(
      ([name, version]) => ({ name, version }),
    );
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
const IMAGE_SCAN_EXTENSIONS = ['.md', '.yml', '.yaml', '.sh', '.cs', '.mjs', '.ts', '.tsx', '.json'];
const imageRef = /(?:mcr\.microsoft\.com|docker\.io|ghcr\.io|quay\.io)\/[A-Za-z0-9._/-]+(?::[A-Za-z0-9._-]+)?(?:@sha256:[a-f0-9]{64})?/g;
for (const { file, rel } of allFiles) {
  if (!IMAGE_SCAN_EXTENSIONS.some((ext) => rel.endsWith(ext)) || rel === 'VERSIONS.md' || rel === 'tools/docs-lint.mjs') {
    continue;
  }
  for (const match of readFileSync(file, 'utf8').matchAll(imageRef)) {
    const ref = match[0];
    const digestSplit = ref.split('@sha256:');
    const repoAndTag = digestSplit[0];
    const hasDigest = digestSplit.length === 2;
    const tag = repoAndTag.includes(':') ? repoAndTag.split(':').pop() : null;
    if (tag === null || tag === 'latest' || tag.endsWith('-latest')) {
      fail(`${rel}: container image '${ref}' floats; pin an exact tag plus digest (DEP-1 / INV-05).`);
      continue;
    }
    if (!hasDigest) {
      fail(`${rel}: container image '${ref}' has no @sha256 digest; the pinned form is tag@digest (DEP-1 / INV-05).`);
    }
    if (!ledgerNames.has(repoAndTag.toLowerCase())) {
      fail(`VERSIONS.md: no ledger row for container image '${repoAndTag}' (DEP-1 / INV-05).`);
    }
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
      if (codeowners !== null && !codeowners.some((line) => line.includes(path) && /\s@\S+/.test(line))) {
        fail(`.github/CODEOWNERS: no owned entry covering '${path}' (the ${surface} surface) (HUM-1).`);
      }
    }
  }
}

// DEP-1: the kernel a project is seeded from is itself a pinned, ledgered dependency. VERSIONS.md carries a
// Kernel provenance section: structural placeholders in the kernel repo, filled mechanically at instantiation.
// The kernel context is detected by BUILD-BRIEF.md and VERIFICATION.md, which the instantiation manifest keeps
// behind: their presence means this tree is the kernel itself, and the placeholders are legal.
const kernelContext = existsSync(join(editionRoot, 'BUILD-BRIEF.md')) && existsSync(join(editionRoot, 'VERIFICATION.md'));
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
