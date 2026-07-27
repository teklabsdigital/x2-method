import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// TEST-3, asked of this repository rather than of a seeded project: **does anything actually RUN the mechanisms
// the editions ship?**
//
// This tool exists because the same defect has now been found three times, by hand, each time by someone running
// a command they had not run in a while:
//
//   E-39  no continuous process ran the .NET architecture suite. Two guards had been narrowed to reach nothing
//         and no loop would have reported either edit. Repaired by adding the server tiers to kernel.yml.
//   E-95  `tools/secret-scan.mjs` had been FAILING for eight commits. Each edition's `ci.yml` runs it and each
//         `ci.yml` is a template that only executes after a project is seeded, so nothing here had ever run it.
//         Repaired by adding a secret-scan job to kernel.yml, with the general obligation written down: when a
//         mechanism is added to an edition, the pass owes an answer to whether anything in THIS repository runs
//         it, and kernel.yml is the register of that answer.
//   E-103 `tools/gate-check.mjs` was in exactly the same position, one job along from where E-95 was found, and
//         E-95's repair did not look for it.
//
// Three instances is not a run of bad luck, it is a missing mechanism. The obligation E-95 wrote down is the
// right obligation and it was addressed to a person, and a person is what E-39 already established does not
// scale: "a mechanism that runs only when a developer remembers is aspirational, not enforced" is TEST-3's own
// sentence, and it applies to the obligation as much as to the mechanism it is about.
//
// **Two registers, because there are two questions.** An edition's own `ci.yml` gates a SEEDED project, so an
// executable missing from it ships a hole to every project instantiated from that edition. `kernel.yml` gates
// THIS repository, so an executable missing from it is a guard nobody here is protected by. Both are asked, and
// they fail differently on purpose: the same file can be correctly present in one and missing from the other,
// which is precisely the state all three findings were in.
//
// Usage: node kernel/tools/loop-check.mjs [--self-test]

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Explicit, the same decision `compose.mjs` makes and for the same reason: the set of editions is a reviewable
// fact, and a new edition joining the gates should be a visible diff rather than something a directory listing
// decided.
const EDITIONS = ['dotnet-react', 'node-react'];

// The directories whose contents are executables the loop owes a run. `tools/` holds the checks an edition
// ships; `scripts/` holds its runners. Both are enumerated from the filesystem rather than listed, because a
// list of files beside the files is the registry that goes stale, which is E-92 and E-95's shared shape.
const EXECUTABLE_DIRECTORIES = ['tools', 'scripts'];
const EXECUTABLE_EXTENSIONS = ['.mjs', '.ts', '.sh', '.js'];

// Not every shipped file is a thing a loop can run, and the exceptions are named with their reasons rather than
// filtered by a pattern, so that a new one costs an argument.
const NOT_A_RUNNABLE_CHECK = Object.freeze([
  Object.freeze({
    file: 'tools/conformance.mjs',
    why: 'a library rather than a command in this repository: `docs-lint.mjs` imports `checkAgainstCatalog`, `checkTable` and `load` from it, so every workflow that runs docs-lint runs this. It is also a CLI (`--write` regenerates the README table), and that half is a developer action rather than a gate.',
  }),
  Object.freeze({
    file: 'scripts/dev-setup.sh',
    why: 'a developer command. It writes a local secret store and a local .env; a CI runner has neither and would not want them. Nothing about it is a claim guard, so a loop that never runs it is not a loop with a hole in it.',
  }),
  Object.freeze({
    file: 'scripts/db-up.sh',
    why: 'a developer command that starts a local engine container. CI brings its engine as a service container instead, which is the same requirement met a different way rather than the same script skipped.',
  }),
  Object.freeze({
    file: 'scripts/db-down.sh',
    why: 'the teardown half of db-up.sh, and a runner that is discarded after the job has nothing to tear down.',
  }),
  Object.freeze({
    file: 'scripts/db-migrate.sh',
    why: 'a developer command wrapping `dotnet ef database update`. The e2e-wire job applies the schema with the same tool against its service container, so the STEP is in the loop even though this wrapper is not.',
  }),
  Object.freeze({
    file: 'scripts/e2e.sh',
    why: 'a developer command, and the one exception here that is a finding rather than a category. The sibling`s `e2e-wire` job does not run this script: it re-implements the whole orchestration inline, so the edition carries two procedures for one job and nothing keeps them equal. E-104 records that with its trigger. The exception is written this way deliberately, because a permanently red gate gets disabled rather than fixed (E-84), and the honest home for an unresolved defect is the register and the conformance row, not a check nobody can make pass.',
  }),
]);

