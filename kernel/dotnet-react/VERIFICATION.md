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

## Round: batch 2's two unrepaired rows, and a registry that missed its own repair (2026-07-27)

TEN-3 and DATA-2 were the two rows batch 2 lowered and did not repair. Both are repaired here, measured at
`4bcbdf4` against baselines of 122 architecture and 19 unit tests. The architecture suite ends at 150 and the
unit suite at 28.

### TEN-3 was reading a registry the kernel had already replaced

E-43 recorded that TEN-3's tenant-column registry had no extent assertion. Looking for where to put one found
something worse. `NameComparison` exists because E-9 found three claims comparing a registry with
`Contains(name.ToLowerInvariant())`, which is equality, so `email` matched and `emailAddress` did not.
`ForbiddenTenantParams` is the canonical tenant registry that replaced the enumerated spellings.
`TenantKeyTests` was never converted. It sat in the same directory as the repair, three rounds later, still
carrying `["tenantid", "orgid", "organizationid", "organisationid"]` and still comparing by equality.

Thirteen tenant-shaped spellings measured against it, six escaped:

```
recognised   TenantId  tenantid  TenantID  OrgId  orgid  OrganizationId  OrganisationId
escaped      tenant_id  TenantIdentifier  TenantKey  WorkspaceId  workspaceslug  AccountId
```

`tenant_id` is the snake_case spelling of the exact property the claim names. The last three are entries the
node-react round 4 audit had already added to the canonical registry, so TEN-3 was behind a correction that had
been made, recorded and merged.

| control | before | after |
|---------|--------|-------|
| the thirteen-spelling floor | **6 escaped** | 13 recognised |
| six ordinary names (`Id`, `Title`, `Origin`, `NoteId`, ...) | not mistaken | not mistaken |
| pre-repair equality registry restored | n/a | red, exactly the 6 |
| E-43's own neutering: marker stripped, registry narrowed | **green, 113** | red, vacuity assertion by name |

The last row is the one worth keeping. E-43's neutering left all 113 tests green because both halves went
vacuous together. It now fails an assertion whose message says an edition genuinely owning no tenant data belongs
at `owed` with that as its trigger, not `proven` over an empty set.

TEN-3's unmarked-data obligation now rests on precisely the registry and comparison TEN-1's `proven` row rests
on. The two stand or fall together. That is the intended consequence: two registries disagreeing quietly is
worse than one being wrong loudly.

### TEN-3's sanctioned exception, and the trap of proving it from an empty register

`KeyShapeExemption` is a second register, separate from the TEN-5 access ledger because the claim rules that a
key-shape exemption is not a cross-tenant access path. It follows `AnonymousCarveOut`, which is the register this
kernel already trusts for the same job on SEC-1: a justification per entry, and a stale entry fails.

The shipped register is empty, and an empty register makes every assertion over it pass. Proving the mechanism
from the shipped state would have been E-44's own shape one level up, so the four rules are a pure function of
their inputs, proven against fixtures, and separately run against the real model.

| control | outcome |
|---------|---------|
| key flipped to lead with `Id`, no exemption | red, the key assertion |
| same, plus an exemption carrying a real justification | green, the exemption works |
| same exemption, justification reduced to `legacy` | red, the register assertion |

The justification floor is 40 characters, and the code says what that is worth rather than pretending otherwise:
it does not make a bad justification good, it prevents the one-word entry that carries nothing a reviewer could
disagree with.

### DATA-2, nine assertions against a store nothing was checking

`EfNoteStoreTests`, in the unit project, against the real `EfNoteStore` over SQLite. Every one of the three
plants E-48 recorded is now red, and a fourth was added.

| control, re-planted | before | after |
|---------------------|--------|-------|
| `.AsNoTracking()` off `GetAsync` | **green, 113 and 19** | red, 1 |
| the store's `Math.Clamp` removed | **green, 113 and 19** | red, 5 |
| `.Take(limit)` removed, the unbounded read | **green, 113 and 19** | red, 5 |
| the keyset cursor filter removed | untestable without Docker | red, 1 |

The fourth row was not in E-48 and is the useful surprise of the round. Paging the whole table one page at a time
and asserting every row is visited exactly once distinguishes keyset from offset without needing a concurrent
writer, and it runs on SQLite. So DATA-2's keyset obligation stops depending on a suite that cannot start, which
was E-49 and behind it E-39. The same-timestamp collision page stays with the integration suite, because Guid
ordering is provider-specific and that tie is the one place it matters.

SQLite rather than SQL Server is a deliberate choice about where a claim's proof should live. A proof that needs
a daemon is a proof that does not run.

### Tally movement

| | before | after |
|---|---|---|
| proven | 14 | 15 |
| patterned | 6 | 7 |
| latent | 2 | 2 |
| owed | 47 | 45 |
| non-owed rows | 22 | 24 |

TEN-3 `owed` to `proven`, on three obligations each planted against separately. DATA-2 `owed` to `patterned`,
which is its ceiling: the claim's locus is per-seam and its weakening note says its static enforcement is the
weakest in the catalog. Its keyset obligation moves from `latent` to `patterned`, which is the first time
anything has moved off `latent` by being made runnable rather than by being lowered.

One finding, E-51. Batch 2's five rows are now closed.

### Gates

Architecture 150, unit 19 to 28, node server 154, both client-webs 65. `compose --check` ok, 38 shared files in
2 editions. Both conformance records ok at 69 rows, both docs-lints ok, both self-tests ok at 14 caught and 11
ignored. Integration still 4 failures, environment-blocked on Docker, and now carrying less weight than it did.
Literal em dash and en dash scans, 0 and 0.

## Round: batch 3, and a row that had already written down the truth it did not record (2026-07-27)

TEN-4, AI-1, AI-2, SEC-4, SEC-6. Measured at `38ea5c9`, baselines 150 architecture and 28 unit. Four of the five
had never been planted; AI-2 and SEC-6 read `patterned`, the other three `proven`.

### The matrix

