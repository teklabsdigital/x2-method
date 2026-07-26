# Kernel verification log

The dated build-and-verification history of this edition, and the proof that every guard binds. The
conformance table in `README.md` states what each mechanism is; this file is the evidence trail. The
discipline is red-green: every guard was deliberately violated, the guard confirmed red, and the
violation reverted. A green suite without this proof is exactly the aspirational-enforcement failure
the extraction found.

## Round 1: first build (2026-07-10)

Built and verified on this machine: `dotnet build` clean with warnings as errors; 68 server tests
green (45 architecture, 19 unit, 4 Testcontainers integration on real SQL Server); `npm run verify`
green (tsc, 16 vitest, eslint); the harness green end to end against a running server (and proven to
fail loudly, not vacuously, when a tenant token is bad); and the red-green proof below. All 18 guards
went red on a real violation and the suites returned to green after revert.

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

- `DependencyDirectionTests` uses NetArchTest, which does not detect a contrived `typeof(...)`-only
  reference; it does detect a realistic dependency (a parameter, field, base type, or instantiation),
  which is how an endpoint would actually reach Persistence. The proof above uses the realistic form.
- `HostSecurityTests` tampered-token assertion cannot be made green-under-violation by config alone:
  the framework always verifies a present signature against the key, so
  `ValidateIssuerSigningKey=false` does not accept a tampered token. The violable SEC-4 assertion is
  session-version revocation, used above.

## Round 2: adversarial review (strengthened guards)

After the first green, an adversarial review probed each guard for evasion paths the red-green proof
did not mutate. It found real gaps where several guards checked an under-approximation of their
surface (the change tracker instead of all SQL writes; reflected URL params instead of all URL
binding; name-filtered contracts instead of all body-bound types; one render branch instead of all).
Those were closed and re-proven; the residual gaps that are inherent to a static or runtime scan are
recorded under Known limitations in `README.md` rather than papered over.

Each hardened guard was re-proven the same way: inject the exact evasion the review found, confirm
the strengthened guard now goes red, revert. All seven went red and both suites restored to green.

| Guard (test) | Injected evasion (previously green) | Result |
|--------------|-------------------------------------|--------|
| `BulkWriteBanTests` (TEN-4/AI-2) | `db.Notes.Where(...).ExecuteDelete()` (bypasses the save guard) | red |
| `EndpointSpineTests` (SEC-3) | a collection-typed query param named `name` | red |
| `EndpointSpineTests` body scan (SEC-2) | a body DTO carrying a `TenantId` field | red |
| `HostSecurityTests` (SEC-4) | the algorithm pin removed, an HS384 token presented | red |
| `NamingPlacementTests` (TEST-1) | a lowercase `microsoft.entityframeworkcore.inmemory` reference | red |
| `eslint` (UI-2) | an `oklch(...)` color literal in a screen | red |
| `NotesScreen.fidelity.test.tsx` (UI-4) | a ledgered atom (`empty-state`) that stops rendering | red |

## Round 3: full code review

A subsequent full code review (ten finder angles plus adversarial verification) found a further set
of runtime and guard-binding defects the red-green proof could not reach because it only mutates the
guards, not the behavior they guard: a keyset that crashed on timestamp collisions, a client repo
that turned every error status into a silent `null` (so the isolation probe passed vacuously), an
endpoint that 500'd on malformed input, a tool that dropped its JSON-typed argument, an anonymous
endpoint that 401'd a stale token, and a flaky (~1-in-16) tamper test. All were fixed, the guards
strengthened again, and the new behavior covered by tests and re-proven red-green.

Each fix was proven the same way: reproduce the defect (or inject the evasion the review found),
confirm red, revert to green.

