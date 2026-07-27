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

## Round 7: applying adjudication rulings 2 through 11 (2026-07-26 and 2026-07-27)

No mechanism in this tree changed in this round and no test was added to the suite. What changed is what the
record CLAIMS about the mechanisms, and two tools in the shared tier that hold the record honest. The round is
recorded here because the two tools gained new failure modes and a failure mode without a red-green proof is a
gate nobody has seen work.

**Four rows stop reading `proven`.** SEC-2 and TIME-1 under ruling 2 (a mechanism class now carries a
completeness obligation, and neither guard meets its closure parameter), SEC-3 under ruling 6 (the comparison is
part of the mechanism, and case-insensitive equality resolves no morphology), TEN-1 under rulings 5 and 6. Each
was measured in an earlier round, with a control, and left at `proven` deliberately because lowering it belonged
to the owner. Each now carries per-obligation statuses, so the row states which half it meets: TEN-1, for
instance, reads `owed` overall while its route surface, its header mechanism and its credential-only resolution
each read `proven`. The tally moves from 25 `proven`, 6 `patterned`, 2 `latent`, 36 `owed` to 21, 6, 2, 40.

**Ruling 5's prediction did not hold, and the deviation is the interesting part.** The digest expected TEN-1 to
be falsified by having no header mechanism. It has one: round 6 built it, after that section of the digest was
drafted, and it is covered from both sides (a declared binding is a scan violation, an undeclared arrival is
proven not to move tenancy). TEN-1 is falsified anyway, by the query enumeration and the comparison, so the
outcome matches the prediction and the reason does not.

**The two tools, and their red-green proofs.** Both are shared-tier files composed into this edition, so both
proofs bind here.

| Guard (`tools/conformance.mjs`, ruling 3) | Injected violation | Result |
|-------------------------------------------|--------------------|--------|
| an obligations array of fewer than two entries | one obligation left on a row | red, naming the row |
| obligations that are not a list | the array replaced by a string | red |
| an obligation with no name | name emptied | red, naming the position |
| two obligations with the same name | second name copied from the first | red |
| an obligation status outside the vocabulary | `partial` | red, listing the four words |
| an obligation with no text | text emptied | red |
| an owed obligation naming no trigger | trigger removed from the text | red |
| a row stronger than its weakest obligation | row set to `proven` over an `owed` half | red, naming the weakest obligation |
| a non-owed obligation on a row naming no mechanism | mechanism emptied | red |
| the generated table not regenerated after an obligation edit | obligation text changed only in the JSON | red (the existing drift check, over the new field) |
| non-vacuity | the record restored | green in both editions, byte-reverted |

| Guard (`tools/docs-lint.mjs`, ruling 10) | Injected violation | Result |
|------------------------------------------|--------------------|--------|
| a qualified locus back in prose | `centralized (model-level assertion)` | red, naming the file |
| a locus outside the enum | `hybrid` | red |
| no locus at all | the line removed | red |
| an empty `locus_note` | the key with nothing after it | red |
| a claim file with no front matter | the block removed | red |
| non-vacuity | the file restored | green in both editions, byte-reverted |
| the seeded shape | the edition copied to a tree with no catalog above it | green, with `note: the claims catalog is not present, so claim locus values were NOT checked` |

The empty-`locus_note` probe found something the ruling did not predict: the shared front-matter parser requires
at least one character after the colon, so a key with an empty value parses as ABSENT. For a mandatory key that
is harmless, since absent and empty fail the same check; for an optional one it is a hole the size of the key.
The check reads the raw front-matter block because of it.

**The dependency half, executed rather than recorded.** Ruling 9a rules that a live advisory outranks the
cooling-off window above the 7-day floor, so round 6's survivor is resolved: `postcss` moves from 8.5.15 to
8.5.18 in the shared tier, the lockfile diff touches nothing but that package, and the pin takes the first row of
a new advisory-rule section in `VERSIONS.md`. Measured after the bump: `npm audit` reports **0 vulnerabilities**
in the shared client tier and in this edition's composed client tree, down from 1 high. The client verify chain
passes on the new lockfile.

**Suite after this round: 67 of 67**, unchanged, which is the point: nothing about the code moved.

## Round 8: raising four falsified rows (2026-07-27)

Round 7 changed what the record claims and nothing about the code. This round is the opposite: four mechanisms
changed, three of the four rows the adjudication falsified had their named gaps closed, and **the four gaps were
closed by removing three hand-written lists rather than by extending them.** That is the shape worth reading
first. A hand-written list of layers omitted one silently (E-15); a hand-written list of URL-bindable types
omitted six silently (E-2); a hand-written list of spellings omitted every compound of its own entries (E-9). In
each case the repair replaces the list with a rule, and in each case the list that remains is shorter than the one
it replaced.

**Suite: 67 of 67 before, 100 of 100 after.** The arithmetic is 67 + 1 layer-reachability fact + 1 binder-agreement
fact + 31 comparison cases (five theories and two facts). No test was deleted.

### The proofs

Every row was planted on a REAL ROUTE in the composed host, not on a fixture, and every one was then re-run with
the mechanism restored from `HEAD` and the violation still planted, which reproduces the hole rather than trusting
the record's description of it.

