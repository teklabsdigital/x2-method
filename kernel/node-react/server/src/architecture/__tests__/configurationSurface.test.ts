import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { declaredKeys, scanConfigurationSurface } from '../configurationSurface.ts';
import { EDITION_ROOT } from '../../platform/settings.ts';

// CFG-1 and SEC-5 over the real tree, plus a red proof for every branch. The green assertion alone would be the
// mistake this edition has already made twice: a scan over a tree with no violations in it cannot reach its own
// failing branches, which is how the carve-out list and the `composeApp` wiring both shipped unexecuted.

const scratch = (files: Readonly<Record<string, string>>): string => {
  const root = mkdtempSync(path.join(tmpdir(), 'cfg-surface-'));
  for (const [relative, contents] of Object.entries(files)) {
    const full = path.join(root, relative);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, contents, 'utf8');
  }
  return root;
};

const sourceSurface = (root: string) =>
  [{ label: 'src', root: path.join(root, 'src'), extensions: ['.ts'], kind: 'source' as const }] as const;

const scriptSurface = (root: string) =>
  [{ label: 'tools', root: path.join(root, 'tools'), extensions: ['.mjs'], kind: 'script' as const }] as const;

describe('CFG-1 and SEC-5 hold over the shipped tree', () => {
  it('finds no violation in the edition as it stands', () => {
    expect(scanConfigurationSurface()).toEqual([]);
  });

  it('declares every key the committed base carries, and no more', () => {
    expect([...declaredKeys()].sort()).toEqual([
      'auth.audience',
      'auth.issuer',
      'auth.signingKey',
      'database.file',
      'http.host',
      'http.port',
      'logging.level',
    ]);
  });
});

describe('CFG-1: a literal in code is the third, wrong home', () => {
  it('refuses a provider endpoint in source', () => {
    const root = scratch({ 'src/tool.ts': "const endpoint = 'https://api.example.com/v1/messages';\n" });

    expect(scanConfigurationSurface(sourceSurface(root), [])).toMatchObject([
      { claim: 'CFG-1', message: expect.stringContaining('provider endpoint') },
    ]);
  });

  it('refuses a model id in source, which is the incident the claim was minted from', () => {
    const root = scratch({ 'src/tool.ts': "const model = 'claude-opus-4-20250101';\n" });

    expect(scanConfigurationSurface(sourceSurface(root), [])).toMatchObject([
      { claim: 'CFG-1', message: expect.stringContaining('model id') },
    ]);
  });

  it('permits a localhost URL, because a loopback address is not a per-environment endpoint', () => {
    const root = scratch({ 'src/tool.ts': "const local = 'http://localhost:5080/health';\n" });

    expect(scanConfigurationSurface(sourceSurface(root), [])).toEqual([]);
  });

  // The fourth home. This is the check that would have caught this edition's own `main.ts`, and it is a second
  // view over the eslint rule rather than a duplicate of it: a lint is a configuration file someone can edit.
  it('refuses a process.env read outside the settings seam', () => {
    const root = scratch({ 'src/tool.ts': 'export const port = Number(process.env.PORT ?? 5080);\n' });

    expect(scanConfigurationSurface(sourceSurface(root), [])).toMatchObject([
      { claim: 'CFG-1', message: expect.stringContaining('ambient environment is a home CFG-1 does not name') },
    ]);
  });

  it('refuses a script that duplicates a committed configuration value instead of reading it', () => {
    // The audience rather than the issuer, deliberately: the issuer is also a URL, so it trips the provider
    // endpoint rule as well and the assertion would not isolate the check it names.
    const root = scratch({ 'tools/smoke.mjs': "const audience = 'kernel-api';\n" });

    expect(scanConfigurationSurface(scriptSurface(root), [])).toMatchObject([
      { claim: 'CFG-1', message: expect.stringContaining("duplicates the committed value of 'auth.audience'") },
    ]);
  });
});

describe('SEC-5: no credential in a committed file', () => {
  it('refuses a secret-shaped literal in source', () => {
    const root = scratch({ 'src/tool.ts': "const signingKey = 'hunter2-but-longer';\n" });

    expect(scanConfigurationSurface(sourceSurface(root), [])).toMatchObject([
      { claim: 'SEC-5', message: expect.stringContaining("assigns a literal to 'signingKey'") },
    ]);
  });

  it('permits the empty placeholder, which declares a key without carrying it', () => {
    const root = scratch({ 'src/tool.ts': "const signingKey = '';\n" });

    expect(scanConfigurationSurface(sourceSurface(root), [])).toEqual([]);
  });

  // `key` is a whole-name entry and this is why. As a run it matches every map-key variable in the server, and a
  // registry that cries wolf is a registry somebody turns off, which is SEC-3's `fileName` problem in a second
  // claim.
  it('does not fire on an ordinary variable whose name merely contains a registry word', () => {
    const root = scratch({ 'src/tool.ts': "const keyboardLayout = 'dvorak-international';\n" });

    expect(scanConfigurationSurface(sourceSurface(root), [])).toEqual([]);
  });
});

// The shipped list is empty, so both branches would be dead code and neither would ever have run. That is the
// exact defect the round 3 audit found in the endpoint spine's carve-outs, which is why the scan takes its
// exemptions as a parameter: a mechanism nobody has executed is a mechanism nobody has proven, and running these
// two for the first time is what would surface a defect in the key.
describe('the exemption list is reviewed rather than merely present', () => {
  it('suppresses a literal it names, keyed by file and by value', () => {
    const root = scratch({ 'src/relax.ts': "const clientSecret = 'sanctioned-fixture-value';\n" });
    const relative = path.relative(EDITION_ROOT, path.join(root, 'src/relax.ts')).split(path.sep).join('/');

    expect(
      scanConfigurationSurface(sourceSurface(root), [
        { file: relative, literal: 'sanctioned-fixture-value', why: 'the reason a reviewer reads' },
      ]),
    ).toEqual([]);
  });

  it('does not let an exemption for one file suppress the same literal in another', () => {
    const root = scratch({ 'src/relax.ts': "const clientSecret = 'sanctioned-fixture-value';\n" });

    expect(
      scanConfigurationSurface(sourceSurface(root), [
        { file: 'server/src/somewhere-else.ts', literal: 'sanctioned-fixture-value', why: 'wrong file' },
      ]),
    ).toMatchObject([{ claim: 'SEC-5' }, { claim: 'CFG-1', message: expect.stringContaining('matched nothing') }]);
  });

  it('reports an exemption that matches nothing, because an unused one is a pre-authorized hole', () => {
    expect(
      scanConfigurationSurface(
        [],
        [{ file: 'server/src/nowhere.ts', literal: 'never-appears-anywhere', why: 'stale by construction' }],
      ),
    ).toMatchObject([{ claim: 'CFG-1', message: expect.stringContaining('matched nothing') }]);
  });
});
