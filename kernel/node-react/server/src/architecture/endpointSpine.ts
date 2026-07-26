import { ANONYMOUS, ANONYMOUS_ROUTES, isRegisteredPolicy } from '../platform/authorization.ts';
import { matchingRule } from '../platform/nameMatching.ts';
import { PII_PARAMETERS, SERVER_CONTROLLED_FIELDS, TENANT_SHAPED, TIME_SHAPED } from '../platform/registries.ts';
import type { RecordedRoute } from '../platform/routeTable.ts';

// The predicate half of four claims, over the one enumeration the edition bought: SEC-1 (every route gated,
// anonymity allowlisted), SEC-3 (no PII in routes or query strings), SEC-2 (no server-controlled field in a
// request body), TEN-1 (tenant never travels as a parameter or a contract field).
//
// This is a pure function of the route table, and that is the design decision worth defending. It could have
// been folded into `createApp` as more boot refusals, and it is deliberately not, for two reasons. The
// completeness of the enumeration is one thing and the truth of a claim about it is another; fusing them makes
// every claim's guard indistinguishable from every other and from the mechanism they all stand on. And a boot
// refusal cannot report: an allowlist and a carve-out list only mean something if something can read the whole
// table and say which entries were used, which a mechanism that throws on the first violation cannot do.
//
// It runs in two places, which is the point. `compose.ts` runs it after `ready()`, so the real server refuses to
// start with an ungated route rather than starting and waiting for CI to notice. The architecture test runs it
// over the same composed app, so the failure is a named test with a diff rather than a boot log.

export type Violation = Readonly<{ claim: string; at: string; message: string }>;

// SEC-1's discipline, applied to the name registries: a carve-out is named in the scan itself with a
// justification. Empty, and empty on purpose rather than by omission: nothing in this edition has yet needed to
// carry a name the registries flag. The mechanism ships anyway, because the first project to want `fileName` in
// a query string should find a place to write down why, not discover that there is none.
//
// A carve-out that matches nothing is a violation, for the same reason a stale allowlist entry is: an unused
// exemption is a pre-authorized hole waiting for a route to be registered under it.
//
// `surface` is part of the key, and the round 3 audit is why. Without it the key was (claim, at, field), and a
// route carrying `/f/:name` with a `name` query parameter took ONE carve-out written for the query string and
// silently exempted the path parameter too. Those are different exposures under the same claim: SEC-3's harm
// paragraph is about URLs reaching logs and proxies, which is the path half. An exemption must name the surface
// it exempts or it is not the reviewed thing SEC-1 asks for.
export type CarveOutSurface = 'route' | 'query' | 'body' | 'header';

export type CarveOut = Readonly<{
  claim: string;
  at: string;
  surface: CarveOutSurface;
  field: string;
  why: string;
}>;

const CARVE_OUTS: readonly CarveOut[] = Object.freeze([]);

