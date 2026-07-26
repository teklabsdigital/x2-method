import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

// The configuration seam: the one module in the server that reads a config file, the secret store, or the
// process environment. CFG-1 owns what it is, SEC-5 owns where secrets come from, DATA-5 owns when it fails.
//
// The first thing all three claims run into is the same sentence SEC-1 produced about authorization: **Fastify
// has no configuration concept at all.** There is no layered provider, no appsettings, no environment overlay,
// no binding to a typed options object. CFG-1 bans "a literal in code" as the third, wrong home and names two
// right ones, and in this stack neither right home exists until it is built. A ban on the wrong home is empty
// until the right ones are there to be the path of least resistance, which is the claim's own stated defence.
//
// **The fourth home, which CFG-1 does not name.** The claim's partition is two right homes (committed
// configuration, the secret store) and one wrong home (a literal in code). Node has a fourth: the ambient
// process environment. `process.env.PORT ?? 5080` is not a literal in code, so CFG-1's literal-shape registry
// cannot see it; it is not committed configuration, so it escapes the config-review surface and the
// per-environment surface; and the `??` is a silent default of exactly the kind DATA-5 forbids. Every harm
// CFG-1's harm paragraph names applies to it and its mechanism class is blind to it by construction. That line
// shipped in this edition's own `main.ts` until this pass removed it.
//
// The repair is not to ban the environment, because deploy-time override is legitimate and a ban would be
// routed around. It is to bring the environment INSIDE the config system: an env var may only override a key
// this spec already declares, under a name derived from the key, so the value stays declared, reviewable and
// per-environment. That is what .NET's configuration builder does by including an environment-variable provider
// by default, which is why the claim never had to say it: on the platform the catalog was written from, the
// fourth home is already inside the first.

export type SettingKind = 'string' | 'number' | 'boolean' | 'url';

export type SettingSpec = Readonly<{
  kind: SettingKind;
  // SEC-5. A secret leaf may never carry a value in a committed file. The committed files may DECLARE it, with
  // the empty string and nothing else, so the key is discoverable in the config-review surface without the
  // value being there.
  secret: boolean;
  why: string;
}>;

type SpecNode = SettingSpec | { readonly [key: string]: SpecNode };

const setting = (kind: SettingKind, why: string): SettingSpec => Object.freeze({ kind, secret: false, why });
const secret = (kind: SettingKind, why: string): SettingSpec => Object.freeze({ kind, secret: true, why });

// The declared surface. This is CFG-1's "committed appsettings" made into something a machine can read: every
// operational setting the server has, with the reason it is a setting rather than a constant, and nothing else.
// A key absent from here cannot be set by any layer, which is the closure obligation applied to configuration.
export const SETTINGS_SPEC = Object.freeze({
  http: Object.freeze({
    port: setting('number', 'differs per environment and per developer; hardcoding it makes two developers fight'),
    host: setting('string', 'a container binds 0.0.0.0 and a laptop binds 127.0.0.1; it is deployment shape, not behaviour'),
  }),
  logging: Object.freeze({
    level: setting('string', 'raised during an incident without a redeploy, which is the whole point of it being config'),
  }),
  auth: Object.freeze({
    issuer: setting('string', 'CFG-1 harm paragraph: a script duplicated this value and the two copies drifted'),
    audience: setting('string', 'as issuer; the e2e harness reads it from here rather than carrying its own copy'),
    signingKey: secret('string', 'SEC-5: a credential, so it lives in the developer-local store outside the tree'),
  }),
}) satisfies Record<string, Record<string, SettingSpec>>;

export type Settings = Readonly<{
  http: Readonly<{ port: number; host: string }>;
  logging: Readonly<{ level: string }>;
  auth: Readonly<{ issuer: string; audience: string; signingKey: string }>;
}>;

// The edition root. An edition is the unit that gets copied at instantiation, so it is the honest boundary for
// SEC-5's "outside the repository tree": in a seeded project the edition root IS the repository root, and no
// machine-local path is written down anywhere, only derived.
export const EDITION_ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
export const CONFIG_DIRECTORY = path.join(EDITION_ROOT, 'server', 'config');