| Guard / behavior | Injected violation or defect input | Result |
|------------------|------------------------------------|--------|
| `BulkWriteBanTests` (TEN-4/AI-2) | raw ADO `db.Database.GetDbConnection()` in a store (bypasses the save guard) | red |
| `EndpointSpineTests` body scan (SEC-2) | an **immutable get-only** DTO carrying `TenantId`, bound as a body (slipped the old `CanWrite` scan) | red |
| `The_fallback_policy_denies_by_default` (SEC-1) | fallback weakened to `RequireAssertion(_ => true)` (stayed non-null) | red |
| `namingPlacement.test.ts` (MOD-2 client) | a misplaced `Domain.tsx` (previously skipped by `endsWith('main.tsx')`) | red |
| `redact` JSON integrity (SEC-6) | the greedy `\S+` form corrupts the surrounding NDJSON (demonstrated old vs new) | red |
| `KeysetPagingTests` collision (DATA-2) | five notes at one instant under the old unique index would crash the second write | red |
| e2e harness isolation probe (TEST-2) | a bad tenant-B token: `get()` now throws instead of returning `null`, so the probe fails loudly | red |

## Round 4: invariants pass (2026-07-11)

The invariants pass applied the kernel acceptance test's record under the owner's rulings: four
claims promoted into the cut line (UI-5, CFG-1, HUM-1, DEC-1), the docs-lint gate extended (scoping,
decision provenance, container-image pins, the dash check), UI-2 extended to dimensions, TEST-2 made
complete and self-auditing with the gated harness profile, the two deliberately-deferred defects
closed (the docs-lint over-scan; the floating SQL Server tag, now tag@digest in one ledgered value
across runbook, CI, and the Testcontainers fixture), and the instantiation section rebuilt as a
verifiable manifest. It also found and closed two latent kernel instances of pilot findings: the
edition's own entrypoint was placeholder-wired (never called the API; the exact INV-07 hole, now
wired and smoke-proven) and the UI-2 raw-number bans were vacuous for numeric literals (esquery
regex-tests only strings; now matched on `raw`).

Verified on this machine (2026-07-11): `dotnet build -warnaserror` clean; 72 server tests green (19
unit, 49 architecture, 4 Testcontainers integration on the pinned image); `npm run verify` green
(tsc, 16 vitest, eslint); the harness 7/7 against a running server including the
service-method-coverage self-audit; the composed-entrypoint smoke green live; docs-lint ok.

Every mechanism the invariants pass landed was proven the same way as it landed, not in a batch at
the end: plant the violation, watch the guard fail, revert, watch it return green. Two rows are live
defects the gate caught on its first run (marked "live"): the red half was the real tree, and the fix
is the green half.

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

## Round 5: versioning pass (2026-07-24)

The versioning pass extended DEP-1 with the kernel pin: `VERSIONS.md` gains the Kernel provenance section
(structural placeholders in the kernel, filled mechanically at instantiation, manifest step 3) and docs-lint
gains the check. The kernel context is detected by BUILD-BRIEF.md and VERIFICATION.md, which the manifest's
file set keeps behind at seeding. Proven red-green on a scratch copy of the edition, with the project context
simulated by removing those two files:

| Guard (mechanism) | State | Result |
|-------------------|-------|--------|
| docs-lint kernel-provenance (DEP-1) | kernel context, placeholders in place | green (placeholders legal in the kernel) |
| docs-lint kernel-provenance (DEP-1) | project context, placeholders unfilled | red, one line per unfilled field (Remote, Commit, Catalog pass date; the prefilled Edition field stays silent) |
| docs-lint kernel-provenance (DEP-1) | project context, section deleted outright | red |
| docs-lint kernel-provenance (DEP-1) | project context, filled with the real remote, commit, and pass date | green |

The check's first real run against a genuinely seeded project is the next instantiation; until then its
conformance-table status is latent, the TEN-5 idiom.

## Round 6: flow-back E-class repair pass (2026-07-26)

The second-edition build produced 36 findings in the method repo's edition register. Thirty are catalog
questions queued for the owner; the class E findings are not, because a class E finding says this tree does not
do what its own conformance row says it does. This round repairs six of them and states why the rest are not
repaired. No claim file was touched and no pending ruling was pre-empted.

**Baseline, established before anything was mutated:** the architecture suite at **49 of 49**. Docker is not
required for it; `KernelApiFactory` strips the SQL Server registration and substitutes a temp-file SQLite
database, so only `Kernel.Tests.Integration` needs the engine. Suite after this round: **67 of 67**.

Every row below was proven by planting the violation, observing red, and reverting. Where the finding claimed
the OLD mechanism was blind, the old mechanism was restored with the violation still planted and observed green,
so the hole is reproduced rather than taken on the register's word.

