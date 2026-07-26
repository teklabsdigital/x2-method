---
kind: record
status: working
---

# Edition findings register

Opened 2026-07-26, at the start of the node-react edition build.

The catalog asserts that claims are technology neutral and that editions are mechanism. Until a second
edition existed, that boundary had never been tested. This register is where it gets tested: every claim whose
mechanism cannot be realized in a second stack as written, every claim that turns out to encode technology
specifics in its portable layer, and every claim that cannot reach the `locus` it declares.

**Why this file and not an existing one.** `candidates.md` holds new claims queued to graduate;
`negative-space.md` holds decisions that were green-but-wrong, nominated by churn. These findings point at
claims that already exist, and they do not churn: hitting one costs a single turn, you pick a different
substrate, and you move on. Nothing detects them statistically, so capture is active, at the moment of
realization, or it does not happen.

**These are findings, not repairs.** `kernel/claims/` is not edited from here. The catalog is rewritten at a
later adjudication pass, in the invariants-pass discipline, by a human ruling. Recording the evidence and
pre-empting the ruling are different acts.

## Classes

- **A. Mechanism class insufficient.** The claim text alone was not enough to build a working mechanism.
- **B. Technology specifics in the portable layer.** The `Mechanism class:` bullet names a .NET type, tool, or
  capability rather than a class of mechanism.
- **C. Locus unreachable.** The claim declares `centralized` but the second stack can only reach per-seam, or
  the mechanism cannot be built at all.
- **S. Schema.** The finding is about the catalog's own file schema or governance, not about one claim's
  content. Opened because the first three passes surfaced findings that fit none of A, B, or C.
- **E. Edition defect.** The finding is about the shipped edition rather than the catalog: a claim whose status
  the record cannot honestly carry. These flow back into `kernel/dotnet-react/`, not into the catalog.

## Register

### S-1. The Enforcement section holds exactly one edition, by construction

**Claim:** all 69. **Found:** Phase 0, reading the catalog.

`kernel/claims/README.md` fixes the file schema as "**Enforcement** (mechanism class + edition realization)",
and every claim file realizes it as two bullets: `- Mechanism class:` and `- Edition:`. The second is singular.
A catalog that expects N editions has one field for the realization, so the second edition has nowhere to
write and the first edition's mechanism reads as though it were the claim's.

MOD-2 has already broken the schema under exactly this pressure: alone among the 69 it carries
`- Edition (.NET):` and `- Edition (TS):`, because its subject (naming and placement) obviously differed
across the two languages of a single edition. The strain was visible before a second edition existed; nobody
generalized it.

**What was done instead:** nothing yet, by ruling. Recorded for the adjudication pass, where the shape of the
repair (an `- Edition (<name>):` bullet per edition, or moving realizations out of the catalog entirely and
leaving only the mechanism class) is a decision, not a mechanical edit.

### S-2. `locus` is documented as an enum and realized as prose

**Claim:** all 69. **Found:** Phase 0, parsing front matter.

The schema declares `locus` as "(centralized or per-seam)" and the catalog's honesty rests on the distinction:
"every file declares which side it is on". Measured, the field holds **22 distinct free-text values** across 69
claims. Only 49 are exactly `centralized` or `per-seam`; the rest qualify in prose, for example
`centralized restriction, per-seam crash proof` (DATA-8), `centralized declaration, per-queue test` (RES-5),
`centralized (import ban) + per-seam (one smoke line per primary flow)` (UI-5).

Splitting on the leading word gives 55 centralized-leading and 14 per-seam-leading, which is the tally the
catalog uses, so the prose is being read as an enum by eye and has held. It stops holding here: a class C
finding is the assertion "this claim declares centralized and the second stack reaches only per-seam", and
that comparison cannot be made mechanically against a field that is prose. The values are also load-bearing in
a way an enum would not be, because several of them encode a real hybrid the two-value enum cannot express.

**What was done instead:** class C findings in this register name the locus value verbatim and state the
reachable locus in prose. The repair (a two-value `locus` plus a separate `locus_note`, or a three-value enum
admitting `hybrid`) is an adjudication decision.

### S-3. Per-claim status had no machine-readable home, and the catalog knew

**Claim:** all 69. **Found:** Phase 0a. **Repaired in this pass** (the one finding here that was repaired
rather than recorded, because the second edition could not land without it).

`kernel/claims/README.md` states that status belongs to the edition and not the catalog. It then carries a
`- **Edition (v1):**` status line for all 69 claims in its own index, and the edition README carried a second
copy as a hand-maintained table of 37 rows, and 42 claim files carry status words embedded in their `Edition:`
prose ("owed; trigger: ..."). Three homes for one fact, becoming five with a second edition, none of them
machine-readable, and the edition table silently omitted the 32 claims minted after it was written.

**What was done instead:** each edition now carries `conformance.json`, one row per claim id, and the README
table is generated from it. `tools/docs-lint.mjs` fails the build on a catalog claim with no row, a row naming
no claim, a non-`owed` claim naming no mechanism, an `owed` claim naming no trigger, and a stale generated
table. A repo-level CI loop (`.github/workflows/kernel.yml`) runs it, because nothing was running it before.
All eight failure modes are red-green proven. The catalog was left untouched, by ruling, so the duplicate
status lines in `kernel/claims/README.md` and the embedded status words in 46 claim files remain: that drift is
accepted and recorded here, and it composes with S-1 as one adjudication decision.

