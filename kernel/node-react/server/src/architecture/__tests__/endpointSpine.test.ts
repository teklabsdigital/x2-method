import { describe, expect, it } from 'vitest';
import { composeApp } from '../../compose.ts';
import { freshDatabase } from '../../persistence/__tests__/support.ts';
import { ANONYMOUS_ROUTES, POLICIES } from '../../platform/authorization.ts';
import { registerHealth } from '../../routes/health.ts';
import { scanEndpointSpine } from '../endpointSpine.ts';

const NO_QUERY = { type: 'object', properties: {}, additionalProperties: false } as const;

// SEC-1, SEC-2, SEC-3 and TEN-1 over THE composed app. Every assertion here reaches the app through `composeApp`
// and never through `createApp`, because a scan is a statement about whatever app it was handed and an app built
// in this file is an app nobody serves. A lint enforces it, so the discipline is not a convention.
//
// These tests are the green half. The red half, which is what makes them mean anything, is in
// `spineRefusals.test.ts`: this file cannot both scan the real app and plant violations in it.

describe('the composed app satisfies the endpoint spine', () => {
  it('has no violation of SEC-1, SEC-2, SEC-3 or TEN-1', async () => {
    const app = await composeApp({}, { database: freshDatabase() });
    expect(scanEndpointSpine(app.routeTable)).toEqual([]);
    await app.close();
  });

  it('scans a table that is not trivially small, so an empty result is not an empty scan', async () => {
    // A green scan over one route proves close to nothing, and a green scan over zero routes proves nothing at
    // all while looking identical. The composed app carries a gated read, a gated read with a path parameter, a
    // gated write with a body contract, an anonymous liveness route, and the HEAD Fastify synthesizes for each
    // GET, which is what gives every branch of the scan something to look at.
    const app = await composeApp({}, { database: freshDatabase() });

    expect(app.routeTable.length).toBeGreaterThanOrEqual(7);
    expect(app.routeTable.some((route) => route.schema.body !== undefined)).toBe(true);
    expect(app.routeTable.some((route) => route.url.includes(':'))).toBe(true);
    expect(app.routeTable.some((route) => route.config.policy === POLICIES['notes.read'])).toBe(true);
    expect(app.routeTable.filter((route) => route.method === 'HEAD').length).toBeGreaterThan(0);

    await app.close();
  });

  it('gates every route it serves, and allowlists exactly one anonymous surface', async () => {
    const app = await composeApp({}, { database: freshDatabase() });

    const anonymous = app.routeTable.filter((route) => typeof route.config.policy === 'string');
    expect(anonymous.map((route) => `${route.method} ${route.url}`).sort()).toEqual([
      'GET /health',
      // A-1: nobody wrote this route and it is reachable, so SEC-1 has to have an answer for it. The answer is
      // that it rides on its GET's allowlist entry, and only because it provably IS its GET: Fastify hands a
      // synthesized HEAD the same options object, so the config is the same reference and not merely equal.
      'HEAD /health',
    ]);
    expect(ANONYMOUS_ROUTES).toHaveLength(1);

    await app.close();
  });

  it('refuses to compose at all when a surface violates the spine, so the scan is wired and not merely written', async () => {
    // The round 3 audit's finding, made permanent. Round 3 recorded "the server refuses to boot on each, naming
    // the claim" in its proof table, and that was true of a manual injection and of nothing that ran: deleting
    // `assertEndpointSpine(app.routeTable)` from `composeApp`, and its import with it, left 72 tests green, tsc
    // clean and eslint clean. The scan was proven; the wiring between the composition and the scan was not.
    //
    // Each case below composes through the REAL `composeApp`, so it fails if the call is removed, if it is moved
    // before `ready()` where the table is still empty, or if its throw is swallowed.
    const violating: Array<[string, string, (app: Parameters<typeof registerHealth>[0]) => Promise<void>]> = [
      ['SEC-1', 'an ungated route', async (app) => {
        app.get('/ungated', { schema: { querystring: NO_QUERY } }, async () => ({}));
      }],
      ['SEC-3', 'a PII query parameter', async (app) => {
        app.get('/search', {
          config: { policy: POLICIES['notes.read'] },
          schema: { querystring: { type: 'object', properties: { email: { type: 'string' } }, additionalProperties: false } },
        }, async () => ({}));
      }],
      ['TIME-1', 'a time-named bare string in a body contract', async (app) => {
        app.post('/schedule', {
          config: { policy: POLICIES['notes.write'] },
          schema: {
            querystring: NO_QUERY,
            body: { type: 'object', properties: { startsAt: { type: 'string' } }, additionalProperties: false },
          },
        }, async () => ({}));
      }],
      ['TIME-1', 'a time-named bare string in a query string', async (app) => {
        app.get('/since', {
          config: { policy: POLICIES['notes.read'] },
          schema: {
            querystring: { type: 'object', properties: { updatedSince: { type: 'string' } }, additionalProperties: false },
          },
        }, async () => ({}));
      }],
      ['TEN-1', 'a tenant field in a contract', async (app) => {
        app.post('/x', {
          config: { policy: POLICIES['notes.write'] },
          schema: {
            querystring: NO_QUERY,
            body: { type: 'object', properties: { tenantId: { type: 'string' } }, additionalProperties: false },
          },
        }, async () => ({}));
      }],
    ];

    for (const [claim, label, register] of violating) {
      await expect(
        composeApp({}, { database: freshDatabase() }, [registerHealth, register]),
        `${claim}: ${label}`,
      ).rejects.toThrow(claim);
    }

    // Non-vacuity: the same call with the real surfaces composes, so the rejections above are the violation and
    // not the seam itself failing.
    const app = await composeApp({}, { database: freshDatabase() });
    expect(app.routeTable.length).toBeGreaterThan(0);
    await app.close();
  });

  // TIME-1's green half, made non-vacuous. A scan for naive datetimes over a tree with no time values in it is
  // green for the same reason an empty scan is, so the exemplar carries one and it is declared in the permitted
  // shape.
  it('carries a real time value on the contract surface, declared offset-bearing', async () => {
    const app = await composeApp({}, { database: freshDatabase() });

    const timeFields = app.routeTable.flatMap((route) => {
      const response = (route.schema.response ?? {}) as Record<string, { properties?: Record<string, { format?: string }> }>;
      return Object.values(response).flatMap((body) => Object.entries(body.properties ?? {}));
    });

    expect(timeFields.some(([name]) => name === 'createdAtUtc')).toBe(true);
    // RFC3339 requires an offset, so this format IS the claim's "UTC-anchored offset-aware" shape. It is also
    // the only place in this edition where the platform supplies it: the in-memory value is a JS Date, which is
    // an instant with the originating offset discarded.
    expect(timeFields.filter(([name]) => name === 'createdAtUtc').every(([, schema]) => schema.format === 'date-time')).toBe(true);

    await app.close();
  });

  // CFG-1 and DATA-5 reach the composed app, and this is the wiring assertion rather than a settings assertion.
  // The settings are on the instance because `createApp` cannot be constructed without them, so a composition
  // that skipped resolution would not compile. The frozen check is the same discipline the route table gets.
  it('composes with settings resolved before the instance exists, and does not let them be rewritten', async () => {
    const app = await composeApp({}, { database: freshDatabase() });

    expect(app.settings.http.port).toBe(5080);
    expect(Object.isFrozen(app.settings)).toBe(true);
    expect(() => {
      (app as unknown as { settings: unknown }).settings = { http: { port: 1 } };
    }).toThrow();

    await app.close();
  });

  it('refuses every gated route to a caller presenting no credential', async () => {
    // Renamed and rewritten when the verifier landed, because both its name and its reason had become false and
    // its stated purpose was the one thing it cannot do (E-90). It read "because the mint is owed", and the mint
    // is no longer owed: `composeApp` installs `bearerCredential`, so these 401s are now a verifier refusing an
    // absent Authorization header rather than a seam that can produce nothing.
    //
    // The claim it used to make was that "if a mint ever lands without wiring, this test goes red rather than the
    // server quietly opening". Measured on the day the mint landed: deleting the wiring from `composeApp` left
    // this test GREEN, because an unwired seam answers 401 and so does a wired one with no header, and a test that
    // asserts a status code cannot tell the two apart. The tests that DID go red are the ones asserting 200, 201
    // and 403 in `tokenVerification.test.ts`, because only a success can distinguish a gate that works from a gate
    // that is missing.
    //
    // What this test is actually worth is stated plainly instead: no gated route is reachable anonymously, and
    // `/health` is. That is SEC-1's sentence, it is true, and it is not a statement about SEC-4 at all.
    const app = await composeApp({}, { database: freshDatabase() });

    const seen: Array<[string, number]> = [];
    for (const route of app.routeTable.filter((candidate) => candidate.method === 'GET')) {
      const url = route.url.replace(/:[A-Za-z0-9_]+/g, 'x');
      seen.push([url, (await app.inject({ method: 'GET', url })).statusCode]);
    }

    expect(seen.sort()).toEqual([
      ['/health', 200],
      ['/notes', 401],
      ['/notes/x', 401],
    ]);

    await app.close();
  });
});
