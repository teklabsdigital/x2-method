import { describe, expect, it } from 'vitest';
import {
  DEVELOPMENT_RELAXATION,
  EDITION_ROOT,
  SECRET_STORE,
  SETTINGS_SPEC,
  environmentNameFor,
  resolveSettings,
  type SettingsSources,
} from '../settings.ts';
import path from 'node:path';

// DATA-5, CFG-1 and SEC-5's runtime half. Every guard below has a red proof, because the round 3 audit found
// three mechanisms in this edition that shipped without ever executing: two carve-out branches and the refusal
// inside `definePolicies`. A guard nobody has run is a guard nobody has proven, and the shape it fails in is
// always the shape nobody imagined.

const complete = {
  http: { port: 5080, host: '127.0.0.1' },
  database: { file: '.data/kernel.db' },
  logging: { level: 'info' },
  auth: { issuer: 'https://kernel.invalid/issuer', audience: 'kernel-api', signingKey: '' },
};

const sources = (over: Partial<SettingsSources> = {}): SettingsSources => ({
  committed: [{ label: 'settings.json', values: structuredClone(complete) }],
  secrets: { auth: { signingKey: 'a-real-development-key' } },
  environment: { NODE_ENV: 'production' },
  ...over,
});

describe('DATA-5: mandatory configuration fails fast', () => {
  it('resolves a complete configuration and freezes it', () => {
    const settings = resolveSettings(sources());

    expect(settings.http.port).toBe(5080);
    expect(settings.auth.signingKey).toBe('a-real-development-key');
    expect(Object.isFrozen(settings)).toBe(true);
    expect(Object.isFrozen(settings.auth)).toBe(true);
  });

  it.each([
    ['http.port', (values: typeof complete) => delete (values.http as Partial<typeof complete.http>).port],
    ['logging.level', (values: typeof complete) => delete (values.logging as Partial<typeof complete.logging>).level],
    ['auth.issuer', (values: typeof complete) => delete (values.auth as Partial<typeof complete.auth>).issuer],
  ])('refuses to start when %s is absent, and names the key', (key, remove) => {
    const values = structuredClone(complete);
    remove(values);

    expect(() => resolveSettings(sources({ committed: [{ label: 'settings.json', values }] }))).toThrow(key);
  });

  // The claim says "an error naming the missing key", singular. A validator that stops at the first turns a
  // three-key misconfiguration into three failed deploys, so all of them are reported and the singular phrasing
  // is recorded as a defect rather than followed.
  it('reports every missing key at once, not the first', () => {
    const values = structuredClone(complete);
    delete (values.http as Partial<typeof complete.http>).port;
    delete (values.logging as Partial<typeof complete.logging>).level;
    delete (values.auth as Partial<typeof complete.auth>).audience;

    expect(() => resolveSettings(sources({ committed: [{ label: 'settings.json', values }] }))).toThrow(
      /3 problem\(s\)[\s\S]*http\.port[\s\S]*logging\.level[\s\S]*auth\.audience/,
    );
  });

  it.each([
    ['a non-numeric port', { http: { port: 'eighty', host: 'h' } }],
    ['an empty string setting', { logging: { level: '' } }],
  ])('refuses %s rather than coercing it to a working start', (_label, overlay) => {
    const values = { ...structuredClone(complete), ...overlay };

    expect(() => resolveSettings(sources({ committed: [{ label: 'settings.json', values }] }))).toThrow(/invalid/);
  });

  // Closure, and the remedy is the opposite of the request surface's. There an undeclared field is stripped in
  // silence because the author may be hostile; here an undeclared key is refused loudly because the author is an
  // operator who believes it did something.
  it('refuses a committed key the spec does not declare, rather than ignoring it', () => {
    const values = { ...structuredClone(complete), http: { ...complete.http, timeoutMs: 30_000 } };

    expect(() => resolveSettings(sources({ committed: [{ label: 'settings.json', values }] }))).toThrow(
      /http\.timeoutMs.*does not declare/s,
    );
  });
});

