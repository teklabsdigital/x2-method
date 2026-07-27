import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { matchingRule } from '../platform/nameMatching.ts';
import { SECRET_SHAPED } from '../platform/registries.ts';
import { CONFIG_DIRECTORY, EDITION_ROOT, SECRET_STORE, SETTINGS_SPEC, environmentNameFor } from '../platform/settings.ts';
import type { Violation } from './endpointSpine.ts';

// CFG-1 and SEC-5's predicate half, over the source tree and the shipped scripts.
//
// Structurally this is the same shape as `endpointSpine.ts` and deliberately so: a pure function of an
// enumeration, returning violations rather than throwing, so that a carve-out can be reported as used and a
// stale one reported as dead. What differs is the enumeration, and the difference is the finding. The route
// table is bought once, in the composition root, and every claim that scans it inherits the purchase. There is
// no equivalent purchase for a source tree: the enumeration here is a directory walk, and its completeness rests
// on this file's own list of what to walk. Nothing reconciles that list against a second view, which is the
// hole `reconcileWithRouter` closes for the route table and which no mechanism closes here.

// CFG-1's "host source and shipped scripts", made explicit. A script surface in this stack is not a directory:
// `package.json` is a manifest that DEP-1 also owns and that legitimately carries version literals, and the
// workflow is YAML. So the surfaces are declared with what part of each file is script, rather than assumed to
// be whole files, which is the shape of the problem the sibling does not have because `server/src` and
// `scripts/` are disjoint directories there.
type Surface = Readonly<{ label: string; root: string; extensions: readonly string[]; kind: 'source' | 'script' }>;

const SURFACES: readonly Surface[] = Object.freeze([
  Object.freeze({ label: 'server/src', root: path.join(EDITION_ROOT, 'server', 'src'), extensions: ['.ts', '.tsx', '.js', '.mjs', '.cjs'], kind: 'source' as const }),
  Object.freeze({ label: 'tools', root: path.join(EDITION_ROOT, 'tools'), extensions: ['.mjs', '.js', '.ts'], kind: 'script' as const }),
  Object.freeze({ label: '.github/workflows', root: path.join(EDITION_ROOT, '.github', 'workflows'), extensions: ['.yml', '.yaml'], kind: 'script' as const }),
  Object.freeze({ label: 'client-web/tools', root: path.join(EDITION_ROOT, 'client-web', 'tools'), extensions: ['.ts', '.mjs', '.js'], kind: 'script' as const }),
  // Added with the e2e orchestrator, and it is the reason that change touched this file. `scripts/e2e.ts` is a
  // shipped script by CFG-1's own words: it resolves the issuer, the audience, the host and the port and hands
  // them to two processes. A shipped script in a directory nothing walks is the shape E-92 and E-95 both have,
  // where a check exists, is correct, and is blind to a surface that was added after the list it enumerates from.
  // The extension list is deliberately wider than what the directory holds today, including `.sh`, so that the
  // sibling's kind of orchestrator would be reached here rather than silently skipped.
  Object.freeze({ label: 'scripts', root: path.join(EDITION_ROOT, 'scripts'), extensions: ['.ts', '.mts', '.mjs', '.js', '.sh'], kind: 'script' as const }),
]);

// The exemption list, in the discipline SEC-1's allowlist and the endpoint spine's carve-outs already use: named
// in the scan itself, each carrying the reason, and a stale one reported rather than left to accumulate.
//
// **The list is non-empty, and it is non-empty for the opposite reason to the one this pass predicted.** The
// prediction was that DATA-5's development relaxation would need an entry: the claim licenses exactly one
// relaxation, conditional on the environment name and visible in one place, and a sanctioned secret-shaped
// literal is what an exemption is for. It needs none, because `DEVELOPMENT_RELAXATION` is not a secret-shaped
// NAME, so `checkSecretLiterals` never looks at it.
//
// That is a residual rather than a convenience, and it is the SEC-5 form of what E-9 found in the three name
// registries: this predicate resolves on the NAME, so a real credential assigned to `bootstrapValue` is
// invisible here and renaming the variable is the whole evasion. The alternative is judging the VALUE by entropy
// or length, which this file refuses because a second heuristic underneath the first is exactly the shape E-2
// records in the sibling's body-DTO scan. The name predicate is kept, its reach is stated, and the CI
// secret-scan gate SEC-5 also asks for is the mechanism that would cover the gap. That gate is not built here;
// see the register.
//
// What DOES need entries is the test that proves SEC-5, which is a structural consequence rather than an
// accident: any test exercising a scan for committed credentials has to commit a credential-shaped string, so a
// SEC-5 scan over its own repository necessarily fires on its own proof. The exemption is the right answer
// rather than a directory-wide carve-out for `__tests__`, because a test file is a committed file and a real
// key in one is a real leak; making each fixture cost a written reason is what keeps that distinction.
type Exemption = Readonly<{ file: string; literal: string; why: string }>;