### S-4. CON-2's mechanism does not reach the kernel's own shared tier

**Claim:** CON-2. **Locus:** `per-seam (one fixture per mirrored contract)`. **Found:** Phase 0b.

CON-2 rules that a corpus mirrored on both sides is pinned by "physically the same file", and explicitly
rejects the alternative: two copies plus a test. It is right about a fixture inside one tree, and the .NET
edition realizes it correctly with an MSBuild link across the server/client boundary.

The shared tier is the same problem one level up (one React client, two editions) and CON-2's mechanism cannot
be applied to it. Two edition trees that must each be independently copyable at instantiation cannot share a
physical file, because whichever tree does not own it holds a path that breaks the moment it is copied. The
mechanism class encodes an unstated precondition: that both consumers live under one root that travels
together.

**What was done instead:** `kernel/shared/` is the single authoritative home, `kernel/tools/compose.mjs`
materializes it into each edition, and `--check` fails the build on any divergence. Mechanically equivalent to
a link for drift purposes; weaker than CON-2's ruling in that the copies exist. Recorded rather than assumed,
in `kernel/shared/README.md` and here. Whether CON-2's weakening notes should name the precondition is an
adjudication question.

### E-1. DEP-1 is tagged `proven` while the CI toolchain floats

**Claim:** DEP-1. **Status carried:** `proven`. **Found:** Phase 0, writing a new workflow under DEP-1's rules.

DEP-1's statement is unconditional: "All versions are pinned exactly, lockfiles committed, CI restores in
locked mode". Its enforcement is the docs-lint ledger check, which compares `VERSIONS.md` rows against
`server/Directory.Packages.props`, `client-web/package.json`, and `server/.config/dotnet-tools.json`.

The CI workflow is not on that list, and everything in it floats:
`actions/checkout@v4`, `actions/setup-node@v4`, `actions/setup-dotnet@v4` (mutable major-version tags, not
commit SHAs), `node-version: '24'`, and `dotnet-version: '9.0.x'`. None has a ledger row. A compromised action
tag executes inside the loop that gates every other claim in the catalog, which makes this the highest-value
unpinned surface in the edition rather than an incidental one, and mutable tags on third-party actions are the
specific shape DEP-1's harm paragraph describes.

This is not a portability finding. It is a claim the shipped edition does not meet while reporting `proven`,
found only because building a second edition meant writing a workflow against DEP-1 as text rather than
copying one.

**What was done instead:** the new repo-level workflow matches the existing edition convention rather than
silently diverging from it, so the gap is uniform and visible in one repair. Nothing was pinned, for two
reasons: the fix belongs in the same change across both workflows and the ledger check, and the publish dates
that DEP-1's cooling-off window needs cannot be verified from this environment. Flagging rather than guessing
is what DEP-1 prescribes when a version's date cannot be established.

### S-5. A portable mechanism class needs three parts, and the catalog names two

**Claims:** every claim whose mechanism is a scan, which is most of the centralized ones. **Found:** Phase 1.
**Confirmed.** This is the most valuable finding of the run so far.

Every scanning mechanism in the catalog is a **surface** plus a **predicate**. The predicates port without
friction: "no parameter name matches the PII list" is the same sentence in any language. The surfaces do not,
and not because of vocabulary. The .NET realizations get **completeness of enumeration for free**, and no claim
mentions it.

Quoting the portable layer only, since which layer says what is this finding's whole subject: SEC-1 and SEC-3
both give their `Mechanism class:` as "a runtime scan over the composed route table". TEN-1's reads "an
architecture test scans the application's real route table ... and a reflection scan over all request contract
types". SEC-2's reads "a reflection scan over every body-bound request type". (The phrase "a composed-host scan
of every endpoint's body-bound DTO" is SEC-2's `Edition:` line, not its mechanism class; it is quoted in B-2
below, where the edition layer is the subject.) Read as build instructions, all four are silent on the only
question that decides whether the mechanism works: what makes
the enumeration complete? The words "real" and "composed" rule out scanning source text and carry nothing
further. In .NET the question never arises, because `EndpointDataSource` is not a report about the router, it
IS the router: `factory.Services.GetRequiredService<EndpointDataSource>().Endpoints` cannot miss a route,
completeness is free, and the freeness is invisible in the claim text.

Measured in Node (fastify 5.8.5, throwaway spike, both directions probed):

- Fastify has **no free equivalent**. There is no structured accessor for the composed route table: the
  instance exposes `printRoutes()` (an ASCII rendering of the radix tree) and the point queries `hasRoute()`
  and `findRoute()`, and no route registry symbol. Completeness has to be bought.