| # | claim | plant | expected | outcome |
|---|-------|-------|----------|---------|
| 1 | TEN-4 | `GuardTenancy()` removed from the sync `SaveChanges` | red | red, `TenantGuardTests` |
| 2 | TEN-4 | the guard skips when scope is unset | red | red, the fail-closed test by name |
| 3 | TEN-4 | provenance stamps | a mechanism | **none exists, and none can** |
| 4 | AI-1 | actor supplies `tenantId`, `tenant_id`, `orgId`, `userId` | rejected | rejected |
| 5 | AI-1 | actor supplies `workspaceId`, `accountId`, `workspaceSlug`, `tenantIdentifier`, `actorId` | rejected | **all five survived** |
| 6 | AI-2 | `ListNotesTool` writes | red | red, names the tool |
| 7 | AI-2 | a second tool declares read-only and writes | red | **green, 150 and 28** |
| 8 | SEC-4 | `ValidAlgorithms` widened to include RS256 | red | **green, 12 of 12** |
| 9 | SEC-4 | `RequireSignedTokens = false` | red | **green, 12 of 12** |
| 10 | SEC-4 | `SessionVersionMiddleware` removed | red | red, two tests |
| 11 | SEC-6 | a server-side redactor | a mechanism | **none exists** |

### Number 3, which is the one to read twice

TEN-4's mechanism class names seven unit tests. Four are provenance and none exists. `Note` has no actor field,
`GuardTenancy` stamps `TenantId` and nothing else, and `CreatedAtUtc` is stamped by `NoteService` rather than by
the pipeline, which is the opposite of the claim's "assigned by the pipeline unconditionally, values already
present are overwritten".

That is an ordinary gap. What makes it worth a heading is where the honest fact was written. The row already
carried the note "the write-provenance stamps are owed (trigger: next edition build pass)". It carried no
obligation for them. `conformance.mjs` rolls up obligations and not notes, so the row read `proven`, the tally
counted a proven row, and the correct information sat two fields away in prose.

Every other overstating row this project has found was a case of nobody knowing. This one was known, written
down, and recorded in the field nothing reads.

### Numbers 8 and 9, on a security claim

SEC-4 read `proven` on "pins the exact expected signing algorithm and requires signed tokens". Both halves can be
switched off with every test green.

The algorithm test mints HS384 over the same key and asserts 401. That proves HS384 is excluded. Exact pinning is
a property of the whole list and nothing reads the whole list, so widening it to accept RS256 as well is silent.
`RequireSignedTokens` has no test at all; `Tampered_signature_is_unauthorized` is a different question, because a
signature that fails to validate is not the same as a signature that is not required.

Revocation, the other half of the claim, is properly proven: removing the middleware turns two tests red.

### Number 5, E-51's second instance, this time in production code

`ToolExecutor.ServerOwnedKeys` is twenty-one entries matched by equality, and its comment says it carries "the
tenant synonyms (org*) the URL and EF-model guards also reject". Since E-51 those guards read
`ForbiddenTenantParams`, which includes `workspace` and `account`. The comment now asserts a parity that is
measurably false, and `workspaceId` and `accountId` are precisely the "tool schema mirroring a tenant's claim
vocabulary" the claim's harm paragraph names.

The repair is not a one-line swap, and that is worth stating before the next round attempts it.
`NameComparison` lives in the test assembly. Either it moves somewhere the runtime chokepoint can read it, or
AI-1 keeps a registry that provably disagrees with the guards it claims to match. That is a real design decision
about where a shared comparison belongs, not a tidy-up.

### Number 11

SEC-6's dotnet row cites `redact.ts` and `redact.test.ts`. They are `client-web/tools/harness/redact.ts`: the
harness output surface, on the client, in TypeScript. The claim names three surfaces and that is one of them. The
dotnet server has no log-safety mechanism at all, `ILogger` and `Serilog` returning zero occurrences across
`server/src`, while `app.UseExceptionHandler()` is wired and nothing asserts what the framework logs.

A server-side claim satisfied by a client-side file is hard to catch by reading, because the filenames are
plausible and the claim's own word, harness, appears on both sides.

### Number 7, recorded without lowering anything

A second tool declaring `IsReadOnly` while writing passes everything, because nothing enumerates tools. AI-2 is
per-seam and its row already said so, so this changes no status. It is recorded because the obligation is
mechanizable and is not mechanized, and `EndpointSpineTests` already makes exactly that move for SEC-1's
endpoints in this same edition.

### Tally movement

| | before | after |
|---|---|---|
| proven | 15 | 12 |
| patterned | 7 | 7 |
| latent | 2 | 2 |
| owed | 45 | 48 |
| non-owed rows | 24 | 21 |

TEN-4 and SEC-4 `proven` to `owed`, AI-1 `proven` to `patterned`, SEC-6 `patterned` to `owed`, AI-2 unchanged.
Six findings, E-52 through E-57.

### One process failure, recorded because it nearly landed

Restoring `Program.cs` from a scratch backup taken during batch 2 silently reverted E-45's repair, and the
symptom appeared three plants later as three unexplained failures attributed at first to the plant in hand. The
backup was stale, not wrong: it predated a commit. Caught by reading the diff against HEAD rather than by any
test, corrected by re-applying the edit rather than by a git restore, and the batch-2 backups were then deleted.
The git-safety hook does not cover this, because a stale `cp` is not a git command.

### Gates

Architecture 150, unit 28, node server 154, both client-webs 65. `compose --check` ok, 38 shared files in 2
editions. Both conformance records ok at 69 rows, both docs-lints ok, both self-tests ok at 14 caught and 11
ignored. Integration 4 failures, environment-blocked on Docker. Literal em dash and en dash scans, 0 and 0.

## 2026-07-27, batch 3 repairs

Taken at a2eb4cf plus the repairs below. Every control was run with the new assertion already in place and the
pre-repair mechanism restored, per the protocol; every restore was verified byte-identical by hash before the
green run.

### SEC-4, both halves of the token-validation sentence

`ValidAlgorithms` and `RequireSignedTokens` are now read off the composed host, over every scheme whose handler
is `JwtBearerHandler` rather than the default scheme by name, plus an unsigned alg:none token driven through the
pipeline.

| control | result |
|---------|--------|
| `ValidAlgorithms` widened with `RsaSha256` | red, 1 failure, the pin assertion |
| `RequireSignedTokens = false` | red, 2 failures, the flag assertion and the unsigned token |
| a second bearer scheme registered with looser validation | red, 2 failures, both naming `Loose` |
| the scan narrowed to match no scheme | red, 2 failures, on the non-empty assertion |

The second control corrected a prediction: with the flag off and the algorithm still pinned, an unsigned token
authenticates, because it never reaches signature validation. Recorded on E-55.

Row: `owed` to `proven`.

### AI-1, the server-owned key registry

`NameComparison` and the tenant registry moved into the application assembly so the runtime chokepoint reads the
same comparison as the build-time guards. Extent asserted against a twenty-name floor written independently of
the registry, with a ten-name cost side.

