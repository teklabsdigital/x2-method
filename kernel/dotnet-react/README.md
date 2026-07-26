# kernel/dotnet-react

The .NET 9 + React edition of the X2 kernel. It realizes the portable claims in `../claims/` as running,
enforced mechanisms: architecture tests that fail the build when an invariant is broken, a fail-closed tenancy
composite, a deny-by-default HTTP host, a bounded-read data layer, a token-locked client, an out-of-process e2e
harness, and a CI loop that runs all of it on every push. The product placeholder name is `Kernel`.

The claims catalog holds 69 claims and this edition declares a status for every one of them in
[`conformance.json`](conformance.json), the single machine-readable record the table below is generated from:
37 realized (25 `proven`, 6 `patterned`, 2 `latent`) and 32 `owed`, each owed claim carrying the named trigger
that promotes it. The next edition build pass picks up the subset whose trigger is that pass (RES-6, DATA-9,
SEC-11, PERF-1, PERF-4, DATA-6, SRV-1, TEST-4, the DATA-11 and PERF-6 lint halves, and the TIME-1 and TEN-4
extensions); the rest wait on their named triggers (first external dependency, first broker, first deployed
host, first cache, first published contract, first identity slice).

Every guard in this edition carries a red-green proof: the violation it exists to catch was deliberately
planted, the guard confirmed red, the violation reverted. Five verification rounds have run (the first build, an
adversarial review that closed real evasion paths, a full code review that closed runtime and guard-binding
defects the guard mutations could not reach, the invariants pass, and the versioning pass that landed the
kernel-provenance check), and each round's mechanisms were proven as they landed, not in a batch at the end. The
dated history and the proof tables are in [`VERIFICATION.md`](VERIFICATION.md).

## What is here