- It **can** be bought, cheaply and structurally. The `onRoute` hook is not a report either: it is a point on
  the registration path, and `.get`/`.post` are sugar over `route()`, so every route passes through it.
  Installed as the composition root's first act, it captured all 8 declared routes plus the 7 HEAD routes the
  framework synthesizes, through encapsulated plugins, plugins nested two deep with prefixes, a child that
  registered a competing `onRoute` hook of its own, and loop-generated routes.
- The purchase price is exactly what the handover predicted: a skeleton constraint (the app is obtainable only
  through one factory, which installs the recorder in the same expression that creates the instance) plus a
  lint banning the framework import anywhere else.

So the locus holds and the completeness obligation is real. Two further measurements sharpen it:

- Fastify **refuses** registration after `ready()`, so once bought, the Node table is closed.
  `EndpointDataSource` is a live collection a custom source can extend at any time, which the .NET edition's own
  limitations section half-names. The bought guarantee is in one respect stronger than the free one.

  Corrected 2026-07-26 after the Phase 2 audit: **which** refusal fires is instance state, not a fixed fact, and
  two passes of this register have each asserted one code as though it were the fact. A bare instance refuses
  through avvio with `AVV_ERR_ROOT_PLG_BOOTED`; an instance carrying an `onReady` hook, which every app built by
  the finished `createApp` does, refuses through Fastify with `FST_ERR_INSTANCE_ALREADY_LISTENING`. Measured
  across five instance shapes: only the presence of an `onReady` hook changes it. The property that matters is
  that registration is refused, and the test asserts the set of codes rather than one of them, because the
  version that pinned one code broke when an unrelated hook was added, which is the wrong thing to be sensitive
  to.
- One hole is irreducible and shared. A hook that answers a request without registering a route serves a URL
  the enumeration cannot contain: the spike leaked a query string from `/ghost` with a route table of length
  zero. The .NET analogue is middleware that short-circuits before routing. **Neither claim names it.** SEC-1's
  weakening notes discuss source-text regex guards and carve-outs; the residual hole they leave is not there.

**Proposed repair, for the adjudication pass:** a portable mechanism class has three parts, not two: the
surface, the predicate, and **the completeness obligation**, meaning the edition must show its enumeration
cannot miss a member and name what forces that. `locus` then stays a property of the claim and gains a
precondition that is an obligation on the edition, and the catalog schema does not have to change.

**Sharpened 2026-07-26, by an audit that broke the first implementation of this very obligation.** The
completeness obligation has a **when**, and stating only the what is not enough to build it. The first Node
recorder sat on the registration path, which is where this finding says to put it, and was still incomplete:
Fastify runs `onRoute` hooks in registration order and registers whatever the LAST hook leaves behind, so a hook
added after the composition root could rewrite a route's url, method or schema after the recorder had already
snapshotted it. The table read `/decoy` while the server served `/admin/impersonate`, with no test failing. The
same defect in three variants, all silent.

Being on the registration path is necessary and is not sufficient. The enumeration must be **materialized at a
point after which the registered set can no longer change**, which in Fastify is `onReady` and in general is
whatever the stack's equivalent barrier is. So the obligation reads: the edition must show that its enumeration
cannot miss a member, **and that nothing can alter a member after the enumeration is taken**. The second half
was invisible until something tried to alter one.

A third property fell out of the same repair and is worth naming for the adjudication: the enumeration should be
**reconciled against a second, independent view** before it is trusted. Everything else here is one mechanism
agreeing with itself, since the recorder decides what the table says and the obligations decide what may
register. Comparing the table with the router's own rendering at boot is what turns "we believe this is
complete" into "two independently derived views agree, or the process refuses to start".

TEN-1 already knows this and states it as a .NET footnote: its weakening note says the contract scan covers
only the Contracts assembly and leans on MOD-2 placement to close the gap. That is the completeness
obligation, written once, for one claim, in a stack-specific vocabulary, filed as a weakness rather than as a
part of the mechanism.

### B-1. The route-scan claims encode free enumeration; the locus survives anyway

**Claims:** SEC-1, SEC-3, TEN-1 (route half), and TEN-1's half of the SEC-2 body scan.
**Locus declared:** `centralized` on all three. **Class B confirmed; class C refuted.**

Class B holds in the precise sense S-5 describes: `Mechanism class:` names a class of mechanism in portable
words while depending on a platform capability it never states. It is a subtler leak than a named .NET type,
and worse for it, because it reads as portable.

Class C is **refuted**, which is the better half of the finding. All three remain reachable at `centralized`
in Node: one scan over one enumeration covers the whole surface, and a violation cannot merge. What changes is
that the edition owes a stated reason why the enumeration is complete. The handover's day-one worry, that a
large block of centralized claims would drop to per-seam in Node, did not happen.

### B-2. The contract-surface hypothesis is refuted, and inverted: Node is the stronger realization

**Claims:** SEC-2, TEN-1 (contract half). **Seeded hypothesis:** class B and possibly C, because TypeScript
erases types at runtime and there is no contracts assembly to reflect over. **Refuted.** Flows back into the
shipped edition, not into the catalog.