export function loopFindings(shipped, invocations, exceptionsAreLive = false) {
  const findings = [];

  if (shipped.length === 0) {
    findings.push(
      'No executable was found in any edition, so this check passed by enumerating nothing. A loop check that approves of an empty set is the failure mode it exists to prevent (TEST-3).',
    );
    return findings;
  }

  // A stale exception is a pre-authorized hole. This one matters more than most: every entry below silences a
  // real question, so an entry whose file is gone silences a question about nothing while reading as an argument
  // somebody made.
  for (const exception of NOT_A_RUNNABLE_CHECK) {
    if (!shipped.some((item) => item.excepted === exception.file) && exceptionsAreLive) {
      findings.push(
        `${exception.file} is excused from needing a run and no edition ships it. An exemption nobody needs is one nobody reviews; delete it (TEST-3).`,
      );
    }
  }

  for (const item of shipped.filter((candidate) => candidate.excepted === undefined)) {
    // Both registers unless the item says otherwise, which is the edition case and the common one.
    for (const register of item.registers ?? ['ci.yml', 'kernel.yml']) {
      const runs = invocations.filter(
        (call) => call.register === register && call.edition === item.edition && call.invokes(item.path),
      );
      if (runs.length === 0) {
        findings.push(
          `${item.edition ?? 'this repository'} ships ${item.path} and ${register} never runs it. ${register === 'ci.yml' ? 'A seeded project inherits this edition and would be unprotected by a check the edition tells it it has' : 'Nothing in THIS repository executes it, so it can rot or fail silently the way secret-scan did for eight commits (E-95)'} (TEST-3).`,
        );
      }
    }
  }

  return findings;
}

// The workflow, read as STEPS, because two weaker readings both fail on this repository's own files.
//
// "Does this filename appear in the text" passes when a sibling edition runs a same-named file, and both editions
// ship `tools/docs-lint.mjs`. Reading line by line and remembering the last `working-directory` fails because in
// YAML that key may come either side of `run:` within one step, and node's e2e job writes it after. Both mistakes
// were made here first and are the reason this is a step parser: a step is the unit that has one command and one
// directory, so it is the unit to read.
//
// Block scalars are read whole. The sibling's `e2e-wire` job carries its entire orchestration inside a `run: |`,
// so a parser that took only the first line would see `dotnet run ... &` and none of the six commands under it.
export function invocationsIn(register, text, editions) {
  const lines = text.split('\n');
  const calls = [];

  let inJobs = false;
  let matrix = null;
  let defaultDirectory = null;
  let step = null;

  const flushStep = () => {
    if (step === null) {
      return;
    }
    const command = commandOf(step);
    if (command !== null) {
      const where = directoryOf(step) ?? defaultDirectory ?? '.';
      for (const edition of matrix ?? editions) {
        calls.push(call(register, edition, where, command));
      }
      if (register === 'kernel.yml') {
        calls.push(call(register, null, where, command));
      }
    }
    step = null;
  };

  for (const line of lines) {
    if (/^jobs:\s*$/.test(line)) {
      inJobs = true;
      continue;
    }
    if (!inJobs) {
      continue;
    }
    if (/^\S/.test(line)) {
      break; // a new top-level key ends the jobs block
    }

    if (/^ {2}[A-Za-z0-9_-]+:\s*$/.test(line)) {
      flushStep();
      matrix = null;
      defaultDirectory = null;
      continue;
    }

    // A step begins at `      - `; anything more indented belongs to the step already open.
    if (/^ {6}- /.test(line)) {
      flushStep();
      step = [line];
      continue;
    }
    if (step !== null && (line.trim() === '' || /^ {8}/.test(line))) {
      step.push(line);
      continue;
    }
    flushStep();

    const matrixList = /^\s*edition:\s*\[([^\]]*)\]/.exec(line);
    if (matrixList) {
      matrix = (matrixList[1] ?? '').split(',').map((name) => name.trim()).filter(Boolean);
      continue;
    }
    // The job default, which lives under `defaults: run:` and therefore outside any step.
    const directory = /^\s*working-directory:\s*(\S+)\s*$/.exec(line);
    if (directory) {
      defaultDirectory = directory[1] ?? null;
    }
  }
  flushStep();

  return calls;
}

