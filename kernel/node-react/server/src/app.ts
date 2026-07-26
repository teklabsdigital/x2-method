import Fastify, { type FastifyInstance, type FastifyServerOptions, type RouteOptions } from 'fastify';
import type { ContractSchema, RecordedRoute } from './platform/routeTable.ts';

// The composition root. This is the ONLY module permitted to import the framework or to open a listening
// socket (eslint.config.js enforces both), because the route recorder is installed in the same expression that
// creates the instance: there is no window in which an instance exists and the recorder does not.
//
// Read `platform/routeTable.ts` first. It carries the five holes an audit drove through the first version of
// this file and what closed each one. The short form: the enumeration is materialized at `onReady`, not at
// `onRoute`, because a later `onRoute` hook can rewrite a route after an earlier hook has recorded it, and
// Fastify registers what the last hook leaves behind.

// Inverted deliberately. The first version enumerated the body-bearing methods as POST, PUT and PATCH, and was
// wrong three ways: Fastify parses and binds a body on DELETE and on OPTIONS, and `addHttpMethod` lets an
// application invent methods this file has never heard of. Only GET and HEAD are defined not to carry one, so
// they are the allowlist and everything else owes a contract, including whatever arrives next.
const BODYLESS_METHODS = new Set(['GET', 'HEAD']);

export function createApp(options: FastifyServerOptions = {}): FastifyInstance {
  const app = Fastify({ logger: false, ...options });

  // References, not snapshots. A snapshot taken here is a snapshot of a route that later hooks may still
  // rewrite, and the difference is the whole of audit finding 1.
  const registered: RouteOptions[] = [];
  let table: readonly RecordedRoute[] = Object.freeze([]);

  // Getter only, so `app.routeTable = []` throws instead of quietly emptying the evidence while every route
  // keeps serving. `decorate` with a plain value gives a writable property, which is what the audit exploited.
  app.decorate('routeTable', { getter: () => table });

  app.addHook('onRoute', (route: RouteOptions) => {
    registered.push(route);
  });

  app.addHook('onReady', async () => {
    const built: RecordedRoute[] = [];
    for (const route of registered) {
      const methods = methodsOf(route);
      const schema = (route.schema ?? {}) as ContractSchema;
      requireDeclaredSurfaces(methods, route.url, schema);
      const constraints = Object.freeze({ ...((route.constraints ?? {}) as Record<string, unknown>) });
      for (const method of methods) {
        built.push(Object.freeze({ method, url: route.url, constraints, schema: Object.freeze({ ...schema }) }));
      }
    }
    reconcileWithRouter(app, built);
    table = Object.freeze(built);
  });

  return app;
}

// The completeness obligation, made mechanical and made loud. A route that exposes a surface without declaring
// it would pass every downstream scan while carrying fields no scan can see, so it is refused before the server
// can serve. Throwing here fails `ready()`, which fails the process and fails any test that boots the app.
function requireDeclaredSurfaces(methods: string[], url: string, schema: ContractSchema): void {
  const bodyless = methods.filter((method) => BODYLESS_METHODS.has(method));
  const bodyBearing = methods.filter((method) => !BODYLESS_METHODS.has(method));
  const at = `${methods.join(',')} ${url}`;

  // `app.all()` and any hand-rolled equivalent. One registration cannot satisfy both halves at once, because a
  // body-bearing method owes a body contract and Fastify refuses a body schema on GET. Say so plainly rather
  // than letting the author discover it as two contradictory errors.
  if (bodyless.length > 0 && bodyBearing.length > 0) {
    throw new Error(
      `${at}: one registration mixes bodyless methods (${bodyless.join(',')}) with body-bearing ones (${bodyBearing.join(',')}); register them separately so each can declare its own contract.`,
    );
  }

  // A wildcard serves an unbounded URL set from one enumerated entry, so every name-based scan over it is
  // vacuous for everything it actually serves.
  if (url.includes('*')) {
    throw new Error(`${at}: wildcard routes are unenumerable; declare the parameters.`);
  }

  if (bodyBearing.length > 0) {
    requireShape(at, 'body', schema.body);
  } else if (schema.body !== undefined) {
    throw new Error(`${at}: a bodyless method declares schema.body; the framework will never bind it.`);
  }

  if (url.includes(':')) {
    requireShape(at, 'params', schema.params);
  }

  // Always required, on every route, including the ones that take no query string. A query string has no
  // syntactic tell in the URL the way a path parameter does, so there is no way to ask "does this route read
  // query parameters?" and get an answer; the only reachable form of the question is to make every route answer
  // it explicitly. Without this, `GET /search` reads `request.query` and no scan built on this table can see it.
  requireShape(at, 'querystring', schema.querystring);
}

