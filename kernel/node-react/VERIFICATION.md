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

## Round 3: the endpoint spine, SEC-1 / SEC-2 / SEC-3 / TEN-1 (2026-07-26)

The first four claims realized on the route seam, each built under the delta protocol: the Node mechanism was
written from the claim file alone and recorded in `record/delta-log.md` before the sibling realization was
opened. What the deltas found is in `record/edition-findings.md` (A-2, A-3, A-4, E-6, E-7, E-8, E-9, S-8).

What exists after this round: a policy vocabulary in which the gate SEC-1 forbids cannot be written; a
deny-by-default hook installed in the expression that creates the instance; a pure scan over the composed table
asserting all four claims; one composition root that the process entrypoint and every architecture test share;
and an exemplar surface (a gated read, a gated read with a path parameter, a gated write with a body contract,
one allowlisted-anonymous liveness route) that exists so the scan has something real to be green about.

Verified on this machine: `tsc --noEmit` clean; 72 tests green (`vitest run`, up from 33); `eslint .` clean;
`node tools/conformance.mjs --check` and `node tools/docs-lint.mjs` ok; `node kernel/tools/compose.mjs --check`
ok. The server boots on `node src/main.ts` and over real HTTP answers `/health` 200, `/notes` 401 (the credential
mint is owed), and an unmatched URL 403.

### What changed in the mechanism, and why each is not an implementation detail

| Change | Why |
|--------|-----|
| The scan is a pure function over the table, run BOTH at boot in `composeApp` and in the architecture tests | A claim guard that lives only in CI lets a violating server start. Running the same call in both places means the test and the server fail identically rather than being two implementations of one idea. |
| The scan is NOT folded into `createApp`'s boot refusals | `createApp` owns the completeness of the enumeration; fusing the claim predicates into it makes every claim's guard indistinguishable from the mechanism they all stand on, and a boot refusal cannot report which allowlist and carve-out entries were used. |
| The deny-by-default hook IS in `createApp`, and the split is by what each consults | The scan reads the table and never issues a request; the hook reads the request and never reads the table. That is the only division under which SEC-1's "belt to the scan's braces" survives in a stack where the enumeration is only obtainable at boot (A-3), and it is what makes the fallback testable at all. |
| `RecordedRoute` holds `config` by reference rather than copying it | Fastify hands a synthesized HEAD the same options object as its GET, so reference identity is a proof of synthesis that no comparison of values gives. That is how A-1's attribution problem is answered: a synthesized HEAD rides on its GET's allowlist entry, an independently registered one does not, however identical it looks. |
| The registries live in `platform/`, not beside the tests | `TENANT_SHAPED` is read by the scan AND by the runtime header strip. A registry that is also a behaviour cannot live in the test tier, or the thing proven and the thing enforced are two lists. |
| A lint bans `createApp` in `src/architecture/__tests__/`, exempting one named file | A scan is a statement about whatever app it was handed. A test that builds its own app proves a property of an app nobody serves, which is the framework import ban's failure one level up. The red-proof file needs violating apps, so the exemption is named rather than implied. |

### Red-green proofs, round 3

Every guard below was violated deliberately, confirmed red, and reverted. Twenty-four of them are permanent
tests in `src/architecture/__tests__/spineRefusals.test.ts`, so they stay red-proven on every run.

| Guard | Injected violation | Result |
|-------|--------------------|--------|
| SEC-1 gate | a route declaring no policy | red, on the GET and its synthesized HEAD |
| SEC-1 allowlist | an anonymous route not on the allowlist | red |
| SEC-1 policy identity | a hand-rolled `{name: 'notes.read', permissions: []}` | red (a string-convention check would have passed it) |
| SEC-1 allowlist staleness | an allowlist entry matching no route | red |
| SEC-1 HEAD attribution | a HEAD registered before its GET, config identical in content | red on the HEAD, green on the GET |
| SEC-1 HEAD attribution, non-vacuity | the synthesized HEAD of an allowlisted GET | green |
| SEC-1 fallback | an ungated route requested anonymously | 403, body does not contain the payload |
| SEC-1 fallback | an ungated route requested WITH a credential holding every permission | 403 |
| SEC-1 fallback | a gated route, no credential / insufficient credential / sufficient credential | 401 / 403 / 200 |
| SEC-1 vocabulary | a policy declared with an empty permission list | refused at module load, and the server refuses to boot |
| SEC-1 vocabulary | a policy named `anonymous` | refused at module load |
| SEC-3 | path parameters `:email`, `:emailAddress`, `:user_email` | red on all three |
| SEC-3 | a `phoneNumber` query parameter | red |
| SEC-3 | a params schema and a URL that disagree | red in both directions from one registration |
| SEC-2 | a server-owned field at the top level, one level down, inside array items, behind `allOf`, and spelled `createdByUser` | red on all five |
| SEC-2 non-vacuity | a body of `title` and `parentId` only | green (a foreign key must not trip the `id` entry) |
| TEN-1 | a `:tenantId` path parameter | red |
| TEN-1 | `tenantId`, `orgId`, `organisationId`, `workspaceId` query parameters | red on all four |
| TEN-1 | a `tenant` field in a request contract | red |
| TEN-1 | a route declaring an `x-tenant-id` header | red |
| TEN-1 strip | `x-tenant-id`, `x-org-id`, `x-workspace-slug` sent on a real request | all three absent at the handler; `x-request-id` and `host` survive |
| architecture-test import ban | a test file importing `createApp` | red, with the composeApp message |
| composed-boot refusal | an ungated route, a PII query parameter, and a tenant field, each planted in the real exemplar | the server refuses to boot on each, naming the claim |

### The round 2 hole assertion, closed and rewritten

Round 1 recorded a known hole and asserted it as a PASSING test, with the instruction that a mechanism closing
it should break the test rather than pass unnoticed. SEC-1's fallback closed it and the test broke. This is the
first time that discipline has fired, and it is recorded here rather than quietly rewritten.

The hole was that a hook answering a request without registering a route serves a URL no enumeration contains;
the round 1 spike leaked `?email=` off `/ghost` with a route table of length zero. Measured now: 403, no leak,
table still length zero. It closes because the fallback consults the REQUEST rather than the table, and because
`createApp` installs it in the expression that creates the instance, so a ghost hook is by construction a later
hook. The narrow statement survives and is now what the test asserts: the route TABLE still cannot see the URL,
so every scan built on the table is still blind to it; the URL is simply no longer reachable.

**Round 4 correction: "no longer reachable" was wrong, and this paragraph is kept rather than rewritten.** The
argument holds over hooks and the evasion is not a hook. See the round 4 table above and A-4 in the register. See A-4.

### Facts the framework supplied that the design did not anticipate

- A synthesized HEAD shares its GET's options object **by reference**, not by value. This was measured while
  looking for a way to answer A-1 and turned out to be a stronger discriminator than the one being designed.
- Root-level `onRequest` hooks run for unmatched URLs, with `request.routeOptions.config` undefined. That is why
  an unmatched URL now answers 403 rather than 404, which changed an existing assertion in the completeness
  suite. The property that suite tests is unchanged: the url the table names is the url that serves.
- Deleting a key from `request.headers` inside `onRequest` is sufficient; the value is gone by the time any
  handler or later hook reads it, and `host` and `user-agent` are untouched by a token-run matcher.

## Round 4: the audit of round 3 (2026-07-26)

The third independent audit, run against the endpoint spine rather than against the claims about it. Round 3's
proof table is kept above, unedited, because round 2 is the model for how a refuted round is kept and because
what round 3 got wrong is not what it tested but what it did not.

**The headline.** Round 3's central design argument is that a closed declaration is not documentation but a
runtime filter, so a scan over the declaration is a true statement about what arrives. Measured, that held at
the top level of a surface and nowhere below it. `removeAdditional` strips at the level that closes itself, and
nothing required a nested level to close itself, so a body closed at the top with an open `author` object
delivered `{author: {nick: 'n', tenantId: 'FORGED', createdBy: 'FORGED'}}` to the handler with
`scanEndpointSpine` reporting nothing. Four evasions of that shape were live and four more were scan-blind.

This is the same defect the Phase 2 audit found in the completeness obligation, one axis over. That obligation
needed a **when** and was stated without it. This one needs a **depth** and was stated without it.

Every attack below was reproduced against the tree before anything was changed, then re-run after.

### What was broken, and what closed it

| Defect | Measured before | Repair |
|--------|-----------------|--------|
| The closure obligation was depth 0. A nested object, or an array's `items`, could stay open, and `removeAdditional` does not reach inside it | `author.tenantId` and `rows[0].createdBy` reached the handler, scan silent | `requireShape` recurses: every object schema inside a scanned surface owes `properties` and `additionalProperties: false`, and every nested subschema owes a `type` |
| `patternProperties` declared a field the walk never visits AND survived `removeAdditional` | `{'^tenantId$': ...}` delivered `tenantId` to the handler, scan silent | refused at registration, on the argument `$ref` was already refused on |
| Six further keywords could hide a declared field from the walk | tuple-form `items`, `not`, `if`/`then`/`else`, `contains`, and an untyped `{}` property all booted with the scan silent | all refused at registration |
| Nothing failed if `assertEndpointSpine` was deleted from `composeApp` | the call and its import both removed: 72 tests green, `tsc` clean, `eslint` clean | `composeApp` takes its `surfaces`, so a violating surface can be composed through the real function; three claims each have a red proof |
| The carve-out key omitted the surface | one carve-out written for a `name` query parameter silently exempted the `:name` PATH parameter of the same route | `surface` is part of the key |
| The carve-out key had no answer for a synthesized HEAD | a carve-out for `GET /f` left `SEC-3 HEAD /f` violating, and the only remedy was an entry for a route nobody wrote | a synthesized HEAD matches its GET's carve-out under reference identity on `config`, reusing the allowlist's proof |
| Both carve-out branches were dead code | `CARVE_OUTS` is empty, so neither suppression nor staleness had ever executed | the list is a parameter; five permanent tests cover both branches |
| `definePolicies`' two refusals had no test | deleting the empty-permission check left the whole suite green; the test meant to cover it asserts over the shipped registry's CONTENTS, not the constructor | the constructor is exported and called directly; three tests |
| The token matcher LOSES to equality on all-lowercase concatenations | `X-TenantId` and `X-OrgId` reached the handler over real HTTP with their forged values, because Node lowercases header names and `x-tenantid` is one token | the concatenated spellings are entries in both registries |
| The architecture-test `createApp` ban was a path ban | a two-line re-export module walked past it, lint clean, and the test then scanned an app nobody serves; `../../app.js` walked past too | the symbol and the member access are banned as well as the path; six variants now blocked |
| A-4's closed hole was not closed. The socket ban governs IMPORTS, and `app.server` is the raw `http.Server` handed out on the instance every module holds | a `request` listener on `app.server` sits below the dispatcher and below every hook: `/ghost?email=a@b.com&tenantId=forged` served 200 with the query string leaked, route table length 2, lint and tsc clean | `.server` is banned outside the composition root, aimed at the affordance rather than the import |

### Red-green proofs, round 4

Every repair above is red-green: the guard was reverted to its round 3 shape and the new test confirmed red,
then restored. Twenty-one new permanent tests, 72 to 93.