// A step's command, block scalars included. Everything indented past the `run:` key is part of it.
function commandOf(step) {
  for (let index = 0; index < step.length; index += 1) {
    const run = /^(\s*)(?:- )?run:\s*(.*)$/.exec(step[index] ?? '');
    if (run === null) {
      continue;
    }
    const value = (run[2] ?? '').trim();
    if (!/^[|>][+-]?$/.test(value)) {
      return value;
    }
    const keyIndent = (run[1] ?? '').length + (step[index]?.includes('- run:') ? 2 : 0);
    const body = [];
    for (let after = index + 1; after < step.length; after += 1) {
      const next = step[after] ?? '';
      if (next.trim() === '') {
        continue;
      }
      if (next.search(/\S/) <= keyIndent) {
        break;
      }
      body.push(next.trim());
    }
    return body.join('\n');
  }
  return null;
}

function directoryOf(step) {
  for (const line of step) {
    const directory = /^\s*(?:- )?working-directory:\s*(\S+)\s*$/.exec(line);
    if (directory) {
      return directory[1] ?? null;
    }
  }
  return null;
}

// One invocation, with the question it can answer. `invokes` asks whether this command would execute the file at
// an edition-relative path, which is the form the shipped set is enumerated in.
function call(register, edition, where, command) {
  const directory = where.replace('${{ matrix.edition }}', edition);
  const resolved = command.replace('${{ matrix.edition }}', edition);
  return {
    register,
    edition,
    invokes: (editionRelativePath) => {
      // Inside the edition (or inside a package under it), the command names the path relative to that
      // directory; from the repository root it names the whole path. Both spellings are accepted, and neither is
      // a substring match on the bare filename, which would let `tools/docs-lint.mjs` in one edition satisfy the
      // other.
      if (edition === null) {
        return resolved.includes(editionRelativePath);
      }
      const fromRepoRoot = `kernel/${edition}/${editionRelativePath}`;
      const insideEdition = directory === `kernel/${edition}` || directory === '.';
      return (
        resolved.includes(fromRepoRoot) || (insideEdition && new RegExp(`(^|\\s)\\S*${escape(editionRelativePath)}`).test(resolved))
      );
    },
  };
}

const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function shippedExecutables(root, editions) {
  const shipped = [];
  for (const edition of editions) {
    for (const directory of EXECUTABLE_DIRECTORIES) {
      const full = join(root, 'kernel', edition, directory);
      let entries;
      try {
        entries = readdirSync(full);
      } catch {
        continue;
      }
      for (const entry of entries) {
        if (!EXECUTABLE_EXTENSIONS.some((extension) => entry.endsWith(extension))) {
          continue;
        }
        if (!statSync(join(full, entry)).isFile()) {
          continue;
        }
        const path = `${directory}/${entry}`;
        const excepted = NOT_A_RUNNABLE_CHECK.find((exception) => exception.file === path)?.file;
        shipped.push({ edition, path, excepted, registers: ['ci.yml', 'kernel.yml'] });
      }
    }
  }
  // The repository's own tools, which are asked one question rather than two: there is no seeded project that
  // inherits them, so `ci.yml` has nothing to say about them, but `kernel.yml` still owes them a run.
  //
  // This is also what puts this file inside its own subject. A check for mechanisms nothing runs, which nothing
  // ran, would be the joke version of E-95, and the enumeration is cheaper than the irony.
  for (const entry of readdirSync(join(root, 'kernel', 'tools'))) {
    if (EXECUTABLE_EXTENSIONS.some((extension) => entry.endsWith(extension))) {
      shipped.push({ edition: null, path: `kernel/tools/${entry}`, excepted: undefined, registers: ['kernel.yml'] });
    }
  }

  return shipped;
}

