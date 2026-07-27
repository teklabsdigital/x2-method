import { describe, expect, it } from 'vitest';
import { createApp } from '../../app.ts';
import { ANONYMOUS, POLICIES, definePolicies as definePoliciesForTest } from '../../platform/authorization.ts';
import { matchingRule, tokenize } from '../../platform/nameMatching.ts';
import { PII_PARAMETERS, SERVER_CONTROLLED_FIELDS, TENANT_SHAPED } from '../../platform/registries.ts';
import { scanEndpointSpine, type CarveOut } from '../endpointSpine.ts';
import { resolveSettings } from '../../platform/settings.ts';

// Every instance in this file needs resolved settings, because `createApp` cannot be constructed without
// them: DATA-5's "at startup, not first-use" is an obligation on composition, so the type system carries it.
const SETTINGS = resolveSettings();

// The red half of the endpoint spine, and the only file permitted to build its own app (named in
// eslint.config.js). Planting a violation needs an app to plant it in, and the composed app is by construction
// the one with no violations in it.
//
// A green scan proves nothing without this file. That is the aspirational-enforcement failure the catalog exists
// to prevent, and the discipline is that every branch of the scan is deliberately violated here, so the proof
// stays alive on every run rather than being a note about a day somebody tried it.

const NO_QUERY = { type: 'object', properties: {}, additionalProperties: false } as const;

async function allViolationsOf(register: (app: ReturnType<typeof createApp>) => unknown): Promise<readonly string[]> {
  const app = createApp(SETTINGS);
  await register(app);
  await app.ready();
  const found = scanEndpointSpine(app.routeTable).map((violation) => `${violation.claim} ${violation.at}`);
  await app.close();
  return found;
}

// The same, minus the violations that are about the allowlist rather than about a route in this table. A
// synthetic app registers the one route under test and not `/health`, so the allowlist staleness check fires on
// every one of them, correctly and irrelevantly. Filtering it here rather than making the check optional keeps
// the scan a single pure function with no switch that a future caller could set the wrong way; the staleness
// check has its own red proof above, on `allViolationsOf`.
async function violationsOf(register: (app: ReturnType<typeof createApp>) => unknown): Promise<readonly string[]> {
  const app = createApp(SETTINGS);
  await register(app);
  await app.ready();
  const served = new Set(app.routeTable.map((route) => `${route.method} ${route.url}`));
  const found = scanEndpointSpine(app.routeTable)
    .map((violation) => `${violation.claim} ${violation.at}`)
    .filter((entry) => served.has(entry.slice(entry.indexOf(' ') + 1)));
  await app.close();
  return found;
}