// **The scan does not scan its own registries, and this is E-5's pattern rather than a convenience.** E-5 records
// that documenting the conformance gate broke it: the README quoted the gate's marker strings in a sentence, the
// generator matched the prose mention first, and the gate then guarded the wrong span while agreeing with itself.
// The finding it drew was that documenting a mechanism should not be able to break it, and it closed with "one
// instance is not a pattern yet".
//
// This is the second instance, in a different mechanism, found the same way: an exemption must name the literal
// it exempts, so the exemption list contains a provider-endpoint URL, so the file holding the exemption list
// failed its own provider-endpoint check. A registry of forbidden values necessarily contains the forbidden
// values. The same is true of `registries.ts`, which is a list of the names three other claims forbid.
//
// **Third instance, 2026-07-26, and it arrived from a direction the first two did not.** The flow-back pass
// replaced SEC-5's CI grep with `tools/secret-scan.mjs`, a shared-tier scan composed into both editions. That
// file declares a registry of secret-shaped key names AND a set of credential-shaped controls asserting what it
// catches, so this scan fired on it immediately. The first two instances were files this edition authored; this
// one was composed in from `kernel/shared/`, which means the pattern is not a property of how one edition writes
// its registries. Any mechanism whose predicate is a set of literals collides with any other mechanism that
// scans for those literals, wherever either one was written.
//
// The cost is real and is stated rather than argued away: a genuine credential written into one of these three
// files is invisible to this scan. All three are named here, all three consist of nothing but registry entries
// and controls, and any reviewer reads them as registries. The alternative, marking each entry individually,
// moves the same exception into a form nobody would maintain. `tools/secret-scan.mjs` carries the additional
// protection that its bytes are pinned to the shared tier by `compose --check`, so a credential cannot be parked
// there without failing a different gate first, and it excludes itself from its own scan for the same reason.
const MECHANISM_FILES: ReadonlySet<string> = Object.freeze(
  new Set([
    'server/src/architecture/configurationSurface.ts',
    'server/src/platform/registries.ts',
    'tools/secret-scan.mjs',
  ]),
);

const FIXTURE_REASON =
  'a fixture in the test that proves this very scan. A SEC-5 check over its own repository necessarily fires on its own red proof, and a directory-wide exemption for tests would hide a real key in a committed file.';

const EXEMPTIONS: readonly Exemption[] = Object.freeze([
  Object.freeze({
    file: 'server/src/platform/__tests__/settings.test.ts',
    literal: 'a-real-development-key',
    why: FIXTURE_REASON,
  }),
  Object.freeze({
    file: 'server/src/platform/__tests__/settings.test.ts',
    literal: 'sk-live-oops',
    why: FIXTURE_REASON,
  }),
  Object.freeze({
    file: 'server/src/platform/__tests__/settings.test.ts',
    literal: 'https://kernel.invalid/issuer',
    why: `${FIXTURE_REASON} This one is a CFG-1 literal rather than a SEC-5 one: the fixture mirrors the committed issuer so the layering tests resolve something realistic.`,
  }),
  Object.freeze({
    file: 'server/src/platform/__tests__/tokenVerification.test.ts',
    literal: 'node-architecture-tests-symmetric-signing-phrase-0123456789',
    why: 'The SEC-4 verification tests both mint and verify with this phrase, so it is a test fixture rather than a credential: nothing in the shipped server ever signs or verifies with it, and no deployed process can reach it. It is written out rather than derived because the alternative is a value whose name does not say what it is, and dodging a secret scan by renaming the binding is the failure the scan exists to prevent. Same reasoning the sibling records for its own architecture-test signing key. The three other secret-shaped values this file needs are DERIVED from this one, so this is the single exempted literal rather than the first of a set.',
  }),
]);

