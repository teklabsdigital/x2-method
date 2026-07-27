import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { EDITION_ROOT } from '../platform/settings.ts';
import type { Violation } from './endpointSpine.ts';

// DATA-1's dependency direction, over every module in the server.
//
// The five obligations that row carries were, until this scan, statements about the four handlers and one store
// that happen to exist, checked by reading them. That is exactly the state the sibling was in before
// `DependencyDirectionTests`, and its E-40 and E-41 are what enumeration found there once somebody wrote one.
//
// **The layering here is not a stack, and encoding it as one would have been wrong.** The obvious reading of
// "dependencies flow downward only" is a tower with the endpoints on top and the database at the bottom, and this
// tree is not that shape: `persistence/` imports `app/`, because `app/` owns the store INTERFACE and
// `persistence/` implements it. Under a tower that edge is upward and forbidden. Under ports and adapters, which
// is what the tree actually is, `app/` is the centre and both `routes/` and `persistence/` are adapters pointing
// inward at it. The graph was read before the rules were written, for that reason: a rule set derived from what
// the claim's words suggest rather than from what the design is would have failed the tree on its correct edges
// and passed it on nothing.
//
// So the rule is stated as an allowlist per layer rather than as an ordering. What it forbids is what DATA-1's
// harm paragraph is about: an endpoint reaching past its service into a store, the domain depending on the
// adapter that serves it, and any lower layer reaching back up.

type Layer = string;

// A module's layer is its first path segment under `server/src`, and a file at the root is its own layer. Naming
// the three root files individually is deliberate: `compose.ts` is the composition root and is allowed to see
// everything, which is the one place the claim's "cross-boundary collaborators are interfaces registered at the
// composition root" is discharged, and a rule that lumped it in with its neighbours would hand that permission to
// `main.ts` and `app.ts` as well.
const ALLOWED: Readonly<Record<Layer, readonly Layer[]>> = Object.freeze({
  // The domain. It owns the ports and the records, and it may lean on the cross-cutting seams. It may not know
  // that `persistence/` exists, which is the edge that makes the store interface worth having: a domain that
  // imports its own adapter has an interface in name only.
  app: Object.freeze(['app', 'platform']),
  // The HTTP adapter. DATA-1's sentence "an endpoint never touches a store or the database context: it calls one
  // service method" is this line: `persistence` is absent, so a handler cannot reach a store even if it wants to.
  routes: Object.freeze(['app', 'platform']),
  // The persistence adapter. It points inward at the interface it implements and never back out at the transport.
  persistence: Object.freeze(['app', 'persistence', 'platform']),
  // The cross-cutting seams: settings, the clock, the credential. Nothing above them, or the thing every layer
  // depends on would in turn depend on all of them.
  platform: Object.freeze(['platform']),
  // The scans. They read the tree rather than participating in it, and they need the settings seam for the
  // edition root. They are not permitted to import the layers they scan, so a scan cannot come to depend on the
  // shape it is checking.
  architecture: Object.freeze(['architecture', 'platform']),
  'app.ts': Object.freeze(['platform']),
  'compose.ts': Object.freeze(['app', 'app.ts', 'architecture', 'persistence', 'platform', 'routes']),
  'main.ts': Object.freeze(['compose.ts']),
});

export function scanImportGraph(root: string = path.join(EDITION_ROOT, 'server', 'src')): readonly Violation[] {
  const violations: Violation[] = [];
  const edges = importEdges(root);

  if (edges.length === 0) {
    violations.push({
      claim: 'DATA-1',
      at: root,
      message:
        'found no imports at all, so every rule below passed by reaching nothing. A dependency-direction scan over an empty enumeration is the shape E-11 recorded: it agrees with itself and says nothing about the tree.',
    });
  }

  const seen = new Set<Layer>();
  for (const edge of edges) {
    seen.add(edge.from);
    const allowed = ALLOWED[edge.from];
    if (allowed === undefined) {
      violations.push({
        claim: 'DATA-1',
        at: edge.at,
        message: `is in '${edge.from}', which no rule describes. A layer nobody wrote a rule for is a layer with no direction at all, and adding a directory is exactly when the question gets asked; declare what it may import.`,
      });
      continue;
    }
    if (!allowed.includes(edge.to)) {
      violations.push({
        claim: 'DATA-1',
        at: edge.at,
        message: `imports '${edge.specifier}', which is in '${edge.to}'. '${edge.from}' may import ${allowed.map((layer) => `'${layer}'`).join(', ')} and nothing else. ${why(edge.from, edge.to)}`,
      });
    }
  }

  // A rule for a layer that no longer exists is the staleness half, in the discipline the anonymous allowlist and
  // the configuration exemptions already use. It matters more here than usual: a renamed directory would leave
  // its old rule permitting things and its new name unruled, and the unruled half is caught above only because
  // this half reports the orphan.
  for (const layer of Object.keys(ALLOWED)) {
    if (!seen.has(layer) && edges.length > 0) {
      violations.push({
        claim: 'DATA-1',
        at: layer,
        message: `has a rule and no module that imports anything. Either the layer is gone and the rule outlived it, or it was renamed and its modules are now being checked under a different rule than the one written for them.`,
      });
    }
  }

  return Object.freeze(violations);
}