// A declared surface has to be readable by a scan, and four of the values that satisfy "is not undefined" are
// not: `{}`, `true`, `false` and `null` all registered happily and validated nothing. So the predicate is
// positive rather than negative.
//
// `additionalProperties: false` is the load-bearing clause, and it does more than document. Fastify's validator
// runs with `removeAdditional`, so a schema that closes itself does not merely describe the accepted fields, it
// STRIPS every field it does not name before the handler runs: a request carrying `tenantId` reaches the
// handler with no `tenantId` at all. An open schema strips nothing, so the declaration a scan reads and the
// object the handler receives are different things. Requiring the clause is what makes them the same thing,
// which is what lets a scan over the declaration say anything true about what arrives.
function requireShape(at: string, surface: string, value: unknown): void {
  const fail = (why: string) => {
    throw new Error(`${at}: schema.${surface} ${why}. A scanned surface must be an explicit object schema with 'properties' and additionalProperties: false, even when it is empty.`);
  };
  if (value === undefined) {
    fail('is missing');
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(`is ${value === null ? 'null' : typeof value}, not an object schema`);
  }
  const schema = value as Record<string, unknown>;
  // A `$ref` points at a schema registered elsewhere, which a scan would have to resolve to read the field
  // names. Resolving them is owed; until it is built, refusing is the honest answer, because accepting one
  // would make every scan silently blind to whatever it points at.
  if ('$ref' in schema) {
    fail('uses $ref, and no resolver is built yet, so a scan cannot read the fields behind it');
  }
  if (schema.type !== 'object') {
    fail(`declares type '${String(schema.type)}'; scanned surfaces are objects`);
  }
  if (schema.properties === null || typeof schema.properties !== 'object') {
    fail('declares no properties object');
  }
  if (schema.additionalProperties !== false) {
    fail('does not set additionalProperties: false, so it accepts fields no scan can see');
  }
}

// `method` is a string or an array of them, and Fastify normalizes neither for the hook.
function methodsOf(route: RouteOptions): string[] {
  return (Array.isArray(route.method) ? route.method : [route.method]).map((method) => String(method).toUpperCase());
}

// The second view. Everything above is one mechanism agreeing with itself: the recorder decides what the table
// says and the obligations decide what may register. `printRoutes` is rendered by the router from what the
// router actually holds, so disagreeing with it means one of the two is lying, and the boot is refused rather
// than the disagreement being resolved in favour of whichever is more convenient.
function reconcileWithRouter(app: FastifyInstance, built: RecordedRoute[]): void {
  const fromRouter = parsePrintedRoutes(app.printRoutes({ commonPrefix: false }));
  const fromTable = new Set(built.map(keyOf));

  const missing = [...fromRouter].filter((key) => !fromTable.has(key));
  const invented = [...fromTable].filter((key) => !fromRouter.has(key));
  if (missing.length > 0 || invented.length > 0) {
    throw new Error(
      `the route table disagrees with the router. Served but not enumerated: ${missing.join(', ') || 'none'}. Enumerated but not served: ${invented.join(', ') || 'none'}.`,
    );
  }
}

function keyOf(route: { method: string; url: string; constraints: Readonly<Record<string, unknown>> }): string {
  const keys = Object.keys(route.constraints).sort();
  const constraints = keys.length === 0 ? '' : ` {${keys.map((k) => `${k}:${String(route.constraints[k])}`).join(',')}}`;
  return `${route.method} ${route.url}${constraints}`;
}

// `printRoutes({ commonPrefix: false })` renders a TREE, not a flat list, and that detail matters: a nested
// line carries only its own segment, so `/ok/:id` prints as `/:id` indented under `/ok`. Reading each line as a
// whole path made the reconciler report `/ok/:id` as enumerated-but-not-served, which is a false alarm of
// exactly the kind that gets a check deleted. Depth is recovered from the indent width rather than assumed to
// be a fixed step, and ancestors are concatenated back into the full path.
function parsePrintedRoutes(printed: string): Set<string> {
  const keys = new Set<string>();
  const ancestors: Array<{ indent: number; segment: string }> = [];
  for (const raw of printed.split('\n')) {
    // Box-drawing glyphs and spaces, then the path, which always begins with a slash.
    const line = raw.match(/^([─-╿\s]*)(\/.*)$/u);
    if (!line) {
      continue;
    }
    const [, indentText, rest] = line;
    const match = rest.match(/^(\S+)\s+\(([^)]*)\)\s*(\{.*\})?\s*$/);
    if (!match) {
      continue;
    }
    const [, segment, methods, constraintJson] = match;
    const indent = indentText.length;
    while (ancestors.length > 0 && ancestors[ancestors.length - 1].indent >= indent) {
      ancestors.pop();
    }
    ancestors.push({ indent, segment });
    const url = ancestors.map((entry) => entry.segment).join('');
    const constraints = constraintJson === undefined ? {} : (JSON.parse(constraintJson) as Record<string, unknown>);
    for (const method of methods.split(',').map((m) => m.trim()).filter(Boolean)) {
      keys.add(keyOf({ method, url, constraints }));
    }
  }
  return keys;
}

// What this does NOT cover, stated here rather than discovered later: a hook that answers a request itself
// (`onRequest` replying and never calling through) serves a URL with no route behind it, so it is reachable and
// unenumerable by construction. The route table cannot see it, and neither can any scan built on the route
// table. The same is true of the not-found handler. Closing that is a separate obligation on the hook surface,
// not on this one, and it is owed.