The erasure argument is sound and its conclusion does not follow. It bites only on a Node edition that tries
to imitate the .NET mechanism. Realize the claim instead and the contract moves: if the contract is a runtime
JSON Schema attached to the route, it is reachable from the route enumeration itself, and a contract that is
not attached to a route is not a contract. Nothing is erased, because nothing was a type.

Measured against the .NET realization, read after the Node design was written:

| | .NET | Node (fastify) |
|---|---|---|
| How a body contract is found | two mechanisms, neither complete alone | one, from the route enumeration |
| `ContractShapeTests` | reflects over the Contracts assembly, filtered to types whose **name ends in "Request"** | not needed |
| `EndpointSpineTests` body scan | infers "is this a body DTO?" by **exclusion**: not URL-bindable, not `CancellationToken`, not a `System`/`Microsoft` namespace, not a DI service | `route.schema.body`, a value |
| Contract with no route | invisible to the endpoint scan, caught only if it is in the right assembly with the right name suffix | cannot exist |
| Route with no contract | binds anyway | **refused at registration** |
| Nested objects, array items, `allOf` | reflection recurses types | schema walk recurses; the spike caught `createdBy` one level down, `tenantId` inside array items, and `rowVersion` behind `allOf` |

The Node completeness obligation here is enforced **at registration**, which is earlier and louder than any
test-time scan: the spike's five evasion attempts (POST with no schema, POST with a schema but no body clause,
a path parameter with no params schema, a wildcard route, and the same evasion buried in a nested plugin) were
all refused before the app could finish booting, so the violation cannot reach a test, let alone a merge.

TEN-1's weakening note understates its own gap. It says "the contract scan covers only the Contracts
assembly; a request type declared elsewhere escapes it". Measured, it covers only types in that assembly
**whose name ends in `Request`**: a body DTO in Kernel.Contracts named `CreateNotePayload` is skipped by the
named mechanism entirely. The endpoint scan is the belt that catches it, which is fair, but the claim names
the weaker of the two as its mechanism.

### E-2. The .NET body-DTO scan reimplements the model binder, and says it does not

**Claim:** SEC-2. **Status carried:** `proven`. **Found:** Phase 1, reading `EndpointSpineTests.IsBodyDto`.

`IsBodyDto` decides what the JSON binder will treat as a body by exclusion, in the test: not URL-bindable, not
`CancellationToken`, not `System.*`, not `Microsoft.*`, not a registered service. That is a second, informal
implementation of ASP.NET's binding rules living in the assertion, and it can drift from the real binder
without anything failing, in either direction: a body type wrongly excluded is scanned by nothing, and the
test still passes.

This is not a portability finding; the Node realization simply does not have the problem, because the schema
is attached rather than inferred. It is recorded because SEC-2 is tagged `proven` and its weakening notes
name only the name-matching heuristic (`newState` slipping past a registry listing `status`). The binder
reimplementation is a second heuristic, unnamed, underneath the first.

### S-6. The shared linter was not stack-neutral, and nothing said so

**Claim:** DEP-1. **Found:** Phase 2, on the first attempt to point the shared tooling at a second edition.
**Repaired in this pass**, because it blocked the scaffold outright.

The handover recorded that `tools/docs-lint.mjs` "is already a Node script living inside the .NET edition"
and that "the harness is partly stack-neutral by accident". Measured, the DEP-1 ledger check was not neutral
at all. It read three hardcoded paths, two of them .NET-only:

```
server/Directory.Packages.props        MSBuild central package management
server/.config/dotnet-tools.json       dotnet local tools
client-web/package.json                neutral
```

A `node-react` edition has neither .NET file, so the shared linter would have crashed on the second edition
it was lifted to serve. The boundary of the shared tier had been drawn by file extension, not by what is
actually edition-agnostic: being written in Node is not the same as being about Node.

The general shape is worth naming, because it is the same one S-5 describes in the catalog. **Which files
declare direct dependencies is edition property; how to read a manifest format is not.** The two had been
fused into one hardcoded list, so the neutral half could not be shared without dragging the specific half
with it.

**What was done instead:** each edition declares its dependency surfaces as data in a new `edition.json`
(`{ path, kind }` per surface); the shared tool keeps the readers, keyed by format. Six failure modes are
red-green proven: a missing or malformed declaration, an empty list, an unknown kind, a declared surface that
does not exist, and a surface paired with a reader that cannot parse it.

Two of those six exist because writing the fix reproduced S-5's lesson on the fix itself. The declaration
proves every DECLARED dependency is ledgered and says nothing about a manifest nobody declared, so dropping
one line from `edition.json` would have silently dropped every package it holds out of the check while the
build stayed green. That is the completeness hole this register exists to name, in a mechanism written by the
person naming it. It is closed by sweeping the tree for manifests in the known formats and failing on one
that exists without a declaration, and by refusing a declared surface that yields zero dependencies (which is
how a wrong-but-parseable reader pairing presents: a `package.json` read as `msbuild-packages` returns an
empty match set, not an error, and was green until the guard landed).

### S-7. S-6 was not a bug, it was the first instance, and nothing in the loop finds the others

Found in Phase 2, scaffolding the second edition.