| Guard | Injected violation | Repaired | Mechanism restored from HEAD |
|-------|--------------------|----------|------------------------------|
| `TimeTypeTests` (TIME-1, E-15) | naive `DateTime` on a public type in `Kernel.Api/Platform/` | red | green (49-of-49 result this finding recorded) |
| `TimeTypeTests` (TIME-1, E-15/E-6) | the same type declared in `Program.cs`, so with no namespace | red | green |
| `TimeTypeTests` (TIME-1, remedy) | an unreferenced project added under `src/`, carrying no time type at all | red, on both facts | n/a (the fact did not exist) |
| `EndpointSpineTests` (TEN-1/SEC-3, E-2) | `TenantKeyProbe : IParsable` as a QUERY parameter named `tenantKey` | red | green |
| `EndpointSpineTests` (SEC-2, E-6) | `GlobalRequest(string Title, string CreatedBy)` declared in `Program.cs`, posted to a route | red | green |
| `EndpointSpineTests` (SEC-3, E-9) | a query parameter named `emailAddress` | red | green |
| `EndpointSpineTests` (SEC-2, E-9) | a body member named `NoteStatus` | red | green |
| `EndpointSpineTests` (TEN-1, E-9) | a declared header `X-Tenant-Reference` | red | green |
| all of the above | every mutation reverted | green, 100/100 | green |

**One control was rejected rather than recorded.** The first attempt at the E-2 proof used a ROUTE parameter
`/probe/{tenantId}` typed as the value object. It came up red on both the repaired and the restored mechanism,
because route pattern parameters have always been read by name without consulting a type. It proves nothing about
this repair, and TEN-1's row already said so ("the route surface is enumerated completely"). The query parameter
is the control that separates the two.

### What each mechanism does now

**`TimeTypeTests` derives its layers.** The array of three assemblies is gone. The layer set is every project
under `server/src`, read from the filesystem, and a declared layer whose assembly is not beside the test binary
fails `Every_declared_layer_is_reachable_by_the_scan`, which is the remedy TIME-1 asks for and the half a list
cannot have. The derivation is cross-checked against the composed host's own assembly graph so an empty walk
cannot read green. The scan also stopped treating the global namespace as framework, which is what let a type in
`Program.cs` sit inside a scanned layer and still be skipped.

**Neither endpoint enumeration reimplements the binder.** E-2's remedy was a split of one predicate into two, and
measuring it produced something better, so the split was built and abandoned in the same session: `Uri` has no
static `TryParse` and does not implement `IParsable`, and it binds from the URL anyway, so a predicate written
from reflection had E-2's defect on its first day. `RequestDelegateFactory` publishes its own conclusion as
`IAcceptsMetadata`, so SEC-2's body set is now the framework's answer, and the URL surface is enumerated BY
EXCLUSION: the declared body, registered services and a closed list of pipeline types are set aside, and every
other parameter is compared. A type nobody has thought of is inside the surface by default. A new fact,
`Both_enumerations_agree_with_the_real_binder_over_a_corpus_of_parameter_types`, builds a throwaway host per
corpus type and asserts that whichever surface the framework chose is the surface that scans it, so the two can no
longer drift apart in silence.

**The comparison is a third matcher, not a port of the second.** The round 4 audit measured the sibling's token
matcher and this edition's equality as incomparable, with six inputs escaping both, so `NameComparison` is built
to beat both: tokenize on camel case, separators and digits; re-glue every contiguous run of tokens; match an
entry that begins or ends a glued word; fold plurals and derive an entry's tail past a one-letter particle. The
evidence that this is a comparison and not a longer list is that the registries SHRANK: ten tenant and PII
spellings and three server-controlled ones stopped being entries and are derived, each asserted to still match.
Its false positives (`fileName`, `voicemail`) and its residuals (a synonym, a reordering, a non-`s` plural) are
asserted as PASSING tests, so a later narrowing goes red instead of quietly shrinking the surface.

### Not repaired in this round, so that a green suite is not read as more coverage than it has

- **`ContractShapeTests` is still flat and still `*Request`-only.** It is MOD-2's realization and MOD-2 has not
  had its delta pass. The residual was measured rather than described: a `*Request` contract carrying a forbidden
  field one level down and bound to NO route is invisible to both guards, and is caught by the host scan at depth
  the moment it gains one. The uncovered set is exactly the contract types nothing can post to. SEC-2's
  enumeration obligation and TEN-1's request-contract obligation stay `owed` on it, and the decision to open that
  file is the owner's.
- **SEC-3 does not return to `proven`**, and not because a mechanism fell short. Its claim's remedy sentence asks
  for an undeclared query parameter to be refused or removed before the handler by a ruled decision; measured, a
  handler reading `Request.Query["emailAddress"]` leaves the suite green. The row now carries that as a fourth
  obligation reading `owed` (E-20).
- **TIME-1's monotonic-durations lint** still has no realization here. The row reads `owed` for it while two
  proven, gating obligations sit beside it, which is S-11's defect and is recorded there as its fourth instance
  rather than smoothed with a fifth status word.
- **The four Weakening-notes instances of the portable-layer rule** (B-6) were left alone: they are recorded and
  unruled, and this pass was ruled.

