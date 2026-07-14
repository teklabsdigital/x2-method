# kernel/dotnet-react

The .NET 9 + React edition of the X2 kernel. It realizes the 37 portable claims in `../claims/` as running,
enforced mechanisms: architecture tests that fail the build when an invariant is broken, a fail-closed tenancy
composite, a deny-by-default HTTP host, a bounded-read data layer, a token-locked client, an out-of-process e2e
harness, and a CI loop that runs all of it on every push. The product placeholder name is `Kernel`.

Built and verified on this machine (2026-07-10): `dotnet build` clean with warnings as errors; 68 server tests
green (45 architecture, 19 unit, 4 Testcontainers integration on real SQL Server); `npm run verify` green (tsc,
16 vitest, eslint); the harness green end to end against a running server (and proven to fail loudly, not
vacuously, when a tenant token is bad); and the red-green guard proof below.

After the first green, an adversarial review probed each guard for evasion paths the red-green proof did not
mutate. It found real gaps where several guards checked an under-approximation of their surface (the change
tracker instead of all SQL writes; reflected URL params instead of all URL binding; name-filtered contracts
instead of all body-bound types; one render branch instead of all). Those were closed and re-proven; the residual
gaps that are inherent to a static or runtime scan are recorded under Known limitations rather than papered over.

A subsequent full code review (ten finder angles plus adversarial verification) found a further set of runtime and
guard-binding defects the red-green proof could not reach because it only mutates the guards, not the behavior they
guard: a keyset that crashed on timestamp collisions, a client repo that turned every error status into a silent
`null` (so the isolation probe passed vacuously), an endpoint that 500'd on malformed input, a tool that dropped
its JSON-typed argument, an anonymous endpoint that 401'd a stale token, and a flaky (~1-in-16) tamper test. All
were fixed, the guards strengthened again, and the new behavior covered by tests and re-proven red-green.

The invariants pass (2026-07-11) applied the kernel acceptance test's record under the owner's rulings: four claims
promoted into the cut line (UI-5, CFG-1, HUM-1, DEC-1), the docs-lint gate extended (scoping, decision
provenance, container-image pins, the dash check), UI-2 extended to dimensions, TEST-2 made complete and
self-auditing with the gated harness profile, the two deliberately-deferred defects closed (the docs-lint
over-scan; the floating SQL Server tag, now tag@digest in one ledgered value across runbook, CI, and the
Testcontainers fixture), and the instantiation section rebuilt as a verifiable manifest. It also found and closed
two latent kernel instances of pilot findings: the edition's own entrypoint was placeholder-wired (never called
the API; the exact INV-07 hole, now wired and smoke-proven) and the UI-2 raw-number bans were vacuous for numeric
literals (esquery regex-tests only strings; now matched on `raw`). Verified on this machine (2026-07-11):
`dotnet build -warnaserror` clean; 72 server tests green (19 unit, 49 architecture, 4 Testcontainers integration
on the pinned image); `npm run verify` green (tsc, 16 vitest, eslint); the harness 7/7 against a running server
including the service-method-coverage self-audit; the composed-entrypoint smoke green live; docs-lint ok; the
round-4 red-green proofs below.

## What is here

```
BUILD-BRIEF.md   the handover this edition was built from (kept for provenance)
VERSIONS.md      the DEP-1 ledger: packages + container images, publish dates; the 90-day window header
.github/workflows/ci.yml   the TEST-3 loop (template; moves to repo root at instantiation)
.github/CODEOWNERS         the HUM-1 gate on migrations and published contracts (armed at instantiation)
.gitattributes   eol=lf everywhere (INV-03: no CRLF churn across the Windows/Mac/Docker boundary)
.vscode/tasks.json         thin editor tasks; each just calls a script or CLI below (INV-03)
scripts/         db-up (pinned image, named volume, arm64 precheck), db-down, db-migrate, dev-setup, e2e
design/          the INV-01 design home: prototype/ (provenance README + imported artifact + _ds) and ledger/
docs/            the DOC-1 tree (claims, decisions, contracts, runbooks, work) + templates
tools/docs-lint.mjs        the DOC-1 / TEN-5 / DEP-1 / DEC-1 / HUM-1 / MET-08 gate (plain node, no deps)
server/          .NET 9 solution: Contracts, App, Persistence, Api + three test projects
client-web/      Vite + React 19: tokens, primitives, notes module, scans, e2e harness + composed smoke
```