Control: the pre-repair equality set with the new theory in place turns six cases red. The finding recorded
five, measured against a narrower list; the sixth is `organisation_id`.

Row: stays `patterned`, now for the reason the claim names (a `JsonElement` subtree is not walked) rather than
for a registry defect.

### SEC-6, the server surface

`LogSafetyTests`: a capturing `ILoggerProvider` in the composed host, a create that succeeds through the real
store, a read that throws into the real `UseExceptionHandler`.

| control | result |
|---------|--------|
| request-header logging added to the pipeline | red, the token and JWT assertions |
| `EnableSensitiveDataLogging()` on the DbContext | red, the content assertion |
| the capture not wired | red, the non-empty guard only; the other three pass on an empty log |

Row: `owed` to `patterned`. The hub surface the claim names does not exist in this edition.

### TEN-4, not repaired

The provenance half needs an actor concept, two columns, a migration and a middleware, with consequences for
SEC-2, TIME-1 and CON-3. That is a build pass, not a repair inside a planting round. It stays `owed` with the
trigger it was given, and the row is honest at `owed` because the roll-up now carries the obligation rather than
a note (E-52).

### Two measurement hazards, both caught here

A stale scratch backup reverted a committed repair earlier in this work; a restore by `mv` preserved an mtime
older than the build output, so three consecutive runs reported the planted binary while the tree was clean and
the source on disk was correct. Recorded as E-59 with the two rules that follow. The second was caught by a
vacuity guard, not by any rule.

### Gates

Architecture 157, unit 58. Both conformance records ok at 69 rows. Literal em dash and en dash scans, 0 and 0.

## 2026-07-27, batch 4 planting

CON-2, DATA-5, MOD-1, MOD-2, TEST-1. Measured at 58d13de, tree clean before and after; every plant restored with
`cp` from a copy taken in this round, and the baseline reconfirmed at architecture 157 and unit 58.

| claim | plant | outcome |
|-------|-------|---------|
| CON-2 | rename `NextCursor` on an existing contract | red, correct |
| CON-2 | a fourth hand-mirrored contract with no fixture entry | green, E-60 |
| CON-2 | a fixture key neither side consumes | green both sides, E-60 |
| CON-2 | an optional field added to the client's contract interface | green, E-60 |
| DATA-5 | each of the four mandatory keys blanked in turn | red per key, correct |
| DATA-5 | a fifth `Required()` key, satisfied in both factories | green, E-61 |
| DATA-5 | an undeclared key in committed `appsettings.json` | green, E-61 |
| DATA-5 | three mandatory keys blanked at once | names one, E-61 |
| MOD-1 | a second module reaching into another module's service directly | green, E-62 |
| MOD-2 | a second public type in a file | red, correct |
| MOD-2 | a `MapGet` in a `*Middleware.cs` | red, correct |
| MOD-2 | a seventh artifact kind (`*Repository`) in a layer it does not belong to | green, E-63 |
| TEST-1 | `Microsoft.EntityFrameworkCore.InMemory` added to a test project | red, correct |
| TEST-1 | the pinned SQL Server digest changed in one of its four copies | green everywhere, E-64 |

Five rows fall: CON-2, DATA-5, MOD-2 and TEST-1 from `proven`, MOD-1 from `latent`. Non-owed rows 23 to 18.

The roll-up tool caught one of my own errors while writing these rows: TEST-1 was written as `latent` with an
`owed` obligation under it, and `conformance.mjs` refused the file naming both. That is the check working on the
person maintaining the record rather than on the code, which is the harder direction.

MOD-1 moving from `latent` to `owed` is the status vocabulary doing its job. `latent` says built but never
executed and is an honest, useful state; nothing was built, and the note that read "the cross-module rules have
no second module to constrain" described a mechanism that does not exist.

### Gates

Architecture 157, unit 58, conformance ok at 69 rows, docs-lint ok, dash scans 0 and 0. Integration not run: no
Docker daemon (E-49).

## 2026-07-27, the gate readback (E-24, owner ruling option c)

Measured at 670fb01 plus the tool. The owner's decision was to build the readback and not the writer, which is
what both claims actually ask for: TEST-3 says the acceptance test must verify that instantiation arms the gate,
HUM-1 says the manifest carries the arming step and the acceptance test verifies it. Arming stays a human step.

`kernel/shared/tools/gate-check.mjs`, composed into both editions.

| control | result |
|---------|--------|
| `--self-test`, both editions | ok, 6 caught, 7 ignored |
| kernel context, dotnet | note, names the workflow's 5 jobs, exit 0 |
| kernel context, node | note, names the workflow's 4 jobs, exit 0 |
| seeded shape, no git remote | exit 1, names the decision it is refusing to make silently |
| seeded shape, remote but no token | exit 1, "an unread gate is not an armed gate" |
| seeded shape, workflow with no jobs | exit 1, before the network |

The six violations the predicate catches: nothing armed; a job added to CI and never added to the gate; code-owner
review not required; every check required but no pull request required, so the checks are bypassable by pushing;
a ruleset in `evaluate` mode, which reports every rule and blocks nothing; and a workflow this parser found no
jobs in, which would otherwise pass against any gate at all.

The evaluate-mode case is worth naming separately. It is TEST-3's own defect one level down: a configuration that
reports every rule and enforces none. A ruleset writer, which was the repair originally proposed for E-24, is
exactly the thing most likely to create it silently.

TEST-3 and HUM-1 move from `owed` to `latent`. Built, never run against a real forge, which needs a token this
repository does not have. Non-owed rows 18 to 20.

Two things this did not close. Nothing arms the gate; that stays the human step both claims describe. And the
node edition has no instantiation manifest to cite the command from, which is E-65, found while scoping this.

### Gates

Architecture 157, unit 58, compose 39 shared files in 2 editions, both conformance records ok at 69 rows, both
docs-lints ok, both docs-lint self-tests ok at 14 caught and 11 ignored, both gate-check self-tests ok at 6
caught and 7 ignored, dash scans 0 and 0.

## 2026-07-27, batch 5 planting

TEST-2, UI-3, UI-4, UI-5. Measured at 75ae4bb, tree clean before and after, client baseline 65 of 65 reconfirmed.