// `carveOuts` is a parameter for the same reason `composeApp` takes its surfaces: the shipped list is empty, so
// the suppression path and the staleness path were both dead code that no test could reach, and the round 3
// audit found them shipped unexecuted. A mechanism nobody has run is a mechanism nobody has proven.
export function scanEndpointSpine(
  routes: readonly RecordedRoute[],
  carveOuts: readonly CarveOut[] = CARVE_OUTS,
): readonly Violation[] {
  const violations: Violation[] = [];
  const used = new Set<CarveOut>();

  const report = (
    claim: string,
    keys: readonly string[],
    surface: CarveOutSurface,
    field: string,
    message: string,
  ): void => {
    const carveOut = carveOuts.find(
      (candidate) =>
        candidate.claim === claim &&
        keys.includes(candidate.at) &&
        candidate.surface === surface &&
        candidate.field === field,
    );
    if (carveOut === undefined) {
      violations.push({ claim, at: keys[0], message });
    } else {
      used.add(carveOut);
    }
  };

  for (const route of routes) {
    const at = `${route.method} ${route.url}`;
    // A-1 again, and the allowlist's answer reused rather than a second one invented. A synthesized HEAD is a
    // route nobody wrote, so asking an author to carve it out separately asks them to justify a line that does
    // not exist, and a string-keyed second entry would then be ridden by an independently registered HEAD. So a
    // synthesized HEAD matches its GET's carve-out, and only when reference identity on `config` proves it IS
    // its GET.
    const keys = [at, ...originGetOf(route, routes)];

    gate(route, at, routes, violations);

    for (const { name, where } of urlAndQueryParameters(route, at, violations)) {
      const pii = matchingRule(PII_PARAMETERS, name);
      if (pii !== undefined) {
        report(
          'SEC-3',
          keys,
          where,
          name,
          `${where} parameter '${name}' matches the PII registry entry '${pii.entry}'. URLs persist in server logs, proxies, browser history and referrer headers; PII travels in the body over TLS, and an opaque surrogate id is the sanctioned pattern.`,
        );
      }
      const tenant = matchingRule(TENANT_SHAPED, name);
      if (tenant !== undefined) {
        report(
          'TEN-1',
          keys,
          where,
          name,
          `${where} parameter '${name}' matches the tenant registry entry '${tenant.entry}'. Tenant is resolved from the validated credential only; one forged value in a URL is a cross-tenant read.`,
        );
      }
    }

    // SEC-2 scans the body and only the body, and the restraint is deliberate rather than inherited. The wider
    // scan was designed and then refused: a query string is a request surface that binds, so `?status=open`
    // looks like the same exposure, but filtering a list by status is not mass assignment and flagging it would
    // have made the claim's registry unusable on exactly the routes it matters least for. "Body-bound" is a
    // proxy for "bound onto a persisted entity", the proxy is imperfect in both editions, and widening the
    // surface does not improve it. The residual is recorded in the register rather than papered over here.
    for (const field of bodyFields(route)) {
      const owned = matchingRule(SERVER_CONTROLLED_FIELDS, field.name);
      if (owned !== undefined) {
        report(
          'SEC-2',
          keys,
          'body',
          field.path,
          `body field '${field.path}' matches the server-controlled registry entry '${owned.entry}'. The server assigns that value; a caller that can post it can assign it.`,
        );
      }
      const tenant = matchingRule(TENANT_SHAPED, field.name);
      if (tenant !== undefined) {
        report(
          'TEN-1',
          keys,
          'body',
          field.path,
          `body field '${field.path}' matches the tenant registry entry '${tenant.entry}'. No request contract carries a tenant identifier.`,
        );
      }
    }

    // TIME-1's contract surface, and it moves rather than porting. The sibling's mechanism is a reflection scan
    // rejecting properties of forbidden TIME TYPES, which works because .NET models the distinction as four
    // types a reflection scan can tell apart. A contract here is JSON Schema and JSON has no time type at all,
    // so there is nothing to reflect over and the ban lands on a FORMAT instead.
    //
    // The permitted shape is native on exactly this surface and nowhere else in the stack: `format: 'date-time'`
    // is RFC3339, and RFC3339 REQUIRES an offset, so a declared date-time is UTC-anchored and offset-aware in
    // the full sense TIME-1 asks for. `date` and `time` are the zoneless calendar concepts the claim's weakening
    // note carves out, and they are permitted for the same reason `DateOnly` and `TimeOnly` are. What is
    // forbidden is the naive form, which on a JSON surface is a time-named property declared as a bare string:
    // an instant arriving as text that nothing validates and nothing anchors.
    for (const field of contractFields(route)) {
      const timely = matchingRule(TIME_SHAPED, field.name);
      if (timely === undefined || field.type !== 'string' || TIME_FORMATS.has(field.format ?? '')) {
        continue;
      }
      report(
        'TIME-1',
        keys,
        field.surface,
        field.path,
        `'${field.path}' matches the time registry entry '${timely.entry}' and is declared as a bare string with ${field.format === undefined ? 'no format' : `format '${field.format}'`}. A time-named string with no offset-bearing format is the naive datetime on a JSON surface: ambiguous at every DST transition and every cross-region deployment. Declare format 'date-time' (RFC3339 requires an offset), or 'date'/'time' for a genuinely zoneless calendar concept.`,
      );
    }

    // TEN-1's fourth surface, and the honest half of what this scan can say about it. A DECLARED header is in
    // the table and is checked here. An UNDECLARED header is not, and cannot be: `additionalProperties: false`
    // is what makes the query-string scan a true statement about what arrives, and no route can close its
    // headers, because every request carries host, user-agent and accept whether anyone declared them or not.
    // So `request.headers` is readable in full regardless of this scan, and the runtime strip in `app.ts` is
    // what actually carries the claim's header sentence. This check is the second view over the same surface,
    // not the mechanism.
    for (const name of propertyNames(route.schema.headers)) {
      const tenant = matchingRule(TENANT_SHAPED, name);
      if (tenant !== undefined) {
        report(
          'TEN-1',
          keys,
          'header',
          name,
          `declares header '${name}', which matches the tenant registry entry '${tenant.entry}'. The runtime strip removes it before any handler runs, so declaring it means a route is asking for a value it can never receive.`,
        );
      }
    }
  }

  for (const entry of ANONYMOUS_ROUTES) {
    if (!routes.some((route) => route.method === entry.method && route.url === entry.url)) {
      violations.push({
        claim: 'SEC-1',
        at: `${entry.method} ${entry.url}`,
        message:
          'is on the anonymous allowlist and is not a route. A list that can only grow is not a reviewed surface; it is a set of pre-authorized holes waiting for a URL to be re-registered under one.',
      });
    }
  }

  for (const carveOut of carveOuts) {
    if (!used.has(carveOut)) {
      violations.push({
        claim: carveOut.claim,
        at: carveOut.at,
        message: `carve-out for '${carveOut.field}' matched nothing. An exemption nobody needs is an exemption nobody reviews; delete it.`,
      });
    }
  }

  return Object.freeze(violations);
}