| Guard | Injected violation | Result |
|-------|--------------------|--------|
| nested closure | an open nested object, and open array `items` | red, and the handler no longer receives the forged field |
| unwalked keywords | `patternProperties`, tuple `items`, `not`, `if`/`then`/`else`, `contains`, untyped `{}` | red on all six |
| nested closure, non-vacuity | the same shapes with every level closed | green, and the strip reaches depth |
| combinator arms | an `allOf` arm that does not close itself | green, deliberately: the arm constrains an object that already strips |
| boot wiring | an ungated route, a PII query parameter and a tenant contract field, each composed through `composeApp` | rejects, naming the claim; goes red if the call is deleted |
| carve-out surface key | a carve-out naming `query` against a route flagged on both `route` and `query` | the route half stays reported; red if `surface` leaves the key |
| carve-out HEAD attribution | a carve-out on a GET, and separately an independently registered HEAD | the synthesized HEAD is covered, the registered one is not; red if the identity proof leaves the key |
| carve-out staleness | a carve-out matching no route | red; and green when it matches, so the check is not vacuous |
| policy constructor | a policy naming no permission, and one named `anonymous` | both throw; neither was reachable by any test before |
| registry concatenations | `firstname`, `lastname`, `dateofbirth`, `emailaddress`, `tenantid`, `orgid`, `organisationid`, `workspaceid` | all matched; `origin`, `organic`, `filename`, `namespace` still clean |
| registry decompositions, plurals and numbered fields | `e_mail`, `e-mail`, `EMailAddress`, `mail`, `emails`, `email1`, `phone2` | all matched; red without the letter/digit split, and red without the `mail`/`emails`/`phones` entries; `mailbox` and `voicemail` still clean |
| architecture-test import ban | six variants: direct, `.js`, deeper relative, re-export, namespace of a re-export, aliased specifier | all blocked; the named exemption still lints |
| raw server ban | a route module taking over `app.server`'s request listener, with no banned import and no `any` | red; clean before the ban existed |

### Attacks that found nothing, recorded because a clean area is a result

- **The deny-by-default hook held against every bypass tried.** A route-level `onRequest` in route options,
  `preParsing`, `preValidation`, `preHandler`, `setNotFoundHandler`, a not-found handler with its own hook chain,
  `setErrorHandler`, and an `onRequest` registered inside an encapsulated child before its routes: all eight
  answered 403 and none reached a handler. The reason is structural and holds for all of them: the hook is
  installed in the expression that creates the instance, so every other hook is a later hook.
- **No policy can be produced from outside the registry.** `structuredClone`, spread, and `Object.create` of a
  real policy are all rejected by the identity check.
- **`request.credential` does not leak.** Sequential and concurrent mixes of gated and anonymous requests each
  saw their own credential or `null`. `decorateRequest` with a `null` default is a primitive, so the shared
  reference footgun does not apply.
- **`request.raw.headers` IS `request.headers`.** They are the same object in Fastify 5, measured over real
  HTTP, so deleting a key removes it from both. The builder's prime suspect is refuted. `request.raw.rawHeaders`
  does retain the original array, which is a residual named below.
- **The header strip runs before `authenticate` on every path.** Measured on three: a gated route where
  `authenticate` runs (it saw zero tenant headers), an anonymous route where the deny hook returns early, and an
  unmatched URL where the deny hook short-circuits at 403 without calling `authenticate` at all.
- **Nothing downstream depends on 404 for an unmatched URL.** Checked rather than assumed: the client's only
  404 handling is `notesRepo.ts` reading a missing NOTE, which still comes from inside the gated handler, and
  RES-4's probes are registered routes. The 403 is safe.
- **The URL parameter regex holds against Fastify's real syntax.** A regex constraint and a multi-parameter
  segment are both parsed correctly; an optional parameter is refused at boot by the router reconciliation
  rather than being silently mis-scanned.
- **`violationsOf`'s filter in the red-proof file does not hide a genuine violation.** It filters on `at` being a
  served route, and every violation the scan emits carries a served route's key except the two staleness checks,
  which have their own proofs.

### Residuals, stated rather than discovered later

- **`request.raw.rawHeaders` still carries the stripped values.** It is the pre-parse array, not the object the
  strip owns, and nothing in this edition reads it. Closing it would mean rewriting a Node internal array; it is
  recorded here so that a future handler reaching for it is a known hole rather than a new one.
- **A tenant identifier smuggled inside a cookie or an `Authorization` parameter is not stripped.** Nothing in
  this edition parses either, so there is no surface to strip from yet. It becomes real the moment a cookie
  parser lands.
- **A route module that nobody calls from `compose.ts` is invisible to every gate.** `tsc`, `eslint` and the
  suite are all clean with an unreferenced `registerRogue` in `src/routes/`. It serves nothing, so it is dead
  code rather than an evasion, but nothing says so.

## Round 5: configuration and time, CFG-1 / SEC-5 / DATA-5 / TIME-1 (2026-07-26)

The claims were chosen by re-deriving from the claim files and both conformance records, not from the round 1
handover's sequencing, which its own author flagged as contaminated. The delta protocol's quarantine was extended
to `kernel/dotnet-react/server/src/**` and `server/**/*.json` before step 2 was written, because three of these
four claims are realized in production code and committed configuration rather than in the test tier, and the
standing quarantine named only the tests and the record. Recorded in `record/delta-log.md` before the round.

Green at the end: `npm run verify` at 154 tests (up from 130), `tsc` clean, `eslint` clean, both editions'
`docs-lint` and `conformance --check`, `compose --check`, and the sibling's architecture suite at 49 of 49 after
every mutation was reverted.

### What was built

| Claim | Mechanism | Where |
|---|---|---|
| CFG-1 | `SETTINGS_SPEC` as the declared configuration surface; one seam that is the only reader of a config file, the secret store or the environment; an AST scan for operational-setting literals, environment reads outside the seam, and script literals duplicating committed values | `platform/settings.ts`, `architecture/configurationSurface.ts`, `eslint.config.js` |
| SEC-5 | secret-shaped keys may hold only the empty placeholder in a committed file, refused at resolution and by the scan; the dev store's path asserted outside `EDITION_ROOT`; filesystem reads confined by lint | `platform/settings.ts`, `architecture/configurationSurface.ts`, `platform/registries.ts` |
| DATA-5 | resolution as `composeApp`'s default parameter, before `createApp`, which cannot be constructed without the frozen result; every problem reported at once; undeclared keys refused | `platform/settings.ts`, `compose.ts`, `app.ts` |
| TIME-1 | a format scan over every contract surface rejecting time-named bare strings; one clock seam with the constructors and globals banned elsewhere | `architecture/endpointSpine.ts`, `platform/clock.ts`, `platform/registries.ts` |

### Red proofs

Each of these was run and observed red before the guard was accepted, and each is a permanent test.

| Guard | Red case | Test |
|---|---|---|
| DATA-5 mandatory key | each of three keys absent, named in the error | `settings.test.ts` |
| DATA-5 all-errors | three keys absent, all three named in one message | `settings.test.ts` |
| DATA-5 coercion | a non-numeric port, an empty string setting | `settings.test.ts` |
| DATA-5 closure | a committed key the spec does not declare | `settings.test.ts` |
| CFG-1 override channel | an override name that is not derived from a declared key; a malformed override value | `settings.test.ts` |
| CFG-1 literal ban | a provider endpoint; a model id; a localhost URL stays green | `configurationSurface.test.ts` |
| CFG-1 fourth home | a `process.env` read outside the seam | `configurationSurface.test.ts` |
| CFG-1 duplication | a script carrying a committed configuration value verbatim | `configurationSurface.test.ts` |
| SEC-5 committed secret | a secret key holding a value; the empty placeholder stays green | `settings.test.ts`, `configurationSurface.test.ts` |
| SEC-5 store misuse | a non-secret placed in the secret store | `settings.test.ts` |
| SEC-5 relaxation | the secret absent in production, staging and ci; permitted in development and test | `settings.test.ts` |
| SEC-5 false positive | `keyboardLayout` stays green, which is why `key` is a whole-name entry | `configurationSurface.test.ts` |
| exemption suppression and staleness | a named exemption suppresses; the same literal in another file does not; an exemption matching nothing is reported | `configurationSurface.test.ts` |
| TIME-1 contract | a time-named bare string in a body; the same in a query string | `endpointSpine.test.ts` |
| lint confinements | `process.env`, `new Date`, `Date.now`, `performance.now` and `node:fs` each rejected outside their seam, and each seam clean | probed directly, all five observed |

The lint half was probed rather than assumed, because a lint that is configured and not binding reads exactly
like one that is: a probe file carrying all four banned forms produced four errors in `src/routes/`, and
`settings.ts` and `clock.ts` stayed clean.

### What the sibling was measured to do, with controls

Every statement this round makes about `kernel/dotnet-react/` is a mutation with a control, run against the
architecture suite, with the tree restored afterwards. Baseline 49 of 49 before and after.

| Mutation | Result |
|---|---|
| `Jwt:Key` committed in plaintext to `appsettings.json` | **49 of 49 green**, and the CI secret-scan grep silent. Both SEC-5 mechanisms miss it (E-11) |
| the CI grep run against `Password: "..."` and `secret: "..."` | only the lowercase spelling matches; the scan carries no `-i` and .NET config keys are PascalCase (E-11) |
| a public type with a naive `DateTime` added to `Kernel.Api` | **49 of 49 green** (E-15) |
| the identical type added to `Kernel.Contracts` (the control) | **red**, naming TIME-1. The guard binds; it is absent one assembly over |
| `grep` for `ValidateOnStart` / `AddOptions` / options binding across `server/src` | none. The claim's `Edition:` bullet names a mechanism the edition does not have (E-14) |

### Predictions this round got wrong, kept because that is the record

- **`Date` is not the unsafe type.** The seeded hypothesis said JavaScript ships one time type and it is the
  naive one. It is an instant: unambiguous, and offset-blind. The claim's two-way partition has no bucket for it
  (A-5).
- **`Temporal` is not available.** The hypothesis that Node might be the stronger realization is refuted at this
  runtime, not in principle (A-5).
- **SEC-5's out-of-tree store was predicted as the class C casualty.** It is not: the sibling already keeps a
  development secret inside its own tree behind a gitignore entry, which is the weaker mechanism this pass
  predicted Node would be forced down to (E-12).
- **The DATA-5 relaxation was predicted to need a scan exemption.** It does not, because its value is not bound to
  a secret-shaped NAME, which is the stated reach of a name-based predicate rather than an oversight.
- **A text scan was predicted to be sufficient for CFG-1.** It reported three files for reading `process.env`, and
  all three hits were the comments and error messages explaining why `process.env` is banned. The source checks
  moved to the parsed AST (E-5 second instance).

### Residuals, stated rather than discovered later

- **The scan does not scan its own registries.** `configurationSurface.ts` and `registries.ts` are excluded from
  the literal checks, because a registry of forbidden values contains the forbidden values. A real credential
  written into either is invisible to this scan. Two files, both named in the code.
- **The secret predicate resolves on the NAME.** A credential assigned to `bootstrapValue` is invisible. Judging
  the value by entropy would be a second heuristic under the first, which is the shape E-2 records in the
  sibling; SEC-5's other mechanism, the CI secret-scan gate, is the one that would cover it and is not built.
- **The duplication check skips values shorter than eight characters.** A committed value of `kernel` or `info`
  is uncovered, in both editions.
- **The response surface of the TIME-1 scan is a report, not a proof.** Response schemas carry no closure
  obligation here, so a response property that exists and is undeclared is invisible to it. The request surfaces
  are closed and the scan over them is complete.
- **No persistence surface exists**, so a third of TIME-1's statement has nothing to scan, and no principal
  exists, so DATA-5's runtime-refusal idiom ships with a test and no caller. Both are why the two rows read
  `owed` rather than `proven`.

## Round 6: the dangling finding id, and the loop gaining a check for it (2026-07-26)

No claim was built in this round. A record defect was closed and the gate that would have caught it was added,
at the start of the adjudication pass.

**The defect.** B-4 was cited seven times across four files and defined nowhere. Two of those citations ship:
the SEC-2 row of `conformance.json`, and the README table generated from it. `conformance.json` seeds into every
instantiated project, so a seeded tree inherited a machine-readable conformance record pointing at a finding
that existed in no register. Neither gate could see it: `conformance.mjs` proves the record is internally
consistent and says nothing about a prose citation inside a `note`, and docs-lint had no notion of a finding id.

**What was measured rather than reconstructed.** B-4's substance is a behaviour of running code, so it was
re-measured on the edition's pinned `fastify` 5.8.5 under Node 24.13.1, in a throwaway spike carrying no
edition machinery, eleven probes. The entry is written from that measurement and is in the register.

| Probe | Result |
|---|---|
| a body closed at the top level | `tenantId` and `createdBy` removed before the handler |
| the same, with a nested `author` object left open | both forged fields reached the handler |
| the same, with `author` closed | removed |
| array `items` open, then closed | reached, then removed |
| closed at depth 0 and depth 1, open at depth 2 | the depth-2 forged field reached the handler |
| `patternProperties` beside a closed object | `tenantId` reached the handler |
| an untyped `{}` property | the whole forged object reached the handler |
| a closed query string | `email` removed |
| control: the same closed body with `removeAdditional: false` | **400 `FST_ERR_VALIDATION`**, not a strip |