| claim | plant | outcome |
|-------|-------|---------|
| TEST-2 | a second client data service with public methods and no scenario | green, E-67 |
| TEST-2 | a repo method declared as a class-field arrow function | green, never enumerated, E-67 |
| UI-3 | a raw `<p>` in a screen | green, E-69 |
| UI-3 | a third component under `src/components` importing tokens | green, and correct: the row overstated the rule, E-69 |
| UI-4 | a ledger atom renamed so it stops rendering | red, exhaustiveness, correct |
| UI-4 | a fabricated element carrying `data-atom` | red, de-fabrication, correct |
| UI-4 | a fabricated `<p>` carrying no `data-atom` | green, E-68 |
| UI-5 | a data-service import in a screen | red with UI-5's own message, correct |
| UI-5 | a screen calling `fetch` with the base URL and token from the environment | green, E-70 |

Four rows fall: TEST-2 and UI-3 from `proven`, UI-4 and UI-5 from `patterned`. Non-owed rows 20 to 16.

E-68 is the one to carry forward, because it is a class and not an instance. UI-4's de-fabrication assertion
draws its SUBJECT from `[data-atom]`, a marker the code under test applies to itself, so it can only police
elements that are already cooperating. It is the guard whose entire purpose is catching what an AI invented, and
invented code is the least likely to volunteer a marker. Both of its directions bind for atoms that opt in, which
is why three rounds of review never noticed.

Two obligations could not be measured in this environment and are recorded as read rather than run: TEST-2's
"an uncovered method fails the run" (with no server, every scenario throws before reaching its repo calls, so the
coverage line is red for that reason) and UI-5's composed-entrypoint smoke (it needs the server up).

### Gates

Architecture 157, unit 58, integration 4 skipped (no engine), client 65, compose 39 shared files in 2 editions,
both conformance records ok at 69 rows, both docs-lints ok, both self-tests ok, both gate-check self-tests ok,
dash scans 0 and 0.

## 2026-07-27, the instantiation manifest defects (E-25, E-26, E-27, E-65)

Surveyed by a read-only agent at e82fc4a and verified independently before anything was applied. Two of its
corrections changed what got done, so they are recorded rather than absorbed: E-26 names five documentation sites
and there are eight across seven files, and E-27's status half had already been repaired, which makes its opening
line stale as written.

### E-26, measured both ways

| state | boot, exactly as the runbook says | architecture suite |
|-------|-----------------------------------|--------------------|
| at ad8ff35 | `Now listening on: http://localhost:5000` | 157 pass |
| plus `Properties/launchSettings.json` | `Now listening on: http://localhost:5080` | 157 pass |

One file rather than eight rewrites, because port 5000 is claimed by the macOS AirPlay Receiver and is the likely
reason 5080 was chosen. The suite result is the check that mattered: `SecretConfigShapeTests` scans committed
JSON under `server/src` and this adds one.

`scripts/e2e.sh` had justified its explicit `ASPNETCORE_URLS` with "because launchSettings.json only applies
under `dotnet run`", naming a file that did not exist. That comment is plausibly why the gap survived a review.

### E-25 and E-27

Part A enumerates `.claude/` and `secret-scan.allow.json` and states that the enumeration is the file set. The
straight-copy reading was wrong in both directions: it dropped two tracked files and it took the gitignored
`.env`, which holds a live development SA password. `skills/seed/SKILL.md` had asserted the hook was in the file
set while the manifest did not list it; the skill was right and the definition it executes was wrong.

Part C gains the secret scan, which it had omitted while step 4 required the `secret-scan` job to be armed.

Step 6 stops demanding an artifact that cannot exist when it runs and hands the import back to x2:lock, whose
done-checks were already the same list.

### E-65

The node edition gains an instantiation manifest, written from the measured delta rather than copied. Step 4 says
"every job the workflow declares" rather than a number, because this edition declares four and the sibling five;
`gate-check.mjs` derives the names, so the readback line ports verbatim. Found while writing it: that README
advertised the server as serving "on PORT (default 5080)", an env read `main.ts` had deliberately removed as
CFG-1's own finding, so the README was still describing the anti-pattern the code was repaired to remove.

### Gates

Architecture 157, unit 58, integration 4 skipped, client 65, both docs-lints ok, both conformance records ok at
69 rows, dash scans 0 and 0.

## 2026-07-27, section C: the prose plants, and what was already executable

The back-fill list was TEN-1, SEC-1, SEC-2, SEC-5, UI-1 and UI-2. Checked before assuming: five of the six already
carry their plants as executable tests, and the counts are the evidence rather than the claim.

| claim | the executable form its plants already have |
|-------|---------------------------------------------|
| TEN-1 | `NameComparisonTests`, 28 fixture cases over the comparison, both directions |
| SEC-2 | the same 28, plus `BodyMemberWalk`'s depth and cycle test and the binder-corpus agreement test |
| SEC-5 | `SecretConfigShapeTests`, 15 fixture cases, plus `secret-scan.mjs --self-test` |
| UI-2 | `ui2LintExtent.test.ts`, 49 cases, including fourteen holes carried as PASSING controls |
| UI-1 | `latent`, because the design export is kernel filler; nothing to back-fill until the first lock |

SEC-1 was the one that was not, and the gap was not where the list said to look. Its plants had landed; what had
not is any assertion about the set they all iterate.

| plant | outcome |
|-------|---------|
| `RouteEndpoints()` narrowed to routes whose pattern contains `health` | SEC-1's three assertions green, TEN-1's two green, caught only by SEC-2's body scan, E-72 |
| the same plant with `The_endpoint_enumeration_is_every_route_the_host_maps` in place | red, naming SEC-1 |

SEC-1's row was flat, one `proven` carrying four separate obligations. It now carries four, all `proven`, and the
fourth exists because the other three could be made vacuous without any of them noticing.

### Gates

Architecture 158, unit 58, integration 4 skipped, client 65, both conformance records ok at 69 rows, both
docs-lints ok, dash scans 0 and 0.

## 2026-07-27, section D part 1: CON-1's two unbuilt clauses

CON-1 read `owed` because two of its four statement clauses had no mechanism at all. Both are built. Baseline for
every number here: **c5a7fb7**, architecture 158, unit 58.

| clause | what carried it before | what carries it now |
|--------|------------------------|---------------------|
| no endpoint invents its own error shape | two hand-picked routes asserted to render problem+json (E-46) | every route in the host's `EndpointDataSource`, read as a declared result union against an allowlist |
| identifiers are opaque strings | nothing (E-47) | every identifier-shaped member in `Kernel.Contracts`, at any depth, read as a declared type |

An allowlist rather than a ban list, because the violation shape is open: any `Xxx<TBody>` result renders TBody raw
at whatever status `Xxx` carries, so a ban list would have to enumerate every error-status result the framework
ships today and every one it adds later, and would read green for the ones it had not heard of. `NotFound` is on
the list and `NotFound<>` is deliberately not.

