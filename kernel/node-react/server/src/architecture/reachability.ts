import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { EDITION_ROOT } from '../platform/settings.ts';
import type { Violation } from './endpointSpine.ts';

// TEST-3's second half: **resolution is not invocation.**
//
// `docs-lint.mjs` already refuses a conformance row whose mechanism names a file that does not exist (E-105).
// What that cannot say is that anything RUNS the file. A module that exists, is named in a row, and that nothing
// imports is exactly the state E-80 recorded of the e2e harness: built, wired, shipped, and never executed. E-95
// and E-103 are the same shape one register out, and all three were found by a person running a command they had
// not run in a while.
//
// So this scan asks the question the other three needed asked: **from the roots the scripts actually execute, is
// every module in this tier reachable?** A file nothing can reach is a file no gate protects, whatever the record
// says about it.
//
// **The roots are derived, not listed**, which is the whole reason this is a mechanism rather than a second
// register to keep in step. They come from `package.json`'s own scripts, because those are what CI runs, plus
// every test file, because that is what `vitest run` collects. A script added to `package.json` adds its root
// here without this file changing; a script deleted removes one, and whatever only it reached is then reported.
//
// **Scope, stated rather than left to be discovered.** This tier only: `server/src` and `server/tools`. The
// client tiers have their own package, their own runner and their own roots, and the same instrument would need
// pointing at them; the record's mechanism field names files in both. The sibling needs a different instrument
// entirely, because its modules are C# and its roots are test assemblies rather than import graphs.

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);
const SKIP_DIRECTORIES = new Set(['node_modules', 'dist', 'coverage', '.data']);

export type Root = Readonly<{ at: string; why: string }>;

// What `package.json` says this tier executes, plus what the test runner collects. Both are read rather than
// transcribed: the first from the scripts block, the second from the tree.
export function executedRoots(tier: string = path.join(EDITION_ROOT, 'server')): readonly Root[] {
  const roots: Root[] = [];
  const seen = new Set<string>();

  const add = (at: string, why: string): void => {
    const relative = path.relative(tier, at).split(path.sep).join('/');
    if (seen.has(relative)) {
      return;
    }
    seen.add(relative);
    roots.push(Object.freeze({ at: relative, why }));
  };

  const manifest = path.join(tier, 'package.json');
  if (existsSync(manifest)) {
    const scripts = (JSON.parse(readFileSync(manifest, 'utf8')) as { scripts?: Record<string, string> }).scripts ?? {};
    for (const [name, command] of Object.entries(scripts)) {
      for (const token of command.split(/\s+/)) {
        // A bare path with a source extension, which is how this tier's scripts name an entrypoint: `node
        // src/main.ts`. A flag or a package name is not a file and resolves to nothing.
        if (token.startsWith('-') || !SOURCE_EXTENSIONS.has(path.extname(token))) {
          continue;
        }
        const resolved = path.join(tier, token);
        if (existsSync(resolved)) {
          add(resolved, `package.json script '${name}' runs it`);
        }
      }
    }
  }

  for (const file of walk(tier)) {
    if (/\.(test|spec)\.tsx?$/.test(file)) {
      add(file, 'vitest collects it');
    }
  }

  return Object.freeze(roots);
}