The last row is the one this round adds to the record. The strip is a **framework default**, not something this
edition sets, asserts or tests, and `createApp` spreads caller-supplied server options into the instance. The
security consequence is nil, since refusal is at least as safe as removal here. The consequence for S-10 is not:
S-10 rules that a closure obligation has a **remedy**, and records this edition's remedy on a caller surface as
a silent strip, with an argument for why refusal would be wrong there. That remedy is a validator default nobody
wrote down.

**The check, and its red-green proof.** `tools/docs-lint.mjs` (shared tier) now fails on a finding id that is
cited and not defined. It is conditional on the register file and announces the skip when it is absent, on the
same rule as the catalog-completeness check, because a seeded tree carries the citations without the register.
The register itself is scanned as a citing surface, because that is where the dangling id lived first. The tool
names no finding id literally, so it needs no exemption from its own check, which is the E-5 second-instance
lesson applied before rather than after.

| Guard | Injected violation | Result |
|-------|--------------------|--------|
| cited-but-undefined id | an undefined id in a comment in `server/src/platform/` | red, naming the file |
| cited-but-undefined id, shipped surface | an undefined id appended to the SEC-2 conformance note, table regenerated | red, naming `conformance.json` and `README.md` |
| cited-but-undefined id, in the register | an undefined id appended to `record/edition-findings.md` | red, naming the register |
| non-vacuity | the tree restored | green in both editions, and all three probes byte-reverted |
| the seeded shape | the edition copied to a tree with no register above it | green, with `note: the findings register is not present, so cited finding ids were NOT checked` |

A survey before the check was written found 36 distinct ids across both editions and `record/`, every one of
them a real citation and no false positive, which is why the id pattern is left broad rather than anchored to a
citation phrasing.

## Round 7: applying adjudication rulings 2 through 11 (2026-07-26 and 2026-07-27)

No claim was built in this round and no server test was added; the suite is unchanged at **154 of 154**. What
changed is the record and two shared-tier tools that keep the record honest, and both tools gained failure modes
that had never been seen to fire.

**What this edition's four rows gained.** SEC-5, DATA-5, TIME-1 and TEN-1 are the rows S-8 was measured on: each
sits at `owed` with a red-green-proven half, and the four-word vocabulary had nowhere to say so. Each now carries
per-obligation statuses. TEN-1 reads `owed` because no credential can be minted here, while its prohibition on
all four surfaces reads `proven` in the same row. **No status moved**, in either direction, which is what the
ruling predicted: the roll-up takes the weakest obligation and every one of these rows already had an owed half.
The edition stays at 4 `proven`, 65 `owed`.

**One row was found to be understating itself** while its obligations were being written (E-19). SEC-5's note
said the CI secret-scan gate "is not built"; `.github/workflows/ci.yml` runs `tools/secret-scan.mjs --self-test`
and then the scan as a required job, and has since the E-16 repair a few hours after the note was written. The
obligation is written as `proven` with the mechanism named and the stale clause is removed. The row still rolls
up to `owed` on the vault port, so nothing moved; the finding is recorded because a row understating its own
edition by a whole mechanism is a status the record could not honestly carry, which is the register's own bar.

| Guard (`tools/conformance.mjs`, ruling 3) | Injected violation | Result |
|-------------------------------------------|--------------------|--------|
| an obligations array of fewer than two entries | one obligation left on TEN-1 | red, naming the row |
| obligations that are not a list | the array replaced by a string | red |
| an obligation with no name | name emptied | red, naming the position |
| two obligations with the same name | second name copied from the first | red |
| an obligation status outside the vocabulary | `partial` | red, listing the four words |
| an obligation with no text | text emptied | red |
| an owed obligation naming no trigger | trigger removed from the text | red |
| a row stronger than its weakest obligation | TEN-1 set to `proven` over its owed half | red, naming the weakest obligation |
| a non-owed obligation on a row naming no mechanism | mechanism emptied | red |
| the generated table not regenerated after an obligation edit | obligation text changed only in the JSON | red |
| non-vacuity | the record restored | green in both editions, byte-reverted |

| Guard (`tools/docs-lint.mjs`, ruling 10) | Injected violation | Result |
|------------------------------------------|--------------------|--------|
| a qualified locus back in prose | `centralized (model-level assertion)` on TEN-3 | red, naming the file |
| a locus outside the enum | `hybrid` | red |
| no locus at all | the line removed | red |
| an empty `locus_note` | the key with nothing after it | red |
| a claim file with no front matter | the block removed | red |
| non-vacuity | the file restored | green in both editions, byte-reverted |
| the seeded shape | this edition copied to a tree with no catalog above it | green, with `note: the claims catalog is not present, so claim locus values were NOT checked` |

Three checks now skip for the same reason in a seeded tree, and all three say so separately rather than sharing
a flag: catalog completeness, the finding-id check, and the locus enum. Each names the artifact it could not
read, because a reader of a green run has to be able to tell which tree they are looking at.

The empty-`locus_note` probe found a hole nobody predicted: the shared front-matter parser requires at least one
character after the colon, so a key with an empty value parses as absent. Harmless for a mandatory key, exactly
key-sized for an optional one, and the check reads the raw front-matter block because of it.

**The dependency half.** `postcss` moves from 8.5.15 to 8.5.18 in the shared tier under ruling 9a (a live
advisory outranks the window above the 7-day floor), recomposed here, with the first row of a new advisory-rule
section in `VERSIONS.md`. Measured: `npm audit` reports **0 vulnerabilities** in this edition's composed client
tree, down from 1 high. The lockfile diff touches nothing but that package; the server tree is untouched and
`npm run verify` passes on it unchanged.

## 2026-07-27, node Phase A: re-measuring the four proven rows

Baseline: **7921bf1**, server 154 tests, 6 files. The four rows read `proven` and each was FLAT, one status with
no obligations, which is the shape E-72 found in the sibling: several separate things carried by one word.

### The vacuity probe, run first because it covers three rows at once

Narrowed `scanEndpointSpine`'s own loop to match nothing. The sibling's equivalent narrowing left five assertions
across two claims green. Here: **23 tests failed**, across SEC-1, SEC-2, SEC-3 and the composition-wiring proof,
each naming its claim.

The difference is structural, not diligence, and the distinction is the whole point (E-79). This scan is a pure
function over a route table passed IN, so every refusal is a fixture test asserting a specific violation is
reported, and narrowing the loop makes 23 of them return nothing. A scan that reads the host it is hosted by
cannot be handed a violating surface at all, so its only available assertion is "the shipped surface is clean",
which passes equally when the scan reaches nothing.

Reverted; `git diff` empty over `server/src`; 154 restored.

### What the three security rows actually have

Measured rather than assumed, and the result is that they hold:

- The route table records REFERENCES at `onRoute` and materializes at `onReady`, then reconciles against
  Fastify's own `printRoutes()` and refuses to boot on a disagreement in either direction.
- The registries are extent-asserted in both directions, and their false positives are ASSERTED rather than
  described: `fileName` and `tenantName` match the PII registry and are accepted as the cost; `filename`,
  `namespace`, `mailbox` and `voicemail` do not.
- `createApp` refuses at REGISTRATION any schema keyword the body walk cannot descend, and requires every object
  schema in a scanned surface to close itself. The sibling has no equivalent.
- SEC-3's undeclared-parameter obligation is genuinely CLOSED here (`removeAdditional` strips it before the
  handler runs) and reads `owed` in the sibling. Each edition measured on its own mechanism, not against the other.

All three keep `proven`, and each now carries its obligations so the status states what it covers rather than
standing for it.

### CFG-1 is lowered, and its own note said why before this round did

The row read `proven` while its note admitted the duplication check "skips values shorter than eight characters".
A status that contradicts its own note is the overstatement this re-measurement exists to find.

| plant | outcome |
|-------|---------|
| a literal `'kernel-api'` in `client-web/tools/harness/main.ts` | red-correct, naming the file and the key it duplicates |

So the check binds. The candidate set is what fails: values are filtered by an eight-character floor AND by a
`typeof === 'string'` test. `http.port` is 5080, a number, so it is excluded twice, and the second exclusion is a
consequence of the type test rather than an argued decision.

Two live instances under it, both in the shared client tier, both silent defaults, both defaulting to a
hardcoded port that duplicates `config/settings.json`.

Not repaired: both are COMPOSED SHARED files, and this is the second instance of one cause. The sibling's
`mintToken.mjs` carries the same shape for the same reason (E-75), and the reason is that a shared file cannot
read an edition's committed configuration because the path is edition-specific. DB2 has since made the repair
obvious: `edition.json` is at the same relative path in both editions. Recorded as E-78 with that trigger.

### Gates

Server 154, docs-lint ok, conformance ok at 69 rows. Non-owed node rows unchanged at 4; the change is that one of
them is now honest about being `patterned` and all four state their obligations.

### Node Phase A, F2: five shared-tier rows that read `owed` while their guards were binding

The client tier is composed, so this edition's `client-web` runs the same 65 tests the sibling does. Five rows
recorded `owed`, which says "no mechanism", while the mechanism ran and passed here on every suite execution.
That is the understating direction of a dishonest row: it is safe for the reader who trusts it and expensive for
the reader who acts on it, because building what already exists is the cost it imposes.

Every plant below was made in THIS edition's tree and scored here. Nothing was inferred from the sibling.

| claim | plant | outcome |
|-------|-------|---------|
| UI-1 | delete one token from `tokens.ts` | red-correct, `every design-system variable has a matching token` |
| UI-2 | `style={{ color: '#ff0000', padding: '12px' }}` on a screen | red-correct, two eslint errors, both naming UI-2 |
| UI-4 | a fabricated `<div data-atom="promo-banner" />` | red-correct, de-fabrication |
| SEC-6 | narrow the redactor's JWT arm to match nothing | red-correct, `scrubs a JWT-shaped token` |
| MOD-2 | a `notes-panel.tsx` beside `NotesScreen.tsx` | red-correct, naming and placement |

All reverted; `git status` clean over `client-web`; 65 and 154 restored.

Two rows move off `owed` (UI-1 to `latent`, UI-2 to `patterned`) and three stay `owed` on a weakest obligation
that is now NAMED rather than standing for the whole row:

- **UI-4** inherits E-68 byte for byte, because the guard is a composed shared file. The de-fabrication assertion
  collects `[data-atom]`, so its subject is the set of elements that already declare themselves part of the
  ledger's vocabulary. The plant above is caught because it marks itself; an unmarked `<p>` is invisible.
- **SEC-6**'s server half is trigger-gated rather than unbuilt, and the distinction is worth the words. `createApp`
  constructs Fastify with `logger: false`: this server emits no log at all, so there is no logging surface to
  assert redaction over. The trigger is the first server log statement, not a missing test.
- **MOD-2** has no server-tree walk at all. That is F4's missing-server-half question, named here so it is not
  discovered again.

**UI-1 is `latent`, not `proven`, and the reason is the artifact rather than the guard.** The mechanism binds and
carries a distinct-count floor above 50 so an emptied export cannot pass. What it locks against is kernel filler:
the export's own header says to replace its values with a real design export at instantiation. A lockstep proof
against a placeholder is a proof about a placeholder.

### Gates

Client 65, server 154, docs-lint ok, conformance ok at 69 rows. Non-owed node rows 4 to 6.

### Node Phase A, F3: four rows recorded no mechanism while four mechanisms were binding

TEST-2, TEST-3, HUM-1, TEN-5 and AI-2 all read `owed` with an empty `mechanism` field and a bare `trigger:` line.
Four of the five triggers had already fired and four mechanisms were present and binding in this tree. Every plant
below was made here and scored here.

| claim | plant | outcome |
|-------|-------|---------|
| HUM-1 | remove the contracts owner from `.github/CODEOWNERS` | red-correct, naming the surface and the claim |
| TEN-5 | a ledger row with an empty sole-reader cell | red-correct |
| TEN-5 | a row naming `NightlyNodeSweepIsSoleReader`, which exists nowhere | red-correct |
| TEN-5 | a second `docs/claims/billing-bypass-ledger.md` | red-correct |