| plant | outcome |
|-------|---------|
| `GetAsync` returns `NotFound<string>` in place of `NotFound` | red-correct, naming the route, the type and E-46 |
| `NoteRevisionResponse(int RevisionId, string Summary)` added to `Kernel.Contracts` | red-correct, naming the contract, the member and E-47 |

Exactly two failures, one per plant, and **no other test in the suite noticed either**. That is what unguarded
meant, and it is also the reason both plants were run together: they are attributable by message, and neither
masked the other.

Reverted with `cp`, not `mv`, per E-59. `git diff` over `server/src` empty, rebuilt with `--no-incremental`,
191 and 58 restored.

### The extent, and why both scans carry one

The error-shape scan walks three routes. The identifier scan finds exactly one identifier in the whole contracts
assembly. A loop over a subject that thin reads identically whether it is working or empty, which is E-30, so
each carries an assertion that its subject is non-empty and each carries a Theory floor written from CON-1's
statement rather than derived from the code under test: 14 cases for the result predicate, 11 for the identifier
types, 6 more asserting that ordinary field names are NOT treated as identifiers.

### Two holes recorded rather than hidden

**E-73.** The error-shape predicate reads only `IResult`-rooted return types. An MVC controller action returns
`IActionResult`, which is not an `IResult`, so it is enumerated and never questioned. E-68's shape at a different
altitude: total subject, partial predicate, and the guard polices the endpoint style that already opted in. Not
repaired, deliberately, because both available repairs are worse than the hole. Trigger recorded.

**E-74.** The identifier registry is two entries, `id` and `key`, compared through the shared `NameComparison`.
Heuristic in the direction the claim admits, so `patterned`.

Row status is the weakest obligation, so CON-1 is `patterned`: two `proven` clauses, two `patterned`.

### Gates

Architecture 191, unit 58, integration 4 skipped, both conformance records ok at 69 rows, both docs-lints ok.
Non-owed dotnet rows 16 to 17.

## 2026-07-27, section D part 2: CFG-1's second closure route, and four live copies

CFG-1's statement ends "Scripts are part of the code surface: a script never duplicates a committed configuration
value, it reads it." E-13 recorded that nothing enforced it. E-36 measured it: literal issuer and audience values
appended to `e2e.sh` left the suite at 100 passed. The row's own mechanism text described the current state of
`e2e.sh` as though it were a mechanism. Baseline for this round: **6371bcc**, architecture 191, unit 58.

The new scan runs the opposite way round from the literal registry beside it. The registry knows the shapes it
bans and hunts for them, so a project adding a setting owes it an entry. This reads every leaf value out of the
committed appsettings and hunts for THOSE, so it owes nothing to a new setting.

| plant | outcome |
|-------|---------|
| `ISSUER="kernel"` in `e2e.sh`, the E-36 recurrence | red-correct, naming the script, the value, both keys it duplicates and the variable |
| `AUDIENCE=kernel`, the bare form | red-correct, same message, second parser branch |

Reverted with `cp`, `git diff` over `scripts/` empty, 200 and 58 restored.

### The negative control caught the parser before the shipped tree could

`The_script_literal_parser_does_not_report_a_read` failed on its first run, on this line from `e2e.sh`:

    ISSUER="$(node -e "process.stdout.write(cfg.Jwt.Issuer)")"

which is the canonical CORRECT read, the exact line the claim asks a script to write. The quoted-literal pass
walked into the middle of the command substitution and came out with the node program's own text as a script
literal. Harmless against this tree, and a false positive waiting for the first script that greps a value out
with a quoted pattern. A guard that fails the build for obeying the claim gets deleted by whoever hits it, so
the parser now masks every `$(...)`, `${...}` and backtick span before either pass runs.

### Widening the surface found four live copies

`scripts/*.sh` was clean. Adding `.github/workflows/*.yml`:

| line | what it said |
|------|--------------|
| job `env:` | `HARN_JWT_ISSUER: kernel` |
| job `env:` | `HARN_JWT_AUDIENCE: kernel` |
| step `env:` | `Jwt__Issuer: kernel` |
| step `env:` | `Jwt__Audience: kernel` |

The harness mints tokens with the first pair and the server validates them with the second, both copied rather
than read, so changing `Jwt:Issuer` in `appsettings.json` would have left this workflow green while every other
caller broke. That is the claim's stated harm, in the file that decides whether the build is green (E-75).

**The second pair is why the exemption had to be narrowed.** CFG-1 sanctions the ambient environment as a fourth
home provided the read resolves through the declared configuration surface under a name derived from a declared
key. `Jwt__Issuer` is exactly that, so the first version of the exemption passed it. An override set to the value
already committed is not an override, it is a copy, and it drifts exactly as a literal does. The exemption now
requires the value to differ from the committed one. Without that narrowing the guard would have reported two of
the four and read as a pass on the other two.

Repaired: a step reads both values into `$GITHUB_ENV`, and the server no longer receives `Jwt__Issuer` at all,
because in Production it loads `appsettings.json` and the value is already there. The read step was executed
locally against the shipped appsettings and returns the two values the literals used to state. The control is the
measurement above: the same guard against the pre-repair workflow reports all four.

### Two live defects recorded rather than repaired

`mintToken.mjs` carries `?? 'kernel'` for both values, which is a duplicated committed value AND the silent
default CFG-1's own text calls out. It is a COMPOSED SHARED file, byte-identical in both editions, so teaching it
to read a .NET appsettings path would be wrong for node. Trigger recorded.

The surface is two globs, and the claim asks for a rule rather than a maintained list. What blocks the rule was
measured, not guessed: over every shipped file the scan also reports `.vscode/tasks.json`, whose window group is
coincidentally named `kernel`, and a `secret-scan.mjs` fixture quoting `"Issuer": "kernel"` as test data. Widening
needs a carve-out register with a justification field, which is a decision, not a wider glob.

### Gates

Architecture 200, unit 58, integration 4 skipped, conformance ok at 69 rows, docs-lint ok, gate-check self-test
6 caught 7 ignored, secret-scan self-test 11 caught 13 ignored. Non-owed dotnet rows 17 to 18.

## 2026-07-27, section D part 3: DEP-1's three buildable obligations, and two guards that caught their author

DEP-1 carried four `owed` obligations. Three were buildable and are built; the fourth needs a registry lookup this
tool does not make and stays `owed`, which keeps the ROW at `owed` under the weakest-obligation rule even though
three obligations moved to `proven`. Baseline: **1e3f274**, docs-lint self-test 14 caught / 11 ignored.

