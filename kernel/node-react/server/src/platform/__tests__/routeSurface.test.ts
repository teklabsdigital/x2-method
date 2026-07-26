import { describe, expect, it } from 'vitest';
import { createApp } from '../../app.ts';
import { ANONYMOUS } from '../authorization.ts';
import { resolveSettings } from '../settings.ts';

// Every instance in this file needs resolved settings, because `createApp` cannot be constructed without
// them: DATA-5's "at startup, not first-use" is an obligation on composition, so the type system carries it.
const SETTINGS = resolveSettings();

// The completeness proof for the route table, red-green in both directions. These tests do not assert any claim;
// they assert the property every route-scanning claim will stand on, which is that a route cannot exist without
// appearing in `routeTable`, and that what the table says about a route is what the router actually holds. If
// this file is wrong, every scan built on it is vacuous and green.
//
// Every case in "attacks" below is an evasion an audit actually drove through an earlier version of this
// mechanism, kept here so that a regression is a failing test rather than a fresh audit.

// The declaration every route owes for its query string, spelled out once. Declaring "no query parameters" is
// itself a declaration, because an omitted querystring schema is indistinguishable from a route that reads
// `request.query` and hopes nobody scans it.
const NO_QUERY = { type: 'object', properties: {}, additionalProperties: false } as const;

// SEC-1's deny-by-default hook is installed by `createApp`, so every request in this file passes it before it
// reaches anything these tests are about. A route that wants to be REACHED here declares itself anonymous; the
// allowlist that would normally constrain that lives in the endpoint-spine scan, not in `createApp`, precisely
// so that the completeness mechanism and the claim predicates stay separable. Routes that are only ever counted
// in the table declare nothing, because the table records what was registered whether or not it is reachable.
const OPEN = { policy: ANONYMOUS } as const;

// Boots an app and returns the error message if registration or ready() refused it, or null if it booted.
async function bootFailure(register: (app: ReturnType<typeof createApp>) => unknown): Promise<string | null> {
  const app = createApp(SETTINGS);
  try {
    await register(app);
    await app.ready();
    return null;
  } catch (error) {
    return (error as Error).message;
  } finally {
    await app.close().catch(() => {});
  }
}