describe('SEC-1: a route that is not gated cannot pass the scan', () => {
  it('reports a route declaring no policy at all', async () => {
    const found = await violationsOf((app) =>
      app.get('/ungated', { schema: { querystring: NO_QUERY } }, async () => ({})),
    );
    expect(found).toContain('SEC-1 GET /ungated');
    expect(found).toContain('SEC-1 HEAD /ungated');
  });

  it('reports an anonymous route that is not on the allowlist', async () => {
    const found = await violationsOf((app) =>
      app.get('/open', { config: { policy: ANONYMOUS }, schema: { querystring: NO_QUERY } }, async () => ({})),
    );
    expect(found).toContain('SEC-1 GET /open');
  });

  it('reports a look-alike policy object, because a policy is compared by identity', async () => {
    // The evasion a string-convention check cannot refuse. The sibling edition asserts that a policy NAME starts
    // with a prefix, so any string of the right shape satisfies it; here the declaration has to BE a member of
    // POLICIES, so a hand-rolled object carrying the right name and no permissions is not one.
    const forged = { name: 'notes.read', permissions: [] as string[] };
    const found = await violationsOf((app) =>
      app.get('/forged', { config: { policy: forged }, schema: { querystring: NO_QUERY } }, async () => ({})),
    );
    expect(found).toContain('SEC-1 GET /forged');
  });

  it('reports an allowlist entry that matches no route, so the list cannot rot', async () => {
    // `/health` is on the allowlist and this app does not register it. An allowlist that only ever grows is a
    // set of pre-authorized holes waiting for a URL to be registered under one, and nothing else in the loop
    // would ever notice.
    const found = await allViolationsOf((app) =>
      app.get('/x', { config: { policy: POLICIES['notes.read'] }, schema: { querystring: NO_QUERY } }, async () => ({})),
    );
    expect(found).toContain('SEC-1 GET /health');
  });

  it('does not let an independently registered HEAD ride in on its GET allowlist entry', async () => {
    // A-1's nuance, made into a guard. A HEAD registered BEFORE its GET suppresses Fastify's synthesis and is
    // then a route of its own that can diverge. It is allowlisted only when it provably IS the synthesized one,
    // which is decided by reference identity on the options object and not by the two configs looking alike.
    const found = await violationsOf((app) => {
      app.route({
        method: 'HEAD',
        url: '/health',
        config: { policy: ANONYMOUS },
        schema: { querystring: NO_QUERY },
        handler: async () => ({}),
      });
      app.get('/health', { config: { policy: ANONYMOUS }, schema: { querystring: NO_QUERY } }, async () => ({}));
    });
    expect(found).toContain('SEC-1 HEAD /health');
    expect(found).not.toContain('SEC-1 GET /health');
  });

  it('accepts the synthesized HEAD of an allowlisted GET, so the guard above is not vacuous', async () => {
    const found = await violationsOf((app) =>
      app.get('/health', { config: { policy: ANONYMOUS }, schema: { querystring: NO_QUERY } }, async () => ({})),
    );
    expect(found).toEqual([]);
  });
});

describe('SEC-1: the fallback denies, and denying is not the same as being registered', () => {
  // The claim asks for a host test asserting the fallback ACTUALLY denies anonymous callers, "not merely that it
  // is registered". The distinction is the whole of this block: every case below issues a request and reads a
  // status code, and none of them inspects a configuration object.
  //
  // These cases exist only because the scan and the fallback were kept separate. The scan refuses an ungated
  // route, so if the fallback also lived at boot there would be no way to compose one and the fallback would be
  // untestable by construction.

  it('denies an ungated route to an anonymous caller', async () => {
    const app = createApp(SETTINGS);
    app.get('/ungated', { schema: { querystring: NO_QUERY } }, async () => ({ payload: 'served' }));
    await app.ready();

    const reply = await app.inject({ method: 'GET', url: '/ungated' });
    expect(reply.statusCode).toBe(403);
    expect(reply.body).not.toContain('served');
    await app.close();
  });

  it('denies an ungated route to an AUTHENTICATED caller too, which is what deny by default means', async () => {
    // The sibling edition's fallback is RequireAuthenticatedUser, so an endpoint that forgot its attribute is
    // reachable by every authenticated caller in the system, cross-tenant, with no permission. That satisfies
    // the claim's "unreachable, not public" only on the narrowest reading of public. Deny by default here means
    // deny, and holding a valid credential changes nothing.
    const app = createApp(SETTINGS, {}, { authenticate: () => ({ subject: 'u', tenantId: 't', sessionVersion: 1, permissions: ['notes:read', 'notes:write'] }) });
    app.get('/ungated', { schema: { querystring: NO_QUERY } }, async () => ({ payload: 'served' }));
    await app.ready();

    expect((await app.inject({ method: 'GET', url: '/ungated' })).statusCode).toBe(403);
    await app.close();
  });

  it('answers 401 without a credential and 403 with an insufficient one, on a properly gated route', async () => {
    const app = createApp(SETTINGS, {}, { authenticate: (request) => (request.headers['x-test-cred'] === undefined ? null : { subject: 'u', tenantId: 't', sessionVersion: 1, permissions: ['notes:read'] }) });
    app.get('/read', { config: { policy: POLICIES['notes.read'] }, schema: { querystring: NO_QUERY } }, async () => ({ ok: 1 }));
    app.get('/write', { config: { policy: POLICIES['notes.write'] }, schema: { querystring: NO_QUERY } }, async () => ({ ok: 1 }));
    await app.ready();

    expect((await app.inject({ method: 'GET', url: '/read' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/read', headers: { 'x-test-cred': '1' } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/write', headers: { 'x-test-cred': '1' } })).statusCode).toBe(403);
    await app.close();
  });
});