| obligation | plant | outcome |
|------------|-------|---------|
| one image value across every surface | change the digest in `db-up.sh` and nowhere else | red-correct: names the repository, both values, the four surfaces holding one and the one holding the other |
| a transitive pin carries its own ledger row | move the shared tier's `postcss` override off its ledgered version | red-correct by name and version |
| the window number lives in exactly one place | a second number in `BUILD-BRIEF.md` | red-correct |

All three reverted with `cp`, re-composed, `git diff` empty over the three files.

The image-agreement check is `proven` rather than `patterned` for a specific reason: it holds no registry and
needs no entry per surface. It compares whatever it finds against whatever else it finds, so a sixth surface is
covered the day somebody writes it. The ledger's own row is in the comparison, reconstructed from its two cells,
because the row keeps repo:tag and the digest in separate columns and the reference regex alone would read the
ledger as disagreeing with every pinned copy in the tree by construction.

### Both new guards caught a live defect on their first real run, and the self-test could not have

**node-react's VERSIONS.md asserted two different windows.** Its header declares the current number and a
paragraph below named the superseded one as a live window. True as history, wrong as a rule, in the file whose own
header claims to be the one place the number lives. The check does not ban restating the number, which would
falsify dated records; it makes restating it unable to drift. Repaired by citing rather than restating.

**The E-38 image widening read English as container images.** A Dockerfile `FROM` line is the unambiguous place
to recognise Docker Hub shorthand, and the first version was not gated on the file being a Dockerfile:

    VERIFICATION.md: container image 'reflection' floats; pin an exact tag plus digest
    VERIFICATION.md: container image 'the' floats; pin an exact tag plus digest

Two sentences beginning a line with the word "from". The self-test passed before and after, 22 caught and 17
ignored, because **every case in it was a Dockerfile line**. A control set drawn from the shape you are trying to
catch cannot report what else you caught. This is the false-positive twin of E-30, and the prose case is a control
now (E-76).

### And then the window check failed its own author, twice

This round's conformance note described the defect by quoting it, which made the note a second statement of the
superseded number, and docs-lint refused it. Reworded to name the window without restating it, the same quotation
survived in an obligation text, and it refused that too. Then this section described the first two refusals by
quoting the offending phrase a third time, and it refused that. The check that a number lives in one place is a
check on the record-keeper as much as on the record, and prose about a defect is not exempt from being the defect.

### Gates

Both docs-lints ok, both conformance records ok at 69 rows, both self-tests 22 caught / 18 ignored (from 14 / 11),
compose 78 files / 2 editions, architecture 200, unit 58. Non-owed rows unchanged at 18: DEP-1's publish-date
obligation is genuinely unbuilt, so the row does not move and should not.

## 2026-07-27, section D part 4: TEN-5 and DOC-1, and the obligation that should not be built

Baseline: **877de8b**, docs-lint self-test 22 caught / 18 ignored.

### TEN-5

| obligation | plant | outcome |
|------------|-------|---------|
| a row that names no sole-reader test fails | an inserted Owner column, and a ledger reformatted as a bullet list | both red-correct, both previously carried as KNOWN GAP controls (E-35) |
| the named test exists | a row naming `NightlyBillingSweepIsSoleReader` | red-correct |
| the same row, with that identifier declared somewhere in the tree | **green** | the resolver resolves rather than always refusing |
| one ledger, not several | a second `docs/claims/billing-bypass-ledger.md` | red-correct |

The second row of that table is the one worth keeping. A resolver that always returned false would have produced
an identical red on the plant above it, and the pair is the only thing that separates the two.

The parse is keyed on column NAME now. Both E-35 halves were failures of the same kind and it is worth naming:
a parse that silently finds nothing is the worst failure available to a guard whose subject is empty BY DESIGN.
An empty ledger is v1's correct state, so "no rows" is indistinguishable from "no ledger I could read" unless the
tool refuses the second. It refuses it now, and so is a table with no sole-reader column.

### DOC-1

`citationFindings` resolves every markdown link in every governed document and fails a live document citing an
archived one. Asymmetric on the citer deliberately: an archived document may cite anything, because history refers
to history. Planted by archiving `VERIFICATION.md`, which `README.md` links; red-correct.

That plant also measured the guard's own reach. There is exactly ONE real inter-document markdown link in this
edition, and the README names the runbook in backticks as prose, which is a citation a reader follows and this
predicate cannot see. `patterned`, with the residue in the row.

### The obligation that should not be built

TEN-5's "every sanctioned cross-tenant path appears in the ledger" stays `owed`, and not for lack of effort. Its
trigger asks for a scan enumerating cross-tenant reads, which presumes a bypass has a lexical signature, which
presumes tenancy has a chokepoint something can be seen bypassing. Measured: this edition has no global query
filter. Tenancy is an explicit per-query predicate, so a cross-tenant read is the ABSENCE of a predicate, and
absence has no syntax. A scan for `IgnoreQueryFilters` here would be green forever, and green because the shape it
looks for cannot occur, which is the defect this whole section keeps finding. Recorded as E-77, which flows back
to the catalog: the claim reads as though the scan is always available.

Both rows stay `owed` on their weakest obligation, correctly. TEN-5 on the above; DOC-1 on forward-only status
transitions, which needs a reader for a document's previous committed value and therefore a decision about a
shared tool depending on git in a tree that may not have it.

### Gates

Both docs-lints ok, both conformance records ok at 69 rows, both self-tests 28 caught / 22 ignored, compose 78
files / 2 editions, architecture 200, unit 58.

## 2026-07-27, DB2: one home for the engine choice, checked against running code

Part 2 of the owner's accepted database recommendation landed on 2026-07-27 (the engine tier skips rather than
fails, E-49). This is part 1. Baseline: **97cf790**, architecture 200, unit 58.

The engine was named on five surfaces that agreed only by hand: the DEP-1 ledger row, `scripts/db-up.sh`, the CI
workflow, the Testcontainers fixture and the runbook (E-64). Section D's agreement check already made the IMAGE
unable to drift between them. What had no home at all was the ENGINE CHOICE, which is more than an image: the EF
provider package, the composition root's `UseSqlServer`, the container and volume names, the port.

`edition.json` gains an `engine` block, and it is guarded in both directions rather than trusted.