S-6 recorded that the shared linter's DEP-1 check hardcoded two .NET manifest paths, and repaired it by moving
the declaration into `edition.json`. That was written as one defect. Building the second edition found two more
instances of the identical shape in the same file, and they were found the same way: by a Node tree hitting them,
one at a time, in the order the scaffold happened to touch them.

- **HUM-1.** The check required a CODEOWNERS line containing the literal fragments `Migrations/` and
  `Contracts/`. Those are one stack's PascalCase directory convention. A Node edition puts the same two
  irreversible surfaces in `migrations/` and `contracts/`, and would have failed HUM-1 for spelling, on a tree
  whose owner coverage was complete.
- **MET-08.** The dash check exempted lockfiles by a literal list of two paths, `client-web/package-lock.json`
  and `server/packages.lock.json`, which is the .NET edition's own layout. A second edition's server lockfile
  sits elsewhere and would have been scanned as authored text, failing on a dash inside a transitive package's
  metadata that nobody in this repo wrote or can fix.

Repaired the same way S-6 was, because the same rule applies: WHICH surfaces are irreversible is portable and is
fixed in the tool (three categories, with the reason each is irreversible written next to it); WHERE each one
lives is edition property and is declared in `edition.json` under `irreversibleSurfaces`. An edition cannot drop
a category or rename one, so declaring the three costs it nothing it should have been free to skip. The dash
exemption now matches lockfiles by name rather than by path.

Both repairs are red-green proven (five HUM-1 injections in the Node edition and one in the .NET edition, all
red; an em dash injected into a lockfile stays green, the same dash in an authored file goes red).

**The finding is not the two bugs.** It is that the shared tier has no mechanism that detects a stack-specific
assumption inside itself. Every one of these three was found by a second edition tripping over it, which means
the count of remaining instances is unknown and the discovery cost is one edition each. The catalog has a name
for this shape and applies it to product code (a claim's mechanism must be enforced, not intended), and the
kernel's own shared tier is the one place it is not applied to itself. A candidate mechanism exists and is not
built: the shared tools could be run against a synthetic minimal edition in CI, one declaring the required
surfaces and nothing else, so that any new hardcoded path fails on the fixture rather than on the next real
stack. That would move the discovery cost from one edition to one test.

### A-1. The route set is not the authored set, and the per-route claims assume it is

Found in Phase 2, on the first real route.

Fastify auto-registers a `HEAD` route for every `GET` (`exposeHeadRoutes`, on by default), and the recorder sees
both. The route table therefore contains reachable surfaces that appear nowhere in the source. In .NET,
`MapGet` produces one endpoint, so the enumeration and the authored declarations are one to one.

The consequence is smaller than it first looks and is recorded at its real strength rather than inflated: the
synthesized `HEAD` inherits the `GET`'s options, so a per-route predicate (SEC-1's permission policy, SEC-2's
body scan, SEC-3's parameter scan) is satisfied by the same configuration that satisfies its `GET`. Nothing
leaks. What breaks is the claims' unstated assumption that every enumerated route has an author: a violation
reported against `HEAD /notes/:id` points at no line anyone wrote, and remediation advice phrased as "add a
permission policy to this endpoint" has no place to be applied. Any scan built here has to attribute a
synthesized route's failure to its origin, and no claim says so because in a one-edition catalog the question
never came up.

**Confirmed by the Phase 2 audit, with one nuance added.** The synthesized `HEAD` was measured to inherit both
the `preHandler` and the schema of its `GET`: the same hook ran for both, both returned 401 behind an auth
guard, and the recorded schemas were byte-identical. Nothing leaks beyond content-length, so the finding's
stated strength was right. The nuance: an explicitly registered `HEAD` placed BEFORE its `GET` suppresses the
synthesis and can then diverge from it, which the audit demonstrated by leaking a header on the `HEAD` that the
`GET` did not carry. That is not a scan hole, because both rows appear in the table and any per-route predicate
sees them separately. It does mean "the HEAD inherits the GET" is true of the synthesized case only, and a scan
must not assume the pair share a configuration.

### B-3. HUM-1's mechanism class names a GitHub product feature (observed, not yet biting)

Recorded at low confidence and low strength, because the second edition does not test it.

HUM-1's portable bullet reads "Mechanism class: CODEOWNERS entries on the migrations path and the published
-contract paths, plus branch protection requiring code-owner review". `CODEOWNERS` and branch protection are one
forge's features, not a class of mechanism. The portable content is: the irreversible surfaces are enumerated,
each has a named human owner, and a change to one cannot merge without that human. A different forge realizes
that differently, and a repository not on a forge at all realizes it not at all.

This did not bite in Phase 2 because both editions target GitHub, so the mechanism transferred unchanged. It is
logged now, while the evidence is in hand, rather than rediscovered when someone ports the kernel to a different
forge. It is the same shape as the route-scan finding in B-1: the claim reads portable only because every
witness so far shares an assumption nobody wrote down.

### E-3. DEP-1 reads `proven` over a pin set carrying a critical advisory, and DEP-2's trigger defers the only mechanism that would say so

Found in Phase 2, on the first `npm install` of the new edition.

Installing the shared tier's toolchain pins produced 12 advisories, one critical and eleven high:
GHSA-5xrq-8626-4rwp (arbitrary file read and execute via the Vitest UI server) against `vitest` below 3.2.6, and
GHSA-mh99-v99m-4gvg (`brace-expansion` denial of service) reaching `eslint` below 10 through
`@eslint/config-array`. The shared client pins `vitest` 3.1.4 and `eslint` 9.27.0, so both ranges cover it.

DEP-1's mechanism is exact pins, committed lockfiles, locked-mode restore, a 90-day cooling window, and a ledger
row per direct dependency. Every one of those holds here. None of them asks whether a pin is **known bad**, and
the edition record reads `proven`. The cooling window is doing the opposite of what the intuition suggests: it
guarantees a pin is old enough for the community to have found problems in it, and then nothing consults what
the community found.

DEP-2 is the claim that would catch it, and it is `owed` with the trigger "the first armed CI loop (TEST-3 at
instantiation)". That trigger is defensible as scheduling and wrong as risk: the advisory exists now, in a
shipped kernel, and the trigger defers the only mechanism that would report it until someone instantiates a
project. A trigger is supposed to name the event that makes a claim's mechanism buildable, not the event that
makes its absence noticed.

