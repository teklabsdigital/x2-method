import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// DOC-1 documentation lifecycle gate, plus the TEN-5 ledger coupling, the DEP-1 ledger-completeness check,
// the DEP-1 container-image pin check (INV-05), the DEC-1 decision-provenance check, and the standing-constraint
// dash check (MET-08). Plain node, no dependencies. Runs from anywhere; paths resolve relative to the edition root.
const editionRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
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

const allFiles = walk(editionRoot)
  .map((file) => ({ file, rel: relative(editionRoot, file).split(sep).join('/') }))
  .filter(({ rel }) => !isExempt(rel));

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

// TEN-5: every bypass-ledger row names a sole-reader test.
const ledgerRows = readFileSync(join(editionRoot, 'docs/claims/tenant-bypass-ledger.md'), 'utf8')
  .split('\n')
  .filter((line) => line.trim().startsWith('|'))
  .slice(2); // skip the header and separator rows
for (const row of ledgerRows) {
  const test = (row.split('|')[3] ?? '').trim();
  if (test.length === 0) {
    fail('tenant-bypass-ledger.md: a bypass row names no sole-reader test (TEN-5).');
  }
}

// DEP-1: every direct dependency has a ledger row in VERSIONS.md.
const versions = readFileSync(join(editionRoot, 'VERSIONS.md'), 'utf8');
const ledgerNames = new Set([...versions.matchAll(/^\|\s*([^|\s][^|]*?)\s*\|/gm)].map((m) => m[1].toLowerCase()));

const declared = [];
// Attribute-order-independent: Include may appear anywhere in the PackageVersion element.
for (const match of readFileSync(join(editionRoot, 'server/Directory.Packages.props'), 'utf8').matchAll(/<PackageVersion\b[^>]*\bInclude="([^"]+)"/g)) {
  declared.push(match[1]);
}
const pkg = JSON.parse(readFileSync(join(editionRoot, 'client-web/package.json'), 'utf8'));
declared.push(...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {}));
// dotnet local tools are a real direct-dependency surface (dotnet-ef lives here).
const tools = JSON.parse(readFileSync(join(editionRoot, 'server/.config/dotnet-tools.json'), 'utf8'));
declared.push(...Object.keys(tools.tools ?? {}));

for (const name of declared) {
  if (!ledgerNames.has(name.toLowerCase())) {
    fail(`VERSIONS.md: no ledger row for direct dependency '${name}' (DEP-1).`);
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
const DASH_EXEMPT_FILES = new Set(['client-web/package-lock.json', 'server/packages.lock.json']);
const BINARY_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.ttf', '.otf', '.woff', '.woff2', '.eot', '.pdf', '.zip'];
const EM_DASH = String.fromCharCode(0x2014);
const EN_DASH = String.fromCharCode(0x2013);
for (const { file, rel } of allFiles) {
  if (DASH_EXEMPT_FILES.has(rel) || rel.endsWith('.lock') || BINARY_EXTENSIONS.some((ext) => rel.toLowerCase().endsWith(ext))) {
    continue;
  }
  const text = readFileSync(file, 'utf8');
  if (text.includes(EM_DASH) || text.includes(EN_DASH)) {
    fail(`${rel}: contains an em or en dash; the standing constraint bans both everywhere (MET-08).`);
  }
}

// HUM-1: the CODEOWNERS file exists and covers the three irreversible surfaces (the locally testable half of the
// claim; branch protection requiring code-owner review is armed at instantiation). Matched on path fragments so
// the instantiation rename (Kernel to the product name) cannot silently drop coverage.
const codeownersPath = join(editionRoot, '.github/CODEOWNERS');
if (!existsSync(codeownersPath)) {
  fail('.github/CODEOWNERS is missing; migrations and published contracts need a named owner (HUM-1).');
} else {
  const codeowners = readFileSync(codeownersPath, 'utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0 && !line.trim().startsWith('#'));
  for (const surface of ['Migrations/', 'Contracts/', 'docs/contracts']) {
    if (!codeowners.some((line) => line.includes(surface) && /\s@\S+/.test(line))) {
      fail(`.github/CODEOWNERS: no owned entry covering '${surface}' (HUM-1).`);
    }
  }
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`docs-lint: ${error}`);
  }
  process.exit(1);
}
console.log('docs-lint: ok');