| guard | what it reads |
|-------|---------------|
| docs-lint | the declared image joins DEP-1's cross-surface agreement set, so the declaration cannot drift from the tree it describes |
| `The_host_registers_the_engine_the_edition_declares` | `Database.ProviderName` off the PRODUCTION composition |
| `The_declared_provider_package_is_referenced_by_the_build` | `Directory.Packages.props` |
| `The_edition_declares_a_complete_engine_choice` | every field the swap set depends on |

The second is the one that matters. A linter can only compare a declaration against other text; it cannot answer
whether the engine the project SAYS it uses is the engine the host actually registers, and those can disagree
with every text-matching gate green. So the test builds the real composition, resolves the context EF would
resolve, and asks it. Deliberately not a scan for `UseSqlServer` in `Program.cs`, which would be a second lexical
idea of what the host does, and deliberately not `KernelApiFactory`, whose entire job is to REPLACE the provider
with SQLite: asking that host which provider is registered answers a question about the test harness. Nothing
connects, because EF resolves a provider at registration and opens a connection at first query.

| plant | outcome |
|-------|---------|
| the declared image drifts by one tag | red-correct, naming the four surfaces holding one value and the declaration holding the other |
| the declaration names `Npgsql.EntityFrameworkCore.PostgreSQL` | red-correct, naming both the declared and the registered provider |

`scripts/db-up.sh` now READS the declaration for image, container, volume and port, so the fifth copy is gone and
the port literal with it. The plant output is the evidence: `db-up.sh` no longer appears among the surfaces
holding a value, because it no longer holds one.

The README's adoption-delta section is rewritten as the actual swap set, six numbered changes each paired with
what checks it, and `db-up.sh` is explicitly absent from it. That section previously said the swap touches "the
image tag@digest in `VERSIONS.md` and the db scripts", which is now wrong in a way worth naming: a manifest that
lists a step the mechanism has removed sends the next reader to edit a file that reads its value.

### Gates

Architecture 200 to 203, unit 58, integration 4 skipped, both docs-lints ok, both conformance records ok at 69
rows, both self-tests 28 caught / 22 ignored, compose 78 files / 2 editions.

## 2026-07-27, J1: the .NET guards enter a continuous loop (E-39 repaired)

E-39 recorded that this repository's own CI ran no dotnet at all, and named it as the reason a neutered guard
survives: E-29 and E-30 were both guards narrowed to reach nothing, both required editing a file, and no
continuous process anywhere would have reported either edit. Every guard this edition ships has been protected
only by whoever remembered to run it.

`kernel.yml` gains a `dotnet-server` job. Every command in it was executed locally in the exact sequence the
workflow runs them, rather than written and hoped for:

    dotnet restore --locked-mode                              ok
    dotnet build -warnaserror --no-restore                    ok
    dotnet test tests/Kernel.Tests.Architecture --no-build    203 passed
    dotnet test tests/Kernel.Tests.Unit --no-build             58 passed

**261 tests were ungated and are now gated.**

### The exclusion was argued, and the argument expired without saying so

This is the part worth keeping. `kernel.yml`'s header did not omit the .NET tiers, it justified omitting them:
"The .NET tiers stay in the edition template: they need an engine container and they gate a seeded project, not
the catalog." That was true when written. Half of it stopped being true afterwards, in this repository, by work
recorded in this file: E-49 made the engine tier SKIP with a named reason when no container runtime responds, and
the architecture and unit tiers never needed an engine at all.

So the argument went on excluding 261 tests on the strength of the 4 it described, and nothing re-examined it.

The recurring defect this repository finds is a document describing a mechanism that is not there. This is one
level up: a **decision resting on a premise that is no longer true**. A document that describes a missing
mechanism can be caught by looking at the mechanism. A decision that was correct when made does not announce the
day its premise expires, and nothing in the method currently re-reads a settled decision when the fact under it
moves. Recorded against E-39 rather than as a new finding, because it is that finding's real cause.

The integration tier stays in the template, and that half of the original argument still holds: it needs a real
engine, `ci.yml` supplies one as a service container, and the catalog does not need an engine to check itself.
The job names its two tiers rather than running `dotnet test` over the solution, which would pick up the third
and either pull an engine image or skip it silently depending on what the runner happens to have.

### Rows corrected

`TEST-1`, `TEST-2` and `DATA-2` each cited E-39 as a live reason. All three now say what is true: two of the three
tiers run continuously against this edition's code here, and the tiers that need an engine or a booted server stay
where the engine and the server are.

### Gates

Architecture 203, unit 58, integration 4 skipped, both conformance records ok at 69 rows, both docs-lints ok.

## 2026-07-27, K2: build output is only build output if something builds there (E-32 repaired)

`docs-lint`'s tree walk skipped any directory named `bin`, `obj`, `dist` or `node_modules`, at any depth,
anywhere. That is E-32. Authored markdown under a `docs/bin/` was never walked, so every DOC-1 check read it as
absent while DOC-1's closure obligation says the enumeration reaches every markdown in the edition tree.

It is the same defect the lockfile exemption two hundred lines further down had already been repaired for, in the
same direction, after failing twice in opposite ways: **a name is not a fact about what a file IS.** A lockfile is
only a lockfile if it locks something; a `bin/` is only build output if something builds there.

`node_modules` and `.git` stay unconditional, because neither is ever authored. `bin`, `obj` and `dist` are
skipped only where a project manifest sits beside them, matched by the five manifest names plus any `*.csproj`,
`*.fsproj` or `*.vbproj`, since a .NET project directory is named by its own project file rather than by a fixed
name.

| case | outcome |
|------|---------|
| authored markdown under `docs/bin/`, which builds nothing | **caught**, naming DOC-1 |
| the identical file under `server/src/Kernel.Api/bin/`, beside a csproj | ignored, correctly |
| the same pair in node-react, using `docs/dist/` | caught, then ignored |

The second row is the one the repair could have broken, and it is why both directions are controls rather than
one. Walking real build output would bury a run in generated files, and a guard that noisy gets switched off.

**The predicate was split so the controls can drive it.** `isBuildOutput(entry, parentBuilds)` is pure and takes
the answer; `buildsHere(parent)` does the filesystem read. That is E-79's lesson applied the same week it was
learned: a predicate that reads the tree it lives in can only be asserted against that tree, and this one has to
hold for editions whose build systems this file has never seen. Five new controls, in both directions.

**Two obligations promoted to `proven` in both editions.** E-32 was the only recorded residue on "every markdown
declares a kind, and the kind matches the single legal root it lives in" and on "no markdown outside the legal
roots". Leaving them `patterned` after closing the only reason they were `patterned` would be the understating
direction of a dishonest row, which this week has spent a lot of time finding elsewhere.