describe('the recorder catches every registration form', () => {
  it('records sugar, desugared, encapsulated, nested, and generated routes', async () => {
    const app = createApp(SETTINGS);

    app.get('/plain', { schema: { querystring: NO_QUERY } }, async () => ({ ok: true }));
    app.route({
      method: 'POST',
      url: '/desugared',
      schema: { querystring: NO_QUERY, body: { type: 'object', properties: {}, additionalProperties: false } },
      handler: async () => ({ ok: true }),
    });
    await app.register(
      async (child) => {
        child.get('/in-plugin', { schema: { querystring: NO_QUERY } }, async () => ({ ok: true }));
        await child.register(
          async (grandchild) => {
            grandchild.get('/deep', { schema: { querystring: NO_QUERY } }, async () => ({ ok: true }));
          },
          { prefix: '/nested' },
        );
        for (const name of ['alpha', 'beta']) {
          child.get(`/generated/${name}`, { schema: { querystring: NO_QUERY } }, async () => ({ ok: true }));
        }
      },
      { prefix: '/mod' },
    );
    await app.ready();

    const seen = app.routeTable.map((route) => `${route.method} ${route.url}`).sort();
    expect(seen).toEqual([
      // Every GET carries an auto-registered HEAD (Fastify's exposeHeadRoutes default), and the recorder sees
      // those too. This is not noise: a HEAD route is a reachable surface nobody wrote, so every per-route
      // predicate a claim asserts has to hold for it as well. Enumerating it is what makes that possible.
      'GET /mod/generated/alpha',
      'GET /mod/generated/beta',
      'GET /mod/in-plugin',
      'GET /mod/nested/deep',
      'GET /plain',
      'HEAD /mod/generated/alpha',
      'HEAD /mod/generated/beta',
      'HEAD /mod/in-plugin',
      'HEAD /mod/nested/deep',
      'HEAD /plain',
      'POST /desugared',
    ]);
    await app.close();
  });

  it('is not shadowed by a child that registers its own onRoute hook', async () => {
    // A child hook must ADD to the parent's, not replace it. If it replaced it, a module could opt itself out of
    // every scan by registering an empty hook, which would be a silent escape hatch with no diff to review.
    const app = createApp(SETTINGS);
    await app.register(async (child) => {
      child.addHook('onRoute', () => {});
      child.get('/shadowed', { schema: { querystring: NO_QUERY } }, async () => ({ ok: true }));
    });
    await app.ready();

    expect(app.routeTable.map((route) => `${route.method} ${route.url}`)).toEqual([
      'GET /shadowed',
      'HEAD /shadowed',
    ]);
    await app.close();
  });

  it('records each method of a multi-method registration separately', async () => {
    const app = createApp(SETTINGS);
    app.route({
      method: ['GET', 'HEAD'],
      url: '/both',
      schema: { querystring: NO_QUERY },
      handler: async () => ({ ok: true }),
    });
    await app.ready();

    expect(app.routeTable.map((route) => route.method).sort()).toEqual(['GET', 'HEAD']);
    await app.close();
  });

  it('distinguishes routes that differ only by constraint', async () => {
    // Two routes, same method, same URL, different host. Dropping `constraints` from the recorded shape turned
    // these into byte-identical rows, so a scan that deduped would have seen one route where two existed.
    const app = createApp(SETTINGS);
    for (const host of ['a.example', 'b.example']) {
      app.route({
        method: 'GET',
        url: '/constrained',
        constraints: { host },
        schema: { querystring: NO_QUERY },
        handler: async () => ({ host }),
      });
    }
    await app.ready();

    const rows = app.routeTable.map((route) => JSON.stringify(route));
    expect(new Set(rows).size).toBe(rows.length);
    expect(app.routeTable.filter((route) => route.constraints.host === 'b.example')).toHaveLength(2);
    await app.close();
  });

  it('refuses a route registered after the app is composed, so the table is not merely a snapshot', async () => {
    // The framework refuses it, so the table taken at ready() is the whole table for the process lifetime.
    //
    // The assertion is on the SET of refusal codes, not on one of them, and that is a measured fact rather than
    // caution. Which guard fires depends on instance state: a bare instance refuses through avvio with
    // AVV_ERR_ROOT_PLG_BOOTED, and an instance carrying an onReady hook, which every app from createApp does,
    // refuses through Fastify with FST_ERR_INSTANCE_ALREADY_LISTENING. Pinning either one alone produced a test
    // that broke when an unrelated hook was added, which is the wrong sensitivity: the property under test is
    // that registration is refused, not which layer refuses it.
    const app = createApp(SETTINGS);
    await app.ready();

    let code: string | undefined;
    try {
      app.get('/after-ready', { schema: { querystring: NO_QUERY } }, async () => ({ ok: true }));
    } catch (error) {
      code = (error as { code?: string }).code;
    }
    expect(['AVV_ERR_ROOT_PLG_BOOTED', 'FST_ERR_INSTANCE_ALREADY_LISTENING']).toContain(code);
    await app.close();
  });

  it('reconciles a deeply nested, prefixed, parameterized tree with the router', async () => {
    // Regression test for the reconciler's own parser. `printRoutes` renders a TREE, so a nested line carries
    // only its own segment; reading each line as a whole path made this shape report a false disagreement.
    const app = createApp(SETTINGS);
    await app.register(
      async (child) => {
        child.get('/thing/:id/sub', {
          schema: {
            querystring: NO_QUERY,
            params: { type: 'object', properties: { id: { type: 'string' } }, additionalProperties: false },
          },
        }, async () => ({ ok: true }));
      },
      { prefix: '/mod' },
    );
    await app.ready();

    expect(app.routeTable.map((route) => route.url)).toEqual(['/mod/thing/:id/sub', '/mod/thing/:id/sub']);
    await app.close();
  });
});