// Two further exemptions were here and are deleted, which is the staleness check doing its job on its own
// author. `configurationSurface.test.ts` writes its fixtures as strings of source code inside a scratch tree, and
// once the checks moved from text to the AST those strings became ordinary property values bound to a filename
// key rather than credentials bound to `signingKey`. The text scan needed them exempted; the parse does not. An
// exemption list that only grows would have carried both forever.

// CFG-1's literal registry. Heuristic by the claim's own admission, and this is the D-000 extension point its
// weakening note names.
// Anchored, and not global. Matching against a parsed literal's VALUE rather than against the surrounding text
// means the pattern describes the whole value, so a stray global flag would carry `lastIndex` between calls and
// make the check answer differently on the second file than on the first. The quote delimiters the first version
// carried are gone with the text scan they belonged to.
const OPERATIONAL_LITERALS: readonly Readonly<{ name: string; pattern: RegExp; why: string }>[] = Object.freeze([
  Object.freeze({
    name: 'provider endpoint',
    pattern: /^https?:\/\/(?!localhost|127\.0\.0\.1|schema\.|www\.w3\.org|json-schema\.org)\S+$/,
    why: 'an absolute endpoint is per-environment by nature; in code it needs a redeploy to change and cannot be varied by a test',
  }),
  Object.freeze({
    name: 'model id',
    pattern: /^(?:claude|gpt|gemini|llama|mistral)-[a-z0-9][a-z0-9.-]*$/i,
    why: 'the pilot hardcoded a model id in the composition root, so changing models meant recompiling; this is the incident CFG-1 was minted from',
  }),
]);

export function scanConfigurationSurface(
  surfaces: readonly Surface[] = SURFACES,
  exemptions: readonly Exemption[] = EXEMPTIONS,
): readonly Violation[] {
  const violations: Violation[] = [];
  const used = new Set<Exemption>();

  // SEC-5's structural half, and the one property this edition has to assert directly because no platform
  // facility supplies it. The claim requires dev secrets "outside the repository tree", which .NET gets from
  // User Secrets: a well-known per-project path outside the tree, wired by a manifest field an arch test can
  // read. Node has neither, and the idiomatic substitute is a gitignored `.env` INSIDE the tree, which is a
  // property of a tool's configuration rather than a property of a path. So the path is asserted.
  if (!path.relative(EDITION_ROOT, SECRET_STORE).startsWith('..')) {
    violations.push({
      claim: 'SEC-5',
      at: SECRET_STORE,
      message:
        'the developer secret store is inside the edition tree. A gitignore entry is a deny-list that git add -f overrides and that an archive of the working tree ignores entirely; the claim asks for a path outside the tree, which is a property of the path.',
    });
  }

  const committed = committedConfigFiles();
  for (const file of committed) {
    checkCommittedConfig(file, violations);
  }
  const committedValues = committedNonSecretValues(committed);

  for (const { relative, file, kind } of enumerate(surfaces)) {
    const source = parse(file, readFileSync(file, 'utf8'));

    if (!MECHANISM_FILES.has(relative)) {
      checkOperationalLiterals(relative, source, exemptions, used, violations);
      checkSecretLiterals(relative, source, exemptions, used, violations);
    }

    if (kind === 'script') {
      checkScriptDuplication(relative, source, committedValues, violations);
    } else {
      checkEnvironmentConfinement(relative, source, violations);
    }
  }

  for (const exemption of exemptions) {
    if (!used.has(exemption)) {
      violations.push({
        claim: 'CFG-1',
        at: exemption.file,
        message: `exemption for ${JSON.stringify(exemption.literal)} matched nothing. An exemption nobody needs is an exemption nobody reviews; delete it.`,
      });
    }
  }

  return Object.freeze(violations);
}

type ScannedFile = Readonly<{ relative: string; file: string; kind: 'source' | 'script' }>;

