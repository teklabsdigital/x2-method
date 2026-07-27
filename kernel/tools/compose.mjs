import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Composes the shared tier (kernel/shared/) into each edition tree.
//
// Why editions carry composed copies rather than referencing kernel/shared/ in place: an edition must be a
// self-contained file set that x2:seed copies into a new repo, and every relative path inside it (the CON-2
// fixture link in the arch-test csproj, the UI-1 token test reaching design/prototype/_ds/, scripts/e2e.sh,
// the CI workflow) has to resolve in BOTH the kernel layout and the instantiated layout. Composing means the
// committed edition tree IS the instantiated shape, so the loop tests exactly what seeding produces. The cost
// is physical duplication; `--check` removes the risk that duplication carries, because a hand-edited copy
// fails the build instead of drifting quietly.
//
//   node kernel/tools/compose.mjs           write the shared tier into every edition
//   node kernel/tools/compose.mjs --check   fail if any edition's copy differs from kernel/shared/
//
// Edit kernel/shared/ and re-run; never edit an edition's composed copy.

const kernelRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sharedRoot = join(kernelRoot, 'shared');

// Explicit, not discovered: the set of editions is a reviewable fact, and a new edition joining the shared
// tier should be a visible one-line diff here.
const EDITIONS = ['dotnet-react', 'node-react'];

// What the shared tier contributes to every edition, as source-relative paths under kernel/shared/. A
// directory entry composes wholesale.
const MANIFEST = [
  'client-web',
  'design',
  'docs/claims/_template.md',
  'docs/contracts/_template.md',
  'docs/decisions/_template.md',
  'docs/runbooks/_template.md',
  'docs/work/_template.md',
  'tools/conformance.mjs',
  'tools/docs-lint.mjs',
  'tools/gate-check.mjs',
  'tools/secret-scan.mjs',
  // The UserPromptSubmit hook that injects the MET-05 ledger reminder on every human turn. Shared rather than
  // per-edition, and moved here 2026-07-28: the sibling shipped it, this edition shipped nothing, and
  // `skills/seed` step 4 tells the builder to "verify the hook file survived instantiation" in both. A seed from
  // the edition that lacked it kept only the CLAUDE.md rule, which PC-10 measured decaying under long sessions.
  // The file names no edition and never did, so two copies were two chances to drift; one composed copy is one.
  '.claude/settings.json',
];

// Never composed: build output and installed dependencies are not shared-tier content.
const SKIP_DIRS = new Set(['node_modules', 'dist', 'bin', 'obj', '.vite']);

function filesUnder(root, rel = '') {
  const full = join(root, rel);
  if (!existsSync(full)) {
    return [];
  }
  if (!statSync(full).isDirectory()) {
    return [rel];
  }
  return readdirSync(full).flatMap((entry) =>
    SKIP_DIRS.has(entry) ? [] : filesUnder(root, rel === '' ? entry : `${rel}/${entry}`),
  );
}

const sharedFiles = MANIFEST.flatMap((entry) => filesUnder(sharedRoot, entry)).sort();
if (sharedFiles.length === 0) {
  console.error('compose: kernel/shared/ contributed no files; the manifest or the tree is wrong.');
  process.exit(1);
}

const check = process.argv.includes('--check');
const problems = [];
let written = 0;

for (const edition of EDITIONS) {
  const editionRoot = join(kernelRoot, edition);
  if (!existsSync(editionRoot)) {
    problems.push(`edition '${edition}' is listed in compose.mjs but kernel/${edition}/ does not exist.`);
    continue;
  }

  for (const rel of sharedFiles) {
    const source = join(sharedRoot, rel);
    const target = join(editionRoot, rel);
    if (check) {
      if (!existsSync(target)) {
        problems.push(`${edition}/${rel}: missing; run 'node kernel/tools/compose.mjs'.`);
        continue;
      }
      if (!readFileSync(source).equals(readFileSync(target))) {
        problems.push(`${edition}/${rel}: differs from kernel/shared/${rel}; edit the shared copy and re-compose.`);
      }
      continue;
    }
    mkdirSync(dirname(target), { recursive: true });
    cpSync(source, target);
    written += 1;
  }

  // A file the shared tier no longer ships must not survive in an edition: a stale composed copy is exactly
  // the drift this tool exists to prevent, and it is invisible to a per-file comparison.
  const roots = [...new Set(MANIFEST.map((entry) => entry.split('/')[0]))];
  for (const root of roots) {
    for (const rel of filesUnder(editionRoot, root)) {
      if (sharedFiles.includes(rel) || !MANIFEST.some((m) => rel === m || rel.startsWith(`${m}/`))) {
        continue;
      }
      if (check) {
        problems.push(`${edition}/${rel}: not in the shared tier; delete it or add it to kernel/shared/.`);
      } else {
        rmSync(join(editionRoot, rel));
      }
    }
  }
}

if (problems.length > 0) {
  for (const problem of problems) {
    console.error(`compose: ${problem}`);
  }
  process.exit(1);
}
console.log(
  check
    ? `compose: ok (${sharedFiles.length} shared files match in ${EDITIONS.length} edition(s))`
    : `compose: wrote ${written} file(s) into ${EDITIONS.length} edition(s)`,
);