**Statuses after this round:** TIME-1 `owed` (2 of 3 obligations `proven`, was 1 of 3), SEC-2 `owed` (2 of 3, was
1 of 3), SEC-3 `owed` (3 of 4, was 1 of 3, and the fourth obligation is new), TEN-1 `owed` (5 of 6, was 3 of 6).
The row tally is unchanged at 21 `proven`, 6 `patterned`, 2 `latent`, 40 `owed`, which is the honest outcome: six
obligations moved from `owed` to `proven`, one obligation was added reading `owed`, and no row crossed a
threshold.

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

## Round: the contracts guard, and the constraint that was never measured (2026-07-27)

The last flat, equality-matching guard in the tree is repaired, and the reason it survived three rounds after both
its defects were named is the more useful half of this round.

**The constraint was false.** Three passes recorded that repairing `ContractShapeTests` would burn MOD-2's delta
pass. Measured, without reading any mechanism: MOD-2's conformance row names `NamingPlacementTests` and not this
file; this file contains the string "MOD-2" zero times; its own summary names SEC-2. It is SEC-2's guard. The
premise came from one pass, was propagated into a commit message and a handover, and was honoured by three more
without ever being checked. S-12 is re-graded on that measurement from a self-reported quarantine breach to no
breach at all.

**What changed.** `BodyMemberWalk` is extracted so both SEC-2 guards share ONE walk over bindable members and one
leaf test. A second walk here would have been E-2's defect one level down: two enumerations of what a caller can
populate, drifting silently, each guard green against its own idea of the surface. The contracts guard now walks
at any depth and compares through `NameComparison` instead of case-insensitive equality.

**And raising the obligation exposed a gap nobody had named.** TEN-1's tenant registry was read by the URL scan
and by nothing else, so no body member on any route had ever been compared against it. `TenantId` was caught only
because SEC-2's separate registry happens to list it. Recorded as E-22 and repaired on both surfaces.

### Red-green proofs

Every proof reproduces the hole with the pre-repair mechanism restored and the violation still planted, rather
than trusting the record that the hole existed. Source tree byte-reverted after each.

| Guard | Planted violation | Pre-repair | Repaired |
|-------|-------------------|-----------|----------|
| SEC-2 contracts, depth | unrouted `OrphanRequest(Title, AuthorInfo)` with `AuthorInfo.CreatedBy` | **100/100 green** | red |
| SEC-2 contracts, comparison | unrouted `ShallowRequest(Title, CreatedByUser)` at depth zero | **100/100 green** | red |
| TEN-1 contracts (E-22) | unrouted `WorkspaceRequest(Title, WorkspaceId, OrganisationId)` | green | red, 1 of 100 |
| TEN-1 routed body (E-22) | `WorkspaceId` added to the routed `CreateNoteRequest` | green | red, 3 of 100 |
| non-vacuity | plant removed | n/a | 100/100 green |

The first two lines are the control that matters: with the plant in place and the old guard restored, the entire
suite passed. Both defects were invisible to all 100 tests at once.

### Status

`SEC-2` and `TEN-1` return to `proven`, each at 3 of 3 and 6 of 6 obligations. The tally moves from 21/6/2/40 to
23/6/2/38. `SEC-3` and `TIME-1` remain `owed`, on E-20's remedy obligation and on the monotonic-durations lint
respectively; neither is touched by this round.

The residual for SEC-2's enumeration, stated rather than left implicit: a contract type in the Contracts assembly
that is neither routed nor named `*Request` is enumerated by neither guard. Nothing can post to it, so it enters
the surface only by gaining a route, at which point the host scan sees it.


## Round: the acceptance test runs for the first time (2026-07-27)

Instantiation had never been executed. It was executed, into a scratch tree outside this repo, product name
Ledgerly, this repo read-only throughout and verified unmodified afterwards. Three rows come down. The reason
they were up is the same reason in all three cases, and it is the useful half of this round.

**A check that a placeholder is shaped like the real thing is not a check.** HUM-1's locally testable half asked
whether an owner-shaped token covered each irreversible surface. The owner this edition ships is `@OWNER`, which
is owner-shaped. Measured: a seeded project with all four placeholders unreplaced passes docs-lint at exit 0 with
migrations, wire contracts and contract docs owned by nobody (E-23). UI-1 has the same shape one family over: its
token test reads `design/prototype/_ds/colors_and_type.css`, which is the kernel's own filler, carrying 58
variables deliberately over the floor of 50, and it goes green in a seeded project whose product design does not
exist (E-27).

**And the step everything else is conditional on ships nothing.** 37 realized rows carry "armed at instantiation".
Measured by exhaustive search: no forge API call, no ruleset, no token, no readback anywhere in the repository;
every hit for branch protection is prose. TEST-3's own weakening note predicted exactly this, that the acceptance
test must verify instantiation actually arms the gate rather than that the workflow file exists. The test ran and
there is nothing to verify (E-24). Part C's verification item names no command, needs a second identity, and
leaves no artifact recording that it ever passed.

### Red-green proofs

The E-23 repair is proven in all four states, with the control reproducing the hole rather than trusting the
record that it existed. The repair reuses DEP-1's kernel-context detection, already in the same file, so a
placeholder stays legal in the kernel and is refused downstream.