**TEST-3 and HUM-1 move to `latent`**, both on the same half: `gate-check.mjs` is built, its `--self-test` runs in
this edition's CI, and the READBACK has never executed against a real forge, which needs a token carrying
repository administration read. That is the arming half, and the claims themselves assign arming to the human and
verification to the kernel, which is why it is `latent` and not `owed`.

**TEN-5 stays `owed` on one obligation** and in this edition it is trigger-gated twice over: there is no
sanctioned bypass, and `server/src` has no persistence layer for a cross-tenant read to exist in.

**TEST-2 stays `owed`, and the reason is worth naming because it is buildable.** The row's trigger was "the first
client data service", which fired long ago. The harness drives the real repository and API client; the smoke boots
the composed entrypoint; both are npm scripts. Nothing runs either. There is no e2e orchestrator in this edition
and `ci.yml`'s four jobs invoke neither. So the harness is `latent` (built, never executed against a running
server here) and the CI obligation is `owed` rather than `latent`, because there is no job to be unexercised
(E-80). It also bounds TEST-3: one mechanism the catalog names demonstrably does not execute automatically, which
is why TEST-3's CI obligation is `patterned`.

**AI-2 is the one honest `owed` in the batch**, and it was checked rather than assumed: `server/src` and
`client-web/src` contain no tool-execution surface, no agent loop and no model call, so there is no
untrusted-content boundary for the claim to bind to.

One residue recorded rather than repaired: two of node's three declared irreversible surfaces name directories
that do not exist, which is argued and correct (naming the owner before the first migration lands is the point),
and which is indistinguishable from a typo until the surface exists (E-81).

### Gates

Client 65, server 154, docs-lint ok, conformance ok at 69 rows. Non-owed node rows 6 to 8.

### Node Phase A, F4: the missing server halves, and a row that was not waiting after all

Ten rows inspected for a missing server half: TEN-2, TEN-3, DATA-1, DATA-2, CON-1, CON-2, MOD-1, DEP-1, TEST-1,
AI-1. All ten read `owed` with an empty `mechanism` field.

**Six are honestly `owed` and their triggers are accurate**, checked rather than assumed: TEN-2 (no second scope
entry point), TEN-3, DATA-1, DATA-2 and TEST-1 (no persistence layer at all, so no store, no tenant-owned entity
and nothing for the tiers to be real about), and AI-1 (no tool-execution seam).

**DEP-1's own note already said what to do**, that the mechanism is composed from the shared tier so what is owed
is the measurement. Taken, here:

| plant | outcome |
|-------|---------|
| a caret range on `fastify` | red-correct, naming the package and the rule |
| an unledgered `left-pad` at an exact pin | red-correct, keyed on name AND version |
| a `design/scratch/package.json` nobody declared | red-correct, caught by the whole-tree completeness sweep |
| the client tier's `postcss` override moved off its ledgered version | red-correct |

Two obligations are `latent` here for this edition's own reason rather than a weakness: there is no container
image anywhere in the tree, and `VERSIONS.md` says so in prose in the section where the first one will land. The
window-number obligation is `proven` on the strongest evidence available, having caught a live defect in this
edition's own ledger on its first run (E-76). The row stays `owed` on the one obligation neither edition has
built.

**CON-2's fixture is read by one side only** (E-82). The client asserts its three types against
`note-contract.fixture.json`; nothing in `server/src` reads it. A parity fixture only the consumer reads cannot
fail on a producer rename, so the two agree forever because only one is ever asked. Consumer obligation `proven`,
producer obligation `owed` and named.

### CON-1 was not waiting, it was broken

The most important result of this batch. CON-1 read `owed` with `trigger: the first enum on the wire`, and this
edition has no enum, so by its own record the row was correctly waiting.

CON-1's statement has four clauses. That trigger names the third. Two of the other three are violated in shipped
code right now:

    404: { type: 'object', properties: { error: { type: 'string' } } },
    return note === undefined ? reply.code(404).send({ error: 'not found' }) : note;
    id: String(notes.size + 1),

A bespoke error shape, declared and sent, with no host-level error handler for anything to conform to. And a dense
sequential counter as an identifier, which satisfies the wire-TYPE half of "identifiers are opaque strings" and
fails the half the word `opaque` carries.

**The defect is the trigger, not the code.** A trigger is what makes an `owed` row honest, and this one scoped a
four-clause claim to its narrowest clause, so the record showed a claim patiently waiting while two of its clauses
were being broken. A live violation is worse than an unbuilt guard, and this record showed neither. Recorded as
E-83, with the general rule: a claim whose statement carries several clauses needs its trigger scoped per
obligation, not per row. The other single-line `trigger:` rows in this edition have NOT been checked for the same
defect, and that is now a known gap rather than an assumption.

Repair is Phase B work: an error handler and an opaque id at the store boundary, and the store is what Phase B
builds.

### Gates

Client 65, server 154, docs-lint ok, conformance ok at 69 rows. Non-owed unchanged at 8: DEP-1, CON-2 and CON-1
all stay `owed` on a weakest obligation, correctly. What changed is that ten rows recording no mechanism now
record what exists, what is missing and, in one case, what is broken.

### Node Phase A, F5: the audit E-83 made necessary

E-83 found a trigger that scoped a four-clause claim to its narrowest clause, so the row read `owed` while two
clauses were violated. The honest consequence is that no other single-line trigger in this edition had been
checked for the same defect. **49 owed rows carried a bare trigger and no obligations.** All 49 were read.

Three separated out immediately, because their trigger already said what to do: *"a violation planted against this
claim's own obligation turning this claim's own guard red. The mechanism is realized in the shared tier and
composed into this edition, so what is owed is the measurement, not the build."* That is DEP-1's shape, and it is
an honest `owed` that names its own discharge. Fired:

| claim | plant | outcome |
|-------|-------|---------|
| DOC-1 | a `kind: notes` doc in docs/claims/, a work doc with no slice, markdown outside the legal roots | all three red-correct |
| UI-3 | a screen importing `../../theme/tokens.ts` | red-correct TWICE, by the source scan and by the lint, both naming UI-3 |
| UI-5 | a screen importing `../../api/client.ts` | **third outcome**: `npm test` stayed at 65 passed; only the LINT caught it |

**UI-5's result is the one to keep.** The obligation binds under `npm run verify` and in CI, and does not bind for
a developer running the test suite alone. That is not a defect in the rule, it is a fact about where the rule
lives, and assuming the suite would report it is exactly the assumption this protocol exists to refuse.

A fourth, DEC-1, was understating in a subtler way: its trigger line already admitted "the upward provenance lint
is built and proven" while the row carried no mechanism at all. Planted here, red-correct for a decision with no
provenance field.

**The rest of the 49 are honestly gated**, and the check was to read the claim's clauses against the trigger's
condition rather than to trust the sentence. Two categories, both legitimate:

- Waiting on an artifact this edition genuinely lacks: a persistence layer (TEN-2, TEN-3, TEN-4, DATA-1 through
  DATA-4, DATA-7 through DATA-11, TEST-1), a credential mint (SEC-4, SEC-10, TEN-6), a deployed host (SEC-8,
  SEC-9, RES-3, RES-4, OBS-2), a tool seam (AI-1, AI-2, AI-3), a broker (DATA-8, RES-5), a second module (MOD-1,
  checked: `client-web/src/modules/` holds exactly one).
- Queued as "the next edition build pass", which is work scheduled rather than a condition awaited (SEC-11,
  DATA-6, DATA-9, SRV-1, RES-6, PERF-1, PERF-4, DEP-2, TEST-4).

MOD-1 is worth naming as an audit result rather than a change: its trigger reads "the second module" and there is
exactly one, so the row is correct and needed nothing. An audit that only ever finds defects is not measuring.

### Two node-specific statuses that are not the sibling's

`archived documents are not cited as authority` is `latent` here rather than `patterned`, because this tree
contains **zero inter-document markdown links**, so the resolver is built and has no subject to run against.

`the composed entrypoint is exercised against a running server` is `latent` for the reason E-80 records: the smoke
is built and is an npm script, and nothing in this edition starts it.

### Gates

Client 65, server 154, lint clean, docs-lint ok, conformance ok at 69 rows. All plants reverted, no source diff.

## 2026-07-27, CON-2's producer half, and what asking the server for the first time returned

Measured at `5dedb47`, tree clean before and after every plant. Server suite 154 before, 172 after.

E-82 recorded that this edition's `server/src` did not read the contract fixture at all, so parity was a
statement about the client agreeing with itself. Its trigger, a server-side test reading the same fixture, was
correct and had fired. Building it was the work. What it returned was not a clean pass.

### The live violation, and what actually hid it

`GET /notes` served `{notes: [...]}` while the fixture and the client's `NoteList` both say `{items, nextCursor}`.
That much was a rename. The reason nothing could have caught it is the part worth keeping: **the route declared no
`response` schema at all**, so there was no declaration for a fixture to be compared with. The first run of the
new guard did not report drift, it reported

    GET /notes: config.contracts.200 claims to realize 'noteListResponse' but the route declares
    no schema at that surface, so there is nothing for the fixture to pin (CON-2).

A missing declaration and a wrong declaration read the same from the outside, and only one of them is visible to a
comparison. Repaired: the list response is declared, and `cursor` is declared on the query surface because it was
absent, and absent is not rejected here. `removeAdditional` had been STRIPPING the cursor the client sends, so
every paged read the client ever issued silently answered page one.

### Where the bindings live, and why not in the test

A route declares which fixture contract each of its surfaces realizes, in `config`, beside its policy. A map
inside the scan would have been a third copy of the same beliefs maintained by whoever remembers the scan exists,
and the route author is the one who knows. `config` already travels on every route table entry by reference, so
the binding rides the same enumeration every other claim guard in this edition stands on.

### Four plants, each scored

| plant | outcome |
|---|---|
| remove the fixture file | red-correct. The test file fails to load with ENOENT, so the producer-side read cannot go vacuous. |
| rename `items` to `notes` in the declared list response | red-correct. Exactly one test, message naming both field sets, `Missing: items. Unpinned: notes.` Nothing else in the suite noticed. |
| leave the declaration and change the handler to `return { notes: items, nextCursor }` | **scan GREEN, tsc and eslint clean, and the server sent `{"nextCursor":null}` with the list gone from the wire.** E-85. |
| delete one route's binding, leaving `noteResponse` bound by the other route | **green, all 172.** A route can stop being pinned with nothing reporting it, which is why the producer obligation is `patterned` and not `proven`. |

The third is the one that changed the row's shape. A declaration and an emission are two objects in this stack,
and the response serializer emits only what the schema names, so a handler that contradicts its own declaration
produces a MISSING field rather than a wrong one. The sibling cannot have this defect: its handler returns the
typed record the contract is. Closed here with five request-level tests, which are also the first tests in this
edition ever to pass a credential. `CreateAppSeams.authenticate` has existed since the composition root was
written, every test took the default, and the entire authenticated path had never run.

The fourth is the one that stopped an overstatement. Without it the producer obligation would have read `proven`
on the strength of the second plant.

### The row did not move, and that is the answer

CON-2 stays `owed`, because a row is its weakest obligation and `every hand-mirrored contract is pinned by the
corpus` is unbuilt in BOTH editions: the register cannot report a contract that was never written into it. Three
obligations gained mechanism and two of them are proven. **Non-owed counts are unchanged at 8, and the honest
reading of this round is in the obligations, not in the count.**

Half of the sibling's equivalent owed obligation did close here and flows back: a fixture entry that no route
binds is now red, where E-60 measured that adding a fixture key nothing consumes was green on both sides.

### Two facts measured before the work, which reordered what comes next

The harness and the smoke were run against the composed server rather than read. Harness: 1 of 7 scenarios green.
Smoke: red on the first list call. Every gated route answers 401 by construction, because the credential mint is
owed. So E-80's orchestrator would be red on every run forever, and E-84 records that its trigger described an
artifact that could exist rather than a run that could pass.

### One row corrected on the way past, and it is a new kind