export function assertEndpointSpine(routes: readonly RecordedRoute[]): void {
  const violations = scanEndpointSpine(routes);
  if (violations.length > 0) {
    throw new Error(
      `the composed route table violates ${new Set(violations.map((violation) => violation.claim)).size} claim(s):\n` +
        violations.map((violation) => `  ${violation.claim} ${violation.at}: ${violation.message}`).join('\n'),
    );
  }
}

// SEC-1. Every route names a policy, or is anonymous and on the allowlist.
function gate(route: RecordedRoute, at: string, routes: readonly RecordedRoute[], violations: Violation[]): void {
  const declared = route.config.policy;

  if (declared === ANONYMOUS) {
    if (!isAllowlisted(route, routes)) {
      violations.push({
        claim: 'SEC-1',
        at,
        message:
          'is anonymous and is not on the reviewed allowlist. Gate it with a permission policy, or add it to ANONYMOUS_ROUTES with the justification that makes it reviewable.',
      });
    }
    return;
  }

  if (!isRegisteredPolicy(declared)) {
    violations.push({
      claim: 'SEC-1',
      at,
      message:
        declared === undefined
          ? 'declares no permission policy. Every route names one; anonymity is an allowlisted exception, not a default.'
          : `declares '${String((declared as { name?: unknown })?.name ?? declared)}', which is not a registered policy. A policy is a value from POLICIES, compared by identity, so a look-alike object is not one.`,
    });
  }
}