The catalog finding is about the pairing: DEP-1 claims dependency quarantine and can read `proven` while the
quarantine admits a known-vulnerable release, because the advisory half was carved into a separate claim that is
allowed to be owed. Either DEP-1's `proven` bar should include "no known unpatched advisory against a pinned
version", or DEP-1's weakening note should say plainly that it does not cover known-vulnerable pins. It says
neither.

The edition finding is separate and concrete: `kernel/shared/client-web/` should move to pins clearing both the
window and these advisories. It is not done here because changing the shared tier re-composes into the shipped
edition and owes that edition its own verification run; it is queued rather than smuggled into a scaffolding
change.

**Corrected 2026-07-26 by the Phase 2 audit, on three points, and the finding is stronger for all three.**

1. **The measurement.** The client tree's own total is 14 advisories, 1 critical and 13 high, measured directly.
   This register previously recorded it as unmeasured because the registry audit endpoint was failing at the
   time; it was working for the audit. Beyond the two chains named above, the tree carries `postcss`
   GHSA-r28c-9q8g-f849 and seven `vite` advisories, two of them high.
2. **"The target versions are known and tested" was false for the client.** They were tested in the server tree,
   which has no React toolchain, and the register generalized from one tree to another. In `client-web`,
   `npm install` at those pins fails outright: `eslint-plugin-react-hooks` 5.2.0 peers `^9.0.0` and will not
   accept eslint 10. The real fix needs a fourth pin this register never named, `eslint-plugin-react-hooks`
   7.1.1 (published 2026-04-17, clears the window, the first version peering `^10.0.0`), which is a two-major
   bump; with it the tree installs and verifies. Recording a fix as "known and tested" on the evidence of a
   different tree is the same error class this register exists to catch, committed by the register itself.
3. **The conflict has already arisen.** This finding closed by saying the window and the advisories could
   conflict but had not. They have, now, in the shipped edition. The `vite` advisories GHSA-fx2h-pf6j-xcff and
   GHSA-p9ff-h696-f583 cover `vite` <= 6.4.2, and the only release in the vite 6 line that clears them is 6.4.3,
   published 2026-06-01, which is inside the 90-day window as of today. There is no version of vite 6 that
   satisfies both rules simultaneously. Escaping to vite 7 was not evaluated: `@vitejs/plugin-react` 4.5.0 peers
   `^4 || ^5 || ^6`, so it needs its own bump chain.

Point 3 is the part the catalog has to answer. DEP-1 as written gives no rule for the case where the cooling-off
window and a live advisory have no overlapping solution, and that case is no longer hypothetical. The choices
are to take a release inside the window, to stay on a known-vulnerable pin, or to change component; the claim
should say which, and by whose decision, rather than leaving an edition to discover the conflict and improvise.

### E-4. DEP-1's own enforcement checked a name and nothing else

Found by the Phase 2 audit, in the mechanism that E-3 relies on.

E-3 argues that DEP-1 can read `proven` while the quarantine admits a known-vulnerable release, and takes for
granted that the rest of DEP-1's mechanism holds: exact pins, publish dates, a ledger row per dependency. The
audit tested that premise instead of accepting it, and it did not hold. The ledger check proved only that a
package NAME appeared somewhere in `VERSIONS.md`. It checked no version, no exactness, and no date. Setting
`"react": "latest"` and `"vite": "^6.0.0"` in a manifest left docs-lint green; so did an invented version string
with a ledger row for a different version.

So DEP-1's strongest-sounding words were the unenforced ones. `.npmrc save-exact=true` governs what a future
`npm install` writes, not what a hand-edited manifest says, and nothing read the two artifacts against each
other. Two of the three properties the claim is named for were documentation.