**Declared docs-lint exclusions (INV-08).** docs-lint governs authored files and skips imported ones, and the
exclusions are declared here so they are a visible decision, never a silent patch: (1) any path registered in
`.gitmodules` (vendored submodules are third-party by definition); (2) everything under `design/` EXCEPT the two
authored shapes it governs, `design/prototype/README.md` (the lock record, kind `provenance`) and
`design/ledger/*.md` (kind `ledger`, slice-stamped). Lockfiles are exempt from the dash check (generated
third-party metadata); every other authored file in the tree is scanned.

The server layers run downward only (DATA-1): Contracts references nothing; App references Contracts; Persistence
implements App's store interfaces; Api is the composition root over App + Persistence. `DependencyDirectionTests`
enforces the direction and that endpoints never touch Persistence directly.

**Provider ports (CONF-02).** Every external side effect (message delivery, a model call, clock-like effects)
sits behind a provider interface bound at the composition root. This is not style: it is what makes the e2e floor
closable. The gated harness profile (TEST-2) can only re-bind an effect that is behind a port; an effect
instantiated inline is unreachable by the profile, and the harness completeness rule breaks there. The
acceptance-test pilot proved the payoff concretely: when full e2e collided with two deliberate design choices
(out-of-band OTP, a live paid model call), both effects were already behind ports, so the resolution was pure
composition-root re-binding, a ruling instead of a redesign. Review each new external effect at its slice for
exactly this property.

## Instantiation manifest

The instantiation layer is where the acceptance test found the kernel weakest (a quarter of the pilot's human
turns were bootstrap the handover failed to ship), so instantiation is a MANIFEST: a concrete file set plus setup
steps plus a verification set, verified AS A SET, not one by one from memory. x2-seed runs it; the kernel
acceptance test verifies that instantiation ships and arms the whole set, extending TEST-3's keystone from
"instantiation arms branch protection" to "instantiation ships and arms everything below". A gap found while
seeding is a finding for the invariants pass, logged as a turn.

**A. The file set** (copy into the new repo root): `server/`, `client-web/`, `docs/`, `tools/`, `scripts/`,
`design/`, `.github/` (workflow AND CODEOWNERS), `.vscode/`, `.gitignore`, `.gitattributes`, `VERSIONS.md`.
BUILD-BRIEF.md stays behind (kernel provenance, not project material).

**B. Setup steps, in order:**

1. **Rename the product.** Replace `Kernel` with the product name across project file names, namespaces, the
   `.sln`, the `UserSecretsId` in `Kernel.Api.csproj`, the connection-string key `ConnectionStrings:Kernel`, the
   scripts' container/volume names, `.vscode/tasks.json` labels, and CODEOWNERS paths. Then the CONFIG VALUES the
   pilot missed (INV-06): `Jwt:Issuer` and `Jwt:Audience` in `appsettings.json` are `kernel` and rename with the
   product; docs-lint's HUM-1 check matches path fragments so the CODEOWNERS rename cannot silently drop coverage.
2. **Git setup.** `git init`; the canonical `.gitignore` and `.gitattributes` (`eol=lf`) are in the file set;
   first commit only when directed (the never-commit constraint is in the project CLAUDE.md that x2-seed writes).
3. **Arm the gates (TEST-3 + HUM-1, the step that gets skipped).** Move `.github/workflows/ci.yml` to the repo
   root; branch protection requires all five jobs AND code-owner review; replace `@OWNER` in CODEOWNERS with the
   product owner. Until this step the loop runs but blocks nothing.
