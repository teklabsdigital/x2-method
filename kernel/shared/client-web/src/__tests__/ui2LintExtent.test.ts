import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

// UI-2: literal visual values are lint errors. This asserts the EXTENT of that config rather than describing it.
//
// Why it exists (E-30). The whole of UI-2 is hand-written alternations and esquery selectors in eslint.config.js,
// and nothing anywhere fed them a violating input. Measured 2026-07-27: prefixing NAMED_COLORS and DIM_CAMEL with
// tokens that match nothing left `npm run verify` completely green (tsc silent, every test passing, eslint exit
// 0), and a real violation planted into a screen then passed silently. A guard whose reach can be reduced to
// nothing without anything going red is evidence about the tree and none at all about the guard. This is the same
// repair tools/secret-scan.mjs carries as `--self-test` and SecretConfigShapeTests carries as a Theory.
//
// The controls are in src/__fixtures__/ui2-lint-extent.fixture.json, NOT inline, because the colour selectors
// match any string or template literal rather than only style-object properties, so a known-bad fixture held as
// a source string in this file would trip the rule this file exists to assert. Placing this test under
// src/theme/__tests__/ would also dodge that, since no-restricted-syntax is off there, and was rejected: an
// extent assertion must not depend on where it sits relative to the exemptions of the config it asserts.

type Fixture = { category?: string; why?: string; source: string; expectedMessage?: string };
type Fixtures = { filePath: string; catch: Fixture[]; ignore: Fixture[]; namedColourFloor: string[] };
type Ban = { selector: string; message: string };

const fixtures: Fixtures = JSON.parse(
  readFileSync(join(process.cwd(), 'src', '__fixtures__', 'ui2-lint-extent.fixture.json'), 'utf8'),
);

// The filePath decides which block of the flat config applies, and it is load-bearing. Under src/theme/** or
// src/components/** the rule is off; under dist/ or node_modules/ the file is ignored and lints clean, which is
// the silent-pass shape this test must never accidentally assert against. src/modules/** is where the rule is on.
//
// What the config bans is read back through `calculateConfigForFile` rather than by importing eslint.config.js.
// That is not a workaround for the untyped import: it is the config AS ESLINT RESOLVES IT for this exact path,
// which is the only form that answers "what actually applies here", and it carries the severity as well.
let eslint: ESLint;
let severity: number | string | undefined;
let declaredMessages: string[] = [];
let namedColours: string[] = [];

beforeAll(async () => {
  eslint = new ESLint({ cwd: process.cwd() });
  const resolved = await eslint.calculateConfigForFile(fixtures.filePath);
  const rule = resolved?.rules?.['no-restricted-syntax'] as [number | string, ...Ban[]] | undefined;
  const [ruleSeverity, ...bans] = rule ?? [];
  severity = ruleSeverity;
  declaredMessages = [...new Set(bans.map((ban) => ban.message))];
  namedColours = (bans
    .find((ban) => ban.message.startsWith('Named color literal'))
    ?.selector.match(/\^\(\?:(.+?)\)\$/)?.[1] ?? '')
    .split('|')
    .filter(Boolean);
});

const visualLiteralMessages = async (source: string): Promise<string[]> => {
  const [result] = await eslint.lintText(source, { filePath: fixtures.filePath });
  return (result?.messages ?? [])
    .filter((message) => message.ruleId === 'no-restricted-syntax')
    .map((message) => message.message);
};