// A-1, answered rather than assumed away. Fastify synthesizes a HEAD for every GET, so `/health` produces a
// reachable route nobody wrote and no author can point at in source. Requiring the allowlist to carry
// `HEAD /health` would ask a human to review a line that does not exist; ignoring HEAD entirely would let an
// explicitly registered HEAD ride in on its GET's entry and then diverge from it, which the Phase 2 audit
// demonstrated is possible.
//
// The discriminator is reference identity on `config`. A synthesized HEAD is handed the very same options object
// as its GET; an independently registered HEAD is not, however identical its contents. So a HEAD is allowlisted
// through its GET only when it provably IS its GET.
function isAllowlisted(route: RecordedRoute, routes: readonly RecordedRoute[]): boolean {
  const listed = (method: string, url: string): boolean =>
    ANONYMOUS_ROUTES.some((entry) => entry.method === method && entry.url === url);

  return listed(route.method, route.url) || originGetOf(route, routes).some((key) => listed('GET', key.slice(4)));
}

// The synthesis proof, factored out because two mechanisms now need it: the anonymous allowlist and the
// carve-out list. Both are lists of exemptions keyed by method and url, and both face A-1's question of what to
// do with a reachable route nobody wrote. The answer is the same in each: a synthesized HEAD is covered by its
// GET's entry, and only because reference identity on `config` proves it IS its GET rather than a separately
// registered HEAD that merely looks alike. Returns the GET's key, or nothing.
function originGetOf(route: RecordedRoute, routes: readonly RecordedRoute[]): readonly string[] {
  if (route.method !== 'HEAD') {
    return [];
  }
  return routes
    .filter(
      (candidate) =>
        candidate.method === 'GET' && candidate.url === route.url && Object.is(candidate.config, route.config),
    )
    .map((candidate) => `GET ${candidate.url}`);
}

// SEC-3 and TEN-1's URL surface. Path parameters have two independent declarations here, the `:name` in the URL
// and the properties of `schema.params`, and they are compared rather than one being trusted. This is the
// reconciliation lesson applied at a smaller scale: a params schema naming a property the URL does not carry is
// a scan reading a field nothing binds, and a URL parameter the schema omits is a bound value the scan cannot
// see. Either way the two views disagree and the disagreement is the finding.
function urlAndQueryParameters(
  route: RecordedRoute,
  at: string,
  violations: Violation[],
): readonly Readonly<{ name: string; where: CarveOutSurface }>[] {
  const inUrl = [...route.url.matchAll(/:([A-Za-z0-9_]+)/g)].map((match) => match[1]);
  const inSchema = propertyNames(route.schema.params);

  for (const name of inSchema) {
    if (!inUrl.includes(name)) {
      violations.push({
        claim: 'SEC-3',
        at,
        message: `schema.params declares '${name}', which the URL does not carry. The two views of the path parameters disagree, so neither can be trusted.`,
      });
    }
  }
  for (const name of inUrl) {
    if (!inSchema.includes(name)) {
      violations.push({
        claim: 'SEC-3',
        at,
        message: `the URL carries ':${name}', which schema.params does not declare. A bound value no scan can see is the hole the declaration exists to close.`,
      });
    }
  }

  return Object.freeze([
    ...[...new Set([...inUrl, ...inSchema])].map((name) => Object.freeze({ name, where: 'route' as const })),
    ...propertyNames(route.schema.querystring).map((name) => Object.freeze({ name, where: 'query' as const })),
  ]);
}

function propertyNames(schema: unknown): readonly string[] {
  if (schema === null || typeof schema !== 'object') {
    return [];
  }
  const properties = (schema as { properties?: unknown }).properties;
  return properties === null || typeof properties !== 'object' ? [] : Object.keys(properties);
}

// SEC-2's surface. The walk recurses, because that is where the fields hide: a body carrying `author` looks
// innocent and `author.createdBy` is the mass assignment. It descends through `properties`, through `items` so
// an array element is not a blind spot, and through the `allOf` / `anyOf` / `oneOf` combinators. `$ref` needs no
// resolver because the surface obligation in `createApp` refuses one at registration; if that ever relaxes, this
// walk goes blind and the refusal is what stands between the two.
function bodyFields(route: RecordedRoute): readonly Readonly<{ path: string; name: string }>[] {
  const found: Array<{ path: string; name: string }> = [];
  visit(route.schema.body, 'body', found);
  return found;
}

