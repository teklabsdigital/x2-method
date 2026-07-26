# kernel/node-react

The Node and TypeScript edition of the X2 kernel, and the catalog's second witness. It exists to answer a
question the first edition could not: whether the 69 claims in `../claims/` are portable invariants, or a
description of one stack's mechanisms wearing portable language. `BUILD-BRIEF.md` states that purpose and the
delta protocol the build follows.

**This edition is under construction, and `conformance.json` declares 65 of 69 claims `owed`.** What exists is
the platform seam every route-scanning claim stands on, proven red-green; the endpoint spine realizing SEC-1,
SEC-2 and SEC-3 over it; and the edition records the shared gates need. TEN-1 is deliberately still `owed`
despite three of its four surfaces being guarded and proven, for the reason S-8 in the findings register gives.

To be precise about what that record means, because an audit was right to press on it: `owed` here is a
statement about **pass order**, not a claim that no mechanism in this tree does anything. Several composed
mechanisms plainly run and plainly bind, and DOC-1, DEP-1 and HUM-1 in particular go red under injection against
this tree. They stay `owed` because the delta protocol in `BUILD-BRIEF.md` requires each claim's Node mechanism
to be designed from the claim text before the sibling edition's realization is opened, and a status written
ahead of that pass would be a status copied rather than earned. Every row is promoted by its own pass and by
nothing else. Reading a green build here as conformance would be the failure of aspirational enforcement that
the catalog was extracted to prevent.

## What the scaffold settled, and why it is structural

Four claims (SEC-1, SEC-2, SEC-3, TEN-1) name the same surface in the same words: a scan over "the composed route
table". In .NET that phrase is free, because `EndpointDataSource` is not a report about the router, it is the
router. Fastify hands out no equivalent: `printRoutes()` renders a tree for humans, `findRoute()` answers about
one URL. Nothing here is complete by construction, and a scan is only as good as its enumeration.

So completeness is bought, and the first attempt to buy it was audited and broken in thirteen ways. What it
costs, after the repair:

1. **The recorder is on the registration path.** `createApp` (`server/src/app.ts`) installs an `onRoute` hook in
   the same expression that creates the instance. `onRoute` fires inside `fastify.route()`, which every
   registration form funnels through, so no route can be registered before the recorder exists.
2. **The enumeration is materialized late, not early.** `onRoute` records references; the table is built at
   `onReady`. Snapshotting at `onRoute` was the audit's first refutation: Fastify runs hooks in registration
   order and registers what the LAST one leaves behind, so a later hook rewrote a route's url after the recorder
   had recorded it, and the table said `/decoy` while the server served `/admin/impersonate`.
3. **The table is reconciled against a second view.** At `onReady` it is compared with the router's own
   `printRoutes()` rendering, and any disagreement in either direction refuses the boot. Without this, the
   mechanism only ever agrees with itself.
4. **The evidence is immutable.** A getter-only decorator, frozen entries and a frozen array, so
   `app.routeTable = []` throws instead of emptying the table while every route keeps serving.
5. **The framework import is banned outside the composition root.** `server/eslint.config.js` covers every
   source extension, the subpath specifiers, dynamic `import()`, computed specifiers and `createRequire`.
6. **Only the entrypoint opens a socket.** A lint cannot see every dynamic evasion, so the second constraint is
   that no module but `src/main.ts` may call `listen`, and no module reaches the raw server modules. An instance
   the lint misses still serves nothing.

The recorder also refuses, before the server can serve, any route that exposes a surface it does not declare: a
body-bearing method with no `schema.body` (and the body-bearing set is defined by exclusion, so DELETE, OPTIONS
and methods added through `addHttpMethod` are all covered), a path parameter with no `schema.params`, any route
with no `schema.querystring`, and any wildcard. A declaration also has to be readable rather than merely
present: `{}`, `true`, `null` and open objects are refused, and `additionalProperties: false` is required.
That last clause is load-bearing rather than stylistic, because Fastify validates with `removeAdditional`: a
closed schema strips every field it does not name before the handler runs, so the declaration a scan reads and
the object a handler receives are the same thing.

The hole this cannot close is named rather than hidden: a hook that answers a request itself serves a URL with no
route behind it. `src/platform/__tests__/routeSurface.test.ts` asserts that hole as a passing test, so the day a
mechanism closes it, the test fails and gets rewritten instead of the limitation being quietly forgotten.

