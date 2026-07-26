import Fastify, { type FastifyInstance, type FastifyServerOptions, type RouteOptions } from 'fastify';
import type { ContractSchema, RecordedRoute } from './platform/routeTable.ts';
import {
  ANONYMOUS,
  isRegisteredPolicy,
  noCredential,
  satisfies,
  type Authenticate,
  type Credential,
} from './platform/authorization.ts';
import { matchingRule } from './platform/nameMatching.ts';
import { TENANT_SHAPED } from './platform/registries.ts';
import type { Settings } from './platform/settings.ts';

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

// SEC-1's runtime half, and the reason it lives in this file rather than alongside the scan. The claim asks for
// two mechanisms and calls one "the belt to the scan's braces", which only means something if the two are
// independent. In a stack where the scan is a build-time reflection test and the fallback is host configuration,
// independence is free. Here the enumeration is only obtainable at boot, so a scan and a boot refusal are the
// same event in the same process, and putting both in one place would have produced one mechanism wearing two
// names.
//
// So they are split by what they consult, which is the only division that survives. This hook consults the
// REQUEST and never reads the route table; `architecture/endpointSpine.ts` consults the TABLE and never runs a
// request. Each therefore covers what the other cannot: the scan sees a route nobody has called, and the hook
// sees a URL that no route serves. The second half is not a theoretical nicety. A hook that answers a request
// without registering a route is the one hole the route table is documented as unable to close, and because
// `createApp` installs this hook in the same expression that creates the instance, no later hook can precede it,
// so every such URL is denied before the hook that would have answered it ever runs.
export type CreateAppSeams = Readonly<{ authenticate?: Authenticate }>;

// `settings` is a required first parameter and not an optional convenience, which is DATA-5's ordering half made
// structural. The claim says validation runs "at startup (not first-use)" and states it as a property of the
// validation; the real obligation is on composition, because validation is only "at startup" if nothing that
// could read a setting exists before it runs. Making the instance unconstructible without resolved settings is
// what turns that from a convention into a compile error, and the round 3 audit is why it is worth the
// awkwardness: `assertEndpointSpine` was deletable from `composeApp` with the entire suite, tsc and eslint clean,
// because the wiring between a composition and a guard is the one part nothing runs.
export function createApp(
  settings: Settings,
  options: FastifyServerOptions = {},
  seams: CreateAppSeams = {},
): FastifyInstance {
  const app = Fastify({ logger: false, ...options });
  const authenticate = seams.authenticate ?? noCredential;

  // Sealed in the same expression that creates the instance, for the same reason the recorder and the deny hook
  // are. See `sealRequestDispatcher`: this is the affordance an audit used to serve a URL below every hook.
  const dispatcher = sealRequestDispatcher(app.server);

  // References, not snapshots. A snapshot taken here is a snapshot of a route that later hooks may still
  // rewrite, and the difference is the whole of audit finding 1.
  const registered: RouteOptions[] = [];
  let table: readonly RecordedRoute[] = Object.freeze([]);

  // Getter only, so `app.routeTable = []` throws instead of quietly emptying the evidence while every route
  // keeps serving. `decorate` with a plain value gives a writable property, which is what the audit exploited.
  app.decorate('routeTable', { getter: () => table });
  // Getter only and already frozen, for the same reason the route table is: evidence a scan reads must not be
  // rewritable by the code it is scanning.
  app.decorate('settings', { getter: () => settings });
  app.decorateRequest('credential', null);

  app.addHook('onRoute', (route: RouteOptions) => {
    registered.push(route);
  });

  // TEN-1's fourth surface. The claim names four places a tenant identifier must never travel: route, query,
  // header and body. Three of them are declared surfaces closed by `additionalProperties: false`, so a scan over
  // the route table is a true statement about what arrives. Headers are not and cannot be: every request carries
  // host, user-agent and accept, so no route can close its header schema, and `request.headers` is readable in
  // full whether or not anything was declared. A scan over the table therefore cannot support the sentence
  // "tenant identity never travels as a header", and neither can the sibling edition's, which never looks at
  // headers at all.
  //
  // What IS reachable is a different mechanism class: not a scan but a strip, at runtime, in one place, before
  // any handler. Stripping rather than refusing, for the same reason the body surface strips: consistency with
  // how an undeclared body field is already handled, and a stray header from a confused client should not become
  // a failed request. The cost is that it is silent, which is a real cost and is why the scan above still
  // reports a route that DECLARES such a header: declaring one now means asking for a value that cannot arrive.
  app.addHook('onRequest', async (request) => {
    for (const name of Object.keys(request.headers)) {
      if (matchingRule(TENANT_SHAPED, name) !== undefined) {
        delete request.headers[name];
      }
    }
  });

  // Second hook, and second only to the strip above, so that the credential seam cannot be handed a header the
  // strip was meant to remove. Both are installed in the expression that creates the instance, so no externally
  // registered hook can precede either, and nothing reaches a handler or a later hook without passing this one.
  app.addHook('onRequest', async (request, reply) => {
    const declared = (request.routeOptions?.config as { policy?: unknown } | undefined)?.policy;

    if (declared === ANONYMOUS) {
      return;
    }

    // The default branch, and it is deny. A route that declared nothing, a URL with no route behind it, and a
    // forged policy object all land here, and none of them is distinguished from the others: an authenticated
    // caller is refused exactly as an anonymous one is. A fallback that admits any authenticated caller is not
    // deny by default, it is the bare authenticated-only gate this same claim forbids, relocated to the floor.
    if (!isRegisteredPolicy(declared)) {
      await reply.code(403).send({ error: 'forbidden', reason: 'no permission policy governs this request' });
      return;
    }

    const credential = authenticate(request);
    if (credential === null) {
      await reply.code(401).send({ error: 'unauthorized' });
      return;
    }

    if (!satisfies(declared, credential)) {
      await reply.code(403).send({ error: 'forbidden', reason: `requires ${declared.permissions.join(', ')}` });
      return;
    }

    request.credential = credential;
  });

  app.addHook('onReady', async () => {
    const built: RecordedRoute[] = [];
    for (const route of registered) {
      const methods = methodsOf(route);
      const schema = (route.schema ?? {}) as ContractSchema;
      requireDeclaredSurfaces(methods, route.url, schema);
      const constraints = Object.freeze({ ...((route.constraints ?? {}) as Record<string, unknown>) });
      const config = Object.freeze((route.config ?? {}) as Record<string, unknown>);
      for (const method of methods) {
        built.push(
          Object.freeze({ method, url: route.url, constraints, schema: Object.freeze({ ...schema }), config }),
        );
      }
    }
    reconcileWithRouter(app, built);
    reconcileRequestDispatcher(app.server, dispatcher);
    table = Object.freeze(built);
  });

  return app;
}