describe('SEC-3: PII in a URL is refused, including the morphology an equality check misses', () => {
  it.each([
    ['a path parameter named for the value itself', '/users/:email'],
    ['a compound path parameter', '/users/:emailAddress'],
    ['a snake-cased path parameter', '/users/:user_email'],
  ])('reports %s', async (_label, url) => {
    const parameter = url.slice(url.indexOf(':') + 1);
    const found = await violationsOf((app) =>
      app.get(
        url,
        {
          config: { policy: POLICIES['notes.read'] },
          schema: {
            querystring: NO_QUERY,
            params: { type: 'object', properties: { [parameter]: { type: 'string' } }, additionalProperties: false },
          },
        },
        async () => ({}),
      ),
    );
    expect(found).toContain(`SEC-3 GET ${url}`);
  });

  it('reports a PII query parameter', async () => {
    const found = await violationsOf((app) =>
      app.get(
        '/search',
        {
          config: { policy: POLICIES['notes.read'] },
          schema: {
            querystring: { type: 'object', properties: { phoneNumber: { type: 'string' } }, additionalProperties: false },
          },
        },
        async () => ({}),
      ),
    );
    expect(found).toContain('SEC-3 GET /search');
  });

  it('reports a params schema and a URL that disagree, in both directions', async () => {
    const undeclared = await violationsOf((app) =>
      app.get(
        '/a/:id',
        {
          config: { policy: POLICIES['notes.read'] },
          schema: {
            querystring: NO_QUERY,
            params: { type: 'object', properties: { other: { type: 'string' } }, additionalProperties: false },
          },
        },
        async () => ({}),
      ),
    );
    // Both directions from one registration: the URL carries `id` that the schema omits, and the schema declares
    // `other` that the URL does not carry.
    expect(undeclared.filter((entry) => entry === 'SEC-3 GET /a/:id').length).toBeGreaterThanOrEqual(2);
  });
});

describe('SEC-2: a server-controlled field in a body is refused, at any depth', () => {
  it.each([
    ['at the top level', { type: 'object', properties: { status: { type: 'string' } }, additionalProperties: false }],
    [
      'one level down in a nested object',
      {
        type: 'object',
        properties: {
          author: { type: 'object', properties: { createdBy: { type: 'string' } }, additionalProperties: false },
        },
        additionalProperties: false,
      },
    ],
    [
      'inside array items',
      {
        type: 'object',
        properties: {
          lines: {
            type: 'array',
            items: { type: 'object', properties: { tenantId: { type: 'string' } }, additionalProperties: false },
          },
        },
        additionalProperties: false,
      },
    ],
    [
      'behind allOf',
      {
        type: 'object',
        properties: {},
        additionalProperties: false,
        allOf: [{ type: 'object', properties: { rowVersion: { type: 'string' } } }],
      },
    ],
    [
      'spelled with a suffix an equality check would miss',
      { type: 'object', properties: { createdByUser: { type: 'string' } }, additionalProperties: false },
    ],
  ])('reports a field %s', async (_label, body) => {
    const found = await violationsOf((app) =>
      app.post('/x', { config: { policy: POLICIES['notes.write'] }, schema: { querystring: NO_QUERY, body } }, async () => ({})),
    );
    expect(found).toContain('SEC-2 POST /x');
  });

  it('accepts a body carrying only caller-owned fields, so the refusals above are not vacuous', async () => {
    const found = await violationsOf((app) =>
      app.post(
        '/x',
        {
          config: { policy: POLICIES['notes.write'] },
          schema: {
            querystring: NO_QUERY,
            body: {
              type: 'object',
              properties: { title: { type: 'string' }, parentId: { type: 'string' } },
              additionalProperties: false,
            },
          },
        },
        async () => ({}),
      ),
    );
    // `parentId` is here deliberately. `id` is a whole-name registry entry, so a foreign key reference does not
    // trip it; had it been a run entry, every legitimate body in every project would have needed a carve-out.
    expect(found).toEqual([]);
  });
});