// The controls. E-11's ordering: a check over a healthy tree reports ok whether its predicates reach everything
// or nothing, so what it CATCHES is asserted before it is trusted, and each control is a state this repository
// has actually been in.
const CONTROLS = [
  ['an executable no workflow runs at all, which is E-95 and E-103 exactly', () =>
    loopFindings([{ edition: 'ed', path: 'tools/secret-scan.mjs' }], [])],
  ['an executable the edition template runs and the repository does not, which is how both survived', () =>
    loopFindings(
      [{ edition: 'ed', path: 'tools/gate-check.mjs' }],
      [call('ci.yml', 'ed', 'kernel/ed', 'node tools/gate-check.mjs --self-test')],
    )],
  ['an executable the repository runs and the edition template does not, so a seeded project inherits the hole', () =>
    loopFindings(
      [{ edition: 'ed', path: 'scripts/e2e.ts' }],
      [call('kernel.yml', 'ed', '.', 'node kernel/ed/scripts/e2e.ts')],
    )],
  ['a matrix job that covers one edition and not the other', () =>
    loopFindings(
      [
        { edition: 'a', path: 'tools/x.mjs' },
        { edition: 'b', path: 'tools/x.mjs' },
      ],
      [
        call('ci.yml', 'a', 'kernel/a', 'node tools/x.mjs'),
        call('ci.yml', 'b', 'kernel/b', 'node tools/x.mjs'),
        call('kernel.yml', 'a', 'kernel/a', 'node tools/x.mjs'),
      ],
    )],
  ['an empty shipped set, which would otherwise pass by enumerating nothing', () => loopFindings([], [])],
  ['a repository tool kernel.yml never runs, which is this file if nobody wires it', () =>
    loopFindings([{ edition: null, path: 'kernel/tools/loop-check.mjs', registers: ['kernel.yml'] }], [])],
  ['an exception for a file no edition ships', () =>
    loopFindings([{ edition: 'ed', path: 'tools/docs-lint.mjs' }], [
      call('ci.yml', 'ed', 'kernel/ed', 'node tools/docs-lint.mjs'),
      call('kernel.yml', 'ed', 'kernel/ed', 'node tools/docs-lint.mjs'),
    ], true)],
];

const IGNORED = [
  ['an executable both registers run', () =>
    loopFindings(
      [{ edition: 'ed', path: 'tools/docs-lint.mjs' }],
      [
        call('ci.yml', 'ed', 'kernel/ed', 'node tools/docs-lint.mjs'),
        call('kernel.yml', 'ed', 'kernel/ed', 'node tools/docs-lint.mjs'),
      ],
    )],
  ['a run from the repository root naming the whole path', () =>
    loopFindings(
      [{ edition: 'ed', path: 'scripts/e2e.ts' }],
      [
        call('ci.yml', 'ed', '.', 'node scripts/e2e.ts'),
        call('kernel.yml', 'ed', '.', 'node kernel/ed/scripts/e2e.ts'),
      ],
    )],
  // The check that one edition cannot satisfy another edition's obligation. A bare filename match would pass
  // this, and it is the mistake a text scan over the workflow makes first.
  ['a sibling edition running the same-named file, which must NOT count', () =>
    loopFindings(
      [{ edition: 'a', path: 'tools/x.mjs' }],
      [
        call('ci.yml', 'a', 'kernel/a', 'node tools/x.mjs'),
        call('kernel.yml', 'a', 'kernel/a', 'node tools/x.mjs'),
        call('kernel.yml', 'b', 'kernel/b', 'node tools/x.mjs'),
      ],
    )],
];

function selfTest() {
  const failures = [];
  for (const [name, run] of CONTROLS) {
    if (run().length === 0) {
      failures.push(`control not caught: ${name}`);
    }
  }
  for (const [name, run] of IGNORED) {
    const findings = run();
    if (findings.length > 0) {
      failures.push(`false positive on ${name}: ${findings.join('; ')}`);
    }
  }
  if (failures.length > 0) {
    process.stderr.write(`${failures.map((failure) => `  ${failure}`).join('\n')}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`loop-check --self-test ok: ${CONTROLS.length} caught, ${IGNORED.length} ignored.\n`);
}

function check() {
  const shipped = shippedExecutables(repoRoot, EDITIONS);
  const invocations = [
    ...invocationsIn('kernel.yml', readFileSync(join(repoRoot, '.github', 'workflows', 'kernel.yml'), 'utf8'), EDITIONS),
    ...EDITIONS.flatMap((edition) =>
      invocationsIn(
        'ci.yml',
        readFileSync(join(repoRoot, 'kernel', edition, '.github', 'workflows', 'ci.yml'), 'utf8'),
        [edition],
      ),
    ),
  ];

  const findings = loopFindings(shipped, invocations, true);
  if (findings.length > 0) {
    process.stderr.write(`${findings.map((finding) => `  ${finding}`).join('\n')}\n`);
    process.exitCode = 1;
    return;
  }
  const checked = shipped.filter((item) => item.excepted === undefined);
  process.stdout.write(
    `loop-check: ok (${checked.length} of ${shipped.length} shipped executable(s) across ${EDITIONS.length} edition(s) run by both registers; ${shipped.length - checked.length} excused with a written reason)\n`,
  );
}

if (process.argv.includes('--self-test')) {
  selfTest();
} else {
  check();
}

export { relative };