## What is here

```
BUILD-BRIEF.md   what this edition is for, the delta protocol, and the cut line
VERIFICATION.md  the dated verification history and the red-green proof table
VERSIONS.md      the DEP-1 ledger: kernel pin, packages, publish dates; the 30-day window header
conformance.json the per-claim status record: one row per catalog claim, the table below generated from it
edition.json     this edition's dependency manifests (DEP-1) and irreversible-surface homes (HUM-1)
.github/workflows/ci.yml   the TEST-3 loop (template; moves to repo root at instantiation)
.github/CODEOWNERS         the HUM-1 gate on migrations and published contracts (armed at instantiation)
.gitattributes   eol=lf everywhere (INV-03: no CRLF churn across the Windows/Mac/Docker boundary)
server/          Fastify 5 on Node 24: the composition root, the route recorder, and its completeness proofs
docs/            the DOC-1 tree (claims, decisions, contracts, runbooks, work); the templates are shared
```

Composed from the shared tier (`kernel/shared/`, one home for what is not stack-specific; see its README):

```
client-web/      Vite + React 19: tokens, primitives, notes module, scans, e2e harness + composed smoke
design/          the INV-01 design home: prototype/ (provenance README + imported artifact + _ds) and ledger/
docs/*/_template.md        the DOC-1 templates, one per registry kind
tools/docs-lint.mjs        the DOC-1 / TEN-5 / DEP-1 / DEC-1 / HUM-1 / conformance / MET-08 gate (plain node)
tools/conformance.mjs      validates conformance.json and generates the table below
```

**Never hand-edit a composed path.** Edit `kernel/shared/` and run `node kernel/tools/compose.mjs`; `--check`
fails the build on any divergence, so a local edit to a composed copy cannot merge.

## Running it

```
cd server && npm ci && npm run verify   # tsc, vitest, eslint
cd server && npm start                  # serves /health on PORT (default 5080)
cd client-web && npm ci && npm run verify
node tools/docs-lint.mjs                # the documentation, ledger, and conformance gates
node tools/conformance.mjs --check      # the record and its generated table
```

The server runs TypeScript directly on Node 24 (native type stripping), the same way the shared client's e2e
harness does. `tsc --noEmit` is the type gate; there is no build step to keep in sync with the run step.

## Conformance

Every claim in the catalog owes a row in `conformance.json`, and docs-lint fails if one is missing, so a claim
minted by a future catalog pass cannot land while this edition stays silent about it. The table below is
generated from that record: edit the JSON, never the table.

The four statuses mean what they mean in the catalog: `proven` (a mechanism exists and a test proves it binds),
`patterned` (the mechanism exists and is followed, with a named gap), `latent` (the mechanism exists but has had
no real subject yet), `owed` (not built, with a named trigger). Every row here is `owed`, and every trigger names
the claim's own delta pass, because the delta protocol requires the Node mechanism to be designed from the claim
text before the sibling edition's realization is opened. Rows whose sibling is also `owed` carry that claim's
product trigger too, since a claim waiting on the first message broker waits in every edition.

<!-- conformance:begin -->
Generated from `conformance.json` by `tools/conformance.mjs`; edit the JSON, not the table.
69 claims at catalog pass 2026-07-26: 4 `proven`, 0 `patterned`, 0 `latent`, 65 `owed`.