Running the harness meant reading TEST-2's row, and its second obligation said `unbuilt. The scenario list is
hand-written`. The mechanism it calls unbuilt is in the file the same row's `mechanism` field points at: `main.ts`
enumerates the repository prototype, wraps every method, diffs the sets and emits `service-method-coverage` as a
failing scenario line. It was watched doing it.

`owed` is still the right status, for the reason the sibling's row gives and this one did not: the audit reads one
class's prototype, so a second data service is invisible (E-67). **The status was right and the reason was false.**
That is a defect no status-level audit can see, and F1 through F5 were status-level audits: they asked whether the
status describes the mechanism, and this row passes that question. Recorded as E-87, with the protocol gap named,
because the other rows lifted in those passes have not been read the same way.

### Gates

Server 172, client 65, tsc and eslint clean, conformance ok at 69 rows, docs-lint ok, docs-lint `--self-test`
28 caught / 27 ignored, `compose --check` ok at 39 shared files. All plants restored byte-for-byte, verified by
hash, and every backup deleted in this round (E-59).

## 2026-07-27, the credential verifier: SEC-4 built, TEN-6 half built, and what four plants said about it

Measured at `1302d7a` and `53b1eec`, tree clean before and after every plant. Server suite 172 before, 236 after.

E-84 named the credential mint as the first of three things blocking the e2e tier, and the only one that does not
need a store. This round built the half of it that does not need one: the edition now VERIFIES a credential. It
still mints nothing, and TEN-6's row says so rather than borrowing credit from the half that landed.

### The measurement that set the design

The sibling proves its equivalent by reading a validation object back off the host. This stack has no such
object, so validation is a function, and the question was whether that is a handicap. It is not, and E-88 is why:
five of the sibling's seven validation properties were planted permissive at 1302d7a, all at once, and 203 + 58
tests stayed green. Its harness mints every token through one builder that always passes the right issuer, the
right audience and a thirty-minute expiry, so no violating input exists to send. **Proving by configuration
cannot be stronger than the inputs the harness can produce.** So this verifier is proved by input: 64 tests in
the file, every rejection asserted by reason.

### E-89, found before the code and designed against rather than recorded after it

With `NODE_ENV` unset and no secret store, `auth.signingKey` resolves to a literal committed in this repository.
Harmless for as long as nothing verified. **The change that closes SEC-4 is the change that arms it**: a deploy
that forgets one environment variable would accept any token signed with a string anyone can read here, silently,
on a process that started cleanly. The refusal is at the verifier and not at the resolver, because the relaxation
is legitimate for a process that verifies nothing and it is the ACT of verifying with it that is not, and the
verifier is the only place that can tell those apart.

### Four plants

| plant | outcome |
|---|---|
| unwire the verifier from `composeApp` | red-correct, 3 tests. **And the three tests asserting 401 stayed green.** |
| disable the E-89 relaxation refusal | red-correct, 2 tests, unit and end to end |
| disable the session-version comparison | red-correct, 3 tests, including the end-to-end revocation |
| the first draft's issuer written as a literal | caught by the CFG-1 scan on the pass that wrote it, not four rounds later |

The first plant produced E-90, which is worth more than the wiring it was checking. `endpointSpine.test.ts`
carried a test whose comment said "if a mint ever lands without wiring, this test goes red rather than the server
quietly opening". Unwiring left it green, and it could never have gone red: an absent seam answers 401, a working
verifier with no header answers 401, and the test compares status codes. The tests that DID move were the three
asserting 200, 201 and 403.

**A refusal cannot distinguish a mechanism that works from a mechanism that is absent, because absence refuses
everything. Only a success separates them.** A security suite made entirely of denial assertions is consistent
with the feature not existing, and it reads as thorough precisely because every case is a denial. That test now
claims only what it proves, which is SEC-1's sentence and not SEC-4's.

### What the rows say, including where they refuse to round up

SEC-4 has six obligations, five `proven` and one `owed`, so the row is `owed`. The owed one is
**revocation reaches every process serving the principal**, and it is split out rather than argued away inside
another obligation's text. The store is a Map in one process: for the shape this edition ships revocation is
immediate and proven end to end, and for any deployment with more than one process a bump reaches one process and
no other, so `immediately` is true of each process and false of the system. Someone seeding from this record picks
a replica count without reading a paragraph, so it is an obligation with a trigger rather than a sentence.

TEN-6 is half built: the credential carries exactly one tenant and it comes from a signed token, both `proven`;
the mint from membership and the revoke-on-membership-change are `owed` and wait on G.

TEN-1 moved from `owed` to `patterned`, which closes S-8. Its resolution rule had no mechanism for as long as no
credential existed to resolve from. It has one now, and it is `patterned` and not `proven` because **nothing
downstream reads `request.credential` yet**: the rule is proven at the point of resolution and unexercised at
every point of use.

Non-owed rows: 8 to 9. Three rows gained substantial mechanism and one of them moved.

### Gates

Server 236, client 65, tsc and eslint clean, conformance ok at 69 rows, docs-lint ok, docs-lint `--self-test`
28 caught / 27 ignored, secret-scan ok with 2 justified exceptions, `compose --check` ok. All plants restored
byte-for-byte, verified by hash, every backup deleted in this round (E-59).

## 2026-07-27, running the harness against the wired server: 1 of 7 to 5 of 7

Measured at `88e066c`, by booting the composed server with `KERNEL_AUTH_SIGNING_KEY` set to a value that exists
only for the duration of the measurement, and running the real tool against it.

    health                    ok
    create-note               ok
    list-notes-paged          ok
    cross-tenant-404          FAILS   tenant B could read tenant A note
    get-note                  ok
    delete-note               FAILS   unexpected status 403
    service-method-coverage   ok      all 4 NotesRepo methods driven through the real transport

`list-notes-paged` is green because of the CON-2 round at 1302d7a, not because of this one. It asserts a bounded
page AND a non-null cursor, which the list route could not have answered at all three days of work ago: it served
`{notes}` with no cursor field and stripped the cursor the client sent.

`service-method-coverage` reporting four methods driven is the closing evidence for E-87. The obligation that
called that audit `unbuilt` was corrected by reading the file; this is the audit itself, running, reporting.

### The thing that only running it could have found

Before the harness ran at all, a single request found E-91. The same server, the same key, two tokens differing by
one character per permission:

    perm = notes.read, notes.write     GET /notes -> 403
    perm = notes:read, notes:write     GET /notes -> 200

`notes.read` is what the sibling's `scripts/e2e.sh` mints, and it is the only orchestrator either edition has.
Node's policy table maps the policy NAME `notes.read` to the PERMISSION `notes:read`. So a token minted the shared
way authenticates cleanly and then fails authorization on every gated route, and nothing anywhere compares the
strings an edition requires against the strings anything mints. Third instance of the E-75 family. Not repaired,
because the repair is a choice this round has no standing to settle and it lands with node's orchestrator.

### What the two failures are

Both are E-84's remaining blockers, and neither is incidental. `delete-note` gets 403 rather than 404 because
there is no `DELETE /notes/:id` at all, so SEC-1's deny-by-default fallback answers a URL with no route behind it;
that is the correct fail-closed answer and is exactly why the scenario cannot pass until the route exists.
`cross-tenant-404` fails because the store has no tenancy: **the credential now carries a tenant and nothing reads
it**, which is the sentence TEN-1's resolution obligation carries as its reason for reading `patterned`.

### Gates

Unchanged from the round above: server 236, client 65, conformance ok at 69 rows, docs-lint ok. The server booted
for this measurement was killed, the log deleted, and `git status --porcelain` confirmed empty afterwards.

## 2026-07-27, pinning the runtime before building on an experimental part of it

Measured at `4a18004`. Prerequisite for G rather than a detour: the persistence layer is being built on
`node:sqlite`, which the runtime reports as experimental and may change in any release, so the exact runtime
version became load-bearing for correctness and not only for supply chain.

It was not pinned anywhere. Two manifests declared `"node": ">=24"` and twelve CI jobs across this repository
asked for `node-version: '24'`, so every run resolved whatever 24.x was newest that day, and neither edition's
ledger had a row for it.

**The cause is structural, and it is CFG-1's fourth home in a different registry.** `edition.json` declares
`dependencySurfaces`, every one of them a package manifest, and docs-lint checks the dependencies it finds there
against the ledger. The runtime is not in a package manifest, so it was never in scope for the check that exists
precisely to catch this (E-92).

### The version, and why it is not the newest one that clears the window

The window is 30 days and this file's header is where that number lives, so the cutoff is 2026-06-27. Publish
dates were read from `nodejs.org/dist/index.json` rather than assumed: **v24.18.0 (2026-06-23) is the newest LTS
outside the window** and would ordinarily be the choice.

Pinned to **24.13.1 (2026-02-09)** instead, because it is the runtime every result in this file was measured on,
and this repository's rule is that a claim names the thing it was measured against. Installing 24.18.0 to test it
is a machine change nobody authorised. So advancing the pin is a named step rather than a bump, written into the
ledger: install, run both editions' suites, record the result with its commit, then move the pin and the row
together. The cost is real and is recorded rather than hidden: a February runtime carries five months of unapplied
fixes.

### The pin is in six places, so it needed a check rather than discipline

Each copy has to exist, because an edition must stand alone after it is copied out: `.nvmrc`, `engines.node` in
two manifests, `node-version` in four CI jobs, and the ledger row. Six copies with nothing comparing them is the
CFG-1 defect this round would have been creating, so `runtimeAgreementFindings` and `runtimeRangeFindings` were
added to the shared linter, mirroring the container-image agreement check DEP-1 already had.

The runtime pass enumerates by FILENAME and not by extension, which is E-38's second half arriving at a different
tool: `.nvmrc` has no extension at all, and a scan keyed on extensions cannot see the files whose whole identity
is their name.

### Controls, and the difference between the two kinds

Self-test 28 caught / 27 ignored, now **33 / 32**: five new CATCH cases and five new IGNORE cases, including a
`.nvmrc` written with the conventional `v` prefix and a manifest with no `engines` block, both of which must stay
silent.

The self-test cannot say whether the WALK reaches the files, which is the E-11 problem one level up, so two live
plants:

| plant | outcome |
|---|---|
| `.nvmrc` set to 24.18.0 | red-correct, and the message names all five other surfaces, which is the extent proof |
| `engines.node` back to `>=24` | red-correct, reported as a range rather than compared as a version |

The first plant's message is worth more than its redness: it enumerated `.github/workflows/ci.yml`, `VERSIONS.md`,
`client-web/package.json`, `server/package.json` and `.nvmrc`, so the walk demonstrably reaches every surface
rather than agreeing with one file it happened to find.

### Gates

Server 236, client 65, shared client 65, docs-lint ok in both editions, self-test 33/32 in both, conformance ok at
69 rows in both, `compose --check` ok. Both plants restored byte-for-byte, verified by hash, backups deleted.

## 2026-07-27, G: the store, and the first fully green e2e run this edition has had

Measured at `31278db`. Server suite 236 before, 238 after. **Harness 5 of 7 before, 7 of 7 after, exit 0.**

The engine is `node:sqlite`, chosen by the owner, declared in `edition.json` under `engine` and nowhere else. It
adds no dependency and therefore no supply-chain surface, and its version IS the runtime version, which is why the
runtime pin landed first and is load-bearing rather than hygienic.

### What replaced what

A module-level `Map` in the route file became a schema at the path `edition.json` and CODEOWNERS have both been
declaring as irreversible since before it existed, a store behind an interface, a service between the route and the
store, and a tenant that comes from a verified signature.

`PRIMARY KEY (tenant_id, id)`, so the tenant LEADS row identity and a query that forgets it cannot use the key.
`STRICT`, because a column declared TEXT that accepts an integer describes intent rather than content. CHECK
constraints on the lengths, which is worth naming: E-66 recorded `value past max length is refused: NO` for SQLite
as a provider capability, and that measurement is about SQLite's TYPE system, which has no length on TEXT. A CHECK
is not the type system and does enforce it.

### Three inherited lessons, taken rather than rediscovered

- The cursor carries `(createdAtUtc, id)`, not the timestamp alone, and the index is NOT unique. The sibling's
  build brief still documents the abandoned version as settled; its shipped code does the opposite because a unique
  index on a timestamp threw the moment two notes were created inside one clock tick.
- Delete carries the tenant in its own predicate, so a cross-tenant delete changes no rows and arrives as an
  absence. E-50 measured the alternative: a cross-tenant read answered 404 while a cross-tenant delete with a
  forgotten filter answered 500, and a caller could tell the difference.
- The bound is at the STORE, not at the route. E-48 measured three read plants each staying green in the sibling
  because the store was inside the tested path and nothing asserted how it read.

### The chokepoint the sibling structurally cannot have

Every statement this store can execute is in one frozen `STATEMENTS` object and every one names `tenant_id`. E-77
records why that matters: in the sibling, read tenancy is a hand-written `Where` repeated per method, so a
cross-tenant read is the ABSENCE of a predicate, absence has no syntax, and a scan for it would be green forever.
Here the statement set is a value a test can read. The scan over it is not built yet and the DATA-2 row says so
with a trigger; what changed is that it is now buildable, which it is not there.

### Two findings the build produced, both from things going wrong

**E-93.** `resolveSettings` validated by enumerating `SETTINGS_SPEC` and RETURNED a hand-written literal naming
three groups. The fourth group was declared, refused when absent, resolved, frozen, and dropped on the way out.
The `as Settings` cast is what allowed it: without a cast the compiler reports the missing property, and the cast
was there to quiet a different objection. Repaired to build from the registry's own keys, with two tests.

**E-94.** `requireDeclaredSurfaces` demands a body contract from every body-bearing method, and DELETE is
body-bearing. Fastify then ENFORCES the declared schema, so `DELETE /notes/x` with no body answered
`400 body must be object`, which is every DELETE the client and the harness send. The rule and the framework were
each right and together they forbade the normal case for a whole method. Repaired by making the decision
expressible, `config.body: 'none'`, rather than by widening the ban: forgetting stays indistinguishable from
nothing, and deciding is greppable.

### One lint that improved the design rather than being satisfied

The filesystem ban refused `node:fs` in `persistence/database.ts`. It was right, and the fix was not an exemption:
`compose.ts` imports that module, so the migration runner's file reads would have entered the SERVER's import
graph for code the server never calls. Split into `database.ts` (opens, no fs) and `migrator.ts` (reads, named in
one eslint exemption). The serving process can now open a database and cannot read a file.

### The rows, and why four of them still read `owed`

DATA-1, DATA-2, TEN-2 and TEN-3 each gained five or six obligations, several `proven`, and each rolls up to `owed`
on one unbuilt ENUMERATION obligation. That is the roll-up rule working: the mechanisms are real and nothing counts
them. Non-owed rows are unchanged at 9, and the honest reading of this round is in the obligations rather than in
the count, exactly as it was for CON-2.

Two obligations are recorded as satisfied by the PLATFORM rather than by a mechanism, so that nobody builds a guard
whose subject cannot occur: records carry no behaviour because `Note` is a type alias and not a class, and reads
run untracked because this engine has no change tracker to disable.

### Gates

Server 238, tsc and eslint clean, conformance ok at 69 rows, docs-lint ok. Harness 7 of 7 against the composed
server booted with a real signing key and a migrated database, both of which existed only for the measurement and
were deleted after it.

## 2026-07-27, E-80 and E-91: the runner, and four things found by using what it uses

Measured at `494e323`. Server suite 238 before, 241 after. **The e2e run is green from a single command for the
first time: `node scripts/e2e.ts`, 7 of 7, exit 0.**

E-80 recorded that this edition shipped an e2e harness and a composed-entrypoint smoke as npm scripts and that
nothing started either of them. E-84 corrected its trigger, which had named an artifact that could exist rather
than a run that could be green, and put it downstream of the credential mint and of the store. Both are now
behind it, so this is the last item of that group rather than the first.

### The orchestrator, and why it is JavaScript

`scripts/e2e.ts` migrates a throwaway database, boots the real entrypoint through `npm start`, drives the real
client services against it, boots the composed entrypoint against the same server, and tears the process group
down. The sibling's `scripts/e2e.sh` does the same in bash and has to read the issuer and the audience back out of
`appsettings.json` with two `node -e` one-liners, because a shell cannot import the host's own modules.

Here they can be imported, and that is the whole repair for **E-91**. The permission strings are read from
`POLICIES`, the session version from `INITIAL_SESSION_VERSION`, and the issuer, audience, host and port from the
same `resolveSettings` the server calls, over the same environment the children inherit. Nothing is copied,
compared or re-derived. The signing key runs the other way: the orchestrator generates one and installs it through
the declared override channel, so both consumers read one variable and there is no second copy to drift from,
which is strictly better than the sibling having to go and FETCH its key out of user-secrets.

### Plants

| plant | outcome |
|---|---|
| the sibling's dot-form `['notes.read', 'notes.write']` in place of the derived permissions | red-correct: 1 of 7, exit 1, 403 on every gated route, which is E-91 reproduced exactly |
| `HARN_BASE_URL` deleted from the harness's environment, first attempt | **GREEN, 7 of 7, exit 0.** A finding, not a proof: E-96 |
| the same deletion, after the port repair | red-correct: 0 of 7, exit 1, and the readback names the cause |
| the `scripts` surface removed from `SURFACES` | red-correct, one test, naming `scripts/e2e.ts`, while the green scan went on reporting ok |
| `refuseUndeclaredEnvironment` deleted from the resolver | red-correct, one test, naming the variable |

### E-96, and why the second plant matters more than the first

The orchestrator carries a non-vacuity control: after the harness reports, it reads `/notes` back with tenant A's
token and fails on an empty list, because seven green scenarios mean nothing unless they happened on the server
this script booted. It is a SUCCESS assertion by construction, which is E-90's rule.

It did not bind, and the run said so: with the harness's base URL deleted, the tools fell back onto their
hardcoded `http://localhost:5080` (E-78), which is the COMMITTED port, reached the very server the orchestrator
had booted, and passed. **A default equal to the configured value cannot be distinguished from configuration
arriving**, because the two paths are observationally identical and no assertion downstream can separate them.
Repaired by serving on a port the operating system assigns, through the same declared channel, so the fallback now
points where nothing listens.