describe('attacks: the table cannot be made to disagree with what is served', () => {
  it('captures a url a later onRoute hook rewrote', async () => {
    // Fastify runs onRoute hooks in registration order and registers what the LAST hook leaves behind. The
    // recorder is registered first, so snapshotting there recorded a route the router never got: the table said
    // /decoy while the server served /admin/impersonate. Materializing at onReady is what closes it.
    const app = createApp(SETTINGS);
    app.addHook('onRoute', (route) => {
      if (route.url === '/decoy') {
        route.url = '/admin/impersonate';
      }
    });
    app.get('/decoy', { config: OPEN, schema: { querystring: NO_QUERY } }, async () => ({ ok: true }));
    await app.ready();

    expect(app.routeTable.map((route) => route.url)).toEqual(['/admin/impersonate', '/admin/impersonate']);
    expect((await app.inject({ method: 'GET', url: '/admin/impersonate' })).statusCode).toBe(200);
    // 403 rather than 404, because SEC-1's fallback answers before routing can decide there is nothing here.
    // The property under test is unchanged: the url the table names is the url that serves.
    expect((await app.inject({ method: 'GET', url: '/decoy' })).statusCode).toBe(403);
    await app.close();
  });

  it('refuses a method a later onRoute hook rewrote into one that owes a contract', async () => {
    const message = await bootFailure((app) => {
      app.addHook('onRoute', (route) => {
        if (route.url === '/swap') {
          route.method = 'DELETE';
        }
      });
      app.get('/swap', { schema: { querystring: NO_QUERY } }, async () => ({ ok: true }));
    });
    expect(message).toMatch(/DELETE \/swap: schema\.body is missing/);
  });

  it('refuses a schema a later onRoute hook stripped', async () => {
    // The nastiest of the three: the table carried a fully declared body contract over a route that validated
    // nothing, so a body scan would have read the declaration and passed.
    const message = await bootFailure((app) => {
      app.addHook('onRoute', (route) => {
        if (route.url === '/notes') {
          route.schema = undefined;
        }
      });
      app.post('/notes', {
        schema: {
          querystring: NO_QUERY,
          body: { type: 'object', required: ['title'], properties: { title: { type: 'string' } }, additionalProperties: false },
        },
      }, async () => ({ ok: true }));
    });
    expect(message).toMatch(/POST \/notes: schema\.body is missing/);
  });

  it('refuses reassignment of the table', async () => {
    const app = createApp(SETTINGS);
    app.get('/still-here', { config: OPEN, schema: { querystring: NO_QUERY } }, async () => ({ ok: true }));
    await app.ready();

    expect(() => {
      // @ts-expect-error the fastify augmentation declares routeTable readonly, so this must not compile. The
      // directive is the compile-time half of the assertion: if the property ever becomes writable again, tsc
      // fails on an unused ts-expect-error and this test file stops building.
      app.routeTable = [];
    }).toThrow(TypeError);
    expect(app.routeTable).toHaveLength(2);
    expect((await app.inject({ method: 'GET', url: '/still-here' })).statusCode).toBe(200);
    await app.close();
  });

  it('refuses mutation of a recorded entry and of the table itself', async () => {
    const app = createApp(SETTINGS);
    app.get('/frozen', { schema: { querystring: NO_QUERY } }, async () => ({ ok: true }));
    await app.ready();

    expect(() => {
      (app.routeTable[0] as { url: string }).url = '/lies';
    }).toThrow(TypeError);
    expect(() => {
      (app.routeTable as unknown[]).push({});
    }).toThrow(TypeError);
    expect(app.routeTable[0].url).toBe('/frozen');
    await app.close();
  });
});