describe('TEN-1: tenant never travels on any of the four surfaces', () => {
  it('reports a tenant path parameter', async () => {
    const found = await violationsOf((app) =>
      app.get(
        '/t/:tenantId/notes',
        {
          config: { policy: POLICIES['notes.read'] },
          schema: {
            querystring: NO_QUERY,
            params: { type: 'object', properties: { tenantId: { type: 'string' } }, additionalProperties: false },
          },
        },
        async () => ({}),
      ),
    );
    expect(found).toContain('TEN-1 GET /t/:tenantId/notes');
  });

  it('reports a tenant query parameter under any of its spellings', async () => {
    for (const name of ['tenantId', 'orgId', 'organisationId', 'workspaceId']) {
      const found = await violationsOf((app) =>
        app.get(
          '/q',
          {
            config: { policy: POLICIES['notes.read'] },
            schema: {
              querystring: { type: 'object', properties: { [name]: { type: 'string' } }, additionalProperties: false },
            },
          },
          async () => ({}),
        ),
      );
      expect(found).toContain('TEN-1 GET /q');
    }
  });

  it('reports a tenant field in a request contract', async () => {
    const found = await violationsOf((app) =>
      app.post(
        '/x',
        {
          config: { policy: POLICIES['notes.write'] },
          schema: {
            querystring: NO_QUERY,
            body: { type: 'object', properties: { tenant: { type: 'string' } }, additionalProperties: false },
          },
        },
        async () => ({}),
      ),
    );
    expect(found).toContain('TEN-1 POST /x');
  });

  it('reports a route that declares a tenant header, and strips it at runtime whether or not it was declared', async () => {
    // The two halves of the fourth surface, in one test because they are one claim. The scan can see a DECLARED
    // header. It cannot see an undeclared one and never will, because headers cannot be closed the way a query
    // string can: every request carries host and user-agent whether anyone declared them or not. So the strip is
    // the mechanism and the scan is the second view.
    const declared = await violationsOf((app) =>
      app.get(
        '/h',
        {
          config: { policy: POLICIES['notes.read'] },
          schema: {
            querystring: NO_QUERY,
            headers: { type: 'object', properties: { 'x-tenant-id': { type: 'string' } } },
          },
        },
        async () => ({}),
      ),
    );
    expect(declared).toContain('TEN-1 GET /h');

    const app = createApp(SETTINGS);
    app.get('/echo', { config: { policy: ANONYMOUS }, schema: { querystring: NO_QUERY } }, async (request) => ({
      headers: Object.keys(request.headers),
    }));
    await app.ready();

    const reply = await app.inject({
      method: 'GET',
      url: '/echo',
      headers: { 'x-tenant-id': 'forged', 'x-org-id': 'forged', 'x-workspace-slug': 'forged', 'x-request-id': 'kept' },
    });

    expect(reply.json().headers).toContain('x-request-id');
    expect(reply.json().headers).not.toContain('x-tenant-id');
    expect(reply.json().headers).not.toContain('x-org-id');
    expect(reply.json().headers).not.toContain('x-workspace-slug');
    await app.close();
  });
});