Repaired in the shared linter, and the repair is what caught the real instance: the readers now return
`(name, version)` pairs; a pin that is not an exact version fails; a pin with no ledger row **for that version**
fails; and a ledger row with no publish date fails, because a row without a date means the cooling-off window
was never checked for it. Eight red-green injections cover the new rules. The real instance it caught is audit
finding 7: `kernel/node-react/` installs `eslint` 9.27.0, `typescript-eslint` 8.32.0 and `vitest` 3.1.4 in its
client surface, and the ledger carried rows for the server's different versions of those three names and nothing
for the client's. Three pinned versions, in a shipped tree, whose publish dates nobody had ever checked, under a
claim whose entire subject is checking publish dates.

The catalog-facing half: this is the third time in this run that a claim's enforcement turned out to be weaker
than the claim's text, and the previous two (S-6, S-7) were about stack neutrality while this one is not. The
pattern underneath all three is the same and is worth stating separately for the adjudication pass: **the
conformance record's `proven` bar is "a mechanism exists and a test proves it binds", and nothing checks that
what the mechanism tests is what the claim says.** A test that binds tightly to a weaker predicate than the
claim reads `proven` honestly and is still wrong.

## Audit, 2026-07-26

An independent audit ran every mechanism above rather than reading the claims about them. It confirmed the
substance of all nine findings and the migration fidelity of all 69 conformance rows (the mechanism column
byte-identical on all 37 pre-existing rows), reproduced the Phase 1 spike in full, and confirmed the DEP-1
pin arithmetic. It corrected three details, now fixed in place above: the post-`ready()` refusal code, the
count of claim files carrying embedded status words (42, not 46), and a quote in S-5 attributed to SEC-2's
portable layer that is actually its edition layer.

It found one real defect, now repaired: the new conformance check made docs-lint fail or crash in exactly the
shape the instantiation manifest says seeding produces, because it read the edition README unconditionally,
while the manifest described a skip announcement that had never been written. Ruled and repaired as follows,
because it is a design question and not only a bug:

- The README table gate keys on the **marker pair**, not on the file. The kernel's edition README holds the
  table and is gated. A seeded project's README belongs to the product, and an edition has no business
  dictating the shape of a document it does not own; a project that wants the table adds the markers and gets
  the identical drift gate. `conformance.json` travels either way, which is what the conformance statement
  actually rests on.
- Both conditional checks now print a `note:` line naming what was not checked and why, so a green run cannot
  be read as coverage it does not have.
- Three further audit items are repaired: a row missing its `note` or `mechanism` key is now diagnosed by a
  sentence instead of a renderer stack trace (shape is validated before meaning, in both entry points);
  `catalogPassDate` is now matched against dates on lines that name a pass, so the 2026-07-10 adjudication no
  longer validates as a version; and `conformance.mjs` now states in its header what the gate proves
  (internal consistency) and what it cannot (truth of a self-reported row).

Verified green afterwards in all four shapes: the kernel repo, a seeded tree with no README, a seeded tree
whose product README carries no markers, and a seeded tree that opted in (drift caught, then cleared by
`--write`).

## Audit, Phase 2 (2026-07-26)

The second independent audit, run against the scaffold rather than against the claims about it. **It refuted the
foundational claim.** The route table was not complete: a route could exist without appearing in it, and the
evasion needed neither a framework import nor a type cast, so neither half of the two-part purchase bound it.
Thirteen evasions were demonstrated and reproduced here before anything was changed; all thirteen were silent,
with no failing test and no lint error.

What was actually wrong, in one sentence each:

- **The enumeration was taken too early.** Recording at `onRoute` snapshotted a route that later `onRoute` hooks
  could still rewrite. Fixed by materializing at `onReady`. This is the substantive catalog finding of the
  audit and it is folded into S-5 above, because it means the completeness obligation has a **when**.
- **Nothing checked the mechanism against a second view.** Fixed: the table is reconciled against the router's
  own rendering at boot, and disagreement in either direction refuses the boot.
- **The evidence was writable.** `app.routeTable = []` emptied the table while every route kept serving, and it
  typechecked and linted clean. Fixed with a getter-only decorator, frozen entries, a frozen array, and a
  `readonly` declaration whose compile-time half is asserted by a `@ts-expect-error` directive.
- **The body-bearing method set was an enumeration and it was wrong.** DELETE and OPTIONS bind bodies, and
  `addHttpMethod` invents methods no list can anticipate. Fixed by inverting it: GET and HEAD are the allowlist.
- **Query strings were never required.** A query string has no syntactic tell in the URL, so an omitted
  declaration was indistinguishable from a route that reads `request.query`. Fixed: every route declares one.
- **The declarations were vacuously satisfiable.** `{}`, `true`, `false`, `null` and an open object all passed a
  `!== undefined` check and constrained nothing. Fixed with a positive shape predicate.
- **Six of seven import-ban evasions worked**, including any file with a `.js` or `.mjs` extension, because the
  rule's glob was `**/*.ts`. Fixed, and paired with a second constraint: only the entrypoint may open a socket,
  so an instance the lint cannot see still cannot serve.