describe('a route that exposes a surface it does not declare cannot be registered', () => {
  it('refuses a body-bearing route with no schema at all', async () => {
    expect(await bootFailure((app) => app.post('/x', async () => ({})))).toMatch(/schema\.body is missing/);
  });

  it('refuses a body-bearing route whose schema omits the body clause', async () => {
    expect(await bootFailure((app) => app.post('/x', { schema: { querystring: NO_QUERY } }, async () => ({})))).toMatch(
      /schema\.body is missing/,
    );
  });

  it.each(['DELETE', 'OPTIONS'])('refuses %s, which binds a body despite not being POST, PUT or PATCH', async (method) => {
    // The first version enumerated POST, PUT and PATCH as the body-bearing set and was wrong: Fastify parses and
    // binds a body on both of these, and an audit read `{"secret":"value"}` straight off `request.body`.
    const message = await bootFailure((app) =>
      app.route({ method: method as 'DELETE', url: '/x', schema: { querystring: NO_QUERY }, handler: async () => ({}) }),
    );
    expect(message).toMatch(/schema\.body is missing/);
  });

  it('refuses a custom method registered through addHttpMethod', async () => {
    // The allowlist is GET and HEAD, so a method this codebase has never heard of owes a contract by default
    // rather than escaping by not being on a list.
    const message = await bootFailure((app) => {
      app.addHttpMethod('QUERY', { hasBody: true });
      app.route({ method: 'QUERY' as 'GET', url: '/custom', schema: { querystring: NO_QUERY }, handler: async () => ({}) });
    });
    expect(message).toMatch(/schema\.body is missing/);
  });

  it('refuses a route that declares no query string, because a query string has no syntactic tell', async () => {
    expect(await bootFailure((app) => app.get('/search', async () => ({})))).toMatch(/schema\.querystring is missing/);
  });

  it('refuses a path parameter with no params schema', async () => {
    expect(
      await bootFailure((app) => app.get('/x/:secret', { schema: { querystring: NO_QUERY } }, async () => ({}))),
    ).toMatch(/schema\.params is missing/);
  });

  it('refuses a wildcard route, which is unenumerable by construction', async () => {
    expect(await bootFailure((app) => app.get('/x/*', { schema: { querystring: NO_QUERY } }, async () => ({})))).toMatch(
      /unenumerable/,
    );
  });

  it('refuses app.all(), which cannot carry a per-method contract', async () => {
    expect(await bootFailure((app) => app.all('/every', { schema: { querystring: NO_QUERY } }, async () => ({})))).toMatch(
      /mixes bodyless methods/,
    );
  });

  it('refuses a bodyless method that declares a body the framework will never bind', async () => {
    // Refused, but by Fastify rather than by this edition: the framework rejects a body schema on a bodyless
    // method during registration, before the onReady materialization runs. The obligation in app.ts is kept
    // anyway, because it must hold for methods Fastify does not police and it must not depend on the framework
    // continuing to police this one.
    expect(
      await bootFailure((app) =>
        app.route({
          method: 'HEAD',
          url: '/x',
          schema: { querystring: NO_QUERY, body: { type: 'object', properties: {}, additionalProperties: false } },
          handler: async () => ({}),
        }),
      ),
    ).toMatch(/[Bb]ody validation schema|declares schema\.body/);
  });

  it('refuses the same evasion buried in a nested plugin', async () => {
    expect(
      await bootFailure((app) =>
        app.register(
          async (child) => {
            child.post('/deep', async () => ({}));
          },
          { prefix: '/mod' },
        ),
      ),
    ).toMatch(/schema\.body is missing/);
  });
});