export function scanReachability(tier: string = path.join(EDITION_ROOT, 'server')): readonly Violation[] {
  const violations: Violation[] = [];
  const roots = executedRoots(tier);
  const modules = walk(tier).filter((file) => SOURCE_EXTENSIONS.has(path.extname(file)));

  // E-11 and E-92, and this scan is more exposed to it than most: it reports what it did NOT find, so a walk that
  // reached nothing reports nothing and reads as total coverage. Both halves are refused explicitly.
  if (modules.length === 0) {
    violations.push({
      claim: 'TEST-3',
      at: path.relative(EDITION_ROOT, tier),
      message:
        'found no modules at all, so every module in it was trivially reachable. A reachability scan over an empty tree agrees with itself and says nothing (E-11).',
    });
    return Object.freeze(violations);
  }
  if (roots.length === 0) {
    violations.push({
      claim: 'TEST-3',
      at: path.relative(EDITION_ROOT, tier),
      message:
        'has no executed roots, so nothing here is reachable and the scan would report every module at once. Either package.json declares no script that runs a file and the tier collects no tests, or the derivation stopped matching how this tier is run.',
    });
    return Object.freeze(violations);
  }

  const reached = reach(tier, roots);
  for (const file of modules) {
    const relative = path.relative(tier, file).split(path.sep).join('/');
    if (reached.has(relative)) {
      continue;
    }
    violations.push({
      claim: 'TEST-3',
      at: relative,
      message: `is not reachable from anything this tier executes (${roots.length} root(s), from package.json's scripts and the test files). A module that exists and that no executed root imports is protected by no gate, whatever a conformance row says about it: that is E-80's state exactly, where a harness was built, wired, named, and never started. Either something should run it, or it should not be here.`,
    });
  }

  return Object.freeze(violations);
}

export function assertReachability(): void {
  const violations = scanReachability();
  if (violations.length > 0) {
    throw new Error(
      `TEST-3: ${violations.length} module(s) are shipped and unreachable:\n` +
        violations.map((violation) => `  ${violation.at}: ${violation.message}`).join('\n'),
    );
  }
}

// Exposed so a test can name what it expects to be reached, rather than trusting a green scan to have walked
// anything (E-92). The set is tier-relative paths.
export function reach(tier: string, roots: readonly Root[]): ReadonlySet<string> {
  const reached = new Set<string>();
  const queue = roots.map((root) => path.join(tier, root.at));

  while (queue.length > 0) {
    const file = queue.pop();
    if (file === undefined) {
      continue;
    }
    const relative = path.relative(tier, file).split(path.sep).join('/');
    if (reached.has(relative)) {
      continue;
    }
    reached.add(relative);

    for (const specifier of relativeImports(file)) {
      const target = resolve(path.resolve(path.dirname(file), specifier));
      if (target !== undefined) {
        queue.push(target);
      }
    }
  }

  return reached;
}

// Relative specifiers only. A package import is somebody else's tree and a builtin has no file; both are covered
// by the framework and filesystem bans rather than here.
function relativeImports(file: string): readonly string[] {
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return [];
  }
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
  const found: string[] = [];

  const visit = (node: ts.Node): void => {
    // Static imports and re-exports, plus `import(...)` calls, because a module reached only dynamically is still
    // reached and treating it as dead would report a false gap.
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier !== undefined) {
      if (ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith('.')) {
        found.push(node.moduleSpecifier.text);
      }
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const argument = node.arguments[0];
      if (argument !== undefined && ts.isStringLiteral(argument) && argument.text.startsWith('.')) {
        found.push(argument.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  return found;
}

// This tier writes extensions on its specifiers, because the runtime requires them; the extensionless and
// directory forms are resolved anyway so a specifier style change does not silently drop edges and report the
// modules behind them as dead.
function resolve(base: string): string | undefined {
  if (existsSync(base) && statSync(base).isFile()) {
    return base;
  }
  for (const extension of SOURCE_EXTENSIONS) {
    if (existsSync(base + extension)) {
      return base + extension;
    }
    const index = path.join(base, `index${extension}`);
    if (existsSync(index)) {
      return index;
    }
  }
  return undefined;
}

function walk(root: string): readonly string[] {
  let entries: string[];
  try {
    entries = readdirSync(root);
  } catch {
    return [];
  }
  const found: string[] = [];
  for (const entry of entries) {
    if (SKIP_DIRECTORIES.has(entry) || entry.startsWith('.')) {
      continue;
    }
    const full = path.join(root, entry);
    if (statSync(full).isDirectory()) {
      found.push(...walk(full));
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry))) {
      found.push(full);
    }
  }
  return found;
}
