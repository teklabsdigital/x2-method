import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { importEdges, scanImportGraph } from '../importGraph.ts';

// DATA-1's dependency direction, with a red proof for every prohibition.
//
// The green scan over this tree is worth almost nothing on its own and is written last for that reason: the tree
// has no violation in it, so a scan that read fifty edges and a scan that read none return the same empty array.
// Each forbidden edge below is built in a scratch tree that uses the real layer names, because the rule table is
// keyed by those names and a fixture that invented its own would be testing a rule nothing enforces.

const scratch = (files: Readonly<Record<string, string>>): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'import-graph-'));
  for (const [relative, contents] of Object.entries(files)) {
    const full = path.join(root, relative);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, contents, 'utf8');
  }
  return root;
};

const messages = (violations: readonly { at: string; message: string }[]): string =>
  violations.map((violation) => `${violation.at}: ${violation.message}`).join('\n');

// Every layer that has a rule needs at least one outbound import in a fixture, or the staleness check reports it
// and swamps the assertion under test. This is the minimum tree that satisfies every rule.
const INHABITED: Readonly<Record<string, string>> = Object.freeze({
  'app/service.ts': "import type { Port } from './port.ts';\n",
  'app/port.ts': "import type { Settings } from '../platform/settings.ts';\n",
  'routes/notes.ts': "import { service } from '../app/service.ts';\n",
  'persistence/store.ts': "import type { Port } from '../app/port.ts';\n",
  'platform/settings.ts': "import { registry } from './registries.ts';\n",
  'platform/registries.ts': "import type { X } from './settings.ts';\n",
  'architecture/scan.ts': "import { EDITION_ROOT } from '../platform/settings.ts';\n",
  'app.ts': "import { resolveSettings } from './platform/settings.ts';\n",
  'compose.ts': "import { createApp } from './app.ts';\n",
  'main.ts': "import { composeApp } from './compose.ts';\n",
});

const withEdge = (from: string, contents: string): string => scratch({ ...INHABITED, [from]: contents });

describe('DATA-1 holds over the module graph as it stands', () => {
  it('finds no violation in the tree as it stands', () => {
    expect(scanImportGraph()).toEqual([]);
  });

  // The reach assertion, naming the layer pairs the scan actually read. A rule table that permits more than the
  // tree uses is not wrong, but it is also not exercised, and this is the difference between the two.
  it('reads a graph with every layer in it, which a green scan cannot say it did', () => {
    const pairs = new Set(importEdges().map((edge) => `${edge.from} -> ${edge.to}`));

    expect(importEdges().length).toBeGreaterThan(30);
    for (const pair of [
      'app -> app',
      'app -> platform',
      'routes -> app',
      'routes -> platform',
      'persistence -> app',
      'persistence -> persistence',
      'platform -> platform',
      'architecture -> platform',
      'compose.ts -> persistence',
      'compose.ts -> routes',
      'main.ts -> compose.ts',
    ]) {
      expect(pairs).toContain(pair);
    }
  });

  // The composition root is the only module that may see both sides, and this says so as a fact about the tree
  // rather than as a rule about it. DATA-1's fifth obligation is discharged by exactly this: a route cannot reach
  // a store because it is never given one.
  it('lets only the composition root name the persistence layer', () => {
    // Edges from inside the layer to itself are not "naming" it, and excluding them is the difference between
    // asserting the composition root's privilege and asserting that the store has no files.
    const naming = importEdges()
      .filter((edge) => edge.to === 'persistence' && edge.from !== 'persistence')
      .map((edge) => edge.at);

    expect(new Set(naming)).toEqual(new Set(['compose.ts']));
  });
});

describe('DATA-1: an endpoint never touches a store', () => {
  it('refuses a route that imports the persistence layer', () => {
    const root = withEdge('routes/notes.ts', "import { sqliteNoteStore } from '../persistence/store.ts';\n");

    expect(messages(scanImportGraph(root))).toMatch(/routes\/notes\.ts.*is in 'persistence'/s);
  });

  it('refuses the domain importing the adapter that implements its port', () => {
    const root = withEdge('app/service.ts', "import { sqliteNoteStore } from '../persistence/store.ts';\n");

    expect(messages(scanImportGraph(root))).toMatch(/app\/service\.ts.*is in 'persistence'/s);
  });

  // A type-only import is counted, and this is the test that says so. It compiles away, so nothing at runtime
  // would ever notice; the dependency is still real, because the layer cannot be changed without the one that
  // needs its types.
  it('refuses a forbidden edge that is type-only, because a compile-time dependency is a dependency', () => {
    const root = withEdge('routes/notes.ts', "import type { Row } from '../persistence/store.ts';\n");

    expect(messages(scanImportGraph(root))).toMatch(/routes\/notes\.ts.*is in 'persistence'/s);
  });
});

describe('DATA-1: no lower layer calls upward', () => {
  it('refuses persistence importing a route', () => {
    const root = withEdge('persistence/store.ts', "import { notesSurface } from '../routes/notes.ts';\n");

    expect(messages(scanImportGraph(root))).toMatch(/persistence\/store\.ts.*is in 'routes'/s);
  });

  it('refuses a platform seam importing the domain', () => {
    const root = withEdge('platform/settings.ts', "import type { Note } from '../app/port.ts';\n");

    expect(messages(scanImportGraph(root))).toMatch(/platform\/settings\.ts.*is in 'app'/s);
  });

  it('refuses a scan importing the layer it scans', () => {
    const root = withEdge('architecture/scan.ts', "import { STATEMENTS } from '../persistence/store.ts';\n");

    expect(messages(scanImportGraph(root))).toMatch(/architecture\/scan\.ts.*is in 'persistence'/s);
  });

  it('refuses the entrypoint reaching past the composition it exists to start', () => {
    const root = withEdge('main.ts', "import { notesSurface } from './routes/notes.ts';\n");

    expect(messages(scanImportGraph(root))).toMatch(/main\.ts.*is in 'routes'/s);
  });
});

describe('the rule table cannot go quietly out of date', () => {
  it('refuses a layer no rule describes, so a new directory is a decision rather than a default', () => {
    const root = scratch({ ...INHABITED, 'jobs/nightly.ts': "import { service } from '../app/service.ts';\n" });

    expect(messages(scanImportGraph(root))).toMatch(/jobs\/nightly\.ts.*which no rule describes/s);
  });

  it('refuses a rule whose layer imports nothing, which is what a rename leaves behind', () => {
    const withoutRoutes = Object.fromEntries(
      Object.entries(INHABITED).filter(([name]) => name !== 'routes/notes.ts'),
    );

    expect(messages(scanImportGraph(scratch(withoutRoutes)))).toMatch(/routes.*rule and no module/s);
  });

  it('refuses a tree it read no imports from at all', () => {
    expect(messages(scanImportGraph(scratch({ 'app/lonely.ts': 'export const x = 1;\n' })))).toMatch(
      /found no imports at all/s,
    );
  });

  it('accepts the minimum inhabited tree, so every refusal above is the edge and not the fixture', () => {
    expect(scanImportGraph(scratch(INHABITED))).toEqual([]);
  });
});