| State | Guard | Plant | Result |
|-------|-------|-------|--------|
| the hole | pre-repair | seeded tree, `@OWNER` unreplaced | **green, exit 0** |
| repaired | post-repair | seeded tree, `@OWNER` unreplaced | red, 3 failures, one per surface, each naming path and claim |
| repaired | post-repair | seeded tree, real handle | green |
| repaired, kernel | post-repair | this repo, placeholders in place | green, both editions, placeholders still legal |
| control | pre-repair restored | plant still in place | **green again**, the hole reproduced |

Baselines after the repair, unchanged from before it: .NET architecture 100 of 100, node server 154 of 154, node
client-web 16 of 16, `compose --check` 36 shared files across 2 editions, both editions' `docs-lint` and
`conformance --check` ok, literal em-dash and en-dash scans zero.

### Status

`HUM-1` and `TEST-3` go from `proven` to `owed`, each on a two-obligation array whose weakest half is the arming
step. That roll-up is not a judgement call: `conformance.mjs` refused `patterned` on both rows and named the
weakest obligation, which is the ruling working as intended. `UI-1` goes from `proven` to `latent`, the mechanism
being real and its subject being filler, which is what `latent` means. The tally moves from 23/6/2/38 to
20/6/3/40, and non-`owed` rows from 31 to 29.

HUM-1's declaration half is genuinely `proven` for the first time, having been a false green until this round.
The row still reads `owed` because the roll-up takes the weakest obligation, which is the conservative direction
the ruling names and the correct one here: a named owner nothing requires a review from is a record, not a gate.

E-24 is recorded and NOT repaired. Building an arming mechanism is a ruleset writer plus an armed-state readback
against a forge API needing an owner token, and choosing which forge the kernel presumes is exactly the
portability question the B class exists for. Improvising it inside a verification round would be the same move
this round is documenting: shipping something shaped like a gate.

Not repaired in this round, so that a green suite is not read as more coverage than it has: E-25 (the file set
omits `.claude/settings.json` and `secret-scan.allow.json`, part A contradicts itself, and part C never runs the
secret scan), E-26 (five places document port 5080 and the host binds 5000, because no `launchSettings.json`
exists), E-27's manifest half (step 6 demands a design export that the method's own skill order puts two skills
away, and offers no fallback). All four are manifest and file-set defects rather than guard defects, and the
manifest is the artifact the next round should take as its subject.

## Round: batch 1 planting, and five guards that could be switched off (2026-07-27)

The first round of workstream 2. Five rows planted against, chosen off the staleness ranking as the ones most
likely to be overstating: every obligation in them was classified GUARD-ONLY or PROSE-ONLY, meaning a guard runs
over the real tree but nothing anywhere feeds its predicate a violating input. Forty-nine plants, five vacuity
probes, every revert byte-exact and every baseline restored.

The round was designed by agents that read only the claim file, then only the mechanism, and every result below
was executed against the working tree at `394e8aa` and re-run by hand where the execution environment could not
be proven current. That last clause is not decoration: one executor was handed a checkout fourteen commits stale,
reported the mismatch itself, and its numbers were discarded and re-measured rather than believed. Another
reported a stale tree and re-ran its whole set at the right commit before reporting. A `docs-lint` result from
the wrong commit is worthless, because that file differs by 476 insertions between the two.

### Red-green, by claim

| Claim | plants | red, naming the claim | green | red, different check | vacuity probe |
|-------|--------|----------------------|-------|---------------------|----------------|
| UI-2 | 9 | 7 | 2 | 0 | **green**, `npm run verify` clean with the patterns neutered |
| DOC-1 | 11 | 5 | 6 | 0 | **green**, and a known-bad input under it still ok |
| TEN-5 | 6 | 2 | 4 | 0 | **green**, two independent ways |
| CFG-1 | 6 | 3 | 3 | 0 | **green**, 100 of 100 with both regexes reaching nothing |
| DEP-1 | 17 | 4 | 12 | 1 | **green**, the image check silently disabled |

The one red-different is DEP-1's lockfile-drift remedy. The build does fail, and npm's `EUSAGE` names npm. It
names neither DEP-1 nor the registry, and it fires in a different CI job from every other check on the row. Under
the three-outcome rule that is a guard that does not bind for this claim.

### The vacuity probes are the finding

Every one of the five guards can be reduced to reaching nothing while every gate stays green. The probe was run
the way the build brief says to change a shared file, not the way it says never to: edit `kernel/shared/`, re-run
`compose.mjs`. Result, with the TEN-5 row scrape unable to match any line:

| gate | result with the guard neutered |
|------|-------------------------------|
| `compose --check` | ok, 36 shared files across 2 editions |
| `docs-lint`, both editions | ok |
| `conformance --check`, both editions | ok, 69 rows |
| a real TEN-5 violation planted underneath | **still ok** |

`compose --check` catches the one-sided edit, which is the mistake the brief already forbids, and cannot observe
whether any of the three copies still does anything. The permitted edit path is the open one. That is E-28, and
E-29, E-30, E-38 and E-39 are the same shape at four other sites.

The repair pattern already exists in this edition and was applied unevenly: `tools/secret-scan.mjs` ships
`--self-test` and CI runs it as its own step, and `SecretConfigShapeTests` asserts its predicate's extent as a
Theory with negative cases. `docs-lint.mjs`, `conformance.mjs`, `OperationalSettingsTests` and the shared eslint
config were all written without either. Nothing about the mechanisms made this hard; it was not done.

### Repaired, with the control