export function assertImportGraph(): void {
  const violations = scanImportGraph();
  if (violations.length > 0) {
    throw new Error(
      `the import graph violates DATA-1 in ${violations.length} place(s):\n` +
        violations.map((violation) => `  ${violation.at}: ${violation.message}`).join('\n'),
    );
  }
}

// The graph, exposed, because a green scan cannot say which edges it read. A rule set that permits more than the
// tree uses is not wrong, but it is also not proven by silence, and this is what a test names its expectations
// against (E-92).
export type ImportEdge = Readonly<{ at: string; from: Layer; to: Layer; specifier: string; typeOnly: boolean }>;

export function importEdges(root: string = path.join(EDITION_ROOT, 'server', 'src')): readonly ImportEdge[] {
  const edges: ImportEdge[] = [];

  for (const file of walk(root)) {
    const from = layerOf(root, file);
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);

    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
        continue;
      }
      const specifier = statement.moduleSpecifier.text;
      // Package and builtin imports are somebody else's rule. The framework ban and the filesystem ban are lints
      // over exactly those, and duplicating them here would put two mechanisms on one property and none on this.
      if (!specifier.startsWith('.')) {
        continue;
      }
      edges.push(
        Object.freeze({
          at: path.relative(root, file).split(path.sep).join('/'),
          from,
          to: layerOf(root, path.resolve(path.dirname(file), specifier)),
          specifier,
          // Counted, not exempted. A type-only import erases at runtime, so it cannot create a cycle the engine
          // would notice, and DATA-1 is not a claim about runtime: a layer that needs another layer's types to
          // compile cannot be changed without it, which is what a dependency IS.
          typeOnly: statement.importClause?.isTypeOnly === true,
        }),
      );
    }
  }

  return Object.freeze(edges);
}

function why(from: Layer, to: Layer): string {
  if (to === 'persistence') {
    return 'DATA-1: an endpoint never touches a store, and the domain never names the adapter that implements its port. The composition root is the one module that may know both, which is what makes the interface load-bearing rather than decorative.';
  }
  if (from === 'persistence' || from === 'platform') {
    return 'DATA-1: no lower layer calls upward. A seam that knows its callers is a seam that cannot be reused by a second one, and the cycle it creates is invisible until something has to be extracted.';
  }
  return 'DATA-1: dependencies flow in one direction, and the direction is a design decision rather than a habit.';
}

function layerOf(root: string, file: string): Layer {
  const relative = path.relative(root, file).split(path.sep);
  if (relative.length === 1) {
    // A root file is its own layer, so `compose.ts` can be granted what its neighbours are not.
    return relative[0]?.replace(/\.tsx?$/, '.ts') ?? '';
  }
  return relative[0] ?? '';
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
    const full = path.join(root, entry);
    // Tests are excluded, and it is a real exclusion rather than an oversight. A test imports the thing it tests
    // and the fixtures it needs, across every layer, by design; holding test files to the production graph would
    // make the rule unusable and the pressure would be to delete it rather than to weaken it.
    if (entry === 'node_modules' || entry === 'dist' || entry === '__tests__') {
      continue;
    }
    if (statSync(full).isDirectory()) {
      found.push(...walk(full));
    } else if (path.extname(entry) === '.ts') {
      found.push(full);
    }
  }
  return found;
}