describe('a declared surface has to be readable, not merely present', () => {
  // Every one of these satisfies "is not undefined", which is what the first version checked, and none of them
  // constrains anything. An audit posted `{"anything":"at all"}` through all four and got 200.
  const vacuous: Array<[string, unknown]> = [
    ['an empty object', {}],
    ['true', true],
    ['false', false],
    ['null', null],
    ['a non-object type', { type: 'string' }],
    ['an object with no properties clause', { type: 'object', additionalProperties: false }],
    ['an open object', { type: 'object', properties: { title: { type: 'string' } } }],
    ['a $ref no scan can follow', { $ref: 'elsewhere#' }],
  ];

  it.each(vacuous)('refuses a body schema that is %s', async (_label, body) => {
    const message = await bootFailure((app) =>
      app.post('/x', { schema: { querystring: NO_QUERY, body } }, async () => ({})),
    );
    expect(message).not.toBeNull();
  });

  it('strips every field the schema does not name, on the body and on the query string', async () => {
    // Why `additionalProperties: false` is required rather than encouraged. Fastify validates with
    // `removeAdditional`, so a closed schema is a filter and not just a description: the handler cannot receive
    // a field the declaration does not name. That is what makes a scan over the declaration a true statement
    // about what arrives, and it is the whole reason the shape check refuses an open object.
    const app = createApp(SETTINGS);
    app.post('/notes', {
      config: OPEN,
      schema: {
        querystring: NO_QUERY,
        body: { type: 'object', properties: { title: { type: 'string' } }, additionalProperties: false },
      },
    }, async (request) => ({ body: request.body }));
    app.get('/list', {
      config: OPEN,
      schema: { querystring: { type: 'object', properties: { page: { type: 'string' } }, additionalProperties: false } },
    }, async (request) => ({ query: request.query }));
    await app.ready();

    const posted = await app.inject({
      method: 'POST',
      url: '/notes',
      payload: { title: 'ok', tenantId: 'evil', createdBy: 'evil' },
    });
    expect(posted.json()).toEqual({ body: { title: 'ok' } });

    const listed = await app.inject({ method: 'GET', url: '/list?page=2&email=a@b.com' });
    expect(listed.json()).toEqual({ query: { page: '2' } });
    await app.close();
  });

  it('accepts a fully declared route, so every refusal above is not vacuous', async () => {
    const app = createApp(SETTINGS);
    app.post('/x/:id', {
      schema: {
        querystring: NO_QUERY,
        params: { type: 'object', properties: { id: { type: 'string' } }, additionalProperties: false },
        body: { type: 'object', properties: { title: { type: 'string' } }, additionalProperties: false },
      },
    }, async () => ({}));
    await app.ready();

    expect(app.routeTable.map((route) => `${route.method} ${route.url}`)).toEqual(['POST /x/:id']);
    await app.close();
  });
});

describe('the affordance below the dispatcher, which is how the closed hole was reopened', () => {
  // The round 4 audit refuted A-4. SEC-1's fallback denies a URL with no route behind it, and the argument for
  // why nothing can pre-empt it quantifies over HOOKS: `createApp` installs it in the expression that creates
  // the instance, so every other hook is a later hook. A `request` listener on the raw `http.Server` is not a
  // hook. It sits below the framework's dispatcher, so it precedes every hook there is, and a route module that
  // swapped it served `/ghost?email=a@b.com&tenantId=forged` at 200 with the query string leaked, a route table
  // of length 2, and eslint and tsc both clean.
  //
  // A lint bans `.server` outside `app.ts`, and a lint is the weakest guard here: `request.raw.socket.server`
  // reaches the same object from inside any handler. These are the guards that do not depend on spelling.

  it.each([
    ['removeAllListeners, named', (s: ReturnType<typeof createApp>['server']) => s.removeAllListeners('request')],
    ['removeAllListeners, bare', (s: ReturnType<typeof createApp>['server']) => s.removeAllListeners()],
    ['on', (s: ReturnType<typeof createApp>['server']) => s.on('request', () => {})],
    ['addListener', (s: ReturnType<typeof createApp>['server']) => s.addListener('request', () => {})],
    ['once', (s: ReturnType<typeof createApp>['server']) => s.once('request', () => {})],
    ['prependListener', (s: ReturnType<typeof createApp>['server']) => s.prependListener('request', () => {})],
    ['off', (s: ReturnType<typeof createApp>['server']) => s.off('request', () => {})],
  ])('refuses %s on the request event', async (_label, mutate) => {
    const app = createApp(SETTINGS);
    expect(() => mutate(app.server)).toThrow(/'request' event is refused/);
    await app.close();
  });

  it('leaves every other event alone, so the seal is aimed and not a blanket', async () => {
    const app = createApp(SETTINGS);
    expect(() => app.server.on('connection', () => {})).not.toThrow();
    await app.close();
  });

  it('reconciles the dispatcher at onReady, so bypassing the seal still refuses the boot', async () => {
    // The second view, and the reason there are two guards rather than one. The seal replaces methods on the
    // server object, which is a guard agreeing with itself; `_events` is reachable underneath it. This is the
    // same discipline `reconcileWithRouter` applies to the route table: compare against what was captured at
    // construction and refuse rather than resolve the disagreement.
    const app = createApp(SETTINGS);
    app.get('/ok', { config: OPEN, schema: { querystring: NO_QUERY } }, async () => ({}));

    const internals = app.server as unknown as { _events: Record<string, unknown> };
    internals._events.request = () => {};

    await expect(app.ready()).rejects.toThrow(/not the ones installed at construction/);
    await app.close().catch(() => {});
  });

  it('still denies a ghost URL and still serves a real one, so the seal costs nothing', async () => {
    const app = createApp(SETTINGS);
    app.get('/ok', { config: OPEN, schema: { querystring: NO_QUERY } }, async () => ({ ok: 1 }));
    await app.ready();

    expect((await app.inject({ method: 'GET', url: '/ok' })).statusCode).toBe(200);
    const ghost = await app.inject({ method: 'GET', url: '/ghost?email=a@b.com' });
    expect(ghost.statusCode).toBe(403);
    expect(ghost.body).not.toContain('a@b.com');
    await app.close();
  });
});