describe('the matcher the three registries share', () => {
  it.each([
    ['emailAddress', ['email', 'address']],
    ['user_email', ['user', 'email']],
    ['EMAIL', ['email']],
    ['userSSN', ['user', 'ssn']],
    ['SSNValue', ['ssn', 'value']],
    ['created-at-utc', ['created', 'at', 'utc']],
  ])('tokenizes %s', (name, expected) => {
    expect(tokenize(name)).toEqual(expected);
  });

  it('catches the morphology an equality check misses', () => {
    for (const name of ['emailAddress', 'userEmail', 'firstName', 'lastName', 'contact_phone']) {
      expect(matchingRule(PII_PARAMETERS, name)).toBeDefined();
    }
    for (const name of ['noteStatus', 'createdByUser', 'createdAtUtc', 'entityRowVersion']) {
      expect(matchingRule(SERVER_CONTROLLED_FIELDS, name)).toBeDefined();
    }
  });

  it('states its own false positive rather than hiding it', () => {
    // `name` is a bad registry entry and this is what it costs: any field whose tokens include `name` matches.
    // Recorded as a passing assertion so the cost is visible in the suite instead of being discovered by the
    // first project that wants a filename in a query string, and so that narrowing the entry later breaks a
    // test rather than silently changing what four claims mean.
    expect(matchingRule(PII_PARAMETERS, 'fileName')).toBeDefined();
    expect(matchingRule(PII_PARAMETERS, 'tenantName')).toBeDefined();

    // And what it does NOT cost: a single word that merely contains the letters is not a token match.
    expect(matchingRule(PII_PARAMETERS, 'filename')).toBeUndefined();
    expect(matchingRule(PII_PARAMETERS, 'namespace')).toBeUndefined();
    // And `mail` as a run entry does not become a substring match: these stay single tokens.
    expect(matchingRule(PII_PARAMETERS, 'mailbox')).toBeUndefined();
    expect(matchingRule(PII_PARAMETERS, 'voicemail')).toBeUndefined();
  });

  it('refuses to promote a foreign key into an entity id', () => {
    expect(matchingRule(SERVER_CONTROLLED_FIELDS, 'id')).toBeDefined();
    expect(matchingRule(SERVER_CONTROLLED_FIELDS, 'Id')).toBeDefined();
    expect(matchingRule(SERVER_CONTROLLED_FIELDS, 'parentId')).toBeUndefined();
    expect(matchingRule(SERVER_CONTROLLED_FIELDS, 'noteId')).toBeUndefined();
  });

  it('catches the all-lowercase concatenations, which tokenizing loses to equality on', () => {
    // The round 3 audit's correction to E-9, asserted so it cannot regress. Tokenizing beats equality on every
    // spelling carrying a boundary and LOSES to it on every concatenation, because `firstname` is one token and
    // shares none with `name`. Each name below is hand-enumerated in the sibling edition precisely because
    // equality needed it, and each walked past this matcher until the audit measured it. The two matchers are
    // incomparable, not ordered, and the claim that this list caught strictly more was false.
    for (const name of ['firstname', 'lastname', 'dateofbirth', 'emailaddress', 'phonenumber']) {
      expect(matchingRule(PII_PARAMETERS, name), name).toBeDefined();
    }
    for (const name of ['tenantid', 'orgid', 'organizationid', 'organisationid', 'workspaceid']) {
      expect(matchingRule(TENANT_SHAPED, name), name).toBeDefined();
    }
  });

  it('catches the decompositions, the plurals and the numbered fields', () => {
    // The round 4 audit's second correction to E-9, and the one that came from RUNNING the inputs rather than
    // reasoning about them. These are a different class from the concatenations above: `e_mail` decomposes to a
    // run containing `mail` and not `email`, `emails` is a plural of a listed word, and `email1` is a numbered
    // field, which is the ordinary way a form carries a second address. The sibling edition misses all of them
    // too, which is why this belongs to E-9's thesis rather than to a Node defect.
    for (const name of ['email1', 'emails', 'e_mail', 'e-mail', 'mail', 'EMailAddress', 'phone2']) {
      expect(matchingRule(PII_PARAMETERS, name), name).toBeDefined();
    }
  });

  it('splits letters from digits without promoting a numbered id', () => {
    expect(tokenize('email1')).toEqual(['email', '1']);
    expect(tokenize('sha256')).toEqual(['sha', '256']);
    // `id` is whole-name, and `id1` is two tokens, so a numbered identifier is not an entity id.
    expect(matchingRule(SERVER_CONTROLLED_FIELDS, 'id1')).toBeUndefined();
  });

  it('does not buy those by prefix matching, which would eat ordinary names', () => {
    // The concatenations are entries rather than a prefix rule, and this is the cost of the alternative: `org`
    // as a prefix matches `origin`, which is an ordinary request header that the runtime strip would then
    // delete. Asserted so that a future "simplification" to prefix matching breaks a test.
    for (const name of ['origin', 'organic', 'workspaces']) {
      expect(matchingRule(TENANT_SHAPED, name), name).toBeUndefined();
    }
    expect(matchingRule(PII_PARAMETERS, 'filename')).toBeUndefined();
    expect(matchingRule(PII_PARAMETERS, 'namespace')).toBeUndefined();
  });
});

