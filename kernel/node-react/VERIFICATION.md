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