| Guard (mechanism) | Mutation | Result |
|-------------------|----------|--------|
| `SecretConfigShapeTests` (SEC-5), as shipped | `Jwt:Key: "Sup3rSecretValue123"` planted in `appsettings.json` | **green, 49/49** (the defect: `leafKey.Contains("signingkey")` cannot fire on the leaf `Key`) |
| `SecretConfigShapeTests` (SEC-5), token matching | same plant | red, exactly one test, naming the key path |
| `SecretConfigShapeTests` (SEC-5), token matching | plant reverted | green |
| `tools/secret-scan.mjs` (SEC-5) | same plant | red |
| `tools/secret-scan.mjs` (SEC-5) | `--self-test`: 11 catch controls, 13 ignore controls | green; each of the three inputs that evaded the old grep is a named control |
| `secret-scan.allow.json` (SEC-5) | exception whose `why` is `"because"` | red |
| `secret-scan.allow.json` (SEC-5) | exception matching no file in the tree | red (staleness) |
| `EndpointSpineTests` body walk (SEC-2), flat | `CreateNoteRequest(..., AuthorDto Author)` with `AuthorDto.CreatedBy` | **green** (the hole E-6 recorded, reproduced) |
| `EndpointSpineTests` body walk (SEC-2), recursive | same nested violation | red, naming the field |
| `EndpointSpineTests` body walk (SEC-2), recursive | violation reverted | green |
| `EndpointSpineTests` header scan (TEN-1) | `[FromHeader(Name = "X-Tenant-Id")] string? scope` on `/notes` | red (the alias, not the parameter name, is what is judged) |
| `EndpointSpineTests` header scan (TEN-1) | `[FromHeader] string? tenantId` on `/notes` | red |
| `HostSecurityTests` forged header (TEN-1) | `TenantScopeMiddleware` changed to prefer `X-Tenant-Id` over the claim | red, exactly one test; the header SCAN stayed green, which is the two halves being independent rather than redundant |
| `EndpointSpineTests` allowlist (SEC-1) | anonymous `MapPost("/health", ...)` added | red (the old path-keyed list pre-authorized it) |
| `EndpointSpineTests` allowlist (SEC-1) | carve-out justification replaced with `"because"` | red |
| `EndpointSpineTests` allowlist (SEC-1) | carve-out added for `GET /metrics`, which nothing registers | red (staleness) |
| all of the above | every mutation reverted | green, 67/67 |

**Is a secret committed anywhere in this tree? No.** `appsettings.json` carries `Jwt:Issuer` and `Jwt:Audience`,
both the string `kernel`, and no `Jwt:Key`. `.env` is untracked and `git log --all -- '*.env'` is empty. The
finding was demonstrated by injection. The repaired scan's first run did surface one committed
credential-shaped literal that no previous pass had named: the symmetric signing key in `KernelApiFactory.cs`,
which is a test-harness constant and is allowlisted with that reasoning written down.

**What changed structurally, and why it is worth the churn.** SEC-5's CI half was a regular expression inside a
YAML `run:` block. It was blind three ways at once and nobody noticed for four rounds, which is a property of
where it lived: nothing could execute it except a CI run, and its green result was indistinguishable from the
green result of a pattern that matched nothing. It is now `tools/secret-scan.mjs` in the shared tier, composed
into both editions, with a `--self-test` mode CI runs first, so the scan's extent is asserted in the same
artifact as the scan.

**The dependency half.** The shared client tier's queued advisory work was re-planned against the 30-day window
rather than executed as first written, and it is a gentler step than the original: vitest 3.2.6 rather than 4.x,
vite 6.4.3 with no escape to vite 7, plus eslint 10.4.1, typescript-eslint 8.60.1 and
eslint-plugin-react-hooks 7.1.1. Fourteen advisories (1 critical, 13 high) to one root advisory, zero critical.
Both editions install from the committed lockfile and pass `npm run verify`.

