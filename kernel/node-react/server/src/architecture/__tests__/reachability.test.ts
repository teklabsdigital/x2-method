import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { executedRoots, reach, scanReachability } from '../reachability.ts';

// TEST-3's second half. The scan says a module nothing executed can reach is a module no gate protects; these
// tests say the scan can tell the difference, because a scan that reports what it did NOT find reads as total
// coverage when it reaches nothing at all.

const tier = (files: Readonly<Record<string, string>>): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'reach-'));
  for (const [relative, contents] of Object.entries(files)) {
    const full = path.join(root, relative);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, contents, 'utf8');
  }
  return root;
};

const START = JSON.stringify({ scripts: { start: 'node src/main.ts' } });

describe('TEST-3: every module is reachable from something this tier executes', () => {
  it('finds no unreachable module in the tier as it stands', () => {
    expect(scanReachability()).toEqual([]);
  });

  // The assertion the green scan cannot make about itself (E-92). A tier whose scripts stopped naming an
  // entrypoint, or whose test files stopped being collected, would produce an empty violation list from an empty
  // walk and read exactly like this one.
  it('derives real roots and reaches real modules, which the green scan cannot say it did', () => {
    const roots = executedRoots();
    const at = roots.map((root) => root.at);

    expect(at).toContain('src/main.ts');
    expect(at).toContain('tools/migrate.ts');
    expect(roots.some((root) => root.why === 'vitest collects it')).toBe(true);
    // Derived from package.json rather than listed here, so the reason travels with the root and a script rename
    // shows up as a changed reason rather than a silently different set.
    expect(roots.find((root) => root.at === 'src/main.ts')?.why).toBe("package.json script 'start' runs it");

    const reached = reach(path.join(import.meta.dirname, '..', '..', '..'), roots);
    // One module per layer, so a walk that stopped descending is caught rather than averaged away.
    expect(reached).toContain('src/compose.ts');
    expect(reached).toContain('src/routes/notes.ts');
    expect(reached).toContain('src/persistence/notes/sqliteNoteStore.ts');
    expect(reached).toContain('src/platform/settings.ts');
    expect(reached).toContain('src/architecture/reachability.ts');
  });
});

describe('TEST-3: what the scan refuses', () => {
  it('reports a module no executed root imports', () => {
    const root = tier({
      'package.json': START,
      'src/main.ts': "import './used.ts';\n",
      'src/used.ts': 'export const used = 1;\n',
      'src/orphan.ts': 'export const orphan = 2;\n',
    });

    expect(scanReachability(root)).toMatchObject([
      { claim: 'TEST-3', at: 'src/orphan.ts', message: expect.stringContaining('not reachable') },
    ]);
  });

  it('reports a tier with no modules rather than approving of it', () => {
    expect(scanReachability(tier({ 'package.json': START }))).toMatchObject([
      { claim: 'TEST-3', message: expect.stringContaining('found no modules at all') },
    ]);
  });

  // The failure mode that would make this scan report EVERYTHING, which is as useless as reporting nothing and
  // arrives the same way: the derivation stops matching how the tier is run.
  it('reports a tier with no executed roots instead of calling every module dead', () => {
    const root = tier({ 'package.json': JSON.stringify({ scripts: { lint: 'eslint .' } }), 'src/thing.ts': 'export const a = 1;\n' });

    expect(scanReachability(root)).toMatchObject([
      { claim: 'TEST-3', message: expect.stringContaining('no executed roots') },
    ]);
  });
});

describe('TEST-3: what the scan permits, because each is a real way to be reached', () => {
  it('follows the graph transitively rather than one hop', () => {
    const root = tier({
      'package.json': START,
      'src/main.ts': "import './a.ts';\n",
      'src/a.ts': "import './b.ts';\nexport const a = 1;\n",
      'src/b.ts': 'export const b = 2;\n',
    });

    expect(scanReachability(root)).toEqual([]);
  });

  // A guard's only caller is its test, by design. Holding claim guards to production reachability would report
  // every one of them and the pressure would be to delete the rule rather than to weaken it.
  it('counts a module reached only by a test file', () => {
    const root = tier({
      'package.json': START,
      'src/main.ts': 'export const main = 1;\n',
      'src/guard.ts': 'export const guard = 1;\n',
      'src/__tests__/guard.test.ts': "import '../guard.ts';\n",
    });

    expect(scanReachability(root)).toEqual([]);
  });

  it('counts a module reached only through a dynamic import', () => {
    const root = tier({
      'package.json': START,
      'src/main.ts': "await import('./late.ts');\n",
      'src/late.ts': 'export const late = 1;\n',
    });

    expect(scanReachability(root)).toEqual([]);
  });

  // Specifiers in this tier carry their extension because the runtime requires it. The other two forms resolve
  // anyway, so a change of specifier style cannot silently drop edges and report the modules behind them as dead.
  it('resolves the extensionless and directory forms as well as the written one', () => {
    const root = tier({
      'package.json': START,
      'src/main.ts': "import './bare';\nimport './folder';\n",
      'src/bare.ts': 'export const bare = 1;\n',
      'src/folder/index.ts': 'export const folder = 1;\n',
    });

    expect(scanReachability(root)).toEqual([]);
  });
});
