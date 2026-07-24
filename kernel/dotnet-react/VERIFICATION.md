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

## Coverage notes by claim

Scan-coverage detail behind the conformance table's summaries. Nothing here changes a status; these
are the specifics of what each mechanism inspects.

- **SEC-1**: the policy provider caches (`AllowsCachingPolicies` asserted); the fallback assertion
  checks for `DenyAnonymousAuthorizationRequirement`, not merely non-null; the `sv`/tenant gates run
  after routing and exempt allowlisted-anonymous endpoints, so a stale token no longer 401s
  `/health`.
- **SEC-2**: services are excluded from the body-DTO scan via `IServiceProviderIsService`; immutable
  constructor-bound DTOs are covered by scanning constructor parameters, not just writable
  properties; the forbidden-field registry covers internal and nested Request types and is shared
  with the body scan.
- **SEC-5**: the CI secret-scan is widened to `.env`, `*.json`, yaml, props, npmrc.
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