```
BUILD-BRIEF.md   the handover this edition was built from (kept for provenance)
VERIFICATION.md  the dated verification history and the four red-green proof tables
VERSIONS.md      the DEP-1 ledger: kernel pin, packages + container images, publish dates; the 90-day window header
conformance.json the per-claim status record: one row per catalog claim, the README table generated from it
edition.json     this edition's stack-specific declarations for the shared linter: which files hold its direct
                 dependencies (DEP-1 ledger check) and where its irreversible surfaces live (HUM-1 owner check)
.github/workflows/ci.yml   the TEST-3 loop (template; moves to repo root at instantiation)
.github/CODEOWNERS         the HUM-1 gate on migrations and published contracts (armed at instantiation)
.gitattributes   eol=lf everywhere (INV-03: no CRLF churn across the Windows/Mac/Docker boundary)
.vscode/tasks.json         thin editor tasks; each just calls a script or CLI below (INV-03)
scripts/         db-up (pinned image, named volume, arm64 precheck), db-down, db-migrate, dev-setup, e2e
server/          .NET 9 solution: Contracts, App, Persistence, Api + three test projects
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

**Never hand-edit a composed path.** Edit `kernel/shared/` and run `node kernel/tools/compose.mjs`;
`--check` fails the build on any divergence, so a local edit to a composed copy cannot merge. Composed copies
are committed rather than referenced in place because an edition has to be a self-contained file set that
instantiation copies into a new repo: the committed tree is the instantiated shape, so the loop tests exactly
what seeding produces. The reasoning is in `kernel/tools/compose.mjs`.

**Declared docs-lint exclusions (INV-08).** docs-lint governs authored files and skips imported ones, and the
exclusions are declared here so they are a visible decision, never a silent patch: (1) any path registered in
`.gitmodules` (vendored submodules are third-party by definition); (2) everything under `design/` EXCEPT the two
authored shapes it governs, `design/prototype/README.md` (the lock record, kind `provenance`) and
`design/ledger/*.md` (kind `ledger`, slice-stamped). Lockfiles are exempt from the dash check (generated
third-party metadata); every other authored file in the tree is scanned.

## Running it

See `docs/runbooks/local-development.md`. In short: `scripts/dev-setup.sh`, `scripts/db-up.sh`,
`scripts/db-migrate.sh`, `dotnet test`; `npm ci && npm run verify` in `client-web/`; and `scripts/e2e.sh` for the
harness plus the composed-entrypoint smoke (or drive everything from the `.vscode` tasks).

## Architecture spine

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
steps plus a verification set, verified AS A SET, not one by one from memory. x2:seed runs it; the kernel
acceptance test verifies that instantiation ships and arms the whole set, extending TEST-3's keystone from
"instantiation arms branch protection" to "instantiation ships and arms everything below". A gap found while
seeding is a finding for the invariants pass, logged as a turn.

**A. The file set** (copy into the new repo root): `server/`, `client-web/`, `docs/`, `tools/`, `scripts/`,
`design/`, `.github/` (workflow AND CODEOWNERS), `.vscode/`, `.gitignore`, `.gitattributes`, `VERSIONS.md`,
`conformance.json`, `edition.json`. The edition tree is already composed, so this is a straight copy of the edition directory:
seeding never reaches into `kernel/shared/`. BUILD-BRIEF.md and VERIFICATION.md stay behind (kernel provenance,
not project material), and so does THIS README: the seeded project writes its own.

`conformance.json` travels, because it is the project's own conformance statement from that point on, pinned to
the catalog date in its `catalogPassDate` field and moved only by a deliberate upgrade. Two of docs-lint's
conformance checks are conditional in the seeded shape, and it prints a `note:` line for each rather than
passing silently:

- **Catalog completeness is not checked**, because a seeded project carries the edition and not the catalog.
  The record is still validated (statuses, mechanisms, triggers).
- **The README table is not checked**, because the marker pair lives in this file, which stays behind. The
  seeded project's README belongs to the product, and nothing here forces a conformance table into it. A
  project that wants one adds `<!-- conformance:begin -->
Generated from `conformance.json` by `tools/conformance.mjs`; edit the JSON, not the table.
69 claims at catalog pass 2026-07-24: 25 `proven`, 6 `patterned`, 2 `latent`, 36 `owed`.

| Claim | Edition mechanism | Status |
|-------|-------------------|--------|
| TEN-1 tenant comes from the credential only | `TenantScopeMiddleware` reads `tenant_id` from the JWT only; `EndpointSpineTests` bans tenant route/query params; `ContractShapeTests` bans `TenantId` on requests | proven |
| TEN-2 ambient scope, fail-closed | `AmbientTenantScope` (AsyncLocal, throws on unset); `AmbientTenantScopeTests` | patterned; the non-HTTP job base class is owed (trigger: first background job) |
| TEN-3 tenant-leading composite keys | `NoteConfiguration.HasKey(TenantId, Id)`; `TenantKeyTests` (both directions) | proven |
| TEN-4 save-time guard and write provenance | `KernelDbContext.GuardTenancy` on both SaveChanges variants; `TenantGuardTests`; integration cross-tenant modify; `BulkWriteBanTests` bans the write paths that bypass the save pipeline (EF set-based, raw SQL, raw ADO) | proven; the write-provenance stamps are owed (trigger: next edition build pass); the tenancy guard is what is proven here |
| TEN-5 sanctioned-bypass ledger | `docs/claims/tenant-bypass-ledger.md` (empty) + docs-lint rule that a row without a sole-reader test fails | latent; ledger empty; the first sanctioned bypass is its first run |
| TEN-6 tenant is minted from membership, never asserted | not built | owed; trigger: first identity slice (shared with SEC-4's version store and SEC-10) |
| SEC-1 every endpoint gated | deny-by-default fallback policy + cached `PermissionPolicyProvider`; `EndpointSpineTests` asserts the fallback denies, allowlists `/health`, and requires a permission policy per endpoint; the `sv`/tenant gates run after routing and exempt allowlisted-anonymous endpoints | proven |
| SEC-2 anti mass-assignment | `ContractShapeTests` forbidden-field registry; `EndpointSpineTests` scans every body-bound DTO for server fields, nested and immutable constructor-bound DTOs included; App/Api declare no request/response types | proven |
| SEC-3 no PII in URLs | `EndpointSpineTests` route + query scan ([AsParameters] wrappers, collections, DateTime/TimeOnly) | proven |
| SEC-4 JWT hardening and revocation | pinned HS256, `RequireSignedTokens`, `SessionVersionMiddleware`; `HostSecurityTests` rejects a wrong-algorithm token and a missing-sv token | proven; EF-backed session store owed (trigger: first identity slice) |
| SEC-5 no secrets in config | `UserSecretsId` + `SecretConfigShapeTests` over every committed JSON config under `src/` + the CI secret-scan job | proven; vault-port interface owed (trigger: first runtime credential) |
| SEC-6 log safety | `redact.ts` scrubs Authorization and JWT-shaped strings; `redact.test.ts` | patterned; v1 surfaces tested; hub log-safety owed (trigger: realtime) |
| SEC-7 opaque public identifiers | not built | owed; trigger: the first anonymous resource surface in an edition project (the kernel exemplar has none) |
| SEC-8 abuse posture | not built | owed; trigger: the first publicly exposed edition host (the launch pre-flight names it) |
| SEC-9 deployment-edge hardening | not built | owed; trigger: the first deployed edition host (arrives with the launch pre-flight) |
| SEC-10 authentication strength asserted at mint, verified at the gate | not built | owed; trigger: first identity slice (shared with SEC-4's version store and TEN-6) |
| SEC-11 the runtime credential cannot touch the schema | not built | owed; trigger: the next edition build pass (rides DATA-6: the migrate mode and the role split are one provisioning story; the integration tier's provisioning path is where both roles are created) |
| TIME-1 UTC, offset-aware, and nothing else | `TimeTypeTests` over Contracts, App, Persistence (recurses Nullable, arrays, generics) | proven; DB UTC column defaults not used: the service sets the value |
| DATA-1 stores, records, downward deps | layer references + `DependencyDirectionTests`; one service call per endpoint | proven |
| DATA-2 bounded reads | `EfNoteStore` AsNoTracking + `(CreatedAtUtc, Id)` keyset + the shared page-size clamp; `NoteServiceTests`, integration `KeysetPagingTests` incl. a same-timestamp collision page | patterned; structural + review; single module, no shared store base |
| DATA-3 two-layer at-most-once | claim + proven exemplar | owed; trigger: first idempotent external side effect |
| DATA-4 cross-store reconcile | claim + proven exemplar | owed; trigger: first cross-store sequence |
| DATA-5 fail-fast mandatory config | `Required()` startup reads; `StartupConfigTests` fails per missing key | proven |
| DATA-6 migrate and exit | not built | owed; trigger: the next edition build pass (a small host change; the mechanism is two facts on the composed host) |
| DATA-7 ruled retention and disposal | not built | owed; trigger: the first PII-bearing entity in an edition project, or the first contractual deletion clause, whichever lands first |
| DATA-8 a state change and its event commit together or not at all | not built | owed; trigger: the first event publish in an edition project (arrives with the first broker, alongside RES-5) |
| DATA-9 a stale write is refused, never silently applied | not built | owed; trigger: the next edition build pass (rides TEN-4's interceptor work; the token and the refusal live in the same save pipeline the tenancy guard already owns) |
| DATA-10 everything that grows has a registered sweep | not built | owed; trigger: the first append-only operational table in an edition project (DATA-8's outbox is the likely first, with RES-5's dead-letter quarantine close behind) |
| DATA-11 a migration never breaks the release running beside it | not built | owed; trigger: the first production deployment with rolling replacement; the lint half can land at the next edition build pass, ahead of the compatibility job |
| CFG-1 operational settings are configuration, not code | `OperationalSettingsTests` scans `server/src` and `scripts/` for model-id and provider-endpoint literals; `scripts/e2e.sh` reads Jwt values from committed appsettings, never duplicating them | proven |
| CON-1 one wire dialect | ProblemDetails + StatusCodePages + single camelCase enum converter; `WireConventionTests` (naming, enum round-trip, problem+json) | proven |
| CON-2 contract parity fixture | shared `note-contract.fixture.json` linked into C# tests + read by the TS test; `ContractParityTests`, `noteContract.test.ts` | proven |
| CON-3 read completeness for action-bearing surfaces | not built | owed; trigger: the first edition project with a restorable session (the kernel exemplar has none) |
| CON-4 a breaking change is detected by machine, approved by human | not built | owed; trigger: the first published external contract (a versioned API consumed outside the repo, a partner surface, or the first schema registry; the composed client in the same repo is CON-2's territory, not a published contract) |
| RT-1 realtime discipline | client is REST-only in v1 | owed; trigger: first realtime slice; the promotion set is the hub arch test, MaximumReceiveMessageSize, the createHub client seam, and the socket harness scenario |
| SRV-1 one deployable unit | not built | owed; trigger: the next edition build pass. Applies to web products; an API-only project re-rules it in its deltas file at adoption |
| RES-1 every outbound call is bounded, and retries are earned | not built | owed; trigger: the first external service dependency in an edition project. Database session bounds are RES-6's, carved out so this claim stays about the chokepoint shape |
| RES-2 no unbounded queue, pool, or backlog in the process | not built | owed; trigger: the first background worker or in-process queue in an edition project |
| RES-3 the host dies cleanly, and there is a test that kills it | not built | owed; trigger: the first deployed edition host (rides SEC-9's deployment-edge work; the drain budget is a CFG-1 operational setting ruled against the platform's grace period) |
| RES-4 liveness answers alone; readiness answers for its dependencies | not built | owed; trigger: the first deployed edition host (lands with RES-3 and SEC-9; the health root SEC-1 already allowlists is the surface this claim splits in two) |
| RES-5 poison is quarantined at a counted limit, never retried forever, never dropped | not built | owed; trigger: the first message broker in an edition project (the transactional outbox relay, DATA-8, is the likely first consumer) |
| RES-6 every database session carries four finite bounds, each proven where it lives | not built | owed; trigger: the next edition build pass. Everything here runs on the existing integration tier against the real engine, so proven is reachable immediately; nothing waits on a new dependency |
| PERF-1 a hot operation's IO is counted, budgeted, and gated | not built | owed; trigger: the next edition build pass (the v1 exemplar's list endpoint is the first designated seam; the interceptor rides the same seam TEN-4's stamps use) |
| PERF-2 a designated hot path's allocations are budgeted per operation | not built | owed; trigger: the first designated hot path in an edition project; designation before need fails the YAGNI gate, so the family expects most projects to hold zero designations for a long time, honestly |
| PERF-3 a designated algorithmic seam proves its scaling with a counted ratio | not built | owed; trigger: the first hand-written algorithm over unbounded input in an edition project; library calls and database queries are not designations (the library's complexity is its documentation's promise, and query shape is PERF-1's and DATA-2's) |
| PERF-4 no sync IO and no whole-payload buffering on the serving path | not built | owed; trigger: the next edition build pass (a BannedApiAnalyzers configuration plus one host assertion; the client side already carries the idiom under UI-2's lint discipline) |
| PERF-5 every cache is bounded and every entry expires | not built | owed; trigger: the first cache in an edition project; the claim deliberately does not mandate caching anywhere, it prices caching where chosen |
| PERF-6 wall time is never asserted raw | not built | owed; trigger: the first wall-time benchmark in an edition project; the lint half can land at the next edition build pass, ahead of any benchmark existing, since its job is to keep the first timing assert out |
| MOD-1 module co-location | Notes module co-located; client deep-path import bans | latent; single module; the cross-module rules have no second module to constrain, so the second module is their first real run |
| MOD-2 deterministic naming and placement | `NamingPlacementTests` (server source scan) + `namingPlacement.test.ts` (client) | proven |
| DOC-1 documentation lifecycle | `docs-lint.mjs`: front matter, placement, work slice ids, the narrow design/ governance, the MET-08 dash check (exclusions declared above) | proven; forward-only status transitions not linted, stateless |
| DEC-1 a module's behaviour traces to a decision | docs-lint fails a `docs/decisions/*.md` without a `provenance` field (the upward link); the decision template models the field | owed; the downward link is owed (trigger: first regeneration of a module from its decisions); the artifact-order check rides here too (trigger: next acceptance test); the upward provenance lint is built and proven |
| UI-1 token source lockstep | `tokenCoverage.test.ts` reads the export at its canonical home `design/prototype/_ds/colors_and_type.css` (every CSS var has a token, count > 50) | proven |
| UI-2 literal visual values are lint errors | `eslint.config.js` bans visual literals in styles: colors, font props, radii, hairlines, and spacing/dimension literals (numerics matched on `raw`), with the structural allowlist | proven |
| UI-3 screens compose primitives only | `Text`/`Button` are the only token importers (eslint no-restricted-imports + naming scan) | proven |
| UI-4 fidelity ledger | `NotesScreen.fidelity.test.tsx` exhaustiveness + de-fabrication; ledgers live in `design/ledger/` (INV-01) | patterned; each screen owes its suite; per-atom resolved-style assertions not included; the prototype-to-ledger exporter owed |
| UI-5 thin UI over tested services, composed entrypoint exercised | eslint bans `api/**` and `data/**` imports outside the composition root (`src/main.tsx`); `npm run smoke` boots the ACTUAL `src/main.tsx` in jsdom against the live server, asserting a real GET and a real POST; runs in the CI e2e job and `scripts/e2e.sh` | patterned; the import ban is proven-centralized; each new primary flow owes its smoke line |
| DEP-1 dependency quarantine | CPM exact pins + lockfiles + locked-mode restore (`--locked-mode` / `npm ci`) + `VERSIONS.md` (90-day window header, container-images section, kernel-provenance section) + docs-lint ledger, image, and kernel-provenance checks; the SQL Server image is one tag@digest value across runbook, CI, and the Testcontainers fixture | proven; publish-date CI check owed (dates recorded by hand); kernel-provenance check latent until the next instantiation fills a real pin |
| DEP-2 standing advisory sweep with a remediation clock | not built | owed; trigger: the first armed CI loop (TEST-3 at instantiation); the publish-date check DEP-1 names as its upgrade path rides the same job |
| TEST-1 tier strategy | SQLite unit/arch, Testcontainers integration; EF InMemory banned by `NamingPlacementTests` | proven |
| TEST-2 e2E harness | `tools/harness/main.ts` drives the real client services (NDJSON + redaction, fails loudly not vacuously); the completeness self-audit fails on any undriven repo method; the gated harness profile refuses outside Development/Testing (`HarnessProfileTests`) | proven; the harness-profile gate is latent: there is no product-owned provider port to re-bind yet, so the first one is its first re-binding |
| TEST-3 CI loop | `ci.yml`: server, client, docs-lint, secret-scan, e2e-wire | proven; mechanism built, not yet armed: branch protection is set at instantiation; until then the loop blocks nothing |
| TEST-4 real-runtime boot proof | not built | owed; trigger: the next edition build pass. UI-5's composed smoke already proves entrypoint wiring in-process; the real-boot script assertion and built-form pinning are the promotion set that completes it |
| HUM-1 irreversible surfaces get a human turn, unconditionally | `.github/CODEOWNERS` covers migrations, contracts, and `docs/contracts/` (`@OWNER` renamed at instantiation); docs-lint fails if any of the three loses its owned entry; branch protection requires code-owner review | proven; mechanism built, not yet armed: it arms with TEST-3 at instantiation; the manifest carries the step |
| AI-1 server-injected identity | `ToolExecutor` reject-then-inject + throw-on-unset, rejecting server-owned keys recursively through nested objects and lists; `ToolExecutorTests` incl. a nested-payload case | proven; nested dictionaries/lists stripped; `JsonElement`-typed nesting remains a per-tool review item |
| AI-2 untrusted content, no authority | `ListNotesTool` read-only + `ListNotesToolReadOnlyTests`; `docs/decisions/ai-trust-tiers.md` | patterned; the v1 tool has its guard test, each new tool owes its own; full taint tracking and the SSRF egress guard are owed (trigger: outbound agentic requests) |
| AI-3 prompt architecture | not built | owed; trigger: the first model-backed feature in an edition project |
| OBS-1 external-effect seam observability | not built | owed; trigger: the first external side-effect port in an edition project. This claim opens the observability family the v1 cut deliberately deferred |
| OBS-2 refusals and privileged actions are security events | not built | owed; trigger: the first deployed edition host (alongside SEC-9; the refusal seams it instruments are already built and tested, so the events attach to existing tested paths) |
<!-- conformance:end -->` to any README it
  owns and gets the identical drift gate.

**B. Setup steps, in order:**

1. **Rename the product.** Replace `Kernel` with the product name across project file names, namespaces, the
   `.sln`, the `UserSecretsId` in `Kernel.Api.csproj`, the connection-string key `ConnectionStrings:Kernel`, the
   scripts' container/volume names, `.vscode/tasks.json` labels, and CODEOWNERS paths. Then the CONFIG VALUES the
   pilot missed (INV-06): `Jwt:Issuer` and `Jwt:Audience` in `appsettings.json` are `kernel` and rename with the
   product. The HUM-1 paths are renamed in TWO places, `.github/CODEOWNERS` and `edition.json`'s
   `irreversibleSurfaces`, and docs-lint fails if they disagree, so renaming one and forgetting the other is
   loud rather than a silent loss of coverage.
2. **Git setup.** `git init`; the canonical `.gitignore` and `.gitattributes` (`eol=lf`) are in the file set;
   first commit only when directed (the never-commit constraint is in the project CLAUDE.md that x2:seed writes).
3. **Write the kernel pin (DEP-1).** Fill `VERSIONS.md`'s Kernel provenance section mechanically from the kernel
   checkout the file set was copied from: remote (`git remote get-url origin`), commit (`git rev-parse HEAD`),
   and the catalog pass date (the date of the latest pass paragraph in the claims catalog README); the edition
   field is prefilled. Mechanical means the seed runs the commands; a human is never asked to transcribe a hash.
   If the kernel arrived without git metadata (an archive), record the archive's stated source and the catalog
   pass date, note the missing commit in D-000, and treat the pass date as the load-bearing value.
4. **Arm the gates (TEST-3 + HUM-1, the step that gets skipped).** Move `.github/workflows/ci.yml` to the repo
   root; branch protection requires all five jobs AND code-owner review; replace `@OWNER` in CODEOWNERS with the
   product owner. Until this step the loop runs but blocks nothing.
5. **Dev environment.** `scripts/dev-setup.sh` (SA password to gitignored `.env`; `Jwt:Key` and connection string
   to user-secrets), then `scripts/db-up.sh` (pinned image, named volume, arm64 precheck) and
   `scripts/db-migrate.sh`. Ports 5080/5173/1433; Node 24+ for the harness and smoke. If the product vendors a
   submodule: `git submodule update --init` joins this step (docs-lint auto-skips `.gitmodules` paths). If the
   product needs a provider key (the pilot's Anthropic key): it goes to user-secrets here, and the bootstrap line
   is added to `dev-setup.sh`, never a manual copy no script covers.
6. **Design home (INV-01).** Import the COMPLETE Claude Design export via the design MCP into
   `design/prototype/` (the `.dc.html` plus the full `_ds/`, both themes, more than fifty variables; never values
   scraped from the `.dc.html`); fill in `design/prototype/README.md` (the lock record); re-point
   `tokenCoverage.test.ts` at the real export path under `_ds/` and re-transcribe `src/theme/tokens.ts` until it
   is green. Each slice lock adds its `design/ledger/slice-NNN.md`.

**C. Verify as a set** (the seed is not done until all pass):

- `dotnet build -warnaserror` and `dotnet test` (all tiers; Docker running)
- `npm ci && npm run verify` in `client-web/`
- `scripts/e2e.sh` (harness with completeness self-audit, then the composed-entrypoint smoke)
- `node tools/docs-lint.mjs` (DOC-1 placement, DEC-1 provenance, DEP-1 image pins and the filled kernel-provenance
  pin, HUM-1 CODEOWNERS coverage, MET-08 dashes)
- The dash check standalone, with the literal-byte pattern (BSD grep false-negatives on a BRE class):
  `grep -rn "$(printf '\342\200\224')" <authored paths>` and `grep -rn "$(printf '\342\200\223')" <authored paths>`
- Branch protection verified armed: a test PR touching `Migrations/` must show the required code-owner review.

Every project you add lands one D-000 (the first project decision record) plus deltas from this edition. That is
the methodology metric: human turns per shipped slice.

### A named adoption delta: the database engine

SQL Server is this edition's ruled default, not a claim: no file in the claims catalog names an engine, and the
catalog's re-rule mechanism (record the decision at adoption, swap the enforcement) applies. Swapping to
PostgreSQL or MySQL is a supported delta with a fixed checklist: the EF provider package and Testcontainers
module (new DEP-1 ledger rows), the image tag@digest in `VERSIONS.md` and the db scripts, and re-verifying the
two engine-sensitive seams the tiers already pin: `DateTimeOffset` ordering under the keyset cursor
(`KeysetPagingTests`) and composite-key behavior (`TenantPersistenceTests`). The integration tier going green on
the new engine is the proof the swap holds. SQLite as the production engine is a larger re-rule, not a delta:
TEST-1's tier shape presumes a client-server engine in containers, and the SQLite `DateTimeOffset` converter
exists for the fast tier's semantics, not production's; record that as a D-000 that re-rules TEST-1, or pick a
client-server engine.

### Upgrading a seeded project

A seeded project is a pinned copy, not a live dependency: it keeps exactly the invariants of the kernel named in
its Kernel provenance row, enforced by its own loop, indefinitely; the kernel moving does not weaken it. An
upgrade is a deliberate act with the catalog pass as its unit, never a raw file diff:

1. Read the pass paragraphs in the claims catalog between the pinned catalog date and head, then land on head
   directly (claim files are current state, not diffs; the pass paragraphs are the cumulative changelog).
2. Claims minted since the pin arrive as owed rows with their named triggers; they cost nothing until a trigger
   fires.
3. Claims extended in place arrive as mechanism changes and may demand immediate work (new red tests, sometimes
   a migration). A project may instead adopt an extension as a ledgered deferral: a VERSIONS.md waiver row with
   a named trigger, never a locally edited test. Deferral is an honest state; a silently un-upgraded mechanism
   is not.
4. Re-copy the kernel-owned paths at the new pin: the architecture test project, the platform layer, `tools/`,
   the client lint config, and `scripts/`. Known gap, until registry externalization lands (owed below): several
   scans carry per-project registries inside those files (SEC-2 forbidden fields, SEC-3 PII names, CFG-1 literal
   shapes), so re-copy is a guided merge for the registry-bearing files, re-applying the project's registry
   additions after the copy.
5. Re-apply the project's recorded deltas. Re-rules are decisions: they replay as deliberate edits verified by
   the loop, not as mechanical patches.
6. Run the loop to green. A schema-affecting extension (TEN-4's write-provenance stamps) lands with its
   migration and takes the HUM-1 human turn like any other migration.
7. Update the Kernel provenance row to the new pin in the same change.

Rollback is re-copying at the old pin and reverting the row; a migration that rode the upgrade does not reverse
by re-copy (HUM-1 territory, a human decision).

A project seeded before the pin existed reconstructs it once: date the project's initial commit against the
catalog's pass dates, corroborate by diffing its kernel-owned paths against kernel history, record the
reconstructed pin and its stated uncertainty in a decision, adopt the current docs-lint, and fill the row. From
then on the mechanism holds.

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

## Conformance table

**The record is `conformance.json`, not this table.** Per-claim status is edition property, not catalog property
(the catalog says so), so it lives in one machine-readable file per edition, keyed by claim id. The table below is
generated from it by `tools/conformance.mjs`, and docs-lint fails the build on three things: a catalog claim with
no row, a row naming no claim, and a table that has drifted from the record. Edit the JSON and run
`node tools/conformance.mjs --write`; never edit the table.

Status uses the catalog's four states (defined in `kernel/claims/README.md`): `proven` (one scan covers the whole
surface), `patterned` (mechanism plus the v1 seams tested; each new seam owes its test), `latent` (built, never
yet exercised by a real instance), `owed` (recorded, with the named trigger that promotes it). Every gating status
is conditional on TEST-3's loop being armed at instantiation. The record is honest by construction in two further
ways the linter enforces: a claim that is not `owed` must name the mechanism that proves it, and a claim that is
`owed` must name the trigger that promotes it. Scan-coverage specifics behind these summaries are in
`VERIFICATION.md` under "Coverage notes by claim".

<!-- conformance:begin -->
Generated from `conformance.json` by `tools/conformance.mjs`; edit the JSON, not the table.
69 claims at catalog pass 2026-07-24: 25 `proven`, 6 `patterned`, 2 `latent`, 36 `owed`.

| Claim | Edition mechanism | Status |
|-------|-------------------|--------|
| TEN-1 tenant comes from the credential only | `TenantScopeMiddleware` reads `tenant_id` from the JWT only; `EndpointSpineTests` bans tenant route/query params; `ContractShapeTests` bans `TenantId` on requests | proven |
| TEN-2 ambient scope, fail-closed | `AmbientTenantScope` (AsyncLocal, throws on unset); `AmbientTenantScopeTests` | patterned; the non-HTTP job base class is owed (trigger: first background job) |
| TEN-3 tenant-leading composite keys | `NoteConfiguration.HasKey(TenantId, Id)`; `TenantKeyTests` (both directions) | proven |
| TEN-4 save-time guard and write provenance | `KernelDbContext.GuardTenancy` on both SaveChanges variants; `TenantGuardTests`; integration cross-tenant modify; `BulkWriteBanTests` bans the write paths that bypass the save pipeline (EF set-based, raw SQL, raw ADO) | proven; the tenancy guard is proven; write-provenance stamps owed (trigger: next edition build pass) |
| TEN-5 sanctioned-bypass ledger | `docs/claims/tenant-bypass-ledger.md` (empty) + docs-lint rule that a row without a sole-reader test fails | latent; ledger empty; the first sanctioned bypass is its first run |
| TEN-6 tenant is minted from membership, never asserted | not built | owed; trigger: first identity slice (shared with SEC-4's version store and SEC-10) |
| SEC-1 every endpoint gated | deny-by-default fallback policy + cached `PermissionPolicyProvider`; `EndpointSpineTests` asserts the fallback denies, allowlists `/health`, and requires a permission policy per endpoint; the `sv`/tenant gates run after routing and exempt allowlisted-anonymous endpoints | proven |
| SEC-2 anti mass-assignment | `ContractShapeTests` forbidden-field registry; `EndpointSpineTests` scans every body-bound DTO for server fields, nested and immutable constructor-bound DTOs included; App/Api declare no request/response types | proven |
| SEC-3 no PII in URLs | `EndpointSpineTests` route + query scan ([AsParameters] wrappers, collections, DateTime/TimeOnly) | proven |
| SEC-4 JWT hardening and revocation | pinned HS256, `RequireSignedTokens`, `SessionVersionMiddleware`; `HostSecurityTests` rejects a wrong-algorithm token and a missing-sv token | proven; EF-backed session store owed (trigger: first identity slice) |
| SEC-5 no secrets in config | `UserSecretsId` + `SecretConfigShapeTests` over every committed JSON config under `src/` + the CI secret-scan job | proven; vault-port interface owed (trigger: first runtime credential) |
| SEC-6 log safety | `redact.ts` scrubs Authorization and JWT-shaped strings; `redact.test.ts` | patterned; v1 surfaces tested; hub log-safety owed (trigger: realtime) |
| SEC-7 opaque public identifiers | not built | owed; trigger: the first anonymous resource surface in an edition project (the kernel exemplar has none) |
| SEC-8 abuse posture | not built | owed; trigger: the first publicly exposed edition host (the launch pre-flight names it) |
| SEC-9 deployment-edge hardening | not built | owed; trigger: the first deployed edition host (arrives with the launch pre-flight) |
| SEC-10 authentication strength asserted at mint, verified at the gate | not built | owed; trigger: first identity slice (shared with SEC-4's version store and TEN-6) |
| SEC-11 the runtime credential cannot touch the schema | not built | owed; trigger: the next edition build pass (rides DATA-6: the migrate mode and the role split are one provisioning story; the integration tier's provisioning path is where both roles are created) |
| TIME-1 UTC, offset-aware, and nothing else | `TimeTypeTests` over Contracts, App, Persistence (recurses Nullable, arrays, generics) | proven; DB UTC column defaults not used: the service sets the value |
| DATA-1 stores, records, downward deps | layer references + `DependencyDirectionTests`; one service call per endpoint | proven |
| DATA-2 bounded reads | `EfNoteStore` AsNoTracking + `(CreatedAtUtc, Id)` keyset + the shared page-size clamp; `NoteServiceTests`, integration `KeysetPagingTests` incl. a same-timestamp collision page | patterned; structural + review; single module, no shared store base |
| DATA-3 two-layer at-most-once | claim + proven exemplar | owed; trigger: first idempotent external side effect |
| DATA-4 cross-store reconcile | claim + proven exemplar | owed; trigger: first cross-store sequence |
| DATA-5 fail-fast mandatory config | `Required()` startup reads; `StartupConfigTests` fails per missing key | proven |
| DATA-6 migrate and exit | not built | owed; trigger: the next edition build pass (a small host change; the mechanism is two facts on the composed host) |
| DATA-7 ruled retention and disposal | not built | owed; trigger: the first PII-bearing entity in an edition project, or the first contractual deletion clause, whichever lands first |
| DATA-8 a state change and its event commit together or not at all | not built | owed; trigger: the first event publish in an edition project (arrives with the first broker, alongside RES-5) |
| DATA-9 a stale write is refused, never silently applied | not built | owed; trigger: the next edition build pass (rides TEN-4's interceptor work; the token and the refusal live in the same save pipeline the tenancy guard already owns) |
| DATA-10 everything that grows has a registered sweep | not built | owed; trigger: the first append-only operational table in an edition project (DATA-8's outbox is the likely first, with RES-5's dead-letter quarantine close behind) |
| DATA-11 a migration never breaks the release running beside it | not built | owed; trigger: the first production deployment with rolling replacement; the lint half can land at the next edition build pass, ahead of the compatibility job |
| CFG-1 operational settings are configuration, not code | `OperationalSettingsTests` scans `server/src` and `scripts/` for model-id and provider-endpoint literals; `scripts/e2e.sh` reads Jwt values from committed appsettings, never duplicating them | proven |
| CON-1 one wire dialect | ProblemDetails + StatusCodePages + single camelCase enum converter; `WireConventionTests` (naming, enum round-trip, problem+json) | proven |
| CON-2 contract parity fixture | shared `note-contract.fixture.json` linked into C# tests + read by the TS test; `ContractParityTests`, `noteContract.test.ts` | proven |
| CON-3 read completeness for action-bearing surfaces | not built | owed; trigger: the first edition project with a restorable session (the kernel exemplar has none) |
| CON-4 a breaking change is detected by machine, approved by human | not built | owed; trigger: the first published external contract (a versioned API consumed outside the repo, a partner surface, or the first schema registry; the composed client in the same repo is CON-2's territory, not a published contract) |
| RT-1 realtime discipline | client is REST-only in v1 | owed; trigger: first realtime slice; the promotion set is the hub arch test, MaximumReceiveMessageSize, the createHub client seam, and the socket harness scenario |
| SRV-1 one deployable unit | not built | owed; trigger: the next edition build pass. Applies to web products; an API-only project re-rules it in its deltas file at adoption |
| RES-1 every outbound call is bounded, and retries are earned | not built | owed; trigger: the first external service dependency in an edition project. Database session bounds are RES-6's, carved out so this claim stays about the chokepoint shape |
| RES-2 no unbounded queue, pool, or backlog in the process | not built | owed; trigger: the first background worker or in-process queue in an edition project |
| RES-3 the host dies cleanly, and there is a test that kills it | not built | owed; trigger: the first deployed edition host (rides SEC-9's deployment-edge work; the drain budget is a CFG-1 operational setting ruled against the platform's grace period) |
| RES-4 liveness answers alone; readiness answers for its dependencies | not built | owed; trigger: the first deployed edition host (lands with RES-3 and SEC-9; the health root SEC-1 already allowlists is the surface this claim splits in two) |
| RES-5 poison is quarantined at a counted limit, never retried forever, never dropped | not built | owed; trigger: the first message broker in an edition project (the transactional outbox relay, DATA-8, is the likely first consumer) |
| RES-6 every database session carries four finite bounds, each proven where it lives | not built | owed; trigger: the next edition build pass. Everything here runs on the existing integration tier against the real engine, so proven is reachable immediately; nothing waits on a new dependency |
| PERF-1 a hot operation's IO is counted, budgeted, and gated | not built | owed; trigger: the next edition build pass (the v1 exemplar's list endpoint is the first designated seam; the interceptor rides the same seam TEN-4's stamps use) |
| PERF-2 a designated hot path's allocations are budgeted per operation | not built | owed; trigger: the first designated hot path in an edition project; designation before need fails the YAGNI gate, so the family expects most projects to hold zero designations for a long time, honestly |
| PERF-3 a designated algorithmic seam proves its scaling with a counted ratio | not built | owed; trigger: the first hand-written algorithm over unbounded input in an edition project; library calls and database queries are not designations (the library's complexity is its documentation's promise, and query shape is PERF-1's and DATA-2's) |
| PERF-4 no sync IO and no whole-payload buffering on the serving path | not built | owed; trigger: the next edition build pass (a BannedApiAnalyzers configuration plus one host assertion; the client side already carries the idiom under UI-2's lint discipline) |
| PERF-5 every cache is bounded and every entry expires | not built | owed; trigger: the first cache in an edition project; the claim deliberately does not mandate caching anywhere, it prices caching where chosen |
| PERF-6 wall time is never asserted raw | not built | owed; trigger: the first wall-time benchmark in an edition project; the lint half can land at the next edition build pass, ahead of any benchmark existing, since its job is to keep the first timing assert out |
| MOD-1 module co-location | Notes module co-located; client deep-path import bans | latent; single module; the cross-module rules have no second module to constrain, so the second module is their first real run |
| MOD-2 deterministic naming and placement | `NamingPlacementTests` (server source scan) + `namingPlacement.test.ts` (client) | proven |
| DOC-1 documentation lifecycle | `docs-lint.mjs`: front matter, placement, work slice ids, the narrow design/ governance, the MET-08 dash check (exclusions declared above) | proven; forward-only status transitions not linted, stateless |
| DEC-1 a module's behaviour traces to a decision | docs-lint fails a `docs/decisions/*.md` without a `provenance` field (the upward link); the decision template models the field | owed; the downward link is owed (trigger: first regeneration of a module from its decisions); the artifact-order check rides here too (trigger: next acceptance test); the upward provenance lint is built and proven |
| UI-1 token source lockstep | `tokenCoverage.test.ts` reads the export at its canonical home `design/prototype/_ds/colors_and_type.css` (every CSS var has a token, count > 50) | proven |
| UI-2 literal visual values are lint errors | `eslint.config.js` bans visual literals in styles: colors, font props, radii, hairlines, and spacing/dimension literals (numerics matched on `raw`), with the structural allowlist | proven |
| UI-3 screens compose primitives only | `Text`/`Button` are the only token importers (eslint no-restricted-imports + naming scan) | proven |
| UI-4 fidelity ledger | `NotesScreen.fidelity.test.tsx` exhaustiveness + de-fabrication; ledgers live in `design/ledger/` (INV-01) | patterned; each screen owes its suite; per-atom resolved-style assertions not included; the prototype-to-ledger exporter owed |
| UI-5 thin UI over tested services, composed entrypoint exercised | eslint bans `api/**` and `data/**` imports outside the composition root (`src/main.tsx`); `npm run smoke` boots the ACTUAL `src/main.tsx` in jsdom against the live server, asserting a real GET and a real POST; runs in the CI e2e job and `scripts/e2e.sh` | patterned; the import ban is proven-centralized; each new primary flow owes its smoke line |
| DEP-1 dependency quarantine | CPM exact pins + lockfiles + locked-mode restore (`--locked-mode` / `npm ci`) + `VERSIONS.md` (90-day window header, container-images section, kernel-provenance section) + docs-lint ledger, image, and kernel-provenance checks; the SQL Server image is one tag@digest value across runbook, CI, and the Testcontainers fixture | proven; publish-date CI check owed (dates recorded by hand); kernel-provenance check latent until the next instantiation fills a real pin |
| DEP-2 standing advisory sweep with a remediation clock | not built | owed; trigger: the first armed CI loop (TEST-3 at instantiation); the publish-date check DEP-1 names as its upgrade path rides the same job |
| TEST-1 tier strategy | SQLite unit/arch, Testcontainers integration; EF InMemory banned by `NamingPlacementTests` | proven |
| TEST-2 e2E harness | `tools/harness/main.ts` drives the real client services (NDJSON + redaction, fails loudly not vacuously); the completeness self-audit fails on any undriven repo method; the gated harness profile refuses outside Development/Testing (`HarnessProfileTests`) | proven; the harness-profile gate is latent: there is no product-owned provider port to re-bind yet, so the first one is its first re-binding |
| TEST-3 CI loop | `ci.yml`: server, client, docs-lint, secret-scan, e2e-wire | proven; mechanism built, not yet armed: branch protection is set at instantiation; until then the loop blocks nothing |
| TEST-4 real-runtime boot proof | not built | owed; trigger: the next edition build pass. UI-5's composed smoke already proves entrypoint wiring in-process; the real-boot script assertion and built-form pinning are the promotion set that completes it |
| HUM-1 irreversible surfaces get a human turn, unconditionally | `.github/CODEOWNERS` covers migrations, contracts, and `docs/contracts/` (`@OWNER` renamed at instantiation); docs-lint fails if any of the three loses its owned entry; branch protection requires code-owner review | proven; mechanism built, not yet armed: it arms with TEST-3 at instantiation; the manifest carries the step |
| AI-1 server-injected identity | `ToolExecutor` reject-then-inject + throw-on-unset, rejecting server-owned keys recursively through nested objects and lists; `ToolExecutorTests` incl. a nested-payload case | proven; nested dictionaries/lists stripped; `JsonElement`-typed nesting remains a per-tool review item |
| AI-2 untrusted content, no authority | `ListNotesTool` read-only + `ListNotesToolReadOnlyTests`; `docs/decisions/ai-trust-tiers.md` | patterned; the v1 tool has its guard test, each new tool owes its own; full taint tracking and the SSRF egress guard are owed (trigger: outbound agentic requests) |
| AI-3 prompt architecture | not built | owed; trigger: the first model-backed feature in an edition project |
| OBS-1 external-effect seam observability | not built | owed; trigger: the first external side-effect port in an edition project. This claim opens the observability family the v1 cut deliberately deferred |
| OBS-2 refusals and privileged actions are security events | not built | owed; trigger: the first deployed edition host (alongside SEC-9; the refusal seams it instruments are already built and tested, so the events attach to existing tested paths) |
<!-- conformance:end -->

Also owed at v1 (out of the cut line, recorded not lost): an identity/auth module (tests and the harness mint their
own JWTs with the dev key), the Expo/React Native client variant (a proven mobile-client pattern, lifted
when the first mobile kernel project appears), and registry externalization: the per-project name registries the
scans read (SEC-2 forbidden fields, SEC-3 PII names, CFG-1 literal shapes) move to project-owned data files so
kernel-owned test code can be re-copied at upgrade without clobbering project extensions (trigger: the first
seeded-project upgrade or the next edition build pass, whichever lands first).

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