| Claim | Edition mechanism | Status |
|-------|-------------------|--------|
| TEN-1 tenant comes from the credential only | the prohibition half IS built and proven on all four surfaces: `scanEndpointSpine` rejects tenant-shaped route, query and body-contract names by tokenized run, and a runtime `onRequest` strip in `createApp` removes tenant-shaped request headers before any handler, which is the only reachable mechanism for a surface that cannot be closed. The strip's registry carries the concatenated spellings (`tenantid`, `orgid`, `organisationid`) explicitly, because Node lowercases header names before any hook runs, so `X-TenantId` arrives as `x-tenantid` and the tokenizer's camel-case half is unavailable on this surface by construction | owed; trigger: the credential mint (SEC-4, TEN-6). Read the status conservatively rather than as nothing built. TEN-1's statement is a prohibition plus a resolution rule; the prohibition is realized and red-green proven, and the resolution rule ('tenant is resolved solely from the validated credential') has no mechanism because no credential can be minted here. No status in the four-value vocabulary says that, which is S-8. Round 4 audit: the prohibition half was itself overstated, because `X-TenantId` and `X-OrgId` walked past the strip over real HTTP until the concatenated entries landed, which is evidence for the conservative status rather than against it. Findings: A-2, E-9, E-10, S-8. |
| TEN-2 ambient scope, fail-closed | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| TEN-3 tenant-leading composite keys | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| TEN-4 save-time guard and write provenance | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| TEN-5 sanctioned-bypass ledger | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| TEN-6 tenant is minted from membership, never asserted | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: first identity slice (shared with SEC-4's version store and SEC-10). |
| SEC-1 every endpoint gated | `POLICIES` registry (a policy naming no permission, or named `anonymous`, is refused at construction, so the bare authenticated-only gate is unrepresentable rather than rejected, and both refusals are exercised by test rather than asserted over the shipped registry's contents); every route declares `config.policy`, checked by `scanEndpointSpine` over the composed table; `ANONYMOUS_ROUTES` carries a justification per entry, is keyed by method and url, covers a synthesized HEAD only under reference identity on `config`, and a stale entry fails; deny-by-default `onRequest` hook installed in the expression that creates the instance, denying an ungated route to anonymous AND authenticated callers alike; `composeApp` runs the scan after `ready()` and refuses to compose a violating surface, which is itself red-green proven through the `surfaces` parameter | proven; the credential mint is owed (SEC-4, TEN-6), so every gated route in this exemplar answers 401; the gate, the allowlist, the fallback and the permission evaluation are each red-green proven, the last through an injected `authenticate` seam rather than a real mint. The fallback also closes the route-table residual hole (A-4). Round 4 audit: the boot wiring and the policy constructor were both unexecuted and are now proven; seven hook bypass attempts and a credential-leak probe all failed to evade. Findings: A-3, A-4, E-7, E-8, E-10. |
| SEC-2 anti mass-assignment | `scanEndpointSpine` walks every route's `schema.body` recursively through `properties`, `items` and `allOf`/`anyOf`/`oneOf`, matching `SERVER_CONTROLLED_FIELDS` by tokenized run (`id` whole-name only, so a foreign key does not trip it); `createApp` refuses at registration any schema keyword the walk does not descend (`$ref`, `patternProperties`, tuple-form `items`, `not`, `if`/`then`/`else`, `dependentSchemas`, `prefixItems`, `contains`, `propertyNames`, `unevaluatedProperties`, `definitions`) and requires EVERY object schema inside a scanned surface to set `additionalProperties: false`, so the closed declaration is a runtime filter at every level and not only at the top | proven; the contract is a value on the route, so there is no assembly heuristic, no name-suffix filter and no route-without-contract (B-2). Round 4 audit: the closure obligation was depth-0 only, so an open nested object delivered `author.tenantId` and `author.createdBy` to the handler with the scan silent; four such evasions were live and four more were scan-blind, and all eight are now refused at boot with permanent tests. Findings: B-2, B-4, E-6, E-9, E-10. |
| SEC-3 no PII in URLs | `scanEndpointSpine` over the composed route table: path parameters reconciled between the URL text and `schema.params` (a disagreement in either direction fails), query parameters from the mandatory closed `schema.querystring`, matched against `PII_PARAMETERS` by tokenized contiguous run so `emailAddress` and `user_email` match `email`, plus explicit entries for the three morphological classes a run over a tokenized entry cannot reach: concatenations (`firstname`, `dateofbirth`), decompositions (`mail`, so `e_mail` and `EMailAddress` match) and plurals (`emails`), with the tokenizer splitting letters from digits so `email1` matches; carve-outs are keyed by claim, route, SURFACE and field, carry a justification, cover a synthesized HEAD under their GET, and a stale carve-out fails | proven; `additionalProperties: false` plus Fastify's `removeAdditional` means an undeclared query parameter is stripped before the handler runs, which closes the ad-hoc-query-read residual the sibling names as unclosable. It does not close SEC-3's actual harm, since a URL carrying PII still reaches logs and proxies in either edition. Round 4 audit: the carve-out mechanism shipped with both its branches unexecuted and two defects in the key; the tokenizer's loss to equality on concatenated names is E-9's correction. Findings: E-9, E-10. |
| SEC-4 JWT hardening and revocation | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| SEC-5 no secrets in config | the committed-config half IS built and proven: a secret-shaped key (token-matched against `SECRET_SHAPED`) may hold only the empty placeholder in a committed file, refused at resolution AND by `scanConfigurationSurface`; the dev store is at a path asserted to be outside `EDITION_ROOT`, which is a property of the path rather than of a gitignore; a lint confines filesystem reads to the settings seam; secret-shaped literals in source are reported, with an exemption list carrying a reason per entry and a staleness check | owed; `owed` on the S-8 reasoning, deliberately and conservatively: two of the claim's obligations have no mechanism here. The vault port for runtime credentials is owed in both editions (trigger: first runtime credential), and the CI secret-scan gate the claim names as its second mechanism is not built, so a credential assigned to a non-secret-shaped name is invisible (the name predicate's stated reach, E-9's shape in a fourth registry). The sibling's realization of the same claim is measurably weaker on the built half: see E-11 and E-12. |
| SEC-6 log safety | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| SEC-7 opaque public identifiers | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first anonymous resource surface in an edition project (the kernel exemplar has none). |
| SEC-8 abuse posture | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first publicly exposed edition host (the launch pre-flight names it). |
| SEC-9 deployment-edge hardening | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first deployed edition host (arrives with the launch pre-flight). |
| SEC-10 authentication strength asserted at mint, verified at the gate | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: first identity slice (shared with SEC-4's version store and TEN-6). |
| SEC-11 the runtime credential cannot touch the schema | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the next edition build pass (rides DATA-6: the migrate mode and the role split are one provisioning story; the integration tier's provisioning path is where both roles are created). |
| TIME-1 UTC, offset-aware, and nothing else | the contract half IS built and proven: `scanEndpointSpine` walks every route's body, params, querystring, headers and response schemas and rejects a time-named property (token-matched against `TIME_SHAPED`) declared as a bare string, since `format: 'date-time'` is RFC3339 and RFC3339 requires an offset; `platform/clock.ts` is the one clock seam, with `new Date`, `Date.now`, `Date.parse`, `Date.UTC` and `performance.now` banned everywhere else by lint, which is the monotonic-durations extension's confinement | owed; trigger: the first store, for the persistence surface, and the first scheduling slice, for the zone-carrying shape the weakening note describes. `owed` on the S-8 reasoning, and the claim itself does not port as written (A-5, B-5). A JS `Date` is an instant: it lacks the ambiguity the harm paragraph is about AND lacks the offset the statement requires, so it satisfies neither side of the ban, because "UTC-anchored offset-aware" fuses two properties `DateTimeOffset` supplies together. `Temporal` is absent from Node 24.13.1, asserted as a test. No persistence surface exists, so that third of the claim has nothing to scan; the response half of the contract scan is a report rather than a proof, because response schemas carry no closure obligation. The two editions check disjoint surfaces for this claim (E-15). |
| DATA-1 stores, records, downward deps | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| DATA-2 bounded reads | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| DATA-3 two-layer at-most-once | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: first idempotent external side effect. |
| DATA-4 cross-store reconcile | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: first cross-store sequence. |
| DATA-5 fail-fast mandatory config | the startup half IS built and proven: `resolveSettings` runs as `composeApp`'s default parameter, before `createApp`, which cannot be constructed without the frozen result, so the ordering is a compile error rather than a convention; every mandatory key absent, mistyped, empty or undeclared is refused by name and ALL problems are reported at once; the runtime-refusal idiom is `requireZone`, tested | owed; trigger: the first seam that needs runtime context, which is the credential mint (SEC-4, TEN-6), since a principal is what carries a timezone. `owed` on the S-8 reasoning: the runtime-refusal half has no seam in this edition to refuse at, because there is no principal and therefore no stored timezone, so `requireZone` ships with a test and no caller. The sibling has a live one. The claim says "an error naming the missing key", singular; this reports all of them, because a validator that stops at the first turns a three-key misconfiguration into three failed deploys, and the sibling takes the singular reading (E-14). The undeclared-key refusal is the closure obligation with the opposite remedy to the request surface's, which is S-10. |
| DATA-6 migrate and exit | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the next edition build pass (a small host change; the mechanism is two facts on the composed host). |
| DATA-7 ruled retention and disposal | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first PII-bearing entity in an edition project, or the first contractual deletion clause, whichever lands first. |
| DATA-8 a state change and its event commit together or not at all | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first event publish in an edition project (arrives with the first broker, alongside RES-5). |
| DATA-9 a stale write is refused, never silently applied | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the next edition build pass (rides TEN-4's interceptor work; the token and the refusal live in the same save pipeline the tenancy guard already owns). |
| DATA-10 everything that grows has a registered sweep | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first append-only operational table in an edition project (DATA-8's outbox is the likely first, with RES-5's dead-letter quarantine close behind). |
| DATA-11 a migration never breaks the release running beside it | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first production deployment with rolling replacement; the lint half can land at the next edition build pass, ahead of the compatibility job. |
| CFG-1 operational settings are configuration, not code | `SETTINGS_SPEC` in `platform/settings.ts` is the declared configuration surface and the only reader of a config file, the secret store or `process.env`; `scanConfigurationSurface` parses `server/src`, `tools/`, `.github/workflows/` and `client-web/tools/` and reports operational-setting literals (provider endpoints, model ids), any `process.env` read outside the seam, and any script literal that duplicates a committed configuration value; a lint confines `process.env` to the seam | proven; The ambient process environment is a fourth home the claim does not name (A-6): not a literal in code, so the literal registry cannot see it, and not committed configuration, so it escapes config review. Closed by making it a declared channel: an env var may only override a key the spec declares, under a name derived from that key. The duplication check skips values shorter than eight characters, so short configuration values are uncovered in both editions (E-13). The source checks run over the parsed AST rather than over text, because a text scan reported the comments explaining its own bans (E-5 second instance). |
| CON-1 one wire dialect | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| CON-2 contract parity fixture | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| CON-3 read completeness for action-bearing surfaces | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first edition project with a restorable session (the kernel exemplar has none). |
| CON-4 a breaking change is detected by machine, approved by human | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first published external contract (a versioned API consumed outside the repo, a partner surface, or the first schema registry; the composed client in the same repo is CON-2's territory, not a published contract). |
| RT-1 realtime discipline | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: first realtime slice; the promotion set is the hub arch test, MaximumReceiveMessageSize, the createHub client seam, and the socket harness scenario. |
| SRV-1 one deployable unit | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the next edition build pass. Applies to web products; an API-only project re-rules it in its deltas file at adoption. |
| RES-1 every outbound call is bounded, and retries are earned | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first external service dependency in an edition project. Database session bounds are RES-6's, carved out so this claim stays about the chokepoint shape. |
| RES-2 no unbounded queue, pool, or backlog in the process | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first background worker or in-process queue in an edition project. |
| RES-3 the host dies cleanly, and there is a test that kills it | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first deployed edition host (rides SEC-9's deployment-edge work; the drain budget is a CFG-1 operational setting ruled against the platform's grace period). |
| RES-4 liveness answers alone; readiness answers for its dependencies | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first deployed edition host (lands with RES-3 and SEC-9; the health root SEC-1 already allowlists is the surface this claim splits in two). |
| RES-5 poison is quarantined at a counted limit, never retried forever, never dropped | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first message broker in an edition project (the transactional outbox relay, DATA-8, is the likely first consumer). |
| RES-6 every database session carries four finite bounds, each proven where it lives | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the next edition build pass. Everything here runs on the existing integration tier against the real engine, so proven is reachable immediately; nothing waits on a new dependency. |
| PERF-1 a hot operation's IO is counted, budgeted, and gated | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the next edition build pass (the v1 exemplar's list endpoint is the first designated seam; the interceptor rides the same seam TEN-4's stamps use). |
| PERF-2 a designated hot path's allocations are budgeted per operation | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first designated hot path in an edition project; designation before need fails the YAGNI gate, so the family expects most projects to hold zero designations for a long time, honestly. |
| PERF-3 a designated algorithmic seam proves its scaling with a counted ratio | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first hand-written algorithm over unbounded input in an edition project; library calls and database queries are not designations (the library's complexity is its documentation's promise, and query shape is PERF-1's and DATA-2's). |
| PERF-4 no sync IO and no whole-payload buffering on the serving path | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the next edition build pass (a BannedApiAnalyzers configuration plus one host assertion; the client side already carries the idiom under UI-2's lint discipline). |
| PERF-5 every cache is bounded and every entry expires | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first cache in an edition project; the claim deliberately does not mandate caching anywhere, it prices caching where chosen. |
| PERF-6 wall time is never asserted raw | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first wall-time benchmark in an edition project; the lint half can land at the next edition build pass, ahead of any benchmark existing, since its job is to keep the first timing assert out. |
| MOD-1 module co-location | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| MOD-2 deterministic naming and placement | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| DOC-1 documentation lifecycle | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| DEC-1 a module's behaviour traces to a decision | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the downward link is owed (trigger: first regeneration of a module from its decisions); the artifact-order check rides here too (trigger: next acceptance test); the upward provenance lint is built and proven. |
| UI-1 token source lockstep | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| UI-2 literal visual values are lint errors | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| UI-3 screens compose primitives only | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| UI-4 fidelity ledger | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| UI-5 thin UI over tested services, composed entrypoint exercised | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| DEP-1 dependency quarantine | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| DEP-2 standing advisory sweep with a remediation clock | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first armed CI loop (TEST-3 at instantiation); the publish-date check DEP-1 names as its upgrade path rides the same job. |
| TEST-1 tier strategy | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| TEST-2 e2E harness | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| TEST-3 CI loop | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| TEST-4 real-runtime boot proof | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the next edition build pass. UI-5's composed smoke already proves entrypoint wiring in-process; the real-boot script assertion and built-form pinning are the promotion set that completes it. |
| HUM-1 irreversible surfaces get a human turn, unconditionally | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| AI-1 server-injected identity | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| AI-2 untrusted content, no authority | not built | owed; trigger: this claim's delta pass in the node-react build. A realized precedent exists in dotnet-react, so a Node mechanism is expected to be reachable. |
| AI-3 prompt architecture | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first model-backed feature in an edition project. |
| OBS-1 external-effect seam observability | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first external side-effect port in an edition project. This claim opens the observability family the v1 cut deliberately deferred. |
| OBS-2 refusals and privileged actions are security events | not built | owed; trigger: this claim's delta pass in the node-react build. It is deferred in every edition so far: the first deployed edition host (alongside SEC-9; the refusal seams it instruments are already built and tested, so the events attach to existing tested paths). |
<!-- conformance:end -->

## Known limitations

- **The exemplar surface is minimal and its store is a placeholder.** Four routes exist (`/health` anonymous,
  `/notes` read and write, `/notes/:noteId`) so the scans have something real to be green about; a scan whose
  only subject is one route it was never going to flag proves close to nothing. `/notes` is backed by a
  module-level Map with no tenancy, no concurrency token and no bounded read. No DATA claim is realized by it and
  choosing a real store under DEP-1 is its own pass. TEST-2 and TEST-4 stay `owed` and the CI loop carries no e2e
  job, deliberately, rather than an e2e job that asserts nothing.
- **No credential can be minted, so every gated route answers 401.** SEC-4 and TEN-6 are owed in both editions,
  so this server has no way to produce a credential and the authorization seam is wired to a function that
  always returns none. That is the fail-closed direction and it is asserted as a test rather than left implicit:
  if a mint ever lands without being wired, the test goes red instead of the server quietly opening.
- **The client is the shared one, unmodified.** `client-web/` is composed from the shared tier and still points at
  the sibling edition's API shape. Wiring it to this server is part of the build pass, not the scaffold.
- **The CI loop is built, not armed.** Branch protection is set at instantiation; until then the loop blocks
  nothing, exactly as in the sibling edition.
- **The client's pins carry known advisories.** `client-web/` reports 14 advisories, 1 critical and 13 high,
  across the eslint, vitest, vite and postcss chains. Every one now has a fix that also clears the cooling-off
  window, following the window pass of 2026-07-26; at 90 days the `vite` chain had none, which is the evidence
  that prompted the ruling. This edition's server tree installs with zero advisories. The client's pins are the
  shared tier's and are not this edition's to change unilaterally, so the bump is queued rather than applied:
  it re-composes into the shipped .NET edition and owes that edition its own verification run. `VERSIONS.md`
  and the findings register (E-3) carry the detail.