### Two surfaces the change had to widen, and both were found the same way

**CFG-1's scan did not walk `scripts/`.** The orchestrator is a shipped script by the claim's own words: it
resolves four operational values and hands them to two processes. A check that exists, is correct, and cannot see
a directory added after the list it enumerates from is E-92 and E-95's shape, so `scripts/` was added in the same
change that created the first file in it. On the scan's first run it reported that file duplicating the committed
`http.host`, by name. That duplication was mine, written an hour earlier, and it was removed rather than exempted.

The scan's own reach is now asserted rather than assumed. `scannedFiles()` is a second view over the same walk and
a test names one real file per declared surface, because `scanConfigurationSurface()` returning an empty array is
the same output whether the walk reached five surfaces or none. Removing the `scripts` surface fails that test
alone; the green scan does not notice, which is precisely the point.

**E-97: the environment channel was closed at one end.** `settings.ts` argues that the ambient environment is
legitimate once brought inside the config system, and states the rule as "an env var may only override a key this
spec already declares, under a name derived from the key". The derivation was built and the other half was not.
Measured: `KERNEL_HTTP_PORTX=9999 KERNEL_NONSENSE=1` resolved with no complaint. Nothing looked at what the
environment carried; it only computed what a declared key would be called. The same file refuses exactly this in a
committed layer with a written argument, and the harm is worse here, where there is no schema, no committed file
and no diff. It survived because the closure was written as a traversal of a parsed object, and the environment is
a flat namespace that cannot be traversed the same way, so it needed a different shape of check and got none.

### E-98, recorded and not repaired

Reading TEST-2 before building against it turned up an obligation neither edition's row carries: the gated harness
profile, which the claim defines and its weakening note tells the kernel it owes as the gate plus its refusal
tests. The sibling SHIPS it, in `Program.cs` and `HarnessProfileTests.cs`, and its row is silent. This edition
ships neither, and its row is silent in the other direction, so an absence reads identically to the presence next
to it. A fifth obligation is now on this edition's row, `owed`, with an outcome-shaped trigger. The sibling's is
recorded as owed to its next pass, because saying which realized status it opens at needs a plant there.

### Statuses

TEST-2's first obligation lifts from `latent` to `proven` and its third from `owed` to `patterned`. **The row
stays `owed`**, on the completeness obligation this pass did not touch and on the new fifth one. That is the
roll-up rule working: an orchestrator does not make an audit that reads one class's prototype read two.

TEST-3's first obligation keeps `patterned` and loses the reason its text gave. It no longer says the e2e tier has
no job, because it has two; it now says nothing compares the mechanisms this edition ships against the jobs that
invoke them, which is the property, and which E-80 and E-95 are both instances of missing.

### Gates

Server 241, tsc and eslint clean, conformance ok at 69 rows, docs-lint ok, docs-lint self-test 33/32, gate-check
self-test 6/7, secret-scan ok, `node scripts/e2e.ts` green. Every plant restored from a copy and its backup
deleted in the same round (E-59), each restoration confirmed against the baseline count before the next plant.

## 2026-07-27, the enumerations: three of the four owed obligations, and four findings from planting against them

Measured at `3ac6f25`. Server suite 241 before, **283** after. Non-owed rows 9 before, **12** after: DATA-2 to
`proven`, DATA-1 and TEN-2 to `patterned`.

G left four obligations `owed`, each with a written trigger. Three were buildable and are built. The fourth,
TEN-3's enumeration over tenant-owned tables, waits on a second table and is the one case where waiting is the
right answer rather than the easy one: an enumeration over a set of size one cannot fail, so building it now
would produce a mechanism whose first real test is the day somebody trusts it.

### The statement chokepoint, which the sibling cannot have

`architecture/statementSurface.ts` reads every `STATEMENTS` object in the tree statically and asserts each
statement constrains `tenant_id` to a parameter, each SELECT carries a LIMIT, and nothing pages by OFFSET. E-77
records why this is available here and not there: in the sibling a cross-tenant read is the ABSENCE of a
`.Where(...)` clause, and absence has no syntax, so a scan for it is green forever.

It reads the PREDICATE rather than the statement, and that distinction has its own test. `SELECT tenant_id, id
FROM notes WHERE id = ? ORDER BY tenant_id LIMIT 10` mentions the tenant column twice and constrains nothing; a
substring check passes it.

Three things keep the set from being a habit rather than a surface: a statement whose value is not a plain
literal is reported by name rather than skipped, SQL reaching `prepare` or `exec` outside the set is a violation
with two named exemptions carrying their reasons, and **the scan reports finding no statements at all as a
violation of its own**, so a renamed directory cannot make it quietly vacuous.

Its first run found a real defect: `STATEMENTS.get` carried no LIMIT. The primary key already bounded that read
to one row, so it was never unbounded; the bound lived in the SCHEMA and the scan reads statements. `LIMIT 1` was
added rather than teaching the scan which columns form the key, which would put a second copy of the migration in
an architecture test.

### The import graph, and why the obvious rule set would have been wrong

`architecture/importGraph.ts` holds each layer to a declared allowlist. **The graph was read before the rules
were written**, and that ordering is the finding rather than a habit: "dependencies flow downward only" suggests
a tower with endpoints on top and the database at the bottom, and this tree is not that shape. `persistence/`
imports `app/`, because `app/` owns the store interface. Under a tower reading that edge is upward and forbidden,
so a rule set derived from the claim's words would have failed this tree on its correct edges and passed it on
nothing at all.

Type-only imports are counted, with their own red proof. They erase at runtime, so nothing would ever notice; the
dependency is still real, because a layer that needs another's types cannot be changed without it.

### Plants

| plant | outcome |
|---|---|
| the tenant filter dropped from `STATEMENTS.remove`, call site untouched | red, 5 tests, and **3 of them on parameter arity rather than tenancy**: E-101 |
| the same, with the parameter dropped too | red-correct, 3 tests, one behavioural and two static |
| `LIMIT` removed from `STATEMENTS.listFirst` | red-correct, 5 tests |
| the real `routes/notes.ts` importing the store | red-correct, 2 tests, one of them the composition-root assertion |
| the `scripts` surface removed from the configuration scan | red-correct, one test, while the green scan reported ok |
| `tenantForTesting` called in a production module | red-correct, both lint selectors |
| `tenantOf({ ...credential, tenantId: 'someone-else' })` in every handler | red-correct, 2 of 3, and **the third stayed green**: E-102 |