4. **Dev environment.** `scripts/dev-setup.sh` (SA password to gitignored `.env`; `Jwt:Key` and connection string
   to user-secrets), then `scripts/db-up.sh` (pinned image, named volume, arm64 precheck) and
   `scripts/db-migrate.sh`. Ports 5080/5173/1433; Node 24+ for the harness and smoke. If the product vendors a
   submodule: `git submodule update --init` joins this step (docs-lint auto-skips `.gitmodules` paths). If the
   product needs a provider key (the pilot's Anthropic key): it goes to user-secrets here, and the bootstrap line
   is added to `dev-setup.sh`, never a manual copy no script covers.
5. **Design home (INV-01).** Import the COMPLETE Claude Design export via the design MCP into
   `design/prototype/` (the `.dc.html` plus the full `_ds/`, both themes, more than fifty variables; never values
   scraped from the `.dc.html`); fill in `design/prototype/README.md` (the lock record); re-point
   `tokenCoverage.test.ts` at the real export path under `_ds/` and re-transcribe `src/theme/tokens.ts` until it
   is green. Each slice lock adds its `design/ledger/slice-NNN.md`.

**C. Verify as a set** (the seed is not done until all pass):

- `dotnet build -warnaserror` and `dotnet test` (all tiers; Docker running)
- `npm ci && npm run verify` in `client-web/`
- `scripts/e2e.sh` (harness with completeness self-audit, then the composed-entrypoint smoke)
- `node tools/docs-lint.mjs` (DOC-1 placement, DEC-1 provenance, DEP-1 image pins, HUM-1 CODEOWNERS coverage,
  MET-08 dashes)
- The dash check standalone, with the literal-byte pattern (BSD grep false-negatives on a BRE class):
  `grep -rn "$(printf '\342\200\224')" <authored paths>` and `grep -rn "$(printf '\342\200\223')" <authored paths>`
- Branch protection verified armed: a test PR touching `Migrations/` must show the required code-owner review.

Every project you add lands one D-000 (the first project decision record) plus deltas from this edition. That is
the methodology metric: human turns per shipped slice.

## Decisions and deviations from the brief

The brief hands the claim file authority on conflict ("if this brief and a claim file disagree, the claim file
wins"). Three claim-mandated obligations were absent from the brief and are built here, confirmed with the owner:

- CON-2 contract-parity fixture (the Notes contract is hand-mirrored in C# and TypeScript, so the claim applies in
  v1): one shared `note-contract.fixture.json`, linked into the C# test project and read by the client test.
- AI-1 / AI-2 agent-trust exemplar: the `ToolExecutor` reject-then-inject chokepoint and one read-only tool with
  its no-writes guard test. Nothing in v1 invokes them; they ship as the proven pattern the claims place in v1.
- SEC-5 config-shape test and CI secret-scan (the brief asserted only that user-secrets was wired, not the actual
  no-secret-in-committed-config invariant). The vault-port interface is recorded owed (no runtime credential yet).

Two resolved potholes:

- Dev database and secrets: the brief named a committed LocalDB connection string. X-6 forbids OS-installed engines
  and SEC-5 forbids committed secrets, so dev `Jwt:Key` and the containerized `ConnectionStrings:Kernel` live in
  user-secrets, and `appsettings.Development.json` holds no secret. The dev engine is a container (see the runbook).
- SQLite cannot order or compare `DateTimeOffset`, which the keyset list requires. `KernelDbContext` applies a
  `DateTimeOffset` to UtcTicks value converter (also matching `DateTimeOffset?`) only when the provider is SQLite
  (the arch and unit tiers), so those tiers exercise the real query; production and the integration tier keep native
  `datetimeoffset` on SQL Server.
- Keyset cursor: the cursor is `(CreatedAtUtc, Id)`, not `CreatedAtUtc` alone, and the supporting index is not
  unique. Id is the tiebreaker, so two notes created in the same clock tick can coexist and still page without a
  dropped or duplicated row; the earlier unique `(TenantId, CreatedAtUtc)` index would have crashed the second
  write. An integration test creates five notes at one instant and pages all five.

## Conformance table (all 37 claims)

Status uses the catalog's four states (defined in `kernel/claims/README.md`): `proven` (one scan covers the whole surface), `patterned` (mechanism plus the v1 seams tested; each new seam owes its test), `latent` (built, never yet exercised by a real instance), `owed` (recorded, with the named trigger that promotes it). Every gating status is conditional on TEST-3's loop being armed at instantiation.

| Claim | Edition mechanism | Status |
|-------|-------------------|--------|
| TEN-1 tenant from claim only | `TenantScopeMiddleware` reads `tenant_id` from the JWT only; `EndpointSpineTests` bans tenant route/query params; `ContractShapeTests` bans `TenantId` on requests | proven |
| TEN-2 ambient scope fail-closed | `AmbientTenantScope` (AsyncLocal, throws on unset); `AmbientTenantScopeTests` | patterned; the non-HTTP job base class is owed (trigger: first background job) |
| TEN-3 tenant-leading keys | `NoteConfiguration.HasKey(TenantId, Id)`; `TenantKeyTests` (both directions) | proven |
| TEN-4 save-time cross-tenant guard | `KernelDbContext.GuardTenancy` on both SaveChanges variants; `TenantGuardTests` incl. unset-scope throws; integration cross-tenant modify; `BulkWriteBanTests` forbids the EF set-based/raw-SQL operators **and raw ADO (`GetDbConnection`/`CreateCommand`/`ExecuteNonQuery`)** that bypass the save pipeline | proven |
| TEN-5 sanctioned-bypass ledger | `docs/claims/tenant-bypass-ledger.md` (empty) + docs-lint rule that a row without a sole-reader test fails | latent (ledger empty; the first sanctioned bypass is its first run) |
| SEC-1 every endpoint gated | deny-by-default fallback policy (`EndpointSpineTests` asserts it carries `DenyAnonymousAuthorizationRequirement`, not merely non-null) + `PermissionPolicyProvider` (policies cached, `AllowsCachingPolicies`); `EndpointSpineTests` (allowlist `/health`, perm policy required). The `sv`/tenant gates run after routing and exempt allowlisted-anonymous endpoints, so a stale token no longer 401s `/health` | proven |
| SEC-2 anti-mass-assignment | `ContractShapeTests` forbidden-field registry (incl. internal/nested Request types, shared with the body scan); `EndpointSpineTests` scans every endpoint's body-bound DTO for server fields (services excluded via `IServiceProviderIsService`; **immutable constructor-bound DTOs covered** by scanning constructor parameters, not just writable properties); App/Api declare no request/response types | proven |
| SEC-3 no PII in URLs | `EndpointSpineTests` route + query scan, covering [AsParameters] wrapper properties, collection-typed and DateTime/TimeOnly params | proven |
| SEC-4 pinned algorithm + revocation | pinned HS256, `RequireSignedTokens`, `SessionVersionMiddleware`; `HostSecurityTests` incl. a wrong-algorithm token (HS384) and a missing-sv token both rejected | proven; EF-backed session store owed (trigger: first identity slice) |
| SEC-5 no secrets in config | `UserSecretsId` + `SecretConfigShapeTests` (scans every committed JSON config under `src/`, not only `Kernel.Api/appsettings*.json`) + CI secret-scan job (widened to `.env`, `*.json`, yaml, props, npmrc) | proven; vault-port interface owed (trigger: first runtime credential) |
| SEC-6 log safety | `redact.ts` scrubs Authorization and JWT-shaped strings; `redact.test.ts` | patterned (v1 surfaces tested); hub log-safety owed (trigger: realtime) |
| TIME-1 UTC offset-only | `TimeTypeTests` over Contracts, App, Persistence (recurses Nullable, arrays, generics) | proven (DB UTC column defaults not used: the service sets the value) |
| DATA-1 stores + records + downward deps | layer references + `DependencyDirectionTests`; one service call per endpoint | proven |
| DATA-2 bounded reads | `EfNoteStore` AsNoTracking + `(CreatedAtUtc, Id)` keyset + `Clamp(1, INoteStore.MaxPageSize)` (bound shared by service and store); `NoteServiceTests`, integration `KeysetPagingTests` incl. a same-timestamp collision page | patterned (structural + review; single module, no shared store base) |
| DATA-3 two-layer at-most-once | claim + proven exemplar | owed (trigger: first idempotent external side effect) |
| DATA-4 cross-store reconcile | claim + proven exemplar | owed (trigger: first cross-store sequence) |
| DATA-5 fail-fast config | `Required()` startup reads; `StartupConfigTests` fails per missing key | proven |
| CFG-1 operational settings are config | `OperationalSettingsTests` scans `server/src` and `scripts/` for model-id and provider-endpoint literals (registry extends per project at D-000); `scripts/e2e.sh` reads Jwt:Issuer/Audience from committed appsettings, never duplicating them | proven |
| CON-1 one wire dialect | ProblemDetails + StatusCodePages + single camelCase enum converter; `WireConventionTests` (naming, enum round-trip, problem+json) | proven |
| CON-2 contract parity fixture | shared `note-contract.fixture.json` linked into C# tests + read by the TS test; `ContractParityTests`, `noteContract.test.ts` | proven |
| RT-1 realtime discipline | client is REST-only in v1 | owed (trigger: first realtime slice): hub arch test, MaximumReceiveMessageSize, createHub client seam, socket harness scenario |
| MOD-1 module co-location | Notes module co-located; client deep-path import bans | latent (single module; the cross-module rules have no second module to constrain, so the second module is their first real run) |
| MOD-2 deterministic naming/placement | `NamingPlacementTests` (server source scan) + `namingPlacement.test.ts` (client) | proven |
| DOC-1 documentation lifecycle | `docs-lint.mjs` front matter + placement + work slice ids + the design/ narrow governance (the provenance README and ledgers governed; imported artifacts exempt; `.gitmodules` paths skipped; exclusions declared above) + the MET-08 dash check | proven (forward-only status transitions not linted, stateless) |
| DEC-1 behaviour traces to a decision | docs-lint fails a `docs/decisions/*.md` without a `provenance` field (the upward link); the decision template models the field | owed (the downward link, trigger: first regeneration of a module from its decisions; the artifact-order check rides here too, trigger: next acceptance test; the upward lint is built and proven) |
| UI-1 token source lockstep | `tokenCoverage.test.ts` reads the export at its canonical home `design/prototype/_ds/colors_and_type.css` (every CSS var has a token, count > 50) | proven |
| UI-2 literals are lint errors | `eslint.config.js` bans hex/rgb/hsl/named colors, inline font props, raw radii and hairlines, in strings and template literals; font weights as a closed set; **spacing and dimension literals** (numeric/px/rem on padding/margin/gap/width/height/offsets/insets, numerics matched on `raw`) with the structural allowlist (ratios, flex, order, zIndex, %, viewport units, ch/fr/auto, 0) | proven |
| UI-3 primitives-only screens | `Text`/`Button` are the only token importers (eslint no-restricted-imports + naming scan) | proven |
| UI-4 fidelity ledger | `NotesScreen.fidelity.test.tsx` exhaustiveness + de-fabrication; ledgers live in `design/ledger/` (INV-01) | patterned (each screen owes its suite; per-atom resolved-style assertions not included; the prototype-to-ledger exporter owed) |
| UI-5 thin UI over tested services | eslint `@typescript-eslint/no-restricted-imports` bans `api/**` and `data/**` outside the composition root (`src/main.tsx`; type-only imports legal; service/transport layers, tests, and tools exempt); `npm run smoke` boots the ACTUAL `src/main.tsx` in jsdom against the live server and asserts a real GET (list renders) and a real POST (create, then re-list); runs in the CI e2e job and `scripts/e2e.sh` | patterned (the import ban is proven-centralized; each new primary flow owes its smoke line) |
| DEP-1 dependency quarantine | CPM exact pins + lockfiles + `--locked-mode` / `npm ci` + source mapping + `VERSIONS.md` (90-day window in the header, container-images section) + docs-lint ledger completeness + docs-lint image check (floating/unledgered/digest-less image refs fail); the SQL Server image is one tag@digest value across runbook, CI, and the Testcontainers fixture | proven; publish-date CI check owed (dates recorded by hand) |
| TEST-1 three tiers on real engines | SQLite unit/arch, Testcontainers integration; EF InMemory banned by `NamingPlacementTests` | proven |
| TEST-2 e2e harness | `tools/harness/main.ts` drives the real client services; NDJSON + redaction (sets `exitCode` so the failing line flushes); proven green e2e and proven to fail loudly on a bad tenant token, not vacuously; **completeness self-audit** (enumerates NotesRepo's methods, records every call, fails on an uncovered method); the gated harness profile ships in `Program.cs` (refuses outside Development/Testing, `HarnessProfileTests`) with identity premises marked in `mintToken.mjs` | proven (the harness-profile gate is latent: no product-owned provider port to re-bind yet; the first one is its first re-binding) |
| TEST-3 CI loop | `ci.yml`: server, client, docs-lint, secret-scan, e2e-wire | proven mechanism, not yet armed (branch protection is set at instantiation; until then the loop blocks nothing) |
| AI-1 server-injected identity | `ToolExecutor` reject-then-inject + throw-on-unset, rejecting server-owned keys (incl. OIDC/Azure names and `org*` tenant synonyms) recursively through nested objects and lists; `ToolExecutorTests` incl. a nested-payload case | proven (nested dictionaries/lists stripped; `JsonElement`-typed nesting remains a per-tool review item) |
| AI-2 untrusted content no authority | `ListNotesTool` read-only + `ListNotesToolReadOnlyTests`; `docs/decisions/ai-trust-tiers.md` | patterned (the v1 tool has its guard test; each new tool owes its own); full taint tracking + SSRF egress guard owed (trigger: outbound agentic requests) |
| HUM-1 irreversible surfaces get a human turn | `.github/CODEOWNERS` covers `Kernel.Persistence/Migrations/`, `Kernel.Contracts/`, `docs/contracts/` (`@OWNER` renamed at instantiation); docs-lint fails if any of the three surfaces loses its owned entry; branch protection requires code-owner review, armed at instantiation | proven mechanism, not yet armed (arms with TEST-3; the manifest carries the step) |

Also owed at v1 (out of the cut line, recorded not lost): an identity/auth module (tests and the harness mint their
own JWTs with the dev key), and the Expo/React Native client variant (a proven mobile-client pattern, lifted
when the first mobile kernel project appears).

## Guard verification (red-green proof)

Every guard was deliberately violated, the guard confirmed red, and the violation reverted. A green suite without
this proof is exactly the aspirational-enforcement failure the extraction found; this is the evidence each guard
binds. All 18 went red on a real violation and the suites returned to green after revert.

| Guard (test) | Injected violation | Result |
|--------------|--------------------|--------|
| `EndpointSpineTests` (SEC-1) | an ungated `MapGet("/leak", ...)` endpoint | red |
| `EndpointSpineTests` (SEC-3) | a `{tenantId}` route parameter | red |
| `ContractShapeTests` (SEC-2) | a `TenantId` property on `CreateNoteRequest` | red |
| `TimeTypeTests` (TIME-1) | a `DateTime` property on `NoteResponse` | red |
| `DependencyDirectionTests` (DATA-1) | an endpoint handler taking a `KernelDbContext` parameter | red |
| `TenantKeyTests` (TEN-3) | the Note key reordered to `(Id, TenantId)` | red |
| `WireConventionTests` (CON-1) | the enum converter removed | red |
| `HostSecurityTests` (SEC-4) | the session-version check bypassed | red |
| `StartupConfigTests` (DATA-5) | `Jwt:Key` given a silent fallback instead of failing fast | red |
| `SecretConfigShapeTests` (SEC-5) | a `Secret` value pasted into `appsettings.json` | red |
| `ContractParityTests` (CON-2, C#) | a field dropped from the shared fixture | red |
| `TenantGuardTests` (TEN-4) | the save guard made fail-open on unset scope (the fail-open regression) | red |
| `NamingPlacementTests` (MOD-2) | a `StrayStore.cs` placed under Api instead of App | red |
| `eslint` (UI-2) | a hex color literal in a screen | red |
| `tokenCoverage.test.ts` (UI-1) | a CSS variable with no matching token | red |
| `NotesScreen.fidelity.test.tsx` (UI-4) | an unledgered atom rendered | red |
| `noteContract.test.ts` (CON-2, TS) | a field dropped from the shared fixture | red |
| `namingPlacement.test.ts` (MOD-2 client) | a lowercase component file | red |

Two notes from the proof, kept because they are real properties of the mechanisms:

- `DependencyDirectionTests` uses NetArchTest, which does not detect a contrived `typeof(...)`-only reference; it
  does detect a realistic dependency (a parameter, field, base type, or instantiation), which is how an endpoint
  would actually reach Persistence. The proof above uses the realistic form.
- `HostSecurityTests` tampered-token assertion cannot be made green-under-violation by config alone: the framework
  always verifies a present signature against the key, so `ValidateIssuerSigningKey=false` does not accept a
  tampered token. The violable SEC-4 assertion is session-version revocation, used above.

### Guard verification, strengthened guards (adversarial review)

Each guard hardened after the adversarial review was re-proven the same way: inject the exact evasion the review
found, confirm the strengthened guard now goes red, revert. All seven went red and both suites restored to green.

| Guard (test) | Injected evasion (previously green) | Result |
|--------------|-------------------------------------|--------|
| `BulkWriteBanTests` (TEN-4/AI-2) | `db.Notes.Where(...).ExecuteDelete()` (bypasses the save guard) | red |
| `EndpointSpineTests` (SEC-3) | a collection-typed query param named `name` | red |
| `EndpointSpineTests` body scan (SEC-2) | a body DTO carrying a `TenantId` field | red |
| `HostSecurityTests` (SEC-4) | the algorithm pin removed, an HS384 token presented | red |
| `NamingPlacementTests` (TEST-1) | a lowercase `microsoft.entityframeworkcore.inmemory` reference | red |
| `eslint` (UI-2) | an `oklch(...)` color literal in a screen | red |
| `NotesScreen.fidelity.test.tsx` (UI-4) | a ledgered atom (`empty-state`) that stops rendering | red |

### Guard verification, code-review round

The full code review found runtime and guard-binding defects that the red-green proof could not reach on its own,
because deliberately violating a guard does not exercise the behavior the guard is meant to describe. Each fix was
proven the same way: reproduce the defect (or inject the evasion the review found), confirm red, revert to green.

| Guard / behavior | Injected violation or defect input | Result |
|------------------|------------------------------------|--------|
| `BulkWriteBanTests` (TEN-4/AI-2) | raw ADO `db.Database.GetDbConnection()` in a store (bypasses the save guard) | red |
| `EndpointSpineTests` body scan (SEC-2) | an **immutable get-only** DTO carrying `TenantId`, bound as a body (slipped the old `CanWrite` scan) | red |
| `The_fallback_policy_denies_by_default` (SEC-1) | fallback weakened to `RequireAssertion(_ => true)` (stayed non-null) | red |
| `namingPlacement.test.ts` (MOD-2 client) | a misplaced `Domain.tsx` (previously skipped by `endsWith('main.tsx')`) | red |
| `redact` JSON integrity (SEC-6) | the greedy `\S+` form corrupts the surrounding NDJSON (demonstrated old vs new) | red |
| `KeysetPagingTests` collision (DATA-2) | five notes at one instant under the old unique index would crash the second write | red |
| e2e harness isolation probe (TEST-2) | a bad tenant-B token: `get()` now throws instead of returning `null`, so the probe fails loudly | red |

### Guard verification, invariants pass (round 4)

Every mechanism the invariants pass landed was proven the same way as it landed, not in a batch at the end:
plant the violation, watch the guard fail, revert, watch it return green. Two rows are live defects the gate
caught on its first run (marked "live"): the red half was the real tree, and the fix is the green half.

| Guard (mechanism) | Injected violation or live defect | Result |
|-------------------|-----------------------------------|--------|
| docs-lint image check (DEP-1/INV-05) | live: ci.yml and the runbook floating `mssql/server:2022-latest` | red; green at tag@digest |
| docs-lint provenance (DEC-1) | live: both shipped decisions carried no `provenance` field | red; green with the field |
| docs-lint dash check (MET-08) | an em dash planted in README.md; then an en dash | red; green on removal |
| docs-lint `.gitmodules` skip (INV-08) | front-matter-less markdown in an unregistered `vendored/` dir | red; green once the path is registered in `.gitmodules` |
| docs-lint design governance (INV-08) | `design/prototype/README.md` without front matter | red (an imported `_ds` file with no front matter AND an em dash stayed exempt: green) |
| docs-lint CODEOWNERS coverage (HUM-1) | the Migrations entry removed from CODEOWNERS | red |
| eslint import ban (UI-5) | a value import of `NotesRepo` in `NotesScreen.tsx` | red (the existing type-only `Note` import stays green) |
| eslint dimension bans (UI-2) | `width: 384`, `gap: 20`, `padding: '24px'`, `margin: '12px 24px'` in a screen | red x4 (allowlist probe `lineHeight: 1.5`, `zIndex: 10`, `flex: 1`, `'50%'`, `'100vh'`, `inset: 0` stays silent) |
| eslint borderRadius raw number (UI-2) | `borderRadius: 8` (previously vacuously green: esquery value-regex never matches numeric literals; now matched on `raw`) | red |
| `OperationalSettingsTests` (CFG-1) | a `claude-*` model-id literal in Program.cs; then one in `scripts/e2e.sh` | red both surfaces |
| `HarnessProfileTests` (TEST-2/INV-10) | the environment refusal weakened to `if (false)` | red (both refusal tests) |
| harness `service-method-coverage` (TEST-2/INV-10) | a public `probeUndriven()` method on NotesRepo with no scenario | red against the live server |
| composed-entrypoint smoke (UI-5/INV-07) | `main.tsx` reverted to the placeholder wiring (no client constructed; the edition's own pre-pass state) | red against the live server; green re-wired |

## Known limitations

Honest edges where a static or runtime scan cannot be complete. Each is a slice-level review item, not silent
coverage:

- A handler that takes `HttpContext` and reads `Request.Query["email"]` at runtime is invisible to any static
  route-table scan (the key is never a declared parameter). Ad-hoc query reads are reviewed per slice; declared
  parameters (including `[AsParameters]`, collections, and DateTime) are scanned.
- `EndpointSpineTests` enumerates `RouteEndpoint`s. A route surfaced by a custom `EndpointDataSource` yielding bare
  `Endpoint`s is not scanned; all minimal-API routes are `RouteEndpoint`s, so this needs a deliberate custom source.
- `ContractParityTests` compares the camelCase field-name set of each mirrored contract, not property types or
  nullability, and only the enumerated contracts. A new hand-mirrored contract must be added to the fixture and the
  theory; a type change that preserves the name set is a review item. A generator would collapse this obligation.
- The UI-2 named-color list is broad but not the full CSS keyword set; the token system plus review are the real
  defense, the lint is the cheap net.
- `InMemorySessionVersionStore` is process-local and resets on restart or scale-out, so revocation is un-done there.
  This is the documented skeleton choice (the EF-backed store is owed at the first identity slice) and is a hard
  pre-production prerequisite for any multi-instance deployment.
- AI-1 rejects server-owned keys (the common OIDC/Azure claim names plus `org*` tenant synonyms) recursively
  through nested dictionaries and lists. A value smuggled inside a `JsonElement`-typed argument (a raw JSON subtree
  the executor does not walk) is still a per-tool schema-review item; the allowlist-per-tool upgrade would close it.
- The strengthened `sv`/tenant gates exempt an endpoint whose matched metadata carries `IAllowAnonymous`. This
  relies on `UseRouting` running before the gates so `GetEndpoint()` is populated; the pipeline sets that order
  explicitly. A gate placed before `UseRouting` would see a null endpoint and fall back to enforcing.

## Running it

See `docs/runbooks/local-development.md`. In short: `scripts/dev-setup.sh`, `scripts/db-up.sh`,
`scripts/db-migrate.sh`, `dotnet test`; `npm ci && npm run verify` in `client-web/`; and `scripts/e2e.sh` for the
harness plus the composed-entrypoint smoke (or drive everything from the `.vscode` tasks).