One survivor, recorded rather than resolved: `postcss` GHSA-r28c-9q8g-f849 has no release satisfying both the
window and the advisory (8.5.15 clears the window and is vulnerable; 8.5.18 clears the advisory and is inside
the window). Left to itself npm resolved 8.5.16, which is inside the window AND vulnerable, satisfying neither
rule. It is pinned to 8.5.15 through an overrides entry and named in `VERSIONS.md`. DEP-1 states no resolution
order for this case, which is the finding, not the pin.

**Not repaired in this round, so that a green suite is not read as more coverage than it has.** `ContractShapeTests`
is still flat and still enumerates only `*Request` types; repairing it belongs to a claim that has not had its
delta pass. `BindsFromUrl` still under-includes the URL-bound set, and the fix has opposite signs for SEC-2 and
for SEC-3/TEN-1, so it is a design decision rather than an edit. `.env` still sits inside the repository tree.
The CI toolchain is still unpinned. `TimeTypeTests` still omits `Kernel.Api`. Each is recorded against its
finding id with the reason.

## Coverage notes by claim

Scan-coverage detail behind the conformance table's summaries. Nothing here changes a status; these
are the specifics of what each mechanism inspects.

- **SEC-1**: the policy provider caches (`AllowsCachingPolicies` asserted); the fallback is a deny,
  not `RequireAuthenticatedUser`, and the assertion RESOLVES it from `IAuthorizationPolicyProvider`
  (which is what the middleware consults, not the options object) and EVALUATES it against both an
  anonymous principal and a fully-permissioned authenticated one; the anonymous allowlist is a
  `(Method, Pattern, Why)` record array with staleness and justification checks, so an anonymous GET
  no longer pre-authorizes a POST on the same URL; the `sv`/tenant gates run after routing and exempt
  allowlisted-anonymous endpoints, so a stale token no longer 401s `/health`.
- **SEC-2**: services are excluded from the body-DTO scan via `IServiceProviderIsService`; immutable
  constructor-bound DTOs are covered by scanning constructor parameters, not just writable
  properties; the host body walk RECURSES through property types, constructor parameter types, arrays
  and generic arguments, with cycle protection and no depth cap, and its depth is asserted directly
  because the composed host binds only flat records and could not otherwise reach a nested violation.
  `ContractShapeTests` does NOT recurse and enumerates only types whose name ends in `Request`, so
  the second net reaches one level; the registry is shared by both.
- **SEC-5**: two mechanisms kept deliberately different in KIND, because a pair is only belt-and-braces
  when the blind spots are independent. `SecretConfigShapeTests` parses committed JSON and knows the
  config schema, matching secret-shaped keys by token split rather than containment.
  `tools/secret-scan.mjs` reads every tracked text surface and knows none of it, over json, cs, ts,
  tsx, js, mjs, jsx, yml, yaml, props, config, npmrc, env, sh, ps1, tf, ini and toml; the file set is
  `git ls-files --cached --others --exclude-standard`, which is what a commit from this tree would
  contain, so a correctly ignored local `.env` is not reported and a new unstaged file is. Exceptions
  live in `secret-scan.allow.json` as (file, key) pairs with a mandatory reason.
- **DATA-2**: the page-size bound is shared by service and store through
  `Clamp(1, INoteStore.MaxPageSize)`.
- **CFG-1**: the model-id and provider-endpoint literal registry extends per project at D-000.
- **DOC-1**: the design/ governance is narrow: the provenance README and the per-slice ledgers are
  governed; imported artifacts are exempt; `.gitmodules` paths are skipped. The exclusions are
  declared in `README.md`.
- **UI-2**: the full ban list: hex/rgb/hsl/named colors in strings and template literals, inline
  font props, raw radii and hairlines, font weights as a closed set, and spacing and dimension
  literals (numeric/px/rem on padding/margin/gap/width/height/offsets/insets, numerics matched on
  `raw`); the structural allowlist: ratios, flex, order, zIndex, %, viewport units, ch/fr/auto, 0.
- **UI-5**: type-only imports are legal; service and transport layers, tests, and tools are exempt
  from the import ban.
- **TEST-2**: the NDJSON writer sets `exitCode` so the failing line flushes; identity premises are
  marked in `mintToken.mjs`; the harness is proven to fail loudly, not vacuously, on a bad tenant
  token.
- **AI-1**: the rejected key set includes the common OIDC/Azure claim names and `org*` tenant
  synonyms.