describe('UI-2 lint extent', () => {
  // Guard the guard's own preconditions first. If the fixture path were ignored, or the rule were off for it,
  // every assertion below would pass vacuously, which is precisely the failure being repaired.
  it('the fixture path is linted, and the visual-literal rule is on for it', async () => {
    const [result] = await eslint.lintText('export const Probe = () => null;\n', {
      filePath: fixtures.filePath,
    });
    expect(result).toBeDefined();
    expect(result.messages.some((m) => /ignored because of a matching ignore pattern/i.test(m.message))).toBe(false);
    await expect(visualLiteralMessages('export const P = () => <div style={{ padding: 24 }} />;')).resolves.toHaveLength(1);
  });

  // UI-2 has no warn-and-ship tier: the ban is error severity or it gates nothing. Asserted rather than assumed,
  // because a single character turns every control below into a report that merges anyway.
  it('the ban is error severity, not a warning', () => {
    expect(severity === 2 || severity === 'error').toBe(true);
  });

  // Completeness, read off the config rather than hardcoded. A ban added to eslint.config.js with no control
  // here fails this test, so the control set cannot silently fall behind the thing it certifies.
  it('every message the config declares is produced by at least one control', () => {
    const covered = new Set(fixtures.catch.map((fixture) => fixture.expectedMessage));
    expect(declaredMessages.filter((message) => !covered.has(message))).toEqual([]);
  });

  it('the control set has not silently shrunk', () => {
    expect(fixtures.catch.length).toBeGreaterThanOrEqual(19);
    expect(fixtures.ignore.length).toBeGreaterThanOrEqual(22);
  });

  // The registries the selectors are built from, asserted two ways, because one way is not enough and this was
  // measured. A first cut of this test held a single named-colour control ('crimson') against an alternation of
  // 61 members, so a narrowing that deleted sixty of them still passed. Removal is caught by the floor below;
  // a selector that is broken while the list still looks complete is caught by driving every member through it.
  // The floor is independently written and lives in the fixture file, NOT derived from the config and NOT held
  // in this source. Not derived, because a list read out of the thing under test shrinks when the thing under
  // test shrinks: measured, a probe that swapped three colour names for four left the derived check and a bare
  // member count both green. Not in this source, because the named-colour selector is anchored to the whole
  // literal, so an array of colour names in a .ts file trips the rule it is asserting.
  it('every named colour on the independent floor is caught', async () => {
    const missed: string[] = [];
    for (const colour of fixtures.namedColourFloor) {
      const messages = await visualLiteralMessages(
        `export const P = () => <div style={{ color: "${colour}" }} />;`,
      );
      if (!messages.some((message) => message.startsWith('Named color literal'))) {
        missed.push(colour);
      }
    }
    expect(missed).toEqual([]);
  });

  it('the named-colour alternation has not shrunk', () => {
    expect(namedColours.length).toBeGreaterThanOrEqual(61);
  });

  it('every named colour the config lists is actually caught', async () => {
    const missed: string[] = [];
    for (const colour of namedColours) {
      const messages = await visualLiteralMessages(
        `export const P = () => <div style={{ color: "${colour}" }} />;`,
      );
      if (!messages.some((message) => message.startsWith('Named color literal'))) {
        missed.push(colour);
      }
    }
    expect(missed).toEqual([]);
  });

  // Independently written, deliberately NOT derived from DIM_CAMEL: a list read out of the thing under test
  // shrinks when the thing under test shrinks, which is the one failure it needs to catch.
  it('every gated dimension axis is caught', async () => {
    const axes = [
      'padding', 'paddingTop', 'paddingInlineStart', 'margin', 'marginBottom', 'marginBlockEnd',
      'gap', 'rowGap', 'columnGap', 'width', 'height', 'minWidth', 'maxWidth', 'minHeight',
      'maxHeight', 'top', 'left', 'right', 'bottom', 'inset', 'insetInlineStart',
    ];
    const missed: string[] = [];
    for (const axis of axes) {
      const messages = await visualLiteralMessages(
        `export const P = () => <div style={{ ${axis}: 24 }} />;`,
      );
      if (!messages.some((message) => message.startsWith('Raw dimension/spacing literal'))) {
        missed.push(axis);
      }
    }
    expect(missed).toEqual([]);
  });

  describe('caught, with the message the config declares', () => {
    for (const [index, fixture] of fixtures.catch.entries()) {
      it(`${index + 1}. ${fixture.category}`, async () => {
        const messages = await visualLiteralMessages(fixture.source);
        expect(messages.length).toBeGreaterThan(0);
        expect(messages).toContain(fixture.expectedMessage);
      });
    }
  });

  describe('not caught', () => {
    // Two kinds live here and the distinction is the point. The plain entries are the config's deliberate
    // structural allowlist: unitless ratios, flex factors, integer zIndex, percentages, viewport units, ch/fr/auto
    // and literal zero, all of which a careless widening would start failing on. The entries marked KNOWN GAP are
    // holes measured on 2026-07-27 and recorded as PASSING rather than omitted, because an omitted case is
    // indistinguishable from one nobody thought of. Each is carried as an `owed` obligation with a named trigger
    // in conformance.json, so closing one turns this test red and has to be argued rather than discovered.
    for (const [index, fixture] of fixtures.ignore.entries()) {
      it(`${index + 1}. ${fixture.why}`, async () => {
        await expect(visualLiteralMessages(fixture.source)).resolves.toEqual([]);
      });
    }
  });
});