### E-99 through E-102

**E-99, the scan reported itself and the credential verifier.** The chokepoint check looks for calls to `prepare`
and `exec`, and `exec` is `RegExp.prototype.exec` as well as `DatabaseSync.prototype.exec`. It matched
`/^INSERT.../i.exec(flat)` inside the scan and `BEARER.exec(header)` in the verifier. E-9's finding from the
other side: there a name predicate under-reached on morphology, here it over-reaches on homonymy, and both say
that the only thing a name-shaped predicate knows is spelling. Scoped to `persistence/`, which is sound exactly
as far as DATA-1's rule holds, and that rule is now a scan built in this same pass rather than review.

**E-100, the register named a divergence and the suite tested one side.** Planting E-50's defect turned two tests
red and both were the new static scan. `sqliteNoteStore` had no test file at all, and the only cross-tenant proof
in the edition was the harness's `cross-tenant-404`, a READ. E-50 is specifically about a read and a delete
answering differently. The scenario nobody had written, in either edition, was the second path.

**E-101, the plant that was caught by the wrong thing.** Three of the first plant's five failures were SQLite
refusing a parameter count, which would have fired for a perfectly tenant-scoped statement that merely miscounted.
Red-for-a-different-reason is usually imagined as a different TEST firing; it also covers the same test firing for
a different CAUSE, and that looks identical in the output.

**E-102, the test that stayed green.** Under a uniformly wrong tenant, the single-caller test still passes: the
write and the read use the same wrong value, so the system is consistent with itself. E-90 in the other
direction, where a suite of refusals could not tell a working mechanism from an absent one. The discriminator in
both cases is a second, differently-positioned actor.

### Two seams pinned, one added

`tenantForTesting` produces a `TenantId` from an arbitrary string and its own comment said "a lint could pin
that". Nothing did. It is now refused outside `__tests__`, as the named import and as the call, in both spellings
so a namespace import does not walk past it. `instantForTesting` was added to the clock seam in the same
discipline rather than by naming a third test file in the lint's exemption list: a file-level exemption would
exempt every clock read in that file, and the affordance in the seam is one greppable line.

### What did not move, and why

TEN-2's row is `patterned` and not better because the request-level assertion is per route: the fifth handler
owes its own, and nothing enumerates handlers. DATA-1's is `patterned` because its third obligation has two
halves and only one is enforced; a handler cannot touch a store, and "calls ONE service method" is still held by
reading. **The row's own text used to say the import-graph scan was its whole distance from `proven`, and that
sentence was wrong**, which is E-87's shape once more: a row can be mistaken about what remains, and nobody
re-derives that sentence on the day the trigger fires.

### Gates

Server 283, tsc and eslint clean, conformance ok at 69 rows, docs-lint ok, self-test 33/32, secret-scan ok,
`node scripts/e2e.ts` green. Every plant restored from a copy and its backup deleted in the same round (E-59),
each restoration confirmed against the baseline count before the next plant.

## 2026-07-27, the loop check: E-95's obligation turned into a mechanism, and what it found

Measured at `8457adf`. Repo-level rather than edition-level, recorded here and in the sibling because it changes
both TEST-3 rows.

E-95 closed with an obligation in exactly the right words: when a mechanism is added to an edition, the pass owes
an answer to whether anything in THIS repository runs it. It was addressed to a person. Asking it mechanically,
once, found `tools/gate-check.mjs` in the same position secret-scan had been in: shipped by both editions, run by
each edition's template `ci.yml`, and never run by `kernel.yml`. Third instance of one shape (E-103).

### What the check has to read, and what a weaker reading misses

`kernel/tools/loop-check.mjs` asks two questions per executable, because there are two registers and the same
file can be right in one and missing from the other. Three things it needs, each of which was got wrong first:

- **Steps, not lines.** `working-directory` may sit either side of `run:` inside one step, and node's e2e job
  writes it after, so a line-by-line parser remembering the last directory attributes the wrong one and reports
  `scripts/e2e.ts` as unrun when the job that runs it is three lines above.
- **Block scalars, read whole.** The sibling's `e2e-wire` job carries its entire orchestration inside a `run: |`.
  A parser taking the first line sees `dotnet run ... &` and none of the six commands under it.
- **Edition-qualified paths.** Both editions ship `tools/docs-lint.mjs`, so a filename match lets one edition
  discharge the other's obligation. That case is in the ignored set as a control.

It enumerates `kernel/tools/` too, under the one register that applies, which puts the file inside its own
subject: a check for mechanisms nothing runs, which nothing ran, would be the joke version of E-95. Removing the
`loop` job from `kernel.yml` reports the checker itself.

### Plants

| plant | outcome |
|---|---|
| the `gate-check` step removed from `kernel.yml` again | red-correct, both editions named |
| the whole `loop` job removed | red-correct, and it names `kernel/tools/loop-check.mjs` |

### The exceptions, and the one that is a finding

Seven of sixteen shipped executables are excused, each with a written reason and each reported if it goes stale.
Six are ordinary: `conformance.mjs` is a library `docs-lint.mjs` imports, and the sibling's four `db-*.sh` and
`dev-setup.sh` are developer commands whose CI equivalent is a service container rather than a skipped script.

The seventh is `scripts/e2e.sh` and it is a finding rather than a category (E-104). The sibling's `e2e-wire` job
does not call that script: it re-implements the whole orchestration inline, so that edition carries two
procedures for one job and nothing keeps them equal. A scenario added to the harness reaches both, because both
end at `node tools/harness/main.ts`; a change to the ORDER, the readiness condition, the teardown or the token
contents lands in one. E-75's family at the scale of a procedure. Node does not have it because
`scripts/e2e.ts` supplies its own database, key and port, so CI is one line, and the sibling's script cannot be
because it reads user-secrets and starts an engine with a container runtime. Recorded with its trigger rather
than repaired, and the exception is written so the reason names the finding, because a permanently red gate gets
disabled rather than fixed (E-84).

### Statuses

TEST-3's first obligation keeps `patterned` in both editions and its residual changes from a sentence to a
mechanism with a narrower residual behind it. The enumeration is over shipped EXECUTABLES, so a claim guard that
is a test inside a suite, or an eslint rule inside a config, is covered only by whatever runs that suite or that
config. trigger for `proven`: an enumeration keyed on this record's own `mechanism` field rather than on the
filesystem, so that a mechanism a row NAMES and nothing invokes is the failing case.

### Gates

loop-check ok (9 of 16 run by both registers, 7 excused), self-test 7 caught 3 ignored; gate-check self-test 6/7
in both editions; conformance ok at 69 rows in both; docs-lint ok in both.

## 2026-07-27, the mechanism field, and a scope rule broken within the hour of the check that catches it

Measured at `f151902`. Repo-level again, recorded in both editions.

TEST-3's residual named a trigger: an enumeration keyed on this record's own `mechanism` field rather than on the
filesystem, so a mechanism a row NAMES and nothing invokes is the failing case. Half of it is now closed.

### What the probe expected to find, and what it found

The probe looked for a stale reference from an old rename, of the kind E-26 records in a comment. Every one of
the sixty-odd file references in both editions resolved. **The only failures were five references written an hour
earlier, by me, in the commit that added the loop check**: `kernel/tools/loop-check.mjs` and `kernel.yml` in three
TEST-3 mechanisms and one TEST-2 mechanism.

All five name real files. None of them exists in a seeded project, which is the only tree this record is read in
outside this repository. The `mechanism` field says what the edition SHIPS; where THIS repository happens to
check an edition is an observation, and observations belong in `note`. The five moved.

They surfaced only because the resolver was run edition-relative rather than repo-relative, and that was an
afterthought about seeded projects rather than the point of the probe. **A scope rule with no mechanism gets
broken by the person who most recently thought about scope**, and the interval here was under an hour (E-105).

### The check

`mechanismReferenceFindings` in the shared `docs-lint.mjs`, so it composes to both editions and runs wherever the
record does. A backticked token counts as a file reference only when it carries a known source extension and no
space or glob character, which deliberately lets the record's prose through: mechanism strings also name code
(`process.env`, `Date.now`, `sqliteNoteStore.list`) and framework vocabulary, and a check that guessed at those
would report the record's own English, which is E-5's pattern.

| plant | outcome |
|---|---|
| `statementSurface.ts` renamed in DATA-2's row and not in the tree | red-correct, naming the row and the token |
| a mechanism naming `kernel.yml`, which no edition has | caught by control |
| a mechanism naming code rather than a file | ignored by control |

Self-test moved from 33 caught / 32 ignored to **35 / 36**.

### What is still owed, and it is the harder half

Resolution is not invocation. A module that exists, is named in a row, and that no test imports is exactly the
state E-80 recorded of the e2e harness, and this check would pass it. Measured by hand for node-react today: 57
shipped modules, 56 reached from the roots the jobs actually execute, and the 57th was a probe artifact (a test
under `client-web/tools/` that the vitest include does cover). So the edition is clean and nothing proves it.
**trigger for `proven`: reachability computed from the executed roots**, which is buildable for the node edition
from the import-graph machinery already here and needs a different instrument for the sibling's C#.

### Gates

docs-lint ok and 35/36 in both editions, conformance ok at 69 rows in both, loop-check ok, compose ok at 39
shared files, node server 283, e2e green.

## 2026-07-27, the acceptance test: this edition seeded, renamed and verified as a set for the first time