// SEC-5's dev secret store. The claim requires development secrets to live "in the developer-local secret
// store, outside the repository tree", and names .NET User Secrets, which is a platform facility: a well-known
// per-project path outside the tree, wired by a manifest field an arch test can assert.
//
// **Node has no such facility, and the idiomatic substitute is strictly weaker.** A `.env` file sits INSIDE the
// tree and is kept out of history only by `.gitignore`, which is a deny-list: `git add -f` overrides it, a
// tarball of the working tree carries it, and a fork of a branch where the entry was missing keeps it forever.
// "Outside the repository tree" is a property of a path; "gitignored" is a property of a tool's configuration.
// So the store is built rather than adopted, and the property the claim asks for is asserted directly:
// `configurationSurface.ts` proves this path is outside `EDITION_ROOT`, which is a statement about the path and
// not about anyone's git configuration.
export const SECRET_STORE = path.join(homedir(), '.x2-kernel', 'secrets.json');

// The relaxation set and the relaxation value, in one place, because DATA-5's note requires the relaxation to be
// visible in one place and conditional on the environment name. Both are exported so the scan in
// `architecture/configurationSurface.ts` can exempt this one literal by identity rather than by pattern: a
// secret-shaped literal anywhere else in the server is a violation, and this one is the sanctioned exception
// with its reason written next to it, in the SEC-1 carve-out discipline.
export const RELAXED_ENVIRONMENTS: ReadonlySet<string> = Object.freeze(new Set(['development', 'test']));
export const DEVELOPMENT_RELAXATION = 'development-only-value-not-a-secret';

export type SettingsSources = Readonly<{
  committed: readonly Readonly<{ label: string; values: unknown }>[];
  secrets: unknown;
  environment: Readonly<Record<string, string | undefined>>;
}>;

// DATA-5's ordering half, made structural. The claim says validation runs "at startup (not first-use)", and
// states it as a property of the validation rather than as an obligation on composition. The real requirement is
// that resolution completes before any seam exists that could read a setting, so `composeApp` calls this as its
// first statement and hands the frozen result to `createApp`, which cannot be constructed without it. Deleting
// the call is a type error rather than a silently weaker build, which is the lesson of the round 3 audit finding
// that `assertEndpointSpine` could be deleted from the composition with the whole suite green.
export function resolveSettings(sources: SettingsSources = defaultSources()): Settings {
  const problems: string[] = [];
  const resolved: Record<string, Record<string, unknown>> = {};

  // Closure, first, and on every committed layer independently. An undeclared key is REFUSED rather than
  // ignored, and the difference from the request surface is deliberate: there, an undeclared field is stripped
  // silently, because the author is a caller who may be hostile and has no expectations worth honouring. Here
  // the author is an operator who believes the key did something, and a setting that is set and never read is a
  // deploy that thinks it is configured. Same obligation, opposite remedy, and the discriminator is who wrote
  // the value.
  for (const layer of sources.committed) {
    refuseUndeclared(layer.label, layer.values, [], problems);
  }
  refuseUndeclared('the secret store', sources.secrets, [], problems);

  for (const [group, leaves] of Object.entries(SETTINGS_SPEC)) {
    resolved[group] = {};
    for (const [name, spec] of Object.entries(leaves)) {
      const key = `${group}.${name}`;
      const found = locate(key, spec, sources, problems);
      if (found !== undefined) {
        resolved[group][name] = found;
      }
    }
  }

  // Every missing key, not the first. The claim says "an error naming the missing key", singular, and a
  // validator that stops at the first turns a three-key misconfiguration into three failed deploys. The singular
  // phrasing is a defect no single-key test can surface, which is why it is recorded rather than followed.
  if (problems.length > 0) {
    throw new Error(
      `configuration is invalid, so the process is not starting (DATA-5). ${problems.length} problem(s):\n` +
        problems.map((problem) => `  ${problem}`).join('\n'),
    );
  }

  return Object.freeze({
    http: Object.freeze(resolved.http),
    logging: Object.freeze(resolved.logging),
    auth: Object.freeze(resolved.auth),
  }) as Settings;
}