Four further findings were about the shared linter rather than this edition, and are recorded as E-4 above and
in the S-7 lineage: the DEP-1 check verified a package name and nothing else; the manifest sweep inherited the
content checks' exemptions and was blind to `design/`; the lockfile dash exemption let an authored `*.lock`
through; and a missing `VERSIONS.md` crashed with a stack trace rather than a sentence. All repaired, all
red-green proven.

The audit also corrected this register on five points, each folded into the finding it corrects: the
post-`ready()` refusal code is state-dependent rather than fixed (S-5), A-1's strength was right but its
inheritance claim holds only for synthesized routes (A-1), and E-3 was wrong about the client's advisory count,
about its replacement pins being tested, and about the window-versus-advisory conflict being hypothetical (E-3).

**What survives.** The two structural conclusions of Phase 1 are unchanged: Fastify's `onRoute` is on the
registration path and does reach every registration form, and the framework refuses registration after boot.
What the audit destroyed was the implementation, not the mechanism class. That distinction is the reason the
finding lands in S-5 as a sharpening rather than as a refutation: the obligation was real, and stating it
without its timing half was not enough to build it correctly, which is exactly the kind of thing a second
edition exists to discover.

## Framework ruling (Phase 1 output)

**Fastify 5.8.5, and the choice follows from the spike rather than from preference.** The requirement was a
composed route table obtainable completely after startup. Express exposes its router stack only as private
internals with no guarantee across middleware-mounted subrouters; Fastify's `onRoute` is on the registration
path itself, survives encapsulation, and is paired with a framework refusal to register after boot, which
closes the table. The JSON Schema surface it already carries for validation doubles as the contract
enumeration, which is what makes B-2 come out the way it does.

Version chosen under DEP-1: 5.8.5, published 2026-04-14, the newest release clearing the 90-day window as of
2026-07-26. 5.9.0 (2026-06-28) and 5.10.0 (2026-07-05) are inside the window and were not taken.

## Seeded hypotheses, from the handover

Each was found by reading, not by building, and is a hypothesis until the mechanism is attempted. Confirming
one is a finding; refuting one is a better finding. Status is updated as Phase 3 reaches each claim.

| Hypothesis | Claims | Class | Status |
|------------|--------|-------|--------|
| `DbContext` named in the portable layer; expected trivially neutral | DATA-1 | B | not yet tested |
| Mechanism class is runtime reflection or a type-set scan, which TypeScript erases | SEC-1, SEC-3, TEN-1 (route half) | B, possibly C | **B confirmed, C refuted** (B-1): the leak is free enumeration, not reflection, and `centralized` survives |
| The same, on the contract half | SEC-2, TEN-1 (contract half) | B, possibly C | **refuted and inverted** (B-2): Node is the stronger realization |
| The same, on the remaining four | DATA-9, SEC-7, TIME-1 | B, possibly C | not yet tested |
| The ban is on a type, and JavaScript ships one `Date` and it is the unsafe one | TIME-1 | A | not yet tested |
| Node may be the STRONGER realization (wall time plus IANA zone id is native) | TIME-1 | flows back to the edition | not yet tested |
| A portable mechanism class needs three parts: surface, predicate, and completeness obligation | all centralized | S | **confirmed** (S-5) |

## Flows back into the shipped edition

Findings where Node turned out to be the stronger realization, or where building against the claim text
exposed a defect in `kernel/dotnet-react/` rather than in the catalog. These are edition work, not catalog
work, and they are listed separately so the adjudication pass does not absorb them by mistake.

| Finding | Claim | What flows back |
|---------|-------|-----------------|
| E-1 | DEP-1 | The CI toolchain is unpinned and unledgered while DEP-1 reports `proven`. |
| E-2 | SEC-2 | `IsBodyDto` reimplements the model binder by exclusion; the weakening notes name only the field-name heuristic. |
| E-3 | DEP-1, DEP-2 | `kernel/shared/client-web/` carries 14 advisories, 1 critical and 13 high. The bump needs four pins, not three: `eslint` 10.2.1, `vitest` 4.1.5, `typescript-eslint` 8.59.0, and `eslint-plugin-react-hooks` 7.1.1 (a two-major bump, without which `npm install` fails on the eslint peer). The `vite` advisories have NO window-clearing fix in the vite 6 line, so that part cannot be closed by bumping and needs a ruling. Queued, not applied. |
| E-4 | DEP-1 | The ledger check verified a package name and nothing else, so exact pins and publish dates were unenforced. Repaired in the shared linter (name plus version, exactness, dated row), which immediately caught three unledgered client pins in `kernel/node-react/`. |
| B-4 | SEC-2 | Fastify validates with `removeAdditional`, so a body schema closed with `additionalProperties: false` does not describe the accepted fields, it STRIPS every field it does not name before the handler runs. A request carrying `tenantId` reaches the handler without one. The .NET edition's mass-assignment defence is a scan that fails the build; here the same declaration is also a runtime filter, and the two together are strictly stronger than either. Measured, and asserted in `routeSurface.test.ts`. |
| B-2 | SEC-2, TEN-1 | Attaching the contract to the route removes both the assembly heuristic and the name-suffix filter. No .NET repair is proposed here: the point is that the .NET weakening notes understate the gap, and the record should say so. |
