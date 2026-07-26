// The composed route table, as a first-class value on the instance.
//
// In .NET the equivalent is obtained for free: `EndpointDataSource` is not a report about the router, it IS the
// router, so a scan over it cannot miss a route. Fastify hands out no such object. `printRoutes()` renders a
// tree for humans and `findRoute()` answers about one URL at a time; neither is an enumeration a test can trust
// to be total. So completeness here is not free, and this file plus `../app.ts` is where it is bought.
//
// Bought, not given, means the purchase can be voided, and an audit voided the first attempt in five ways at
// once. All five are now closed, and every one of them is a permanent test in `__tests__/routeSurface.test.ts`:
//
//   1. The recorder ran at `onRoute` and snapshotted immediately. Fastify runs `onRoute` hooks in registration
//      order and then registers whatever the LAST hook left behind, so a hook added after `createApp` could
//      rewrite the url, the method, or the schema after the snapshot was taken. The table said `/decoy` while
//      the server served `/admin/impersonate`. Fixed by recording REFERENCES at `onRoute` and materializing the
//      table at `onReady`, which is after every hook has had its turn and after the router is built.
//   2. `routeTable` was a plain data decorator, so `app.routeTable = []` emptied it while every route still
//      served, and typechecked, and linted clean. Fixed with a getter-only decorator: assignment throws.
//   3. Recorded entries were mutable, so `app.routeTable[0].url = '/lies'` rewrote the evidence. Fixed by
//      freezing every entry and the array.
//   4. Nothing reconciled the table against the framework's own view. Fixed: `onReady` compares the table with
//      `printRoutes()` and refuses to boot if they disagree in either direction.
//   5. The surface obligations were an enumerated set of body-bearing methods, and the set was wrong. Fixed by
//      inverting it: only GET and HEAD are bodyless, everything else owes a body contract, including methods
//      this file has never heard of.

export type ContractSchema = Readonly<{
  body?: unknown;
  params?: unknown;
  querystring?: unknown;
  headers?: unknown;
  response?: unknown;
}>;

// One entry per method per URL per constraint set. Fastify allows `method: ['GET', 'HEAD']` on a single
// registration and allows two routes on the same method and URL distinguished only by `constraints`, so the
// constraint set is part of a route's identity: dropping it made two distinct routes into four byte-identical
// rows, and a scan that dedupes would have seen one route where two existed.
//
// `config` is held BY REFERENCE, not copied, and that is load-bearing rather than an economy. Fastify passes a
// synthesized HEAD the very same options object as the GET it was synthesized from, so reference identity is a
// proof of synthesis that no comparison of values can give: two routes whose configs are deep-equal may still
// have been written separately and may still diverge later. SEC-1's allowlist uses that identity to cover a
// synthesized HEAD under its GET's entry without covering an explicitly registered HEAD that merely looks the
// same, which is A-1's attribution problem answered rather than assumed away.
export type RecordedRoute = Readonly<{
  method: string;
  url: string;
  constraints: Readonly<Record<string, unknown>>;
  schema: ContractSchema;
  config: Readonly<Record<string, unknown>>;
}>;

declare module 'fastify' {
  interface FastifyInstance {
    // `readonly` here is the compile-time half of closing the reassignment hole; the getter-only decorator in
    // `createApp` is the runtime half. Neither alone was enough: the type said readonly array, not readonly
    // property, so assignment typechecked.
    readonly routeTable: readonly RecordedRoute[];
  }
}