// The environment variable name a key may be overridden by. Derived, never invented, so the env channel cannot
// carry a key the spec does not declare.
export function environmentNameFor(key: string): string {
  return `KERNEL_${key.replace(/\./g, '_').replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase()}`;
}

function locate(
  key: string,
  spec: SettingSpec,
  sources: SettingsSources,
  problems: string[],
): string | number | boolean | undefined {
  const fromEnvironment = sources.environment[environmentNameFor(key)];
  const layers: Array<{ label: string; raw: unknown }> = [];

  for (const layer of sources.committed) {
    const raw = read(layer.values, key);
    if (raw !== undefined) {
      layers.push({ label: layer.label, raw });
    }
  }
  const fromStore = read(sources.secrets, key);

  if (spec.secret) {
    // SEC-5's runtime half, and it is a closed rule rather than a heuristic. The claim asks for a config-shape
    // test failing the build "when secret-shaped keys hold non-placeholder values", and never defines
    // placeholder. Deciding it by entropy or length is a second heuristic underneath the first, which is the
    // shape E-2 records in the sibling's body-DTO scan. So the only permitted committed value is the empty
    // string and there is nothing left to judge.
    for (const layer of layers) {
      if (layer.raw !== '') {
        problems.push(
          `${key} is a secret and ${layer.label} carries a value for it. SEC-5: no credential appears in a committed file. The only permitted committed value is "", which declares the key without carrying it.`,
        );
        return undefined;
      }
    }
    if (fromStore === undefined && fromEnvironment === undefined) {
      // DATA-5's weakening note, taken at its word, and it is the one place in this round where the catalog was
      // ahead of the builder. A secret that must exist makes the composed app unconstructible on a fresh clone,
      // and every claim whose mechanism is "a scan over the composed app" then depends on a developer having
      // populated a store outside the tree. The note licenses exactly one way out: "Development environments may
      // relax specific checks (dev signing key from user-secrets), but each relaxation is conditional on the
      // environment name and visible in one place, never a silent default value in committed config."
      //
      // So: conditional on the environment name, in one place, and not in committed config. Outside that set the
      // absence is fatal, which is the half that has a red proof. The value is deliberately a sentence rather
      // than a plausible key, so that a relaxation which escaped to production would be visible in a decoded
      // token rather than merely weak.
      if (!RELAXED_ENVIRONMENTS.has(environmentName(sources))) {
        problems.push(
          `${key} is missing. It is a secret, so it resolves from the developer-local store at ${SECRET_STORE} or from ${environmentNameFor(key)}, never from a committed file.`,
        );
        return undefined;
      }
      return DEVELOPMENT_RELAXATION;
    }
    return coerce(key, spec, fromEnvironment ?? fromStore, problems);
  }

  if (fromStore !== undefined) {
    problems.push(
      `${key} is not a secret and the secret store carries it. A non-secret in the secret store is invisible to config review and cannot be varied per environment (CFG-1).`,
    );
    return undefined;
  }

  const raw = fromEnvironment ?? layers.at(-1)?.raw;
  if (raw === undefined) {
    problems.push(
      `${key} is missing. Declare it in server/config/settings.json, or override it with ${environmentNameFor(key)}. ${spec.why}.`,
    );
    return undefined;
  }
  return coerce(key, spec, raw, problems);
}