describe('the carve-out mechanism, which shipped in round 3 with no execution at all', () => {
  // `CARVE_OUTS` is empty in this edition, and empty on purpose, so both branches of the mechanism were dead
  // code: nothing ever suppressed a violation and nothing ever reported a stale exemption. The round 3 audit
  // ran them for the first time and found two defects. `scanEndpointSpine` now takes the list as a parameter so
  // the paths can be exercised without a fake entry having to ship.

  const carveOut = (over: Partial<CarveOut> = {}): CarveOut =>
    Object.freeze({
      claim: 'SEC-3',
      at: 'GET /f/:name',
      surface: 'query',
      field: 'name',
      why: 'the exemplar carve-out under test',
      ...over,
    }) as CarveOut;

  async function scanWith(
    carveOuts: readonly CarveOut[],
    register: (app: ReturnType<typeof createApp>) => unknown,
  ): Promise<readonly string[]> {
    const app = createApp(SETTINGS);
    await register(app);
    await app.ready();
    // Served routes only, plus the carve-out staleness reports, which are the subject here. The `/health`
    // allowlist entry fires on every synthetic app and is proven elsewhere; see `violationsOf` above.
    const served = new Set(app.routeTable.map((route) => `${route.method} ${route.url}`));
    const found = scanEndpointSpine(app.routeTable, carveOuts)
      .filter((v) => served.has(v.at) || v.message.includes('matched nothing'))
      .map((v) => `${v.claim} ${v.at}: ${v.message.slice(0, 40)}`);
    await app.close();
    return found;
  }

  // A route carrying the same flagged name on BOTH the path and the query string. One name, two surfaces, two
  // different exposures.
  const bothSurfaces = (app: ReturnType<typeof createApp>) =>
    app.get('/f/:name', {
      config: { policy: POLICIES['notes.read'] },
      schema: {
        params: { type: 'object', properties: { name: { type: 'string' } }, additionalProperties: false },
        querystring: { type: 'object', properties: { name: { type: 'string' } }, additionalProperties: false },
      },
    }, async () => ({}));

  it('suppresses only the surface the carve-out names, and not the other one', async () => {
    // The first defect. The key was (claim, at, field) with no surface, so this single entry, written for the
    // query string, silently exempted the PATH parameter too. That is the wrong direction to be wrong in: the
    // path half is the one SEC-3's harm paragraph is about, because a URL reaches logs, proxies and referrers.
    const found = await scanWith([carveOut()], bothSurfaces);

    expect(found.filter((f) => f.includes('route parameter'))).toHaveLength(2); // the GET and its HEAD
    expect(found.filter((f) => f.includes('query parameter'))).toEqual([]);
  });

  it('covers a synthesized HEAD under its GET entry, so no author is asked to justify a route nobody wrote', async () => {
    // The second defect. `at` is method-and-url, so a carve-out for `GET /f` left `SEC-3 HEAD /f` violating, and
    // the only fix available to an author was a second entry for a line that does not exist in any source file.
    // That entry would then have been a bare string, so an independently registered HEAD would have ridden it,
    // which is exactly the hole the allowlist uses reference identity on `config` to close. The carve-out now
    // uses the same proof.
    const found = await scanWith([carveOut({ at: 'GET /f', surface: 'query' })], (app) =>
      app.get('/f', {
        config: { policy: POLICIES['notes.read'] },
        schema: { querystring: { type: 'object', properties: { name: { type: 'string' } }, additionalProperties: false } },
      }, async () => ({})),
    );
    expect(found).toEqual([]);
  });

  it('does not let an independently registered HEAD ride in on its GET carve-out', async () => {
    const found = await scanWith([carveOut({ at: 'GET /f', surface: 'query' })], (app) => {
      const schema = { querystring: { type: 'object', properties: { name: { type: 'string' } }, additionalProperties: false } };
      app.route({ method: 'HEAD', url: '/f', config: { policy: POLICIES['notes.read'] }, schema, handler: async () => ({}) });
      app.get('/f', { config: { policy: POLICIES['notes.read'] }, schema }, async () => ({}));
    });
    expect(found.map((f) => f.split(':')[0])).toEqual(['SEC-3 HEAD /f']);
  });

  it('reports a carve-out that matched nothing, so an exemption cannot outlive its route', async () => {
    const found = await scanWith([carveOut({ at: 'GET /gone' })], (app) =>
      app.get('/kept', { config: { policy: POLICIES['notes.read'] }, schema: { querystring: NO_QUERY } }, async () => ({})),
    );
    expect(found.some((f) => f.startsWith('SEC-3 GET /gone') && f.includes('matched nothing'))).toBe(true);
  });

  it('does not report a carve-out that was used, so the staleness check is not vacuous', async () => {
    const found = await scanWith([carveOut()], bothSurfaces);
    expect(found.some((f) => f.includes('matched nothing'))).toBe(false);
  });
});