function enumerate(surfaces: readonly Surface[]): readonly ScannedFile[] {
  const found: ScannedFile[] = [];
  for (const surface of surfaces) {
    for (const file of walk(surface.root, surface.extensions)) {
      found.push(
        Object.freeze({
          relative: path.relative(EDITION_ROOT, file).split(path.sep).join('/'),
          file,
          kind: surface.kind,
        }),
      );
    }
  }
  return Object.freeze(found);
}

// The walk, exposed, and it exists because of what this file's own header admits: the enumeration rests on a list
// declared here and nothing reconciles that list against a second view. A green scan is the same output whether
// the walk reached five surfaces or none, which is E-11's shape and E-92's lesson stated exactly: a self-test
// cannot say whether the walk reaches the files. So the reach is asserted separately, against real paths, and a
// surface whose root is renamed or whose extension list stops matching turns a test red instead of turning the
// scan quiet.
export function scannedFiles(surfaces: readonly Surface[] = SURFACES): readonly string[] {
  return Object.freeze(enumerate(surfaces).map((entry) => entry.relative));
}


// SEC-5. A secret-shaped key in a committed file may hold the empty string and nothing else. This is the closed
// rule rather than the heuristic the claim's wording invites: "non-placeholder value" has no definition in the
// claim, and deciding it by entropy or length would put a second heuristic underneath the first, which is the
// shape E-2 records in the sibling's body-DTO scan. There is nothing left to judge.
function checkCommittedConfig(file: string, violations: Violation[]): void {
  const relative = path.relative(EDITION_ROOT, file).split(path.sep).join('/');
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch (cause) {
    violations.push({ claim: 'CFG-1', at: relative, message: `is not readable JSON: ${String(cause)}` });
    return;
  }

  const visit = (node: unknown, at: readonly string[]): void => {
    if (node === null || typeof node !== 'object' || Array.isArray(node)) {
      return;
    }
    for (const [name, child] of Object.entries(node as Record<string, unknown>)) {
      const key = [...at, name];
      const matched = matchingRule(SECRET_SHAPED, name);
      if (matched !== undefined && child !== '' && (child === null || typeof child !== 'object')) {
        violations.push({
          claim: 'SEC-5',
          at: `${relative} ${key.join('.')}`,
          message: `is a secret-shaped key (matches the registry entry '${matched.entry}') carrying a value. Committed secrets outlive their commit: they persist in history, forks and backups, and rotate only when someone remembers. The only permitted committed value is "", which declares the key without carrying it.`,
        });
      }
      visit(child, key);
    }
  };
  visit(parsed, []);
}

// The parse, and it is the finding this function exists to carry. CFG-1's mechanism class is "a cheap
// architecture test over host source and shipped scripts banning a small registry of operational-setting literal
// shapes", and a literal shape is a text pattern, so the cheap text scan is what the claim describes. It is not
// sufficient here, and the first version of this file proved it by reporting itself: a scan for `process.env`
// over raw text fires on the COMMENT explaining why `process.env` is banned, and on the error message telling an
// author what to do instead. Three files in this edition failed their own check for saying the words.
//
// The reason is not sloppiness in the scan, it is a difference in what is being banned. A model id is a LITERAL
// SHAPE and text is the right surface for it. The fourth home is a syntactic FORM, `process.env`, and a form has
// to be recognized where forms live. So the source is parsed and the checks run over nodes. The parser is the
// `typescript` package this edition already pins as a devDependency, so nothing is added under DEP-1.
//
// A file this parser cannot read is scanned as TEXT rather than skipped, which is honest for what those surfaces
// are used for: they are checked only for duplicated committed values, and a comment carrying a committed value
// verbatim is a duplication worth reporting anyway. YAML was the only such file when this was written and the
// test was `extension === '.yml'`; the set is now stated the other way round, as the extensions this parser DOES
// read, so a surface holding a shell script or any other unparsed form gets the text check instead of falling
// through the walk with an empty literal list and reporting nothing.
const PARSEABLE: readonly string[] = Object.freeze(['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs']);

type ParsedSource = Readonly<{
  parseable: boolean;
  text: string;
  literals: readonly Readonly<{ value: string; name: string | undefined }>[];
  environmentReads: number;
}>;