CFG-1's registry gained the extent assertion its sibling already had: thirteen cases, eight positive and five
negative, asserting the reach of the two patterns rather than describing it.

| state | mechanism | plant | result |
|-------|-----------|-------|--------|
| the hole | shipped registry, no extent test | both patterns narrowed to match nothing | green, 100 of 100 |
| repaired | extent test in place | shipped registry | green, 113 of 113 |
| control | extent test in place | both patterns narrowed to match nothing | **red**, the reach assertions fail by name |

That is the whole repair this round makes. E-28's remedy is a `--self-test` mode for `docs-lint` over known-bad
fixtures, which is a shared-tier build and not a verification-round edit, and E-30's is the same shape for the
eslint config.

### Status

| Claim | was | now | why |
|-------|-----|-----|-----|
| UI-2 | `proven` | `patterned` | bare negative numerics escape every dimension selector, and the per-side axes are in no alternation, so the surface is not whole |
| DOC-1 | `proven` | `owed` | the stateless halves were never built, which the row's own note said while the status did not |
| TEN-5 | `latent` | `owed` | the mechanism has now been executed and resolves no test; `latent` was right for an empty ledger and is not right for this |
| CFG-1 | `proven` | `owed` | the script-duplication half the mechanism text asserted has no predicate |
| DEP-1 | `proven` | `owed` | twelve of seventeen obligations green, including named members of its own mechanism class |

Every one of the five now carries a per-obligation array, which is where the honest detail lives: most of DOC-1
and both halves of DEP-1's shipped pair are `patterned`, not worthless, and the roll-up takes the weakest. The
tally moves from 20/6/3/40 to **16/7/2/44**, and non-`owed` rows from 29 to 25.

Four rows falling to `owed` looks like a bad round and is the opposite. None of these mechanisms got worse this
week. They were recorded as covering more than they covered, and the row that overstates is the defect that
matters, because a seeded project inherits the row and not the measurement.

Baselines: .NET architecture **113 of 113** (100 before this round, plus the 13 extent cases), node server 154 of
154, node client-web 16 of 16, dotnet client-web `npm run verify` clean, `compose --check` 36 shared files across
2 editions, both editions' `docs-lint` and `conformance --check` ok, literal em-dash and en-dash scans zero.

Not repaired in this round: E-28 and E-30 (the two missing self-tests), E-31 (the UnaryExpression hole and the
ungated axes), E-32 through E-37 (the unbuilt halves, each now an `owed` obligation with a named trigger), E-38,
and E-39. E-39 is the one to read first: this repository's CI runs no dotnet at all, so the neutered-guard probes
in this round would not have been reported by any continuous process, only by a human choosing to look.

## Round: docs-lint gains the self-test its sibling already had (2026-07-27)

E-28's repair, and nothing else. The batch 1 round measured that every one of five guards could be reduced to
reaching nothing while every gate stayed green, and that the probe worked through the edit path the build brief
tells you to use. This round closes that for `docs-lint.mjs`, which carried the locally testable half of four
claims and had no fixture behind any of it.

The repair is a port, not a design. `tools/secret-scan.mjs` has shipped `--self-test` since E-11, and CI has run
it as its own step ahead of the scan for the same reason. `docs-lint.mjs` is the same shape and did not get the
same treatment, so it got it now.

### What moved

Three predicates are lifted out of the file walk into pure functions of their input: `docLifecycleFindings(rel,
text)`, `bypassLedgerFindings(text)`, `imageFindings(rel, text, hasLedgerRow)`. The three scans became loops over
files and those functions and nothing else. That is the load-bearing part, and it is worth saying why: if the
controls drove a copy of the rule rather than the rule, a narrowing could silence the scan while the controls
stayed green, which is the defect one level up. The rule has one home and both callers use it.

Fourteen CATCH controls, eleven IGNORE controls, both editions: `docs-lint --self-test ok: 14 caught, 11
ignored`. Wired as its own CI step ahead of the lint in this repo's `kernel.yml` and in both editions' template
`ci.yml`.

### The control, which is the point

| state | mechanism | probe | `compose --check` | `docs-lint` | `--self-test` |
|-------|-----------|-------|-------------------|-------------|----------------|
| the hole | pre-repair | ledger row scrape matches no line | ok | **ok** | (did not exist) |
| repaired | post-repair | same probe | ok | **ok** | **red**, 1 missed |
| repaired | post-repair | image host allowlist matches nothing | ok | **ok** | **red**, 4 missed |
| repaired | post-repair | folder-kind map emptied | ok | red | red, 3 false positives |
| repaired | post-repair | no probe, shipped tree | ok | ok | **ok**, 14 caught, 11 ignored |

The first three rows are the finding and its closure in one table. Two narrowings are invisible to the scan and
now visible to the controls. The third was never invisible, and it is in the table so that the mode is not
credited with catching something that was already caught.

### Four gaps are asserted as PASSING controls

E-34's unresolved test name, E-35's positional row parse in both its forms, and E-38's Docker Hub blindness are
each written into the IGNORE set, marked KNOWN GAP, with the finding id in the reason. They are recorded as
passing rather than omitted, because an omitted case is indistinguishable from one nobody thought of. Each is an
`owed` obligation with a named trigger, so closing one breaks this test and has to be argued. That is the device
`SecretConfigShapeTests` uses to record the cost of token matching, pointed at a gap instead of a false positive.