Measured at 7b70f2d, into a scratch directory outside the kernel repository, product name Ledgerly (the same name
the sibling's run used, so the two are comparable). This edition's instantiation had never been executed.

### Part A, and it failed before anything was copied

The file set did not name `scripts/`, four commits after `scripts/e2e.ts` landed and `ci.yml` learned to run it
by that path. E-108 has the finding and the mechanism that now holds it; on its first run that check also found
`.nvmrc` unnamed by BOTH editions, so the runtime pin travelled as five surfaces of six.

Executing the corrected step then found a second defect in the same paragraph. The enumeration is not what
excludes `node_modules/`: `cp -R` over the named items produces a 233M tree, because the ignored paths are nested
INSIDE `server/` and `client-web/` rather than beside them. The manifest claimed the enumeration did that work.
Copying what git tracks: **96 files, 1.2M**.

### Part B

The rename list omitted the database file name, which is written twice (`database.file` in
`server/config/settings.json`, `engine.file` in `edition.json`), so a correctly seeded project ran `kernel.db`.
Repaired in the list.

Step 4 could not be performed: no forge, no token. That is where this run stops and it is the same wall the
sibling's run hit.

### Part C, verified as a set

| command | result |
|---|---|
| `npm run verify` in `server/` | **282 of 283**, then 283 of 283 after E-109 |
| `npm run verify` in `client-web/` | pass |
| `docs-lint --self-test`, `docs-lint` | pass, with five `note:` lines naming what the seeded shape does not check |
| `conformance --check` | pass |
| `secret-scan --self-test`, `secret-scan` | pass, both (the sibling's run failed this on day one, E-25) |
| `gate-check --self-test` | pass |
| `gate-check` | **fail, correctly**: no forge remote, named as a decision to record |
| `node scripts/e2e.ts` | pass, needing no engine container |
| the dash greps | clean |

**9 of 10, and the failure is the forge.**

### E-109, the one that made a seeded build red

CFG-1's script-duplication proof asserted against `'kernel-api'`, this kernel's placeholder audience, which
manifest step 1 tells the seeder to change. Rename it correctly and the fixture stops duplicating a committed
value, the scan correctly reports nothing, and the test fails. The check under test is that a script READS a
committed value rather than carrying a second copy; the test carried a second copy.

Repaired by exporting `committedValueFor` and deriving the fixture. Two-way: 283 of 283 in the kernel, and 283 of
283 in the seeded tree whose audience is `ledgerly-api`, where it was red before the change.

### The turn count

**Roughly five human turns, against the sibling's twenty-seven**, and all five are the forge: create the remote
and choose the default branch, the owner's handle for CODEOWNERS, arm protection, verify the arming with a test
PR and a second identity, and choose the CLAUDE.md house-style set. The difference is not documentation quality:
the sibling's twenty-seven carried nineteen manifest gaps and this run found three.

### Recorded, not repaired

`skills/seed/SKILL.md` step 4 tells the builder to verify that `.claude/settings.json` survived instantiation.
This edition ships no `.claude/` at all, and its manifest names the absence as a decision, so the skill and the
manifest disagree and the skill is what the seeder runs. PC-10 measured that the CLAUDE.md rule alone drifts
under long-context sessions, so a project seeded from here has nothing mechanical holding the ledger discipline.

### Gates

Both editions: docs-lint ok and 37 caught / 40 ignored, conformance ok at 69 rows. compose ok at 39 shared files,
loop-check ok, node server 283, node e2e green, shared client 65, dash scan 0 with a live control.

## 2026-07-28, reachability: resolution is not invocation, and the scan found itself first

Measured at e6eda6a. TEST-3's first obligation carried a trigger for `proven` that named reachability computed
from the roots the jobs actually execute. Half of it is built.

### The scan

`server/src/architecture/reachability.ts`. The roots are DERIVED, not listed, which is the whole reason this is a
mechanism rather than a second register to keep in step: they come from `package.json`'s own scripts, because
those are what CI runs, plus every test file, because that is what `vitest run` collects. A script added there
adds its root here without this file changing.

**On its first run, before its test existed, it reported itself**: `src/architecture/reachability.ts` is not
reachable from anything this tier executes. That is the state it exists to detect, arriving in the file that
detects it.

Both vacuity directions are refused explicitly rather than left to a reviewer, because this scan reports what it
did NOT find and so reads as total coverage when it reaches nothing: a tier with no modules is a violation, and a
tier with no roots is a violation instead of a report that every module is dead.

| plant, against the shipped tree | outcome |
|---|---|
| an orphan module under `src/platform/` | red-correct, reported by name |
| every script naming `src/main.ts` removed | red-correct, the entrypoint reported |
| only ONE of the two scripts naming it removed | **green, and correctly so** (E-112) |

The third row is the finding. The property had two causes and the plant removed one, so the scan was right to
stay green; what went red was the non-vacuity test's assertion about WHICH script supplies the root. Without that
assertion the run would have read as a clean green and this scan would have been recorded as proven against a
plant it never saw.

Nine tests besides: a module reached transitively, reached only by a test file, reached only through a dynamic
import, and reached only through the extensionless and directory specifier forms, each permitted because each is
a real way to be reached. Server tier 283 to 292.

### What it cannot see, measured rather than asserted

Reachability here is at MODULE granularity, so an unused EXPORT inside a reached module is invisible. Four live
instances in this tier: `assertImportGraph`, `assertStatementSurface`, `assertConfigurationSurface` and
`assertReachability` are exported, read as the enforcement path, and are called by nothing (E-113). The scans
they wrap all bind, because each test asserts the scan directly, and no conformance row names any of the four,
which was checked rather than assumed.

`assertReachability` was written in the same commit as the scan that exists to catch this class, and is invisible
to it by construction.

The obligation stays `patterned`. trigger for `proven`: export-level reachability, plus the same instrument
pointed at the client tiers, which have their own package, runner and roots.

### Gates

Server 292, client-web 65, e2e green, docs-lint ok at 37/40, conformance ok at 69 rows, compose ok, loop-check
ok, dash scan 0 with a live control.

## 2026-07-28, two obligations, one walk: DATA-1's "one service method" and TEN-2's "from THIS request"

Measured at 138fe8f. Both were held by reading, and both rows said so. They are two questions about the same
three lines of every handler, so they are one scan: `server/src/architecture/handlerBodies.ts`.

The service binding is DERIVED, not named: a parameter whose declared TYPE is imported from `app/`. A second
service under a second parameter is covered the day it is written, which a test asserts with a `TagService` the
scan was never told about. Registrations are recognized by SHAPE, a url string and a function last, so renaming
`app` does not turn the scan vacuous, and an ordinary `cache.delete(key)` is not mistaken for a route.

| plant, against the shipped route module | outcome |
|---|---|
| the list handler gains a second `service.read` | red-correct (DATA-1), naming both methods and the url |
| one handler's `tenantFor(request)` becomes `tenantOf(request.credential!)` | red-correct (TEN-2), naming the url |
| the same plant, under `tsc --noEmit` and `eslint` | **both silent** |

The third row is the evidence that matters: this scan is the only view of the property, not a second view of one
already guarded.

### A hole found by writing the row's own text

The first version checked that the tenant argument was a call to `tenantFor`, and nothing about its argument. So
`tenantFor(someOtherRequest)` would have passed: the sanctioned resolver, a real `TenantId`, belonging to a
different caller. That is E-99 arriving inside the repair for E-102, and it was closed before it shipped by
checking the resolver call's own argument against the handler's request parameter. **Stating a mechanism in prose
is what exposed its gap, for the third time this session.**

### A scan caught this scan, again

`const CREDENTIAL = 'credential'` was reported by SEC-5's own configuration scan as a committed credential,
correctly: the registry treats `credential` as a run, and a rule cannot know that this constant is a selector.
Renamed to `REQUEST_PROPERTY` rather than exempted, because an exemption is a pre-authorized hole and this
binding has no need of one. Fourth time this session a shipped scan has reported code written minutes earlier.

### What moved

**DATA-1 to `proven`**, all six obligations. **TEN-2's fourth obligation to `proven`**; the row stays `patterned`
on "every execution path entry establishes a tenant", which waits on this edition having a non-HTTP entry point
at all, and inventing one to satisfy a row would be the wrong direction.

Two limits are stated in both rows rather than left to be discovered. The tenant argument must be the resolver
call INLINE, so a handler that binds it to a local first is refused although that code is correct; that is the
point, because it puts the whole property on one line. And "the tenant argument" means "the first argument",
which holds because every `NoteService` method takes its `TenantId` first.

Server tier 292 to 306. Rows: 5 proven, 4 patterned, 3 latent, 57 owed.

## 2026-07-28, three owner rulings executed: the runtime, the hook, and the thirteen exports

### The runtime advanced to 24.18.0, by the named step

`VERSIONS.md` said advancing the runtime is a named step and not a bump: install the version, run every suite,
record the result with its commit, then move the pin and the row together. Performed in that order. v24.18.0
published 2026-06-23, verified against `nodejs.org/dist/index.json` rather than assumed, checksum verified by nvm
at install, 35 days old at pinning.

Measured on 24.18.0 at ad00662 BEFORE the pin moved: node server 306, node client-web 65, dotnet client-web 65,
shared client-web 65, node e2e green end to end. Then eleven surfaces moved together, and docs-lint's
cross-surface agreement check is what would have caught a missed one.

The window that permitted it: the repo declared 30 days and the owner's standing package policy said 3 months,
and they disagreed. The owner ruled 30 and changed the policy, so the two now agree and the version that exposed
the disagreement is the one that moved.

`Temporal` is still absent on 24.18.0, which matters because TIME-1's row rests on it and a test asserts it. That
assertion is why this was a measurement: a runtime that shipped `Temporal` would have turned the test red rather
than quietly changing what the claim rests on.

### The prompt-submit hook moved to the shared tier

This edition shipped no `.claude/` at all while `skills/seed` step 4 told the builder to verify the hook survived
instantiation, so a seed from here had nothing to verify and kept only the CLAUDE.md rule that PC-10 measured
decaying under long sessions. The file names no edition and never did, so two copies would have been two chances
to drift. One composed copy is one: 40 shared files now, `compose --check` holds them equal, and part A of this
edition's manifest names it.

### The thirteen exports, and the check that turned out to be unnecessary

E-113 recorded thirteen values exported and imported by nothing, and proposed an export-reachability check. The
ruling was to un-export them instead. **That made the compiler the mechanism.** `tsc --noUnusedLocals` reported
five of the thirteen as declared and never read the moment they stopped being exported, and all five were the
`assert*` wrappers that read as the enforcement path and were called by nothing. Deleted. The other eight are
used inside their own modules and are now module-private.

The instrument was in the build the whole time. What hid it was the `export` keyword: an export is a promise that
somebody outside might call this, and the compiler cannot disprove a promise. TEST-3's residual is correspondingly
smaller, and its remaining half is the client tiers and the sibling's C#.

### Gates

Everything on 24.18.0: node server 306, three client tiers 65 each, node e2e green, both editions docs-lint ok at
37/40 and conformance ok at 69 rows, compose ok at 40 shared files, loop-check ok, secret-scan ok in both, dash
scan 0 with a live control.

## 2026-07-28, the edition closes: what is met, what is not, and by whose decision

Measured at c2cec82. Four owner rulings close this effort deliberately, and three of them are decisions NOT to
build. Recorded in `record/adjudication-digest.md` under RULED, 2026-07-28.

### The state

    rows           5 proven / 4 patterned / 3 latent / 57 owed, 12 non-owed of 69
    suites         server 306, client-web 65, e2e green end to end, needing no engine container
    tools          docs-lint 37/40, conformance 69 rows, secret-scan 2 exceptions, gate-check 6/7

### The definition of ready, answered

**Requirement 2 is met**: every plant runs as an executable test. **Requirement 3 is met**: the acceptance test
ran on 2026-07-28, 9 of 10 commands passing in roughly five human turns against the sibling's twenty-seven, and
the tenth was the forge. **Requirement 1 is met except for two rows in this edition**, TEST-3 and HUM-1, both
`latent` on a gate readback that has never executed against a real forge.

That is a decision rather than a pending task. The owner ruled on 2026-07-28 not to instantiate in this pass, and
both rows now carry the trigger that would move them.

### E-117, and why this edition's rows were already right

The sibling's two rows said the readback was `latent` because it "needs a token this repository does not have".
Measured false: `gate-check` detects the kernel context and reads no gate at all, exiting 0 with a note whether a
token is present or not, because the kernel ships the workflow as a template and is not the repository whose
default branch is gated. What the rows need is an instantiation.

**These two rows named no blocker, and that is why they were correct.** They said only that the readback has
never run against a real forge, which is true and was true throughout. The finding is worth carrying here rather
than only in the sibling: the defect came from adding an explanation, written from an assumption about what the
tool needed rather than from running it. Claiming less was the stronger record. Both rows now name the
instantiation explicitly, which is a claim that was measured rather than assumed.

## Round: the tally that lived in two places (2026-07-28, S-16)

**Measured at 08be1a8**, repair in the working tree above it. Found by reading, not by a gate: this README's
intro restated the conformance tally in prose while the generated table a few sections below held the correct
one. Every gate was green, because `checkTable` compares the generated block against the record and cannot see
prose, and the catalog's stated-count check reads the repository's live documents and the skills rather than an
edition's README.

Repaired in the fourth bucket: the tally is deleted from the intro rather than re-synced, and
`tallyRestatementFindings` in the composed `tools/conformance.mjs` now fails a tally restated outside the
markers. It bans the shape rather than the value, because a second copy that agrees today still drifts on the
next pass that moves a row.

| what was done | result |
|---|---|
| the original sentence planted back into this README | `docs-lint` RED, naming the file, the line and the offending text |
| the same, in the sibling edition | RED, the same way, from the same composed predicate |
| **pre-repair control**: predicate disabled, both plants left in the tree | `docs-lint`, `catalog-check`, `loop-check`, `secret-scan` and `compose --check` ALL GREEN, which is the state both READMEs had been shipping in |
| mechanism restored, plants still in place | RED again in both editions |
| plants reverted from copies taken before the plant | byte identical, `docs-lint` green in both editions |
| predicate controls | 4 that must fire and 5 that must stay silent, in the self-test; the five are sentences shipped in these two READMEs, not invented ones |

### What is deliberately not built

TEST-3 stays `latent` rather than being driven to `proven`, which needs export-level reachability for the client
tier. UI-2 keeps its last two holes. TEN-3, UI-1 and CON-1 stay `owed` on surface this kernel does not have and
will not grow purely to be enumerated.

### The verdict

The edition is congruent with the claims catalog: every claim has an honest row. It is not the case that every
claim is `proven`, and it never was.