// Env values are strings and committed values are already typed, so coercion runs on both and is strict in
// either direction. A silent NaN is the failure DATA-5 exists to prevent, dressed as a working start.
function coerce(
  key: string,
  spec: SettingSpec,
  raw: unknown,
  problems: string[],
): string | number | boolean | undefined {
  const bad = (why: string): undefined => {
    problems.push(`${key} is invalid: ${why}.`);
    return undefined;
  };

  if (spec.kind === 'number') {
    const value = typeof raw === 'number' ? raw : Number(String(raw).trim());
    if (typeof raw !== 'number' && String(raw).trim() === '') {
      return bad('expected a number and found an empty value');
    }
    return Number.isFinite(value) ? value : bad(`expected a number and found ${JSON.stringify(raw)}`);
  }

  if (spec.kind === 'boolean') {
    if (typeof raw === 'boolean') {
      return raw;
    }
    if (raw === 'true' || raw === 'false') {
      return raw === 'true';
    }
    return bad(`expected a boolean and found ${JSON.stringify(raw)}`);
  }

  if (typeof raw !== 'string') {
    return bad(`expected a string and found ${typeof raw}`);
  }
  if (raw === '') {
    return bad('is empty. Nothing limps on a blank setting');
  }
  if (spec.kind === 'url') {
    if (!URL.canParse(raw)) {
      return bad(`expected an absolute URL and found ${JSON.stringify(raw)}`);
    }
  }
  return raw;
}

function environmentName(sources: SettingsSources): string {
  return sources.environment.NODE_ENV ?? 'development';
}

function read(values: unknown, key: string): unknown {
  let node: unknown = values;
  for (const segment of key.split('.')) {
    if (node === null || typeof node !== 'object') {
      return undefined;
    }
    node = (node as Record<string, unknown>)[segment];
  }
  return node;
}

function refuseUndeclared(label: string, values: unknown, at: readonly string[], problems: string[]): void {
  if (values === null || typeof values !== 'object' || Array.isArray(values)) {
    if (values !== undefined) {
      problems.push(`${label} is ${values === null ? 'null' : typeof values}, not an object.`);
    }
    return;
  }
  for (const [name, child] of Object.entries(values as Record<string, unknown>)) {
    const key = [...at, name];
    const declared = read(SETTINGS_SPEC, key.join('.'));
    if (declared === undefined) {
      problems.push(
        `${label} sets '${key.join('.')}', which SETTINGS_SPEC does not declare. A key nobody declared is a value nobody reads, and a deploy that believes it configured something.`,
      );
      continue;
    }
    if (!isLeaf(declared)) {
      refuseUndeclared(label, child, key, problems);
    }
  }
}

function isLeaf(node: SpecNode | unknown): node is SettingSpec {
  return node !== null && typeof node === 'object' && 'kind' in (node as Record<string, unknown>);
}

// The layers, in precedence order, lowest first: the committed base, the committed per-environment overlay, then
// the out-of-tree secret store for secret leaves, then the derived environment variable for a deploy-time
// override. `NODE_ENV` selects the overlay and is read here, in the one module permitted to read the
// environment at all.
function defaultSources(): SettingsSources {
  const environment = process.env;
  const name = environment.NODE_ENV ?? 'development';
  const committed = [
    { label: 'server/config/settings.json', file: path.join(CONFIG_DIRECTORY, 'settings.json'), required: true },
    {
      label: `server/config/settings.${name}.json`,
      file: path.join(CONFIG_DIRECTORY, `settings.${name}.json`),
      required: false,
    },
  ];

  return Object.freeze({
    committed: Object.freeze(
      committed
        .filter((layer) => layer.required || existsSync(layer.file))
        .map((layer) => Object.freeze({ label: layer.label, values: readJson(layer.label, layer.file) })),
    ),
    secrets: existsSync(SECRET_STORE) ? readJson(SECRET_STORE, SECRET_STORE) : undefined,
    environment,
  });
}

function readJson(label: string, file: string): unknown {
  if (!existsSync(file)) {
    throw new Error(
      `configuration is invalid, so the process is not starting (DATA-5). ${label} does not exist, and the committed base layer is mandatory.`,
    );
  }
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (cause) {
    throw new Error(
      `configuration is invalid, so the process is not starting (DATA-5). ${label} is not readable JSON: ${String(cause)}`,
    );
  }
}