function parse(file: string, text: string): ParsedSource {
  if (!PARSEABLE.includes(path.extname(file))) {
    return Object.freeze({ parseable: false, text, literals: Object.freeze([]), environmentReads: 0 });
  }

  const source = ts.createSourceFile(file, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);
  const literals: Array<{ value: string; name: string | undefined }> = [];
  let environmentReads = 0;

  const walk = (node: ts.Node): void => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      literals.push({ value: node.text, name: nameFor(node) });
    }
    // `process.env` in any form: the member access, the destructure `const {PORT} = process.env`, and the
    // element access `process.env['PORT']` all read the same object, and only the first is what an author
    // reaching for it would type. All three are the same node shape below the dot.
    if (
      (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'process' &&
      ts.isPropertyAccessExpression(node) &&
      node.name.text === 'env'
    ) {
      environmentReads += 1;
    }
    ts.forEachChild(node, walk);
  };
  walk(source);

  return Object.freeze({ parseable: true, text, literals: Object.freeze(literals), environmentReads });
}

// The identifier a literal is bound to, which is what the secret registry matches against. A variable
// declaration, an assignment, and an object property each bind a name in a different node shape, and a literal
// bound to none of them (an argument, an array element) has no name to judge.
function nameFor(node: ts.Node): string | undefined {
  const parent = node.parent;
  if (parent === undefined) {
    return undefined;
  }
  if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
    return parent.name.text;
  }
  if (ts.isPropertyAssignment(parent) && (ts.isIdentifier(parent.name) || ts.isStringLiteral(parent.name))) {
    return parent.name.text;
  }
  if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    const target = parent.left;
    if (ts.isIdentifier(target)) {
      return target.text;
    }
    if (ts.isPropertyAccessExpression(target)) {
      return target.name.text;
    }
  }
  return undefined;
}

// CFG-1's script sentence: "a script never duplicates a committed configuration value, it reads it." This is the
// sharpest check in the file because it is exact rather than heuristic, and it is the incident the claim was
// minted from: a script duplicated the issuer and audience so the two copies could drift.
function checkScriptDuplication(
  relative: string,
  source: ParsedSource,
  committedValues: ReadonlyMap<string, string>,
  violations: Violation[],
): void {
  for (const [value, key] of committedValues) {
    if (source.parseable ? source.literals.some((literal) => literal.value === value) : source.text.includes(value)) {
      violations.push({
        claim: 'CFG-1',
        at: relative,
        message: `duplicates the committed value of '${key}' (${JSON.stringify(value)}). A script is part of the code surface: it reads a committed configuration value, it does not carry a second copy that can drift from the first.`,
      });
    }
  }
}

// The fourth home, confined. This is the second view over the eslint rule that bans `process.env` outside the
// settings seam, and it exists for the reason the route table is reconciled against the router: a guard that only
// agrees with itself has not been checked. A lint is a configuration file someone can edit; this is a test.
function checkEnvironmentConfinement(relative: string, source: ParsedSource, violations: Violation[]): void {
  if (relative === 'server/src/platform/settings.ts' || source.environmentReads === 0) {
    return;
  }
  violations.push({
    claim: 'CFG-1',
    at: relative,
    message:
      'reads process.env. The ambient environment is a home CFG-1 does not name: a value read there is not a literal in code, so the literal registry cannot see it, and it is not committed configuration, so it escapes config review and the per-environment surface. Declare the key in SETTINGS_SPEC and read it from the resolved settings; the derived override name is what makes the environment a channel into the config system rather than a way around it.',
  });
}

function checkOperationalLiterals(
  relative: string,
  source: ParsedSource,
  exemptions: readonly Exemption[],
  used: Set<Exemption>,
  violations: Violation[],
): void {
  for (const shape of OPERATIONAL_LITERALS) {
    for (const { value: literal } of source.literals) {
      if (!shape.pattern.test(literal)) {
        continue;
      }
      const exempt = exemptions.find((candidate) => candidate.file === relative && candidate.literal === literal);
      if (exempt !== undefined) {
        used.add(exempt);
        continue;
      }
      violations.push({
        claim: 'CFG-1',
        at: relative,
        message: `carries a ${shape.name} literal (${JSON.stringify(literal)}): ${shape.why}. Declare it in SETTINGS_SPEC and put the value in server/config/settings.json.`,
      });
    }
  }
}