describe('CFG-1: the environment is a declared channel, not a fourth home', () => {
  it('derives the override name from the key rather than accepting an invented one', () => {
    expect(environmentNameFor('http.port')).toBe('KERNEL_HTTP_PORT');
    expect(environmentNameFor('auth.signingKey')).toBe('KERNEL_AUTH_SIGNING_KEY');
  });

  it('lets a declared key be overridden per environment', () => {
    const settings = resolveSettings(
      sources({ environment: { NODE_ENV: 'production', KERNEL_HTTP_PORT: '9191' } }),
    );

    expect(settings.http.port).toBe(9191);
  });

  it('coerces an override strictly, so a typo fails the start rather than becoming NaN', () => {
    expect(() =>
      resolveSettings(sources({ environment: { NODE_ENV: 'production', KERNEL_HTTP_PORT: '91 91' } })),
    ).toThrow(/http\.port is invalid/);
  });

  // The overlay is what makes committed configuration per-environment, which is one of the two reasons CFG-1
  // gives for a literal in code being the wrong home.
  it('layers a per-environment overlay over the committed base', () => {
    const settings = resolveSettings(
      sources({
        committed: [
          { label: 'settings.json', values: structuredClone(complete) },
          { label: 'settings.production.json', values: { http: { host: '0.0.0.0' } } },
        ],
      }),
    );

    expect(settings.http.host).toBe('0.0.0.0');
    expect(settings.http.port).toBe(5080);
  });
});

describe('SEC-5: no secret in committed configuration', () => {
  it('refuses a committed value for a secret key, and the only permitted one is the empty placeholder', () => {
    const values = { ...structuredClone(complete), auth: { ...complete.auth, signingKey: 'sk-live-oops' } };

    expect(() => resolveSettings(sources({ committed: [{ label: 'settings.json', values }] }))).toThrow(
      /auth\.signingKey is a secret and settings\.json carries a value/,
    );
  });

  it('resolves a secret from the out-of-tree store', () => {
    expect(resolveSettings(sources()).auth.signingKey).toBe('a-real-development-key');
  });

  it('refuses a non-secret smuggled into the secret store, where config review cannot see it', () => {
    expect(() =>
      resolveSettings(sources({ secrets: { auth: { signingKey: 'a-real-development-key' }, logging: { level: 'debug' } } })),
    ).toThrow(/logging\.level is not a secret and the secret store carries it/);
  });

  it('places the store outside the edition tree, which is a property of the path and not of a gitignore', () => {
    expect(path.relative(EDITION_ROOT, SECRET_STORE).startsWith('..')).toBe(true);
  });

  // DATA-5's weakening note licenses exactly one relaxation: conditional on the environment name, visible in one
  // place, never a silent default in committed config. Both halves are proven, and the fatal half is the one
  // that matters.
  it('relaxes a missing secret in development and in test, and only there', () => {
    for (const name of ['development', 'test']) {
      const settings = resolveSettings(sources({ secrets: undefined, environment: { NODE_ENV: name } }));
      expect(settings.auth.signingKey).toBe(DEVELOPMENT_RELAXATION);
    }
  });

  it.each(['production', 'staging', 'ci'])('refuses to start in %s with the secret absent', (name) => {
    expect(() => resolveSettings(sources({ secrets: undefined, environment: { NODE_ENV: name } }))).toThrow(
      /auth\.signingKey is missing/,
    );
  });
});

describe('what the spec declares is what the resolver returns (DATA-5, E-93)', () => {
  it('delivers every group the spec declares, not a hand-written subset', () => {
    // The guard for E-93. `resolveSettings` used to validate by enumerating `SETTINGS_SPEC` and then RETURN a
    // literal naming three groups, so a fourth group added to the spec was declared, validated, refused when
    // missing, resolved from the correct layer, and then dropped on the way out with no error anywhere. The
    // `as Settings` cast is what stopped the compiler from reporting it, and a cast is not a check.
    expect(Object.keys(resolveSettings()).sort()).toEqual(Object.keys(SETTINGS_SPEC).sort());
  });

  it('delivers every leaf of every group, so a dropped key inside a group is caught too', () => {
    // The same defect one level down, which the group-level assertion above cannot see: a group can arrive with
    // some of its leaves missing and still be present by name.
    const resolved = resolveSettings() as unknown as Record<string, Record<string, unknown>>;
    for (const [group, leaves] of Object.entries(SETTINGS_SPEC)) {
      expect(Object.keys(resolved[group]).sort()).toEqual(Object.keys(leaves).sort());
    }
  });
});