describe('the policy constructor is the only thing making the forbidden gate unrepresentable', () => {
  // Round 3 asserted these two refusals in its proof table by manual injection, and the audit found that
  // deleting the empty-permission check from `definePolicies` left the whole suite green. The test that was
  // meant to cover it iterates POLICIES and asserts each entry has permissions, which measures the CONTENTS of
  // the shipped registry and not the constructor's behaviour, so the one-line regression its own comment names
  // was the one thing it could not see. These call the constructor.

  it('refuses a policy naming no permission', () => {
    expect(() => definePoliciesForTest({ 'notes.peek': [] })).toThrow(/names no permission/);
  });

  it('refuses a policy named anonymous, so anonymity is unreachable by naming a policy', () => {
    expect(() => definePoliciesForTest({ [ANONYMOUS]: ['notes:read'] })).toThrow(/not a policy name/);
  });

  it('accepts a well-formed declaration, so the refusals above are not vacuous', () => {
    const built = definePoliciesForTest({ 'notes.peek': ['notes:read'] });
    expect(built['notes.peek'].permissions).toEqual(['notes:read']);
    expect(Object.isFrozen(built['notes.peek'])).toBe(true);
  });
});

describe('the policy vocabulary makes the forbidden registration unrepresentable', () => {
  it('has no policy that gates on authentication alone', () => {
    // SEC-1 says bare authenticated-only registrations are REJECTED, which presumes a stack where the bare form
    // can be written and a scan has to catch it. Here there is nothing to catch: every policy names at least one
    // permission, because the constructor refuses an empty set, so the registration the claim forbids cannot be
    // expressed. Asserted over the whole registry rather than trusted, because the constructor is the only thing
    // standing between this property and a one-line regression.
    for (const policy of Object.values(POLICIES)) {
      expect(policy.permissions.length).toBeGreaterThan(0);
    }
  });
});