// SEC-5 over source rather than over configuration. A secret assigned to a secret-shaped name in code is a
// committed secret whatever file it hides in, and a config-shape test over config files alone would never look
// here. Empty strings and the spec's own declarations are not values.
function checkSecretLiterals(
  relative: string,
  source: ParsedSource,
  exemptions: readonly Exemption[],
  used: Set<Exemption>,
  violations: Violation[],
): void {
  for (const { value: literal, name } of source.literals) {
    // A template literal carrying an interpolation is not a constant, so it cannot be a committed secret, and
    // the parse gives that for free: an interpolated template is a `TemplateExpression` and never reaches here.
    // The text scan this replaced reported `key = ${group}.${name}` in the settings seam, which is a key path
    // being built rather than a credential.
    if (name === undefined || literal === '' || matchingRule(SECRET_SHAPED, name) === undefined) {
      continue;
    }
    const exempt = exemptions.find((candidate) => candidate.file === relative && candidate.literal === literal);
    if (exempt !== undefined) {
      used.add(exempt);
      continue;
    }
    violations.push({
      claim: 'SEC-5',
      at: relative,
      message: `assigns a literal to '${name}', which matches the secret registry. A credential in source is a committed secret; it belongs in the developer-local store outside the tree, and the runtime value belongs behind a vault handle.`,
    });
  }
}

// The non-secret committed values, keyed by value, for the script duplication check. Short values are excluded
// because a port number or a log level occurs in prose by coincidence and a check that fires on "info" is a check
// somebody deletes.
function committedNonSecretValues(files: readonly string[]): ReadonlyMap<string, string> {
  const values = new Map<string, string>();
  for (const file of files) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      continue;
    }
    const visit = (node: unknown, at: readonly string[]): void => {
      if (node === null || typeof node !== 'object') {
        return;
      }
      for (const [name, child] of Object.entries(node as Record<string, unknown>)) {
        const key = [...at, name];
        if (typeof child === 'string' && child.length >= 8 && matchingRule(SECRET_SHAPED, name) === undefined) {
          values.set(child, key.join('.'));
        }
        visit(child, key);
      }
    };
    visit(parsed, []);
  }
  return values;
}

function committedConfigFiles(): readonly string[] {
  return walk(CONFIG_DIRECTORY, ['.json']);
}

// Exported for the duplication test, which needs a value the scan will actually recognize as committed and must
// not transcribe one. E-109: it carried the literal `'kernel-api'`, which is this kernel's PLACEHOLDER audience
// and which the instantiation manifest's first step tells a seeded project to change, so the test failed on the
// day the rename was performed correctly. The test that enforces "a script reads a committed value, it does not
// carry a second copy" carried a second copy.
//
// It returns the pair rather than the value because a test asserting on the message needs the key too, and the
// pair is what the scan itself works in.
export function committedValueFor(key: string): { key: string; value: string } | undefined {
  for (const [value, name] of committedNonSecretValues(committedConfigFiles())) {
    if (name === key) {
      return { key: name, value };
    }
  }
  return undefined;
}

function walk(root: string, extensions: readonly string[]): readonly string[] {
  let entries: string[];
  try {
    entries = readdirSync(root);
  } catch {
    return [];
  }
  const found: string[] = [];
  for (const entry of entries) {
    const full = path.join(root, entry);
    if (entry === 'node_modules' || entry === 'dist') {
      continue;
    }
    if (statSync(full).isDirectory()) {
      found.push(...walk(full, extensions));
    } else if (extensions.includes(path.extname(entry))) {
      found.push(full);
    }
  }
  return found;
}

// Exported for the test that proves the spec and the committed base agree about which keys exist. Two views of
// one surface, compared, rather than one trusted: a spec key with no committed value is a key that only works if
// somebody sets an environment variable nobody documented, and a committed key with no spec entry is already
// refused at resolution.
export function declaredKeys(): readonly string[] {
  const keys: string[] = [];
  for (const [group, leaves] of Object.entries(SETTINGS_SPEC)) {
    for (const name of Object.keys(leaves)) {
      keys.push(`${group}.${name}`);
    }
  }
  return Object.freeze(keys);
}

export { environmentNameFor };