### Status

No row moves. This repair closes a vacuity, and vacuity was never what any of these statuses rested on: DOC-1,
TEN-5 and DEP-1 are `owed` because obligations are unbuilt, and that is still true. What changed is that the
parts which ARE built can no longer be switched off without something saying so. DOC-1, TEN-5 and DEP-1 each
gained a sentence recording it. Tally unchanged at 16/7/2/44, non-`owed` 25.

Still open, and named so a green run is not read as more than it is: E-30, the same defect in the shared eslint
config. It is not a node script and has no fixture surface, so its repair is a vitest suite driving ESLint's API
rather than a flag, and it is a build rather than a port.

Baselines: .NET architecture 113 of 113, node server 154 of 154, node client-web 16 of 16, dotnet client-web 16
of 16, `compose --check` 36 shared files across 2 editions, both editions' `docs-lint`, `docs-lint --self-test`
and `conformance --check` ok, literal em-dash and en-dash scans zero.

## Round: the eslint config gets its extent asserted (2026-07-27)

E-30's repair, the twin of the previous round's. `docs-lint.mjs` got `--self-test` by porting what
`secret-scan.mjs` already had. UI-2's config could not be repaired by porting anything: it is not a node script,
it has no fixture surface, and its guard is ESLint itself, so the repair is a vitest suite that drives ESLint's
own API over known-bad and known-good inputs.

`src/__tests__/ui2LintExtent.test.ts` in the shared tier, composed into both editions. Nineteen caught controls,
one per banned category the config declares, twenty-two ignored controls, an independently written floor of 54
named colours, and an independently written list of 21 gated dimension axes. Forty-nine assertions. Both
editions' client suites move from 16 tests to 65. No new dependency: eslint 10.4.1 was already an exact pin.

### The control, which is the whole point

| probe against the shipped config | `eslint .` | extent test |
|----------------------------------|-----------|--------------|
| three colour names swapped out | **green** | red |
| whole colour alternation matches nothing | **green** | red, 3 failures |
| dimension alternation matches nothing | **green** | red, 3 failures |
| widened, `lineHeight` newly gated | **green** | red |
| severity dropped from `error` to `warn` | **green** | red |
| none, shipped config | green | 49 passed |

Five sabotages. `eslint .` is green for every one of them, which is E-30 restated as a measurement rather than
an argument. The test is red for every one.

The severity row is worth its own sentence. UI-2's claim has an explicit "no warn-and-ship tier" obligation, and
until this round nothing asserted it: one word turns every ban into a report that merges anyway, and the suite,
the lint and the CI job all stay green.

### Three wrong first answers, kept because each was corrected by running the control

**Where the controls live.** They are in a JSON fixture, not in the test source, because the colour selectors
match any string or template literal rather than only style-object properties, so a known-bad fixture held as a
source string makes the guard test fail the rule it asserts. Putting the test under `src/theme/__tests__/`, where
`no-restricted-syntax` is off, also dodges it and was rejected: an extent assertion must not depend on where it
sits relative to the exemptions of the config it is asserting.

**One control against sixty-one members.** The first cut asserted a single named colour, `crimson`, against an
alternation of 61, so deleting sixty of them passed. The second cut read the member list out of the config and
drove every member through the linter, and a probe swapping three names for four passed again, because a list
read out of the thing under test shrinks when the thing under test shrinks. Both are kept now: an independent
floor catches removal, the derived sweep catches a selector broken while the list still looks complete. Neither
alone was sufficient and only the control showed it. The first row of the table above is that probe.

**How the config is read.** Through `calculateConfigForFile`, not by importing `eslint.config.js`. That started
as a way around a type error and is the better mechanism anyway: it is the config as ESLint resolves it for that
exact path, and it carries the severity, without which the warn-and-ship obligation is not assertable.

### Status

No row moves. UI-2 stays `patterned`, because what makes it `patterned` is coverage, not vacuity: bare negative
numerics and the per-side axes still escape. Fourteen such holes are now carried as PASSING controls marked
KNOWN GAP, up from the two that had been planted; the other twelve were predicted by reading the selectors and
are confirmed here as measured facts. Closing any of them turns this test red and has to be argued. Tally
unchanged at 16/7/2/44, non-`owed` 25.