const TIME_FORMATS = new Set(['date-time', 'date', 'time']);

type ContractField = Readonly<{
  path: string;
  name: string;
  surface: CarveOutSurface;
  type: string | undefined;
  format: string | undefined;
}>;

// TIME-1 spans every contract surface, not just the body, because an `expiresAt` in a query string is the same
// naive instant as one in a body. The request surfaces are closed by the registration obligation, so this walk
// over them is complete in the sense S-5 asks for.
//
// The response surface is walked too and is NOT complete, and saying so is the point of this comment. Response
// schemas carry no closure obligation in this edition (nothing strips an undeclared response field, because the
// server authors it), so a response property that exists and is undeclared is invisible here. That makes the
// response half of this check a report rather than a proof, and TIME-1's conformance note says so rather than
// letting the two halves read alike.
function contractFields(route: RecordedRoute): readonly ContractField[] {
  const found: ContractField[] = [];
  const surfaces: ReadonlyArray<readonly [unknown, string, CarveOutSurface]> = [
    [route.schema.body, 'body', 'body'],
    [route.schema.params, 'params', 'route'],
    [route.schema.querystring, 'query', 'query'],
    [route.schema.headers, 'headers', 'header'],
    [route.schema.response, 'response', 'body'],
  ];
  for (const [schema, label, surface] of surfaces) {
    visitTyped(schema, label, surface, found);
  }
  return Object.freeze(found);
}

function visitTyped(node: unknown, path: string, surface: CarveOutSurface, found: ContractField[]): void {
  if (node === null || typeof node !== 'object') {
    return;
  }
  const schema = node as Record<string, unknown>;

  const properties = schema.properties;
  if (properties !== null && typeof properties === 'object') {
    for (const [name, child] of Object.entries(properties as Record<string, unknown>)) {
      const leaf = (child ?? {}) as Record<string, unknown>;
      found.push(
        Object.freeze({
          path: `${path}.${name}`,
          name,
          surface,
          type: typeof leaf.type === 'string' ? leaf.type : undefined,
          format: typeof leaf.format === 'string' ? leaf.format : undefined,
        }),
      );
      visitTyped(child, `${path}.${name}`, surface, found);
    }
  }

  if (schema.items !== undefined) {
    visitTyped(schema.items, `${path}[]`, surface, found);
  }

  for (const key of ['allOf', 'anyOf', 'oneOf'] as const) {
    const branches = schema[key];
    if (Array.isArray(branches)) {
      for (const [index, branch] of branches.entries()) {
        visitTyped(branch, `${path}.${key}[${index}]`, surface, found);
      }
    }
  }

  // The response surface is keyed by status code, so its children are schemas rather than properties. Walked by
  // shape rather than by name, so a route declaring 200 and 404 has both read.
  if (path === 'response') {
    for (const [code, child] of Object.entries(schema)) {
      if (/^\d{3}$/.test(code)) {
        visitTyped(child, `${path}.${code}`, surface, found);
      }
    }
  }
}

function visit(node: unknown, path: string, found: Array<{ path: string; name: string }>): void {
  if (node === null || typeof node !== 'object') {
    return;
  }
  const schema = node as Record<string, unknown>;

  const properties = schema.properties;
  if (properties !== null && typeof properties === 'object') {
    for (const [name, child] of Object.entries(properties as Record<string, unknown>)) {
      found.push({ path: `${path}.${name}`, name });
      visit(child, `${path}.${name}`, found);
    }
  }

  if (schema.items !== undefined) {
    visit(schema.items, `${path}[]`, found);
  }

  for (const key of ['allOf', 'anyOf', 'oneOf'] as const) {
    const branches = schema[key];
    if (Array.isArray(branches)) {
      for (const [index, branch] of branches.entries()) {
        visit(branch, `${path}.${key}[${index}]`, found);
      }
    }
  }
}