declare module 'fastify' {
  interface FastifyRequest {
    credential: Credential | null;
  }
  interface FastifyInstance {
    readonly settings: Settings;
  }
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
//
// The obligation is recursive, and the first version of this function was not, which an audit turned into four
// live evasions. `removeAdditional` strips at the level that closes itself and nowhere else, so a body closed at
// the top with an OPEN nested object handed the handler `{author: {tenantId: 'forged', createdBy: 'forged'}}`
// with the scan silent, and the same held one level down inside array items. The completeness obligation this
// edition is built on has a depth as well as a when: it is not enough for the declaration a scan reads to be
// the object the handler receives at the top level, because that is not where mass assignment hides.
function requireShape(at: string, surface: string, value: unknown): void {
  requireScannable(at, surface, `schema.${surface}`, value, 'root');
}

// Keywords that can introduce a field the scan's walk never visits. The walk descends `properties`, `items` and
// the `allOf` / `anyOf` / `oneOf` combinators, and nothing else, so anything below is refused on exactly the
// argument `$ref` is refused on: accepting one makes the scan silently blind to whatever it declares, and being
// blind quietly is worse than being unable to express the schema. `patternProperties` is the sharp one, because
// it survives `removeAdditional` as well as the scan: a body closed at the top with `patternProperties:
// {'^tenantId$': ...}` delivered `tenantId` to the handler with nothing reported.
const UNWALKED_KEYWORDS = [
  'patternProperties',
  'unevaluatedProperties',
  'propertyNames',
  'not',
  'if',
  'then',
  'else',
  'dependentSchemas',
  'prefixItems',
  'contains',
  'additionalItems',
  'definitions',
  '$defs',
];

// `root` is the surface itself and must be an object. `nested` is a real level of nesting, reached through
// `properties` or `items`, which `removeAdditional` does NOT reach from above and which therefore owes its own
// closure. `branch` is a combinator arm: it constrains the enclosing object, which is already closed and strips
// first, so demanding closure of the arm would forbid the ordinary use of `allOf` while buying nothing.
type SchemaPosition = 'root' | 'nested' | 'branch';

function requireScannable(at: string, surface: string, path: string, value: unknown, position: SchemaPosition): void {
  const fail = (why: string) => {
    throw new Error(`${at}: ${path} ${why}. A scanned surface, and every object schema inside it, must be an explicit object schema with 'properties' and additionalProperties: false, even when it is empty.`);
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
  for (const keyword of UNWALKED_KEYWORDS) {
    if (keyword in schema) {
      fail(`declares '${keyword}', which the endpoint-spine walk does not descend, so it would hide the field names it introduces`);
    }
  }

  const type = schema.type;
  if (position === 'root' && type !== 'object') {
    fail(`declares type '${String(type)}'; scanned surfaces are objects`);
  }
  // Every nested subschema says what it is. An untyped `{}` accepts an arbitrary object, so a property declared
  // that way is a hole the scan reads as a single leaf name while the handler receives whatever was sent. A
  // combinator arm is exempt, because an arm carrying only `required` or only `minProperties` is ordinary.
  if (position !== 'branch' && typeof type !== 'string') {
    fail(`declares no 'type', so a scan cannot tell whether it carries fields`);
  }

  const properties = schema.properties;
  if (type === 'object' || properties !== undefined) {
    if (properties === null || typeof properties !== 'object') {
      fail('declares no properties object');
    }
    if (position !== 'branch' && schema.additionalProperties !== false) {
      fail('does not set additionalProperties: false, so it accepts fields no scan can see');
    }
    for (const [name, child] of Object.entries(properties as Record<string, unknown>)) {
      requireScannable(at, surface, `${path}.${name}`, child, 'nested');
    }
  }

  if (type === 'array' || schema.items !== undefined) {
    // The tuple form (`items` as an array) is refused rather than walked, for the same reason as the keywords
    // above: the walk visits `items` as a single schema, so a tuple's element schemas are invisible to it.
    if (Array.isArray(schema.items)) {
      fail("declares 'items' as a tuple array, which the walk does not descend");
    }
    requireScannable(at, surface, `${path}[]`, schema.items, 'nested');
  }

  // The combinators are walked by the scan, so they are allowed. An arm cannot introduce an ARRIVING field that
  // the enclosing object does not also declare, because the enclosing object is closed and strips first; the
  // recursion here is for the keyword refusals and for nested objects declared inside an arm.
  for (const key of ['allOf', 'anyOf', 'oneOf']) {
    const branches = schema[key];
    if (Array.isArray(branches)) {
      for (const [index, branch] of branches.entries()) {
        requireScannable(at, surface, `${path}.${key}[${index}]`, branch, 'branch');
      }
    }
  }
}

// `method` is a string or an array of them, and Fastify normalizes neither for the hook.
function methodsOf(route: RouteOptions): string[] {
  return (Array.isArray(route.method) ? route.method : [route.method]).map((method) => String(method).toUpperCase());
}

// The affordance below the framework, closed. This is the round 4 audit's refutation of A-4 and it is worth
// stating exactly, because two passes have now declared this hole closed and been wrong.
//
// SEC-1's fallback denies a URL with no route behind it, and the argument for why nothing can pre-empt it is
// that `createApp` installs it in the expression that creates the instance, so every other hook is a LATER hook.
// Every word of that is true and it quantifies over hooks. Fastify hands out the raw `http.Server` as
// `app.server`, and a `request` listener on it is not a hook: it sits below the framework's dispatcher and
// therefore below every hook there is. A route module that swapped that listener served
// `/ghost?email=a@b.com&tenantId=forged` at 200 with the full query string leaked, a route table of length 2,
// and both eslint and tsc clean. No framework import, no `node:http` import, no `createRequire`: the socket ban
// governs imports and there was nothing to import.
//
// A lint now bans `.server` outside this file, and a lint is the weakest guard in this edition: it matches one
// spelling of one path to an object the framework deliberately exposes, and `request.raw.socket.server` reaches
// the same object from inside any handler. So the lint is the outer fence and this is the inner one. Mutating
// the 'request' event is refused outright, and the surviving dispatcher is reconciled at `onReady` against the
// one captured at creation, which is the same second-view discipline `reconcileWithRouter` applies to the route
// table: a guard that only agrees with itself has not been checked.
//
// Only the 'request' event is sealed. Fastify installs exactly one listener for it, at construction, and never
// adds another; 'connection', 'listening' and 'clientError' are untouched because nothing below the dispatcher
// hangs off them.
function sealRequestDispatcher(server: FastifyInstance['server']): readonly unknown[] {
  const dispatcher = Object.freeze(server.listeners('request'));

  const refuse = (verb: string): never => {
    throw new Error(
      `${verb} on the server's 'request' event is refused. A request listener runs below the framework dispatcher, so it precedes every hook including the deny-by-default fallback, and it serves a URL no route table can contain. Register a route.`,
    );
  };

  type Mutator = 'on' | 'addListener' | 'once' | 'prependListener' | 'prependOnceListener';
  for (const verb of ['on', 'addListener', 'once', 'prependListener', 'prependOnceListener'] as const) {
    const original = server[verb].bind(server) as (event: string | symbol, listener: never) => typeof server;
    (server as unknown as Record<Mutator, unknown>)[verb] = (event: string | symbol, listener: never) =>
      event === 'request' ? refuse(verb) : original(event, listener);
  }

  type Remover = 'removeListener' | 'off' | 'removeAllListeners';
  for (const verb of ['removeListener', 'off', 'removeAllListeners'] as const) {
    const original = server[verb].bind(server) as (event?: string | symbol, listener?: never) => typeof server;
    (server as unknown as Record<Remover, unknown>)[verb] = (event?: string | symbol, listener?: never) =>
      // `removeAllListeners()` with no argument takes the 'request' event with everything else, so an absent
      // event is refused rather than treated as harmless.
      event === 'request' || event === undefined ? refuse(verb) : original(event, listener);
  }

  return dispatcher;
}

function reconcileRequestDispatcher(server: FastifyInstance['server'], dispatcher: readonly unknown[]): void {
  const current = server.listeners('request');
  if (current.length !== dispatcher.length || current.some((listener, index) => listener !== dispatcher[index])) {
    throw new Error(
      `the server's 'request' listeners are not the ones installed at construction (${dispatcher.length} then, ${current.length} now). A listener below the framework dispatcher precedes every hook, so the deny-by-default fallback is not the first thing a request meets.`,
    );
  }
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