Baselines: .NET architecture 113 of 113, node server 154 of 154, node client-web **65 of 65**, dotnet client-web
**65 of 65**, `compose --check` 38 shared files across 2 editions, both editions' `docs-lint`, `docs-lint
--self-test` and `conformance --check` ok, literal em-dash and en-dash scans zero.

## Round: batch 2 planting, and three rows that were proven on obligations nobody had planted (2026-07-27)

Five claims, TEN-2, TEN-3, DATA-1, DATA-2 and CON-1. Every measurement in this round was taken at
`1e52bfa`, against baselines of 113 `Kernel.Tests.Architecture` tests and 19 `Kernel.Tests.Unit` tests, with the
tree clean before and after each plant and `git status --porcelain` empty at every revert.

Three of the five read `proven` going in. All five leave the round `owed`, on the roll-up rule, and the
per-obligation arrays carry the detail the roll-up flattens: TEN-3 is in good health with one member missing,
DATA-1 is not.

### The matrix

| # | claim | plant | expected | outcome |
|---|-------|-------|----------|---------|
| 1 | DATA-1 | a type in `Kernel.Api.Endpoints` takes `KernelDbContext` | red | red, names DATA-1 |
| 2 | DATA-1 | the same type in `Kernel.Api.Platform` | red | **green, 113** |
| 3 | DATA-1 | a persistence type takes `NoteService` | red | **green, 113** |
| 4 | DATA-1 | guard scoped to an empty namespace, real violation present | red | **green, 113** |
| 5 | TEN-3 | `HasKey` flipped to lead with `Id` | red | red, names TEN-3 |
| 6 | TEN-3 | `Note` stripped of `ITenantOwned` | red | red, names TEN-3 |
| 7 | TEN-3 | column registry narrowed to nothing, entity unmarked | red | **green, 113** |
| 8 | TEN-3 | registry narrowed, marker intact, key flipped | red | red, names TEN-3 |
| 9 | CON-1 | the single enum converter removed | red | red, two tests |
| 10 | CON-1 | `AddProblemDetails()` removed | red | red, names problem+json |
| 11 | CON-1 | an endpoint returns a bespoke `{ok, why}` 400 | red | **green, 113** |
| 12 | CON-1 | the document `7` deserialized for a two-member enum | rejected | **accepted, yields `7`** |
| 13 | DATA-2 | `.AsNoTracking()` removed from `ListAsync` | red, DATA-2 | **red, AI-2's tool test** |
| 14 | DATA-2 | `.AsNoTracking()` removed from `GetAsync` | red | **green, 113 and 19** |
| 15 | DATA-2 | the store's `Math.Clamp` removed | red | **green, 113 and 19** |
| 16 | DATA-2 | `.Take(limit)` removed, an unbounded read | red | **green, 113 and 19** |
| 17 | TEN-2 | `Current` returns `Guid.Empty` instead of throwing | red | red, names TEN-2 |
| 18 | TEN-2 | the ingress middleware removed from the pipeline | red | red, 7 tests |
| 19 | TEN-2 | tenant filter removed from `EfNoteStore.DeleteAsync` | red | **green, 113 and 19** |

Nine plants of nineteen did not bind. One, number 13, is the third outcome rather than the second, and it is the
one worth reading twice.

### Number 13, which is E-22 again

Removing `.AsNoTracking()` from the list path does turn a test red, so the surface looks covered. The test is
`ListNotesToolReadOnlyTests.Read_only_tool_reads_but_never_writes`, which is AI-2's guard, and its message is
"Assert.Empty() Failure: Collection was not empty". DATA-2 is not named. The catch exists only because that tool
happens to read through the list path, and number 14 shows the read path, which no tool touches, is green.

Scoring that as coverage is the error E-22 was recorded for. It is scored as a finding.

### Number 19, where the backstop is louder than the leak

The cross-tenant delete leaves both suites green because no cross-tenant probe exists for any verb but GET. A
probe written for the purpose returns `InternalServerError`, not `NotFound`: TEN-4's `SaveChanges` guard stops
the write, so nothing leaks, but a cross-tenant read answers 404 and a cross-tenant delete answers 500, and a
caller can tell those apart. Uniform not-found exists to deny exactly that inference. The probe passes against
unplanted code, so the 500 is the plant's doing and the probe is sound.

### The environment, which decides what several of these mean

`Kernel.Tests.Integration` builds a SQL Server container through Testcontainers. With no Docker daemon it does
not skip, it fails, four failures reading `Docker is either not running or misconfigured`. DATA-2's row cited
`KeysetPagingTests` as proof of keyset paging; that proof runs on a developer machine with Docker up and, per
E-39, in no CI anywhere. Recorded as E-49, and the obligation is `latent` rather than `patterned` because
`latent` is the word for a mechanism that has not been executed against a real surface.

`KernelApiFactory`, by contrast, does run the real `EfNoteStore`, against a temp-file SQLite database. So plants
14, 15 and 16 are not green because the store sits outside the tested path. It sits inside it, and nothing
asserts how it reads.

### Tally movement

| | before | after |
|---|---|---|
| proven | 16 | 13 |
| patterned | 7 | 5 |
| latent | 2 | 2 |
| owed | 44 | 49 |
| non-owed rows | 25 | 20 |

TEN-3 proven to owed, DATA-1 proven to owed, CON-1 proven to owed, TEN-2 patterned to owed, DATA-2 patterned to
owed. Eleven findings, E-40 through E-50. One of them, E-45, is a code defect and not only a guard gap: the host
constructs `JsonStringEnumConverter` without `allowIntegerValues: false`, so CON-1's closed string set is open to
integers.

### Gates

`compose --check` ok, 38 shared files in 2 editions. Both conformance records ok at 69 rows. Both docs-lints ok.
Architecture 113, unit 19, client-web 65. Integration 4 failures, environment-blocked on Docker, recorded rather
than counted as a pass. Literal em dash and en dash scans, 0 and 0.

Register leak report (S-12), the dotnet edition, reports and never fails, 17 of 69 claims informed by a finding
about another claim: AI-1 (ToolExecutor); AI-2 (ListNotesToolReadOnlyTests); CFG-1 (OperationalSettingsTests);
CON-1 (WireConventionTests); CON-2 (ContractParityTests); DATA-2 (EfNoteStore); HUM-1 (irreversibleSurfaces);
MOD-2 (NamingPlacementTests); SEC-1 (EndpointSpineTests, IAuthorizationPolicyProvider, PermissionPolicyProvider,
RequireAuthenticatedUser); SEC-2 (ContractShapeTests, EndpointSpineTests, NameComparison); SEC-3
(EndpointSpineTests, NameComparison); SEC-4 (HostSecurityTests, SessionVersionMiddleware); SEC-5
(SecretConfigShapeTests, UserSecretsId); TEN-1 (ContractShapeTests, EndpointSpineTests, HostSecurityTests,
IFromHeaderMetadata, NameComparison, TenantScopeMiddleware); TEN-4 (KernelDbContext); TEST-1
(NamingPlacementTests); TIME-1 (TimeTypeTests).

## Round: batch 2's plants land as tests, and three of the five rows come back (2026-07-27)

Batch 2's planting round ended the way batch 1's did, with prose and lowered rows, which is the thing the plan
for this batch said would change: plants land as executable tests as they go. This round is that work, taken at
`4bcbdf4`. Nine assertions added, the architecture suite 113 to 122, and every one of them controlled by
re-planting the violation it exists to catch.

### DATA-1, four holes, one file rewritten

`DependencyDirectionTests` had four assertions covering one of its mechanism class's three members, scoped by a
namespace string, with nothing checking that the string matched anything. It now has seven.

| control | before | after |
|---------|--------|-------|
| host type in `Kernel.Api.Platform` takes `KernelDbContext` | **green** | red, names DATA-1 |
| persistence type takes `NoteService` | **green** | red, names DATA-1 |
| host type takes `EfNoteStore` rather than `INoteStore` | untested | red, two assertions |
| selection pointed at an empty namespace, real violation present | **green** | red, "matched no types" |
| type in `Kernel.Api.Endpoints` takes `KernelDbContext` | red | red |
| none, shipped tree | green | 7 passed |

Two design choices are worth stating because the obvious version of each is wrong.

The composition root is excluded by construction, not by an allowlist. `Program.cs` legitimately names
`KernelDbContext` and `EfNoteStore`, because registering them is its job. Top-level statements put it in the
global namespace, so `ResideInNamespace("Kernel.Api")` does not reach it and no name has to be maintained. An
allowlist entry would be one more hand-written string to go stale, which is the defect class this round is
repairing.

The two new registries are discovered by reflection and asserted non-empty. Writing "ban `NoteService`" by hand
would have fixed E-41 by rebuilding E-29.

One narrowing was caught by re-reading rather than by a control, and it is worth recording because no control
here would have caught it: the first cut routed the assembly-wide assertions through the same namespace-prefix
helper as the host one, which would have rebuilt E-40 inside the repair for E-40. Assembly-wide assertions now
stay assembly-wide and gain only the non-emptiness check.

### CON-1, the one code defect of the batch

`allowIntegerValues: false`, one argument, plus four planted assertions through the host's own options.

| control | before | after |
|---------|--------|-------|
| undeclared string `"notAMember"` | rejected | rejected |
| document `7` | **accepted, yields `7`** | rejected |
| document `0` | **accepted, yields `FirstValue`** | rejected |
| document `-1` | **accepted** | rejected |

The pre-repair control is the row that matters: restoring the old registration with the new tests in place turns
all three integer cases red and leaves the string case green. That is the hole reproduced, and it also explains
why it survived four rounds of review. The spelling a human tries is the one that was already closed.

### TEN-2, uniformity across verbs rather than on one

Two probes added, so read, delete and list each assert the same absent answer. Re-planting the tenant filter
removal in `EfNoteStore.DeleteAsync` turns the delete probe red and nothing else, where before it left all 113
tests green and the path answered 500. The probes read a status code rather than naming which layer refused, so
they hold whether the store filter or TEN-4's `SaveChanges` guard does the work; what they will not accept is the
two answers differing.

### Tally movement, and what is still down

| | before batch 2 | after planting | after this round |
|---|---|---|---|
| proven | 16 | 13 | 14 |
| patterned | 7 | 5 | 6 |
| latent | 2 | 2 | 2 |
| owed | 44 | 49 | 47 |
| non-owed rows | 25 | 20 | 22 |

DATA-1 recovers all the way to `proven`, on three obligations each planted against separately. TEN-2 recovers to
`patterned`, its ceiling by the claim's own weakening note. CON-1's closed-enum obligation is `proven` and its row
stays `owed` on two clauses that are not repaired, E-46 and E-47.

TEN-3 and DATA-2 are unrepaired and stay `owed`. TEN-3 needs an extent assertion over its column registry and a
home for a sanctioned key-shape exception. DATA-2 needs an assertion that observes the change tracker across the
store's read paths, and its keyset half stays `latent` until the integration suite can run somewhere, which is
E-49 and ultimately E-39.

### Gates

Architecture 122, unit 19, node server 154, both client-webs 65. `compose --check` ok, 38 shared files in 2
editions. Both conformance records ok at 69 rows, both docs-lints ok, both self-tests ok at 14 caught and 11
ignored. Integration 4 failures, environment-blocked on Docker, recorded rather than counted as a pass. Literal
em dash and en dash scans, 0 and 0.