### Gates

docs-lint self-test 28 caught / 27 ignored in both editions (from 28 / 22), both docs-lints ok, both conformance
records ok at 69 rows, compose 78 files / 2 editions.

## 2026-07-27, E-88 repaired: the minters that had to exist before any assertion could mean anything

Measured at `34b3bf6`. Architecture tier 203 before, 208 after. Unit tier 58, unchanged.

E-88 was found while building the node edition's verifier, by asking what this edition's equivalent could prove.
`Program.cs` sets seven token-validation properties. Two carried assertions. The other five were planted permissive
all at once, `ValidateIssuer`, `ValidateAudience`, `ValidateLifetime` and `RequireExpirationTime` false and
`ClockSkew` at a year, and **203 architecture plus 58 unit tests stayed green**. This host would have accepted a
token from any issuer, for any audience, with no expiry claim, or expired by up to a year.

Nothing was wrong with the host. The cause was one line in the test harness: every mint routed through a single
`TestTokens.Build` that always passed the right issuer, the right audience and a thirty minute expiry, so no
violating input existed to send. **A configuration assertion cannot be stronger than the inputs the harness can
produce**, and this is E-42's vacuity argument arriving through the fixture rather than through the scan.

The finding set its own repair order, minters before assertions, and it was followed. `Build` stopped hardcoding
three values; `MintFromIssuer`, `MintForAudience`, `MintExpired` and `MintWithoutExpiry` were added; then four
behavioural tests and one configuration assertion over every registered bearer scheme.

### Each test proves its own input is violating, before it sends it

A minter that quietly produced a VALID token would make every one of these pass for the opposite reason, and a
status code cannot tell you which happened. So `An_expired_token_is_rejected` reads `ValidTo` back off its own
token and asserts it is comfortably outside the thirty second skew, and `A_token_carrying_no_expiry_at_all_is_rejected`
asserts the `exp` claim is ABSENT rather than trusting that `expires: null` omits it.

### Two controls, and the second is what makes the first mean anything

| plant | outcome |
|---|---|
| all five permissive | 5 failed, 203 passed. The identical plant left all 203 green before the repair. |
| `ValidateIssuer` alone | 2 failed, 206 passed: the issuer test and the configuration assertion, and nothing else. |

Five tests failing together is also what one degenerate assertion looks like. The discrimination plant is what
separates those two readings, and it says each behavioural test is bound to its own property rather than to
whichever of the five happens to be off.

### One deliberate omission, named so it is not read as a gap

`ClockSkew` is asserted as a bound and never behaviourally. A token expired inside the skew window is valid on
purpose, so a behavioural test of that boundary asserts the opposite of what the host promises and flakes besides.
What matters is the size: a skew large enough to matter is a lifetime extension nobody wrote down.

### The row

SEC-4 stays `proven` and gains a fourth obligation, `the premise the claim rests on`. It is recorded as its own
obligation rather than folded into the other three because **SEC-4's statement names none of issuer, audience or
expiry**, and this row should not pretend the claim asked for what it did not. The argument for guarding them is
the claim's own revocation sentence: revocation takes effect "rather than at token expiry", which presupposes
tokens expire.

### Gates

Architecture 208, unit 58, integration 4 skipped by design, build clean with `-warnaserror`, conformance ok at 69
rows, docs-lint ok. Both plants restored byte-for-byte, verified by hash, backup deleted in this round (E-59).

## 2026-07-27, the loop check, and a duplicated procedure it found here

Measured at `8457adf`. A repo-level mechanism, recorded here because it changes this edition's TEST-3 row and
because the one finding it surfaced that is not shared belongs to this edition.

`kernel/tools/loop-check.mjs` asks, of every executable an edition ships, whether the edition's own `ci.yml` runs
it and whether the repository's `kernel.yml` runs it. E-95 wrote that obligation down for a person; this is the
same question asked on every push. It found `tools/gate-check.mjs` never run by `kernel.yml` in this edition,
which is E-95's exact structure one job along and the third instance of the shape (E-103). The job is added.

**E-104, which is this edition's alone.** `scripts/e2e.sh` brings the database up, migrates it, mints two
bearers, boots the server, runs the harness, runs the smoke and tears down. The `e2e-wire` job does all seven of
those things and never calls the script: it inlines the sequence in a `run: |` block, with its own readiness
loop, its own mint calls and its own exit arithmetic. Two procedures for one job, and nothing keeps them equal.

A scenario added to the harness reaches both, because both end at `node tools/harness/main.ts`. A change to the
ORDER, to the readiness condition, to what is torn down on failure, or to what the tokens carry lands in one and
not the other, and the developer runs one while CI runs the other. That is E-75's family with a procedure in
place of a value.

The cause is worth naming precisely, because it is not carelessness: the script cannot be called from CI as it
stands, since it reads `Jwt:Key` from `dotnet user-secrets` and starts its engine with `docker compose`, and a
runner has neither. **The duplication is a consequence of the script depending on a developer's machine.** The
sibling edition has no such duplication and the difference is structural rather than virtuous: its
`scripts/e2e.ts` obtains a throwaway database, generates its own signing key and asks the operating system for a
port, so there is nothing for CI to supply and the job is one line.

Recorded, not repaired. The repair is to make this script supply its own dependencies the way the sibling's does,
which touches the dev-setup and engine story and needs a container runtime to verify; none was available.
**Trigger: the next pass in this edition with a container runtime, which owes either one procedure called from
both places or a written argument for why two is correct.** The loop check carries the exception meanwhile, with
the reason naming this finding rather than waving the file past, because a permanently red gate gets disabled
rather than fixed (E-84).

### Gates

Architecture 208, unit 58, integration 4 skipped (no container runtime, by design). loop-check ok, self-test 7
caught 3 ignored; gate-check self-test 6/7; secret-scan ok with 5 justified exceptions; conformance ok at 69
rows; docs-lint ok, self-test 33/32.

## 2026-07-27, the mechanism field, and a scope rule broken within the hour of the check that catches it

Measured at `f151902`. Repo-level, recorded here because it changes this edition's TEST-3 row and because two of the five bad references were in this edition's record.

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
from the import-graph machinery already here and needs a different instrument here, where the equivalent question is whether a named type is reached by a test rather than whether a module is imported.

### Gates

docs-lint ok and 35/36 in both editions, conformance ok at 69 rows in both, loop-check ok, compose ok at 39
shared files, node server 283, e2e green.