describe('the obligation has a depth, and the round 3 audit found it did not', () => {
  // `removeAdditional` strips at the level that closes itself and nowhere else, so the round 3 version of the
  // shape check, which looked only at the top level of each surface, bought the "declared set IS the accepted
  // set" property for depth 0 and for nothing below it. Four evasions were live, meaning the forged value
  // reached the handler with the endpoint-spine scan reporting nothing, and four more were scan-blind. All
  // eight are here.

  const evasions: Array<[string, unknown]> = [
    [
      'a nested object that does not close itself',
      { type: 'object', properties: { author: { type: 'object', properties: { nick: { type: 'string' } } } }, additionalProperties: false },
    ],
    [
      'array items that do not close themselves',
      { type: 'object', properties: { rows: { type: 'array', items: { type: 'object', properties: { v: { type: 'string' } } } } }, additionalProperties: false },
    ],
    [
      'patternProperties, which survives removeAdditional AND the walk',
      { type: 'object', properties: { title: { type: 'string' } }, additionalProperties: false, patternProperties: { '^tenantId$': { type: 'string' } } },
    ],
    [
      'the tuple form of items, which the walk visits as one schema',
      { type: 'object', properties: { rows: { type: 'array', items: [{ type: 'object', properties: { tenantId: { type: 'string' } } }] } }, additionalProperties: false },
    ],
    [
      'not',
      { type: 'object', properties: {}, additionalProperties: false, not: { type: 'object', properties: { tenantId: { type: 'string' } } } },
    ],
    [
      'if/then/else',
      { type: 'object', properties: {}, additionalProperties: false, if: { type: 'object' }, then: { type: 'object', properties: { tenantId: { type: 'string' } } } },
    ],
    [
      'contains',
      { type: 'object', properties: { rows: { type: 'array', items: { type: 'string' }, contains: { type: 'object', properties: { tenantId: { type: 'string' } } } } }, additionalProperties: false },
    ],
    [
      'an untyped {} property, which accepts an arbitrary object under one leaf name',
      { type: 'object', properties: { meta: {} }, additionalProperties: false },
    ],
  ];

  it.each(evasions)('refuses %s', async (_label, body) => {
    const message = await bootFailure((app) =>
      app.post('/x', { schema: { querystring: NO_QUERY, body } }, async () => ({})),
    );
    expect(message).not.toBeNull();
  });

  it('strips at depth once the nested levels are closed, which is what the refusals buy', async () => {
    // The green half, and the reason the refusals above are not merely pedantic. Before the repair this exact
    // request delivered `author.tenantId` and `rows[0].createdBy` to the handler untouched.
    const app = createApp(SETTINGS);
    app.post('/deep', {
      config: OPEN,
      schema: {
        querystring: NO_QUERY,
        body: {
          type: 'object',
          additionalProperties: false,
          properties: {
            author: { type: 'object', properties: { nick: { type: 'string' } }, additionalProperties: false },
            rows: {
              type: 'array',
              items: { type: 'object', properties: { v: { type: 'string' } }, additionalProperties: false },
            },
          },
        },
      },
    }, async (request) => ({ body: request.body }));
    await app.ready();

    const posted = await app.inject({
      method: 'POST',
      url: '/deep',
      payload: { author: { nick: 'n', tenantId: 'evil' }, rows: [{ v: '1', createdBy: 'evil' }] },
    });
    expect(posted.json()).toEqual({ body: { author: { nick: 'n' }, rows: [{ v: '1' }] } });
    await app.close();
  });

  it('still accepts a combinator arm that does not close itself, because the enclosing object already did', async () => {
    // An `allOf` arm constrains the object it sits in, and that object is closed and strips first, so an arm
    // cannot introduce an arriving field. Requiring closure of the arm would forbid the ordinary use of the
    // keyword and buy nothing, so the arm is exempt and this asserts the exemption rather than leaving it to be
    // inferred from the absence of a test.
    const message = await bootFailure((app) =>
      app.post('/x', {
        schema: {
          querystring: NO_QUERY,
          body: {
            type: 'object',
            properties: {},
            additionalProperties: false,
            allOf: [{ type: 'object', properties: { rowVersion: { type: 'string' } } }],
          },
        },
      }, async () => ({})),
    );
    expect(message).toBeNull();
  });
});

