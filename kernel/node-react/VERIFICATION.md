# node-react verification log

The dated build-and-verification history of this edition, and the proof that every guard binds. The conformance
record (`conformance.json`) states where each claim stands; this file is the evidence trail. The discipline is
red-green: every guard is deliberately violated, the guard confirmed red, and the violation reverted. A green
suite without this proof is exactly the aspirational-enforcement failure the catalog exists to prevent.

Nothing in this file changes a claim's status. Status lives in `conformance.json` and nowhere else.

## Round 1: scaffold (2026-07-26)

What exists after this round is the platform seam the claim scans will stand on, and nothing else. No claim is
realized, and `conformance.json` records all 69 as `owed` accordingly. Recording a green scaffold as progress
against the catalog would be the failure this log exists to catch.

Verified on this machine: `npm install` clean with zero advisories reported by `npm audit`; `tsc --noEmit` clean;
11 tests green (`vitest run`); `eslint .` clean; the server boots on `node src/main.ts` and answers `/health`
with 200 over real HTTP, on both GET and the auto-registered HEAD.

### Red-green proofs

| Guard | Injected violation | Result |
|-------|--------------------|--------|
| framework import ban (`eslint.config.js`) | `import Fastify from 'fastify'` in `src/routes/rogue.ts` | red |
| body contract obligation (`createApp` onRoute) | `app.post('/x', handler)` with no schema | red |
| body contract obligation | `app.post('/x', { schema: { response: {} } }, handler)` | red |
| params contract obligation | `app.get('/x/:secret', handler)` with no `schema.params` | red |
| wildcard refusal | `app.get('/x/*', handler)` | red |
| the same evasion nested | a body-bearing route inside a prefixed child plugin | red |
| recorder completeness | a fully declared route, to prove the refusals above are not vacuous | green |

The refusal guards are asserted in `src/platform/__tests__/routeSurface.test.ts`, so they stay red-proven on
every run rather than only on the day they were written. The import ban is proven by injection: the rogue file
was added, `eslint .` failed with the ban's message, the file was deleted, `eslint .` returned clean.

### Facts the framework supplied that the design did not anticipate

- Every `GET` carries an auto-registered `HEAD` (Fastify's `exposeHeadRoutes` default), and the recorder sees
  both. So the route table contains reachable surfaces nobody wrote, and every per-route predicate a claim
  asserts has to hold for them too. This is a completeness gain, not noise, but it is a difference from the
  sibling edition, where `MapGet` creates one endpoint.
- Registering a route after `ready()` is refused by the framework (`AVV_ERR_ROOT_PLG_BOOTED`), so the table taken
  at ready is the whole table for the process lifetime, rather than a snapshot that later registrations invalidate.

### Known hole, asserted rather than hidden

A hook that answers a request itself (`onRequest` replying without calling through) serves a reachable URL with
no route behind it, and no scan built on the route table can see it. The same is true of the not-found handler.
This is asserted as a passing test so that the day a mechanism closes it, the test fails and is rewritten.

## Round 2: the audit that refuted round 1 (2026-07-26)

An independent audit attacked the completeness claim and broke it. **A route could exist without appearing in
`routeTable`**, and the evasions needed neither a framework import nor a type cast, so neither half of the
two-part purchase bound them. Thirteen evasions were demonstrated; all thirteen were silent, with no failing
test and no lint error. Six of seven attempts to evade the framework import ban also succeeded.

Round 1's proof table was not wrong about what it tested. It was wrong about what it did not test, which is the
failure mode this log exists to catch, and it is recorded here rather than quietly overwritten.

Every evasion was reproduced against the tree before anything was changed, then re-run after. All are now
permanent tests in `server/src/platform/__tests__/routeSurface.test.ts`, so a regression is a failing test rather
than a fresh audit.

### What changed in the mechanism

| Defect | Repair |
|--------|--------|
| The table was snapshotted at `onRoute`, and a later `onRoute` hook could still rewrite the url, method or schema | references are held at `onRoute` and the table is materialized at `onReady`, after every hook has run |
| Nothing checked the table against the framework's own view | `onReady` reconciles the table with `printRoutes()` and refuses the boot on any disagreement in either direction |
| `app.routeTable = []` emptied the table while every route still served | getter-only decorator, frozen entries, frozen array, and a `readonly` declaration whose compile-time half is asserted by `@ts-expect-error` |
| The body-bearing method set was `{POST, PUT, PATCH}`, and DELETE, OPTIONS and custom methods bind bodies too | inverted to an allowlist: GET and HEAD are bodyless, everything else owes a body contract |
| A query string could go undeclared, because it has no syntactic tell in the URL | every route declares `schema.querystring`, empty if it takes none |
| `{}`, `true`, `false`, `null` and open objects satisfied the surface checks and constrained nothing | a positive shape predicate: object type, a properties clause, and `additionalProperties: false` |
| Two routes differing only by `constraints` produced byte-identical rows | `constraints` is part of a recorded route's identity |
| A `.js` or `.mjs` file was outside the import ban's glob, and `import()`, `createRequire` and subpaths walked past it | the glob covers every source extension, patterns cover subpaths, and dynamic import, computed specifiers and `createRequire` are refused |
| The ban could not reach a determined dynamic evasion at all | second constraint: only `src/main.ts` opens a socket and no module reaches the raw server modules, so an instance the lint cannot see still cannot serve |

### Red-green proofs, round 2

Nineteen attacks on the route table, run before and after. Before: 13 evaded. After: 0 evaded, 19 blocked. The
suite includes a fully declared route that boots successfully, so the refusals are proven non-vacuous.

Seven import-ban evasions, run before and after. Before: 6 of 7 passed `eslint .` clean (dynamic `import`,
`createRequire`, the `fastify/fastify.js` subpath, a `.js` file, a `.mjs` file, and a raw `node:http` server).
After: all 7 refused, plus the socket ban. Each probe was placed in `src/`, linted, and deleted.

Eight injections against the repaired shared linter, each red then green: a floating pin (`latest`), a range pin
(`^6.0.0`), an exact-but-unledgered version, a ledger row with no publish date, a deleted `VERSIONS.md`, an
undeclared manifest planted under `design/`, an em dash in an authored file named `yarn.lock`, and an em dash in
a real lockfile (which must stay green, and did).

### Facts the framework supplied that the design did not anticipate

- `additionalProperties: false` is not documentation here. Fastify validates with `removeAdditional`, so a
  closed schema STRIPS every field it does not name before the handler runs: a body carrying `tenantId` and
  `createdBy` reached the handler as `{title: 'ok'}`, and a query string carrying `email` reached it as
  `{page: '2'}`. The declaration a scan reads and the object the handler receives are the same thing only
  because the clause is required, which is why the shape check requires it rather than suggesting it.
- The post-`ready()` refusal code is instance state, not a fixed fact. A bare instance refuses through avvio
  with `AVV_ERR_ROOT_PLG_BOOTED`; an instance carrying an `onReady` hook, which every app from `createApp` now
  does, refuses through Fastify with `FST_ERR_INSTANCE_ALREADY_LISTENING`. Measured across five instance shapes;
  only the `onReady` hook changes it. The test asserts the set, because the property is that registration is
  refused.
- `printRoutes()` renders a tree, so a nested line carries only its own segment and `/ok/:id` prints as `/:id`
  indented under `/ok`. Reading each line as a whole path made the new reconciler report a false disagreement on
  the first nested route it met. There is a regression test for the parser.