describe('the hole the route table cannot close, and the mechanism that closed it anyway', () => {
  it('denies a URL with no route behind it, even though the table cannot see it', async () => {
    // This test used to assert the opposite, and the change is the point of having written it that way.
    //
    // The round 1 version asserted a passing hole: a hook that replies without calling through serves a URL no
    // enumeration contains, it leaked `?email=` off `/ghost` with a route table of length zero, and that was
    // recorded as the boundary of what a route-table scan can claim, with the instruction that a mechanism
    // closing it should break this test rather than pass unnoticed. SEC-1's deny-by-default fallback closed it,
    // and this test broke, and here is the rewrite.
    //
    // The reason it closes is worth keeping, because it is not specific to this hole. The fallback consults the
    // REQUEST, not the table, so it does not care whether a route exists; and `createApp` installs it in the
    // expression that creates the instance, so no later hook can run before it. A ghost hook is by construction
    // a later hook. What remains true is the narrower statement: the route TABLE still cannot see this URL, so
    // every scan built on the table is still blind to it. What is no longer true is that the URL is reachable.
    const app = createApp(SETTINGS);
    app.addHook('onRequest', async (request, reply) => {
      if (request.url.startsWith('/ghost')) {
        await reply.send({ leaked: request.query });
      }
    });
    await app.ready();

    const reply = await app.inject({ method: 'GET', url: '/ghost?email=a@b.com' });
    expect(reply.statusCode).toBe(403);
    expect(reply.body).not.toContain('a@b.com');
    expect(app.routeTable).toHaveLength(0);
    await app.close();
  });

  it('denies an unmatched URL rather than answering 404, so absence is not a reachable state', async () => {
    const app = createApp(SETTINGS);
    app.get('/real', { config: OPEN, schema: { querystring: NO_QUERY } }, async () => ({ ok: true }));
    await app.ready();

    expect((await app.inject({ method: 'GET', url: '/real' })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/not-a-route' })).statusCode).toBe(403);
    await app.close();
  });
});
