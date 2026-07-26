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

One ruling has since landed, and it is worth being exact about what changed. On 2026-07-26 the owner cut DEP-1's
cooling-off window from 90 days to 30, with E-3 below as the evidence. That is the discipline working rather
than an exception to it: the finding was recorded, the owner ruled, and the catalog was edited by that ruling
and recorded as a dated pass in the catalog's own changelog. It does not license editing the catalog from here.
Each finding below still says what it found and what, if anything, was done instead.

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

MOD-2 has already broken the schema under exactly this pressure: alone among the 69 its bullet is labelled
`- Edition (.NET):` and carries the TS half inside the same bullet, because its subject (naming and placement)
obviously differed across the two languages of a single edition. The strain was visible before a second edition
existed; nobody generalized it.

**Corrected 2026-07-26 while applying the ruling below**, measured without reading the bullet's content: this
finding previously said MOD-2 carried two bullets, `- Edition (.NET):` and `- Edition (TS):`. It carries one,
labelled for .NET, with `(TS)` inside it. The substance is unchanged and the form is not what was recorded.

**RULED AND APPLIED, 2026-07-26 (adjudication ruling 1, option b).** Realizations are removed from the catalog
entirely, leaving only the mechanism class. Neither alternative the register floated survives contact with the
other two findings this composes with: a bullet per edition leaves S-9's contamination exactly where it was,
since the contamination is the bullet's existence and not its cardinality, and it leaves E-14's staleness free
to recur in N places instead of one.

All 69 `- Edition:` bullets are removed, along with the 69 duplicate `- **Edition (v1):**` status lines in
`kernel/claims/README.md` (S-3's accepted residual, closed by the same ruling), and the file schema and
status-tag sections are rewritten. Realization and status now live only in each edition's `conformance.json`,
which is machine-checked and can hold as many editions as exist.

What replaces the bullet is not nothing: ruling 2 puts a completeness **obligation** in the claim, which is
portable and is what an edition actually needs from a claim. Applied from the claim files alone, never
reconciled against either edition's mechanism column, because 61 claims still owe a step 2.

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
status lines in `kernel/claims/README.md` and the embedded status words in 42 claim files remain: that drift is
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

  **Corrected 2026-07-26 by Phase 3, and the correction is this register making its own error.** The hole is not
  irreducible; it is irreducible FOR A ROUTE-TABLE SCAN, and this bullet generalized from the mechanism under
  study to the claim, which is the exact move S-5 exists to name. SEC-1's OTHER mechanism, the deny-by-default
  fallback, consults the request rather than the table and therefore does not care whether a route exists.
  Measured after it landed: `/ghost` returns 403 with an empty table and no leaked query string. See A-4. What
  survives is the narrow statement: a claim whose only mechanism is a table scan still carries the residual.

  **Corrected again 2026-07-26 by the round 4 audit, and the correction above was itself too strong.** The
  Phase 3 correction is right that the hole is not a property of route-table scans, and wrong that it closes.
  `app.server` is the raw `http.Server`, handed out by the framework on the instance every module holds, and a
  `request` listener on it sits below the dispatcher and therefore below every hook: `/ghost?email=a@b.com`
  returned 200 with the query string leaked, lint and typecheck clean. The Phase 3 argument quantified over
  hooks and the evasion is not a hook. So this bullet's ORIGINAL text was nearer the truth than its first
  correction, and the standing statement is neither of them: the hole is narrowed to below the framework's
  request pipeline and held there by a lint. See A-4, where the measurement and the surviving residual are
  recorded. Three passes have now written this bullet and two of them overreached in the direction their author
  found interesting.

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
| Nested objects, array items | **flat: neither guard descends** (corrected 2026-07-26, see E-6; this row previously read "reflection recurses types" and was inferred rather than measured) | schema walk recurses; the spike caught `createdBy` one level down and `tenantId` inside array items, and each depth is a red-green proof |
| `allOf` | **caught, by accident** (corrected 2026-07-26 by the round 4 audit; the previous correction over-corrected). The .NET analogue of `allOf` is inheritance, and `GetProperties(Public\|Instance)` without `DeclaredOnly` walks the base chain, so both guards DO see an inherited server-controlled property. Measured on a derived class and a derived positional record. No test pins it, so the coverage is accidental rather than proven | schema walk descends `allOf`/`anyOf`/`oneOf`; red-green proven |

**Three of this table's rows have now been wrong, and the pattern in HOW they were wrong is the finding worth
keeping.** Each was inferred rather than measured, and each inference ran in the direction the writer already
believed: the original `allOf` row credited the sibling with recursion it did not have, and the correction then
credited the Node side with an advantage on `allOf` that it does not have either, because inheritance gives the
sibling that case for free. A comparison table is the shape most likely to carry an unmeasured cell, because
filling it in is a writing act and measuring it is not.

The round 4 audit re-derived the remaining rows from source. Rows 2, 4 and 5 hold as written. Row 1 is true as
scoped and is an undercount: there are four mechanisms by which a body contract is reached in the sibling, not
two, the extra two being the `*Request`/`*Response` placement ban and a hand-maintained `[InlineData]` parity
enumeration, neither complete and one of them not scaling by design. Row 3's thesis holds and its enumeration is
one short; see the fifth exclusion recorded under E-6.

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

**Extended 2026-07-26 by the round 4 audit, and the extension is filed here as a cross-reference rather than
absorbed, because absorbing it would hide the part that matters.** `BindsFromUrl`, in the same file, is a second
reimplementation of the binder: a closed positive enumeration of `string`, `Guid`, primitives, enums, `decimal`
and the date/time types, with `Nullable` unwrapping and array recursion. It consults nothing the real binder
uses, no `TryParse`, no `IParsable<T>`, no `BindAsync`, no `StringValues`. Measured disagreements in both
directions, against a real host: `TimeSpan`, `Uri`, `IPAddress`, `Int128`, any `IParsable` value object and any
legacy `TryParse` type all bind from the URL and are rejected by `BindsFromUrl`; `IEnumerable<string>` resolves
from DI and `Guid[]` on a POST is the body, and both are accepted by it.

Three reasons it is not merely a second instance of E-2:

- **It is the shared root, not a peer.** `IsBodyDto`'s first exclusion clause IS `BindsFromUrl`. Filing it as a
  second site inverts the dependency.
- **The two failure directions fight each other.** E-2's shape is over-exclusion of the BODY set, which loses
  SEC-2 coverage. `BindsFromUrl`'s dangerous shape is under-inclusion of the URL set, which loses SEC-3 and
  TEN-1 coverage. Widening the predicate to catch `IParsable` value objects fixes the second and worsens the
  first; tightening it does the reverse. One predicate cannot serve both claims, and that structural point
  disappears if the two are merged into one "the test reimplements the binder" bullet.
- **It bites a different claim, and this register is read by claim.** E-2 is filed under SEC-2, so a reader
  auditing TEN-1 would never find it, and TEN-1 is the claim carrying `proven` with this exact test named as its
  mechanism.

Also recorded: the exclusion list in this finding and in B-2's row 3 is one item short. There are five, and the
fifth is `type.Namespace is null`. See E-6.

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

### B-4. A closed declaration is a runtime filter and not a description, at the level that closes itself and at no other

**Claims:** SEC-2, TEN-1 (contract half), SEC-3 (query half). **Found:** Phase 2, measured on the route surface.
**Entry written 2026-07-26 at the adjudication pass, from a fresh measurement.**

This id was cited seven times across four files and defined nowhere: four times in this register (in E-10, in
the round 1 audit summary, in the round 2 defect note), once in `record/delta-log.md`, once in
`kernel/node-react/conformance.json`'s SEC-2 row, and once in the generated README table that row renders into.
Two of those citations ship: `conformance.json` seeds into every instantiated project, so a seeded tree
inherited a machine-readable conformance record pointing at a finding that existed in no register.

The round 4 auditor refused to reconstruct the entry from its own references and was right to: writing a finding
under an id from secondhand citations is how a register acquires a finding nobody made. The property, though, is
not a matter of recollection. It is a behaviour of running code, so it is re-measured here rather than
reconstructed, on the edition's own pinned `fastify` 5.8.5 under Node 24.13.1, in a throwaway spike with no
edition machinery in it.

**Measured, eleven probes.** A body schema closed with `additionalProperties: false` does not describe the
accepted fields, it removes every field it does not name before the handler runs, because Fastify validates
with ajv's `removeAdditional`.

| Declaration | Sent | Reached the handler |
|---|---|---|
| closed at the top level | `{title, tenantId, createdBy}` | `{title}` |
| closed at the top, nested `author` left open | `{title, author:{nick, tenantId, createdBy}}` | **`{title, author:{nick, tenantId, createdBy}}`** |
| closed at the top, nested `author` closed | the same | `{title, author:{nick}}` |
| array `items` left open | `{rows:[{v, createdBy}]}` | **`{rows:[{v, createdBy}]}`** |
| array `items` closed | the same | `{rows:[{v}]}` |
| closed at depth 0 and depth 1, open at depth 2 | `{a:{b:{c, tenantId}}}` | **`{a:{b:{c, tenantId}}}`** |
| `patternProperties: {'^tenantId$'}` beside a closed object | `{title, tenantId}` | **`{title, tenantId}`** |
| an untyped `{}` property | `{meta:{tenantId}}` | **`{meta:{tenantId}}`** |
| a closed query string | `?page=2&email=a@b.com` | `{page: '2'}` |

**E-10's correction is carried here rather than only in the flow-back row, because the uncorrected sentence is
what shipped.** The original finding said a closed declaration is a filter, full stop, and that a scan over the
declaration is therefore a true statement about what arrives. The bolded rows are where that is false: the
strip happens at each level that closes itself and is not inherited downward, so the correct statement is
per level rather than per surface. The depth-2 probe is the one that settles it, because it rules out the
reading that the property covers "the top two levels" or "the declared object and its children": closure at
depth 0 and depth 1 bought nothing at depth 2.

The edition now refuses every one of those shapes at registration rather than relying on the declaration, and
the eight refusals plus their non-vacuity cases are permanent tests in
`kernel/node-react/server/src/platform/__tests__/routeSurface.test.ts`. So B-4's property holds in the shipped
edition today, and it holds because the closure obligation was made recursive by E-10, not because the
framework gives it.

**One measurement this entry adds, and it is a live residual rather than history.** The strip is a **framework
default**, not something this edition configures. Measured with a control: an instance built with
`ajv: { customOptions: { removeAdditional: false } }` and the identical closed schema answers **400
`FST_ERR_VALIDATION`** instead of stripping. `createApp` spreads a caller-supplied `FastifyServerOptions` into
the instance, so that option is reachable, and nothing in the edition sets `removeAdditional`, asserts it, or
tests it. The security consequence is nil, because refusal is at least as safe as removal for SEC-2's purpose.
The consequence for S-10 is not nil: S-10 rules that a closure obligation has a **remedy** and records this
edition's remedy for a caller surface as "stripped, silently, before the handler runs", with a reasoned argument
for why refusal would be wrong there. That remedy is a validator default nobody wrote down, and one options key
flips it to the remedy S-10 argues against. Recorded, not repaired: asserting it is edition work, and S-10's
ruling should say whether a stated remedy is part of the completeness obligation an edition owes.

**On the class letter, stated rather than quietly resolved.** This is filed under B and its content is not a
clean class B. Class B is "the `Mechanism class:` bullet names a .NET type, tool, or capability rather than a
class of mechanism", and the class-B reading here is real but thin: SEC-2's mechanism class is "a reflection
scan over every body-bound request type", which names a detection mechanism over types, where the portable
content is that the accepted field set is declared and closed, and this stack makes that declaration enforcing
rather than merely inspectable. The finding's live weight is as flow-back to the sibling, which is where the
register already carries it. The id is kept as issued rather than reclassified, because ids in this register
are cited from two shipped conformance records and an id that changes meaning is worse than an id in the wrong
class. That B-4 sat undefined between B-3 and B-5 is what made this the register's only numbering gap, and it
is why the loop now carries a cited-but-undefined-id check.

### E-5. Documenting the conformance gate broke it, and the gate agreed with the break

Found 2026-07-26, while propagating the window ruling. Introduced by this run, shipped in the Phase 2 commit,
and caught only because a `grep` for the old window value returned a row that should not have existed.

`spliceTable` located the generated table with `indexOf(BEGIN)` and `indexOf(END)`, matching the marker strings
anywhere in the text. The edition README documents the seeded-project opt-in by quoting those strings inside a
sentence. So the first match was the prose mention, and `--write` spliced all 69 rows into the middle of that
sentence. The real table further down was never rewritten again.

The part that matters is what the gate did next. `checkTable` resolved the markers the same way, compared the
same wrong span, found it consistent, and reported ok. The result was a drift gate that had been guarding a
table nobody reads while the table everyone reads went stale, with a green build throughout. The stale copy sat
in the committed tree carrying a superseded catalog pass date and a superseded DEP-1 mechanism string.

Repaired: a marker is a line whose entire trimmed content is the marker, never a substring; more than one pair
on its own lines is refused as ambiguous rather than resolved by picking the first; and the damaged prose is
restored, with the marker names written as inline code that no line-anchored matcher can mistake for the real
thing. Three red-green cases cover it (a duplicated pair fails, a prose mention is ignored, real drift is still
caught).

Two things worth keeping from this, neither of which is about markers:

- **The tool was self-consistent and wrong.** Generation and checking shared the locator, so the check could
  not disagree with the generator about where to look. That is the same shape as the route-table defect the
  Phase 2 audit found, where the recorder and the scans agreed with each other about an enumeration that did
  not match the router, and it is why that repair added reconciliation against an independent view. The
  conformance gate has no such second view: it compares a file against a renderer, and both sides are this
  tool. What it would take is a check that the rendered table appears exactly once in the file.
- **Documenting a mechanism should not be able to break it.** The prose was accurate, was written to help a
  seeded project opt in, and was the payload. Any generator that locates its output by scanning for a literal
  has this property, and the catalog has no claim about it. Recorded here rather than proposed as a claim,
  because one instance is not a pattern yet.

### E-3. DEP-1 reads `proven` over a pin set carrying a critical advisory, and DEP-2's trigger defers the only mechanism that would say so

Found in Phase 2, on the first `npm install` of the new edition.

Installing the shared tier's toolchain pins produced 12 advisories, one critical and eleven high:
GHSA-5xrq-8626-4rwp (arbitrary file read and execute via the Vitest UI server) against `vitest` below 3.2.6, and
GHSA-mh99-v99m-4gvg (`brace-expansion` denial of service) reaching `eslint` below 10 through
`@eslint/config-array`. The shared client pins `vitest` 3.1.4 and `eslint` 9.27.0, so both ranges cover it.

DEP-1's mechanism is exact pins, committed lockfiles, locked-mode restore, a cooling window (90 days when this
was found, 30 after the window pass), and a ledger
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

**Owner ruling, window pass 2026-07-26.** The window is cut from 90 days to 30, on the grounds that 90 is
excessive in practice, with this finding as the evidence. Consequences, separated because they are not the same
kind of thing:

- **The instance is resolved.** At 30 days the `vite` conflict does not arise: 6.4.3 (2026-06-01) clears both
  the window and the advisories. The whole client bump becomes tractable, and becomes a smaller step than the
  one proposed above, because releases that were too fresh at 90 days are now available. It should be
  re-planned against the new window rather than executed as written; in particular the vitest jump to 4.x may
  no longer be necessary, since 3.2.6 (2026-06-01) now clears.
- **The catalog gap is NOT resolved, and must not be recorded as if it were.** Shortening the window makes the
  conflict less likely and cannot make it impossible: a window of any length can still fail to overlap the set
  of releases that clear a live advisory, and DEP-1 still says nothing about what to do then. The number moved;
  the missing rule did not appear. This finding therefore stays open on that point, and the adjudication pass
  still owes DEP-1 a sentence naming the resolution order and whose decision it is.
- **A recorded tension the ruling reopens.** The 90-day value came from invariants pass R12 with the reason
  "the former 30-day default contradicted the owner's standing 90-day policy". That standing policy lives
  outside this repo and is unchanged. Reverting the catalog to 30 recreates exactly the contradiction R12
  resolved, in the opposite direction, and a future invariants pass reading only R12's reasoning would flip it
  back. Either the standing policy moves to 30 as well, or DEP-1 should record that the catalog's number is
  deliberately independent of it. Flagged at the time of the ruling rather than left for rediscovery.

**Executed 2026-07-26 by the flow-back pass, re-planned against the 30-day window rather than run as written, and
verified in both editions.** Measured before: 14 advisories, 1 critical and 13 high, confirming this finding's
corrected count exactly.

The re-plan is gentler than the version list this finding first proposed, as the window ruling predicted:

| Package | From | To | Published | Why |
|---------|------|----|-----------|-----|
| vitest | 3.1.4 | 3.2.6 | 2026-06-01 | clears the critical GHSA-5xrq-8626-4rwp; the jump to 4.x is not needed at 30 days |
| vite | 6.3.5 | 6.4.3 | 2026-06-01 | clears seven advisories; no escape to vite 7 or 8 needed, so `@vitejs/plugin-react` 4.5.0 stays (it peers `^6.0.0`) |
| eslint | 9.27.0 | 10.4.1 | 2026-05-29 | clears the brace-expansion/minimatch chain GHSA-mh99-v99m-4gvg |
| typescript-eslint | 8.32.0 | 8.60.1 | 2026-06-01 | same chain; peers `^10.0.0` |
| eslint-plugin-react-hooks | 5.2.0 | 7.1.1 | 2026-04-17 | the fourth pin this finding's correction identified: 5.2.0 peers `^9.0.0` and will not accept eslint 10 |

Measured after: **1 root advisory, 0 critical.** Both editions' `client-web` install from the committed lockfile
with `npm ci` and pass `npm run verify` (tsc, 16 tests, eslint), which is the two-edition verification this
finding said the change owed and the reason it was queued rather than smuggled into a scaffolding change.

**The catalog point this finding keeps open is not closed, and the evidence got stronger.** The one remaining
advisory is `postcss` GHSA-r28c-9q8g-f849, reached transitively through `vite`, and it has no version satisfying
both the 30-day window and the advisory. So the window-versus-advisory conflict recurred immediately in a
different package at the shortened window, which is what this finding predicted when it refused to let the ruling
record the gap as resolved. Filed as E-18, separately, because the genuinely new part is what unpinned resolution
does when both rules are invisible to it. DEP-1 still owes the resolution order.

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

### A-2. TEN-1 names four surfaces and every mechanism in the catalog reaches three

**Claim:** TEN-1. **Locus:** `centralized`. **Found:** Phase 3, building TEN-1's step 2 before reading the
sibling. **Class A confirmed; class C refuted.** This is the finding Phase 3 was most likely to produce and it
did not come out where it was expected to.

TEN-1's statement names four surfaces: "Tenant identity never travels as a route, query, header, or body
parameter". Its mechanism class names two mechanisms: a route-table scan and a contract reflection scan. The
step-2 design predicted that the header surface would be the one Node could not reach, and gave the reason
before looking: three of the four surfaces are DECLARED and closed, so `additionalProperties: false` makes the
declared set the accepted set and a scan over the declaration is a true statement about what arrives. Headers
cannot be closed by anyone. Every request carries `host`, `user-agent` and `accept` whether or not a route
declared them, and `request.headers` is readable in full regardless. So a scan over the route table can see a
declared header and can say nothing at all about a read one.

The prediction was right about Node and wrong about what it meant, because **the sibling does not reach headers
either**. `EndpointSpineTests.ParameterNames` walks route-pattern parameters and handler method parameters, and
nothing in it looks at a header. A `[FromHeader] string tenantId` is caught by accident, since the scan yields
the name of every scalar-typed parameter without caring which source binds it, and a header read ad hoc off
`HttpContext` is not caught at all. TEN-1 has read `proven` in a shipped edition for one surface it has never
checked.

**Confirmed 2026-07-26 by the round 4 audit, which re-derived it from source and measured the incidental catch
against a real ASP.NET host. Three corrections, and the third makes the finding bigger.**

1. The incidental catch is real and narrower than it reads. The filter is on TYPE, via `BindsFromUrl`, and no
   binding-source attribute is read anywhere in the file except `[AsParameters]`. So `[FromHeader] string
   tenantId` is yielded, and `[FromHeader] TenantKey tenantId` where `TenantKey : IParsable<TenantKey>` is not,
   and neither is `[FromHeader] StringValues`. Both of the latter build and bind.
2. `[FromHeader] SomeComplexType` cannot exist: the analyzer makes it a compile error and the endpoint builder
   throws. That half of the hypothetical is moot. Conversely a header-bound property inside an `[AsParameters]`
   wrapper IS caught, because that branch yields every property name with no type filter at all.
3. **"Reaches three of four surfaces" is too generous, and the QUERY surface is holed by the same predicate.**
   `MapGet("/notes", (TenantKey tenantId) => ...)` binds `?tenantId=` through the real binder and yields nothing
   to the scan; so does `(TimeSpan dob)`, and `dob` is on the PII list. Only the ROUTE surface is total, because
   the route-pattern loop reads `RoutePattern.Parameters` and never consults a type. The honest tally is: route
   total, query type-dependent, header type-dependent and only when declared, body separate. Wrapping an id in a
   strong type is a normal maturation step and it silently blinds the scan, which makes this the direction a
   codebase drifts into rather than out of.

So this is not a portability finding. It is a gap in the claim that a single-edition catalog structurally could
not surface: with one witness, the mechanism IS the claim, and a surface the mechanism never touches is
indistinguishable from a surface no attacker uses.

**What was done instead:** the node edition covers the fourth surface with a mechanism the claim does not name.
Not a scan but a strip, in the composition root, before any handler: an `onRequest` hook installed in the same
expression that creates the instance removes every header whose tokenized name matches the tenant registry.
Measured to remove `x-tenant-id`, `x-org-id` and `x-workspace-slug` while leaving `x-request-id` and `host`
intact. The declared-header half is still scanned, as a second view, so a route that DECLARES such a header is
reported rather than silently handed a value that can never arrive.

Two consequences for the adjudication pass, separately:

- `centralized` **survives**, by a mechanism class the claim does not contain. That is the same shape as B-1
  (the locus is reachable, the mechanism class is not portable as written) with the roles of the two halves
  swapped: here the mechanism class is not merely stack-specific, it is absent in both stacks.
- The strip is silent by design, which is a real cost. Refusing the request was the alternative and was rejected
  for consistency with how an undeclared body field is already handled (stripped, not refused) and because a
  stray header from a confused client should not become a failed request. The cost is that a caller attempting
  the attack learns nothing and neither does anyone else, and OBS-2 (security event log) is owed in both
  editions, so there is nowhere to record the attempt. Recorded rather than resolved.

### A-3. SEC-1's fallback and SEC-1's scan are independent only where the enumeration is free

**Claim:** SEC-1. **Locus:** `centralized`. **Found:** Phase 3, step 2, before reading the sibling.

SEC-1 asks for two mechanisms and calls one "the belt to the scan's braces". A belt and braces mean something
only if they can fail separately. In the sibling they plainly can: the scan is a reflection test in one process
and the fallback is host configuration in another, so their independence is a free consequence of the
build-time/runtime split that `EndpointDataSource` makes possible.

In Node the enumeration is only obtainable at boot, which S-5 already establishes. So a scan over it and a boot
refusal are the same event, in the same process, in the same expression, and the naive realization produces one
mechanism wearing two names. Worse, it produces one that cannot be tested: if the scan refuses an ungated route
at boot, no test can compose an ungated route, and the claim's explicit demand for a test that the fallback
"actually denies anonymous callers, not merely that it is registered" becomes unsatisfiable by construction.

The independence is buyable and the currency is not obvious, which is why this is a finding rather than an
implementation note. **The two mechanisms are split by what they consult, not by when they run.** The scan reads
the route table and never issues a request; the fallback reads the request and never reads the table. Each then
covers precisely what the other cannot: the scan sees a route nobody has called, and the fallback sees a URL no
route serves.

**What was done instead:** built that way, and the second half turned out to be worth more than the argument for
it. See A-4.

**For the adjudication pass:** S-5 proposes that a portable mechanism class has three parts (surface, predicate,
completeness obligation). This finding suggests a fourth thing the catalog does not have words for. Where a
claim names two mechanisms and asserts a relationship between them ("belt to the braces"), the RELATIONSHIP is
part of the claim and is not portable for free. Naming the two mechanisms and leaving their independence to be
inferred is how an edition ends up with one mechanism and two names for it.

### A-4. The residual hole S-5 calls irreducible is closed by SEC-1's other mechanism

**Claims:** SEC-1, and every claim that inherits S-5's residual. **Found:** Phase 3, measured. **This corrects
S-5 above rather than adding to it.**

S-5 records, as its one irreducible limitation: "A hook that answers a request without registering a route
serves a URL the enumeration cannot contain: the spike leaked a query string from `/ghost` with a route table of
length zero. The .NET analogue is middleware that short-circuits before routing. **Neither claim names it.**"
The Phase 1 spike measured it, Phase 2 asserted it as a passing test so a future closure would break the test
rather than pass unnoticed, and the register called it irreducible and shared.

Measured after SEC-1's fallback landed: `/ghost?email=a@b.com` returns 403 with an empty route table and no
leaked query string, and an unmatched URL returns 403 rather than 404. The hole is closed.

The reason it closes is general and is the useful part. The fallback consults the request rather than the table,
so it does not care whether a route exists; and `createApp` installs it in the expression that creates the
instance, so a hook that would answer the request is by construction a later hook and never runs. **The hole was
never irreducible. It was irreducible for a route-table scan**, and S-5 generalized from the mechanism it was
studying to the claim, which is the error S-5 itself exists to name. The catalog already contained the closure,
one claim over, in the half of SEC-1 the register had not yet built.

What remains true, narrowly: the route TABLE still cannot see such a URL, so every scan built on the table is
still blind to it, and a claim whose only mechanism is a table scan still carries the residual. What is no
longer true is that the URL is reachable.

The Phase 2 test that asserted the hole is rewritten in place, with the old assertion and the reason it changed
kept in the test body. That is the discipline working exactly as designed and is the first time it has fired.

**Refuted 2026-07-26 by the round 4 audit. The hole was not closed, and the closure argument was sound about
the only case it considered.** Measured: `/ghost?email=a@b.com&tenantId=forged` returned **200** with the full
query string leaked, a route table holding two entries, `eslint` clean and `tsc` clean.

The argument was "`createApp` installs the fallback in the expression that creates the instance, so a hook that
would answer the request is by construction a LATER hook and never runs". Every word of that is true. It is a
statement about hooks, and the evasion is not a hook. Fastify hands out the raw `http.Server` as `app.server`,
on the instance every module already holds, so a route module can take over the server's `request` listener and
sit BELOW the framework's dispatcher, which puts it below every hook there is. No framework import, no
`node:http` import, no `createRequire`, no dynamic import: the socket ban governs imports and there was nothing
to import.

Two things worth separating, because they are different lessons.

- **The mechanism half.** A fallback that consults the request rather than the table does close the hole against
  everything the framework's own request pipeline can express. What it cannot close is a competitor to that
  pipeline, and "installed first" is only a total order among things that agree to queue. Repaired by banning
  `.server` outside the composition root, which is the same shape as the existing socket ban aimed at the
  affordance rather than at the import. The demonstrated evasion is now a lint error.
- **The reasoning half, and this one matters more.** This register declared an irreducible limitation reducible
  on the strength of one measurement plus an argument, and the argument quantified over the wrong set. S-5's
  original bullet was closer to right than its correction was. The honest statement now: the hole is closed
  against every mechanism the framework's request pipeline offers, and it is closed against the one evasion
  below that pipeline that anybody has thought to try, by a lint, which is the weakest kind of closure this
  edition has. A residual remains and is stated rather than argued away: `request.raw.socket.server` reaches the
  same object from inside any handler, so a handler can install a listener for subsequent requests, and no lint
  can see every path to an object the framework deliberately exposes.

**What this does to the seeded hypothesis.** The row reading "refuted" is downgraded to "partly refuted": the
hole is not a property of route-table scans alone, as A-4 correctly established, and neither is it closed. It is
narrowed to below the framework pipeline, and it is held there by a lint rather than by construction.

### E-6. The sibling's SEC-2 scan is flat, and the register said it recursed

**Claim:** SEC-2. **Status carried:** `proven`. **Found:** Phase 3, step 3.

B-2's comparison table above credits the sibling with "reflection recurses types" for nested objects, array items
and `allOf`. Measured, it does not. `EndpointSpineTests.BindableMemberNames` yields a type's own public
properties and its constructor parameters and never descends into a property's type or a collection's element
type. `ContractShapeTests` enumerates only types whose name ends in `Request`, so a nested `AuthorDto` in the
contracts assembly is not merely un-recursed, it is never enumerated.

So a request body of the shape `CreateNoteRequest(string Title, AuthorDto Author)` where `AuthorDto` carries
`CreatedBy` passes both SEC-2 guards. No live instance exists, because the shipped contracts are flat records,
which is why this is a hole in the guard rather than an open vulnerability. It is exactly the kind of hole that
opens the first time a product nests a DTO, which every product does.

**Corrected 2026-07-26 by the round 4 audit, on the premise rather than the conclusion, and the correction is
this finding repeating the error it was written to name.** The reflection half is confirmed exactly as stated:
`BindableMemberNames` yields a type's own public properties and its constructor parameters and descends into
nothing, and `ContractShapeTests` filters on `Type.Name.EndsWith("Request", StringComparison.Ordinal)` within
`typeof(CreateNoteRequest).Assembly`, so a nested `AuthorDto` is never enumerated. Both were re-derived from
source and reproduced by lifting the reflection code verbatim into a throwaway host.

**"The shipped contracts are flat records" is false.** `NoteListResponse(IReadOnlyList<NoteResponse> Items,
string? NextCursor)` is a contract type whose property is a collection of another contract type, and the nested
`NoteResponse` carries `Id` and `CreatedAtUtc`, both on the forbidden registry. The nesting shape and the
forbidden names already ship. The correct statement is narrower and weaker than the one this finding made: no
nested contract type currently sits on the REQUEST side of a route. This register asserted a property of the
sibling's contracts without enumerating them, in a finding whose entire subject is asserting a property of the
sibling's mechanism without reading it.

Two things the audit added that make the hole worse than recorded:

- **The edition itself states the false claim, in two machine-read places.** `kernel/dotnet-react/README.md` and
  `kernel/dotnet-react/conformance.json`'s SEC-2 row both say `EndpointSpineTests` scans every body-bound DTO
  "nested and immutable constructor-bound DTOs included". E-6 said the register claimed recursion; measured, the
  conformance ledger carrying SEC-2 as `proven` claims it too. That is the row a seeded project reads.
- **`IsBodyDto` has a fifth exclusion nobody has written down**, `type.Namespace is null`. A public DTO declared
  in `Program.cs`, which has top-level statements and therefore no namespace, is skipped by the body scan
  entirely, and `NamingPlacementTests` explicitly exempts `Program.cs` from the one-public-type rule. Measured in
  a scratch minimal API: the global-namespace record binds and returns 200. E-2's enumeration of the exclusions
  is four items long and there are five.

Two things are being corrected at once, and the second matters more. The register asserted a property of a
mechanism it had not read, in a table whose entire purpose was to compare the two realizations, and the
assertion was favourable to the side that was not measured. The Node column of that table was measured against a
spike; the .NET column was inferred from what the mechanism ought to do. **B-2's table is corrected in place.**

The Node realization walks `properties`, `items`, and `allOf`/`anyOf`/`oneOf`, and each depth is a separate
red-green proof.

**Repaired 2026-07-26 by the flow-back pass, one guard of the two, and the surviving half is named.**

`EndpointSpineTests.BindableMemberNames` now recurses: into property types, into constructor parameter types, and
through `Nullable`, arrays and generic arguments, so a collection element is walked like any other member. `seen`
is cycle protection rather than a depth cap, deliberately, because a maximum depth is the same bug with a larger
constant (E-10).

**Proven in both directions against a real endpoint, not only against a fixture.** `CreateNoteRequest` was given
the exact shape this finding describes, a nested `AuthorDto` carrying `CreatedBy`. With the repaired walk the
SEC-2 endpoint scan is RED. With the recursion disabled and the same violation still planted it is GREEN, which
reproduces the hole as recorded rather than taking the record's word for it. Reverted, the suite is green.

A separate `[Fact]` asserts the walk's depth directly, because the composed host binds only flat request records
today, so the endpoint scan cannot reach a nested violation and the walk could silently go flat again without any
test noticing. That is exactly how the flat walk survived while two shipped artifacts described it as recursive.

**`ContractShapeTests` is still flat and is NOT repaired here.** It enumerates only types whose name ends in
`Request`, so a nested `AuthorDto` is never enumerated. That test belongs to MOD-2, which has not had its delta
pass, and opening it to repair it would destroy that pass permanently. Recorded as blocked on MOD-2's delta rather
than done or forgotten. The practical exposure is smaller than it sounds: the host scan is the guard that reaches
every body-bound type on a real route, and it now recurses, so the request surface is covered by the guard whose
job it is. The Contracts-assembly scan is a second net that remains one level deep.

### E-7. SEC-1's fallback admits every authenticated caller, and the test that would notice reads a field

**Claim:** SEC-1. **Status carried:** `proven`. **Found:** Phase 3, step 3.

Two defects that compose, in the mechanism SEC-1 is named for.

**The fallback is not deny-by-default.** `Program.cs` registers
`SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build())`. An endpoint with no
authorization metadata is therefore reachable by every authenticated caller in the system, with no permission,
across tenants. SEC-1's statement asks for a fallback such that a forgetful endpoint is "unreachable, not
public", and one sentence earlier the same claim forbids exactly this gate: "Bare 'authenticated is enough'
registrations are rejected". The claim rejects bare authentication at the endpoint and then accepts it as the
floor, and the realization takes the floor at its word.

**The test cannot see it, and could not see a larger failure either.** The claim's mechanism class is explicit:
"a host test asserting the fallback policy actually denies anonymous callers, not merely that it is registered".
The realization asserts that `IOptions<AuthorizationOptions>.Value.FallbackPolicy.Requirements` contains a
`DenyAnonymousAuthorizationRequirement`. That is reading the registration one level deeper. It never evaluates
the policy against a principal, never composes an endpoint with no authorization metadata, and never observes a
status code, so it cannot distinguish a host that applies the fallback from one that never calls
`UseAuthorization()` at all. A test whose own comment says "Non-null is not enough: assert it actually rejects
anonymous callers" asserts the presence of an object in a list.

This is the third instance of the pattern E-4 names, and the sharpest, because here the claim spelled out the
distinction in advance and the realization crossed it anyway. **The `proven` bar is "a mechanism exists and a
test proves it binds", and nothing checks that what the test binds to is what the claim says.** SEC-1 is the
claim most likely to be read by someone deciding whether the kernel is safe.

**What flows back:** the fallback should deny outright rather than require authentication, which costs nothing
because the scan already guarantees every real endpoint names a policy; and the fallback test should compose an
endpoint carrying no authorization metadata and assert the response, which the scan currently prevents only
because scan and fallback are not separated (see A-3). The Node realization does both, and both are red-green
proven, including the case the sibling cannot express: an ungated route denied to a caller holding a valid
credential with every permission in the system.

**Corrected 2026-07-26 by the round 4 audit, which RAN the sibling's suite. Both halves need restating, and the
first is a correction to this whole register.**

**The .NET architecture suite is runnable in this environment, and every prior pass recorded that it was not.**
`KernelApiFactory` strips the SQL Server registration and substitutes a temp-file SQLite database, so only
`Kernel.Tests.Integration` needs Docker. Baseline: 49 of 49 passing. Three passes of this register have marked
sibling verdicts "read-from-source" on the strength of an assumption nobody tested, which is the same shape as
every finding here.

**E-7a: the mechanism is confirmed and the exposure is smaller than stated.** `SetFallbackPolicy(new
AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build())` is exactly as quoted, and a metadata-free
endpoint added to the test host returned 200 to a caller with no permission. But the pipeline adds two
preconditions the finding does not mention: `SessionVersionMiddleware` requires a matching `sv` claim and
`TenantScopeMiddleware` requires a parseable non-empty `tenant_id`, both before `UseAuthorization`, so the caller
must be authenticated AND session-valid AND tenanted, not merely authenticated. More important, the hole is
**latent and test-guarded**: every shipped endpoint carries `AllowAnonymous` or a `perm:` policy, and adding one
that does not turns `EndpointSpineTests` red with the message naming SEC-1. The honest statement is that the
runtime fallback is not what prevents the hole; a test is.

**E-7b is refuted as stated, and the underlying gap is real and sharper than the finding argued.** The named test
is in `EndpointSpineTests.cs`, not `HostSecurityTests.cs`. Deleting `app.UseAuthorization()` turns **13 tests
red**, not zero: the framework auto-inserts the middleware ahead of `UseRouting`, so it sees no endpoint and no
principal and denies everything, and the suite notices loudly. That specific counterfactual was wrong.

What is right, and was found by looking for the mutation the test genuinely cannot see: the host ships its own
`IAuthorizationPolicyProvider`, and `AuthorizationMiddleware` takes the fallback from **that provider**, not from
`IOptions<AuthorizationOptions>`. Changing `PermissionPolicyProvider.GetFallbackPolicyAsync()` to return null
leaves all 49 tests green, `The_fallback_policy_denies_by_default` included, and opens every metadata-free
endpoint to a caller with no token at all. So the finding's thesis holds exactly: the test asserts the presence
of an object in a list and cannot distinguish a fallback that is configured from one that is never consulted.
The finding simply named the wrong lever. Two further mutations show the test is also load-bearing and alone:
deleting `SetFallbackPolicy`, or replacing it with `RequireAssertion(_ => true)`, fails that one test and nothing
else.

### E-8. SEC-1's allowlist has nowhere to write the justification SEC-1 requires

**Claim:** SEC-1. **Status carried:** `proven`. **Found:** Phase 3, step 3. Recorded separately from E-7 because
it is a governance defect rather than a security one.

SEC-1's weakening notes rule that carve-outs "must be named in the scan itself with a justification comment,
mirroring TEN-5 discipline", and its statement requires the anonymous allowlist to be "reviewed as a security
surface". The realization is `private static readonly string[] AnonymousAllowlist = ["/health"];`. There is no
field for a reason, and the failure message instructs the author to "add it to the allowlist with a
justification" that the data structure cannot hold.

Three smaller defects sit in the same three lines:

- **The key is a path, not a method and a path.** Allowlisting a health GET pre-authorizes every future method
  on that URL, including a POST nobody has written yet. SEC-1's harm paragraph names an anonymous POST as one of
  its three live failure shapes.
- **Nothing detects a stale entry.** An allowlist entry matching no endpoint survives forever. A list that can
  only grow is not a surface anyone reviews; it is a set of pre-authorized holes waiting for a URL to be
  re-registered under one.
- **Anonymity has no home in HUM-1.** SEC-1 requires the allowlist to be a reviewed surface, and the edition's
  review mechanism is HUM-1, whose repaired form (S-7) fixes exactly three irreversible-surface categories in
  the shared tool and lets an edition declare only WHERE each lives. There is no fourth slot, so the one surface
  SEC-1 explicitly calls a security review surface is the one surface HUM-1 cannot cover. Left as a finding
  rather than repaired, because S-7's whole point was that an edition may not invent a category unilaterally.

  **Refuted as stated, 2026-07-26 by the round 4 audit.** The three categories are an enforced FLOOR, not a
  ceiling. The shared linter iterates `Object.entries(IRREVERSIBLE_SURFACES)`, the tool's own three, and indexes
  into the edition's object; it never enumerates the edition's keys, so a fourth category is **ignored, not
  rejected**, and an edition declaring one lints green today. The same file shows the author knew how to close a
  set when they meant to, because the DEP-1 path fails on an unknown surface `kind` by name. Second, nothing
  checks that CODEOWNERS contains only the declared paths, so an edition wanting a human turn on its anonymous
  allowlist can add that line today and stay green. The real gap is weaker and more precise than "nowhere to
  live": there is nowhere to declare it such that the shared tool will VERIFY an owner exists, so the coverage
  would be unenforced convention rather than a checked gate. That is still worth an adjudication ruling, and it
  is a different ruling from the one this finding asked for.

  The SEC-1 half of E-8 is confirmed in every particular, and one detail is worse than recorded: the sibling's
  allowlist carries not even the justification COMMENT the .NET build brief says it has. The matching is
  `AnonymousAllowlist.Contains(pattern)` with the default ordinal comparer, so it is case-sensitive equality on
  route-pattern text, which fails closed on a `/Health` spelling and does not rescue the method-blindness.

**What was done instead:** the Node allowlist is a frozen list of `{method, url, why}`, the staleness check is a
scan violation with its own red proof, and the HUM-1 gap is recorded here for adjudication rather than closed by
inventing a category.

**Repaired 2026-07-26 by the flow-back pass. All four defects of the SEC-1 half, each proven separately.**

`AnonymousAllowlist` was `string[] ["/health"]`. It is now an `AnonymousCarveOut(Method, Pattern, Why)` record
array with one entry, `GET /health`, carrying its reason.

- **Method blindness.** The key is a method AND a pattern, and every method an endpoint answers is judged
  separately against the framework's own `HttpMethodMetadata`. Proven: an anonymous `MapPost("/health", ...)`,
  which the old path-keyed list pre-authorized, turns the scan red.
- **Nowhere to write the reason.** `Why` is a field and is asserted non-trivial. Proven: replacing the
  justification with `"because"` turns the scan red. The failure message no longer instructs an author to supply
  something the data structure cannot hold.
- **No staleness detection.** Entries matching no endpoint fail. Proven: adding a carve-out for `GET /metrics`,
  which nothing registers, turns the scan red. A list that could only grow is now a list that has to be true.
- **Case-sensitive matching.** Comparison is `OrdinalIgnoreCase` on both method and pattern, matching ASP.NET
  routing's own case-insensitivity, so a `/Health` spelling no longer walks past the allowlist.

The HUM-1 half is untouched and stays open exactly as the round 4 audit restated it: the gap is not that there is
nowhere to declare an anonymous-allowlist review surface, it is that there is nowhere to declare one the shared
tool will VERIFY, and that is an adjudication ruling rather than a repair.

### E-9. Both editions' name registries fail on morphology, and both claims blame novelty

**Claims:** SEC-2, SEC-3, TEN-1. **Found:** Phase 3, step 3.

Every claim in this family calls its registry a heuristic and every one of them names the same weakness. SEC-3:
"a novel parameter name carrying PII escapes it". SEC-2: "a field named `newState` slips past a registry listing
`status`". Both are true, both are about a name nobody thought of, and neither is the failure that actually
occurs.

The sibling matches with `hashSet.Contains(name.ToLowerInvariant())`, which is equality. So `email` is on the
list and `emailAddress` walks past it; `status` is on the list and `noteStatus` walks past it; `createdAt` is on
the list and `createdAtUtc` walks past it. No novelty is required and no synonym is required. The registries
partly compensate by hand-enumerating `firstname`, `lastname`, `dateofbirth` and `organisationid` as separate
entries, which is enumeration standing in for a comparison, and it still misses every compound built on a listed
word.

**The finding is not that equality is the wrong comparison.** It is that three claims describe their shared
mechanism's weakness in terms of the registry's CONTENTS and none of them says anything about the COMPARISON,
so an edition can satisfy every word of all three claims with a matcher that fails on the most common naming
convention in the language it is written in. This is S-5's shape aimed at a third part of the mechanism: surface,
predicate, completeness obligation, and now the predicate's own resolution.

**What was done instead:** the Node matcher splits a name into tokens on camel case, underscores and hyphens and
matches a registry entry as a contiguous run of them, so `emailAddress`, `user_email`, `EMAIL`, `userSSN` and
`createdByUser` all match entries the sibling's would miss. The cost is stated rather than discovered: `name` is
a bad registry entry, `fileName` tokenizes to `file name` and matches it, and that false positive is asserted as
a passing test so it is visible in the suite rather than found by the first project that wants a filename in a
query string. `id` is a whole-name entry for the same reason in reverse, since a run would flag every foreign key
a legitimate body carries.

**Corrected 2026-07-26 by the round 4 audit, on two points, and the second inverts the finding's conclusion.**

1. **One of the four exhibits is refuted.** `createdAtUtc` does NOT walk past the sibling: `ServerControlledFields.Names`
   hand-enumerates `"CreatedAtUtc"` and `"UpdatedAtUtc"` alongside `"CreatedAt"` and `"UpdatedAt"`, so the
   OrdinalIgnoreCase equality fires and the guard catches it. The finding's own next paragraph names the
   mechanism that refutes it (the sibling compensates by hand-enumeration) without noticing it covers this
   example. Three of four exhibits stand, and the thesis stands on them; `createdAtUtc` is withdrawn and
   `noteState`, `ownerRole` or `phoneNumber` are the honest replacements.
2. **"The Node registries are shorter for it" and "catching strictly more" were both false, and the second was
   the load-bearing claim.** The two matchers are **incomparable, not ordered**. Tokenizing beats equality on
   every spelling that carries a boundary and LOSES to it on every all-lowercase concatenation, because
   `firstname` is one token and shares none with `name`. Measured, `firstname`, `lastname`, `dateofbirth`,
   `tenantid`, `orgid`, `organizationid` and `organisationid` all walked past the Node matcher, and every one of
   them is a hand-enumerated entry in the sibling's list. The hand-enumeration this finding characterizes as
   "enumeration standing in for a comparison" is doing real work that the token matcher does not replace.

   The registries.ts comment made the error twice over: it listed `dateOfBirth` as an entry with the stated
   reason that `dateofbirth` as one lowercase word cannot be derived, and the ENTRY is tokenized too, so
   `dateOfBirth` reduces to the run `date of birth` and never matched `dateofbirth` at all. The entry named its
   own purpose and did not serve it.

   Where this bit hardest is TEN-1's header surface, and the reason is structural rather than incidental: **Node
   lowercases every header name before any hook sees it**, so `X-TenantId` and `X-TenantID` both arrive as
   `x-tenantid`, and the tokenizer's camel-case half, which is the entire source of its advantage, is
   unavailable on that surface by construction. Measured over real HTTP: `x-tenant-id` was stripped and
   `X-TenantId` reached the handler carrying its forged value. See E-10.

   Repaired by adding the concatenated spellings to both registries, with the prefix alternative rejected and
   asserted against: `org` as a prefix matches `origin`, an ordinary request header, and stripping that would
   break more than it protects.

3. **A third class, found by running the inputs rather than reasoning about them, and missed by both editions.**
   The two corrections above are about concatenation. These are not: `e_mail`, `e-mail` and `EMailAddress` all
   tokenize to a run containing `mail` and none containing `email`, so a DECOMPOSITION of a listed word escapes;
   `emails` is a plural, and a token is not stemmed; `email1` is a numbered field, which is the ordinary way a
   form carries a second address, and the tokenizer treated the digit as part of the word. Six inputs, all
   carrying an email address, all walking past a list whose first entry is `email`.

   The sibling misses all six too, by equality. So this is not a Node defect and not a scoreboard entry: it is
   the third distinct morphological class in one claim family, and the claims name none of them. Note also that
   `SERVER_CONTROLLED_FIELDS` already knew about plurals, carrying `role` beside `roles`, and the PII list did
   not, which is enumeration solving a problem in one registry and not in its neighbour because nobody wrote the
   rule down anywhere.

   Repaired: the tokenizer splits letters from digits, and `mail`, `emails` and `phones` are entries. `mail` is
   safe as a run rather than a substring, asserted against: `mailbox` and `voicemail` are single tokens and do
   not match, `mailTo` does.

   **What this does to the finding's thesis:** it survives and gets sharper. The claims still say nothing about
   the comparison, an edition can still satisfy every word of all three with a matcher that fails on the most
   common naming convention in its language, and the round 4 evidence is that the SECOND edition did exactly
   that, in the opposite direction from the first, while its own comment claimed otherwise. Neither matcher is
   the right answer; the catalog's silence on the comparison is what let two editions each pick a different
   half of it and each believe they had picked the whole.

### S-8. The conformance vocabulary has no value for a claim that is half realized

**Claim:** TEN-1, and structurally any claim whose statement contains separable obligations. **Found:** Phase 3,
writing the conformance row.

`conformance.json` admits four statuses and `kernel/claims/README.md` defines them: `proven`, `patterned` (a
per-seam claim whose v1 seams are tested), `latent` (built but never run against a real surface), and `owed`.
All four are properties of ONE mechanism, and they assume a claim is atomic.

TEN-1 is not. Its statement is a prohibition ("tenant identity never travels as a route, query, header, or body
parameter") and a resolution rule ("the tenant a request operates in is resolved solely from the validated
authentication credential"). In this edition the prohibition is realized on all four surfaces and red-green
proven, and the resolution rule has no mechanism at all, because minting a credential is SEC-4 and TEN-6 and
both are owed in both editions. No status says that. `proven` overstates by claiming a resolution rule that
cannot run; `latent` is wrong because the built half runs against three real routes on every boot; `owed`
understates so badly that a reader would conclude tenant parameters are unguarded.

**What was done instead:** `owed`, deliberately, with the mechanism string naming what is built and proven and
the note naming what is missing. The conservative direction is chosen on purpose: a security claim that reads
better than it is, is the precise failure the catalog exists to prevent, and one that reads worse costs a reader
thirty seconds. The right repair is an adjudication decision and there are at least two shapes (a per-obligation
status, or splitting TEN-1 into two claims), so it is not pre-empted here. It composes with S-1, which is the
same schema under a different pressure.

**The other side of it, argued 2026-07-26 by the round 4 audit, because a status chosen "deliberately" by the
person who benefits from the choice is exactly the thing an audit should not wave through.**

The case for raising it is real and has three legs. First, `owed` has a DEFINITION in
`kernel/claims/README.md`, and overloading a defined term to mean "half built" makes every other `owed` row
ambiguous: this edition now reports 66 of 69 owed, and a reader cannot tell from that number how many are
nothing and how many are most of the way. Second, S-3 established that the generated table is the artifact
people actually read, and the table carries the status word, not the mechanism string; the mitigation lives in
the column nobody reaches. Third, `patterned` exists precisely for a claim whose seams are tested, and TEN-1's
prohibition half is tested across all four of its surfaces.

It still loses, on three counts. The `patterned` leg fails on the definition: it is scoped to per-seam claims,
and TEN-1 declares `centralized`, so taking it would misreport the locus to fix the status. The cost asymmetry
is not symmetric in the way the "reads worse costs thirty seconds" phrasing suggests, and the real argument is
sharper than that: the thing missing is not a decoration on the prohibition, it is the claim's OTHER half, the
rule that says where tenant actually comes from. An edition that prohibits four channels and cannot resolve the
tenant at all has not made tenancy safe; it has made it absent. A status implying otherwise would be wrong in
the direction that gets a product shipped.

And the audit supplied evidence that did not exist when the choice was made. The prohibition half, the very half
the raise-it argument rests on, was itself overstated: `X-TenantId` and `X-OrgId` walked past the header strip
over real HTTP, and the concatenated spellings only landed after they were measured. The half that was called
"realized and red-green proven" was neither, on the surface it was proudest of. That is a direct argument for
the conservative reading rather than a general appeal to caution, and it is the second time in this run that the
builder's confidence in a half-built mechanism turned out to be the unreliable part.

**Verdict: `owed` stands, and the reasoning for it is now stronger and different from the reasoning originally
given.** The adjudication question is unchanged and is the real repair: the vocabulary has no value for a claim
with separable obligations, and choosing the least-wrong of four is not a fix.

### E-10. A closure obligation has a depth, and stating it without one bought the property at level zero

**Claims:** SEC-2, TEN-1 (contract half), and structurally every claim whose surface is a nested declaration.
**Found:** round 4 audit, measured. **This is the finding of the round, and it is a sharpening of S-5 rather
than a new class.**

S-5 proposes that a portable mechanism class has three parts: surface, predicate, and a completeness obligation.
The Phase 2 audit added that the obligation has a **when**, because an enumeration taken before the registered
set is closed is not complete. Round 4 adds that it has a **depth**, and the evidence is the same shape a third
time: the obligation was stated, believed, mechanized, red-green proven, and true of exactly one level.

The Node edition's whole argument for being the stronger SEC-2 realization is B-4: a body schema closed with
`additionalProperties: false` is not a description but a runtime filter, because Fastify validates with
`removeAdditional`, so the declaration a scan reads IS the object the handler receives. Measured, `removeAdditional`
strips at the level that closes itself and at no other, and nothing required a nested level to close itself. A
body closed at the top with an open `author` object delivered `{author: {nick: 'n', tenantId: 'FORGED',
createdBy: 'FORGED'}}` to the handler with the scan reporting nothing. The same held inside array items. Two
further shapes were live evasions rather than merely blind spots, `patternProperties` being the sharp one
because it survives both the walk and the filter.

**The general statement, for the adjudication pass.** Where a mechanism's surface is a nested declaration, the
completeness obligation is not "the enumeration cannot miss a member" but "the enumeration cannot miss a member
**at any depth**, and the property that makes the declaration binding holds at every depth it holds at any".
Both editions state the obligation at one level. The sibling states it as a flat reflection scan and E-6 records
that it never descends; this edition states it as a recursive walk and then bought the binding half only at the
root, so the scan descended into levels where the declaration no longer described what arrived. Those are
opposite errors with the same cause: nobody wrote down that depth is a dimension of the obligation.

**What was done instead:** repaired, with the repair proven in both directions. Every object schema inside a
scanned surface owes `properties` and `additionalProperties: false`, every nested subschema owes a `type`, and
eleven keywords the walk does not descend are refused at registration on the argument `$ref` was already refused
on. Combinator arms are exempt and the exemption is asserted rather than left to be inferred, because an arm
constrains an object that already strips. Eight evasions red, three legitimate shapes green.

**Three smaller defects of the same family, all found because CARVE_OUTS and the boot wiring were shipped
unexecuted, and all recorded because the pattern is the point.**

- **Nothing failed if `assertEndpointSpine` was deleted from `composeApp`.** The call and its import both
  removed: 72 tests green, `tsc` clean, `eslint` clean. The scan was proven and the WIRING between the
  composition and the scan was not, because the composed app is by construction the one with no violations in
  it, so no test could reach the failing branch. This is the aspirational-enforcement failure in the one part of
  the mechanism that decides whether a violating server starts.
- **Both carve-out branches were dead code, and running them found two defects in the key.** The key omitted the
  surface, so one carve-out written for a `name` query parameter silently exempted the `:name` PATH parameter of
  the same route, which is the half SEC-3's harm paragraph is actually about. And the key had no answer for a
  synthesized HEAD, so the only remedy available to an author was a second entry for a route nobody wrote, which
  is precisely the A-1 problem the allowlist mechanism was carefully designed to avoid one file over. The
  allowlist's `Object.is` proof is now reused rather than a second, weaker answer invented.
- **`definePolicies`' two refusals had no test.** Deleting the empty-permission check left the whole suite green.
  The test meant to cover it iterates `POLICIES` and asserts each entry names a permission, which measures the
  CONTENTS of the two policies that happen to ship and not the constructor's behaviour, and its own comment says
  it exists "because the constructor is the only thing standing between this property and a one-line
  regression". It could not see that regression. This is E-4's pattern aimed at a test rather than at a claim: a
  test that binds tightly to a weaker predicate than the thing it names reads green and is still wrong.

**One catalog-facing consequence, separate from the mechanics.** Three audits in a row have now refuted the
foundational mechanism of the phase they audited, and in all three cases the mechanism was red-green proven
against the cases its author thought of. The discipline is working, and what it demonstrates is that red-green
proof establishes that a guard binds and establishes nothing about the guard's extent. The catalog has no word
for the difference, which is the same gap E-4 names from the other side.

### S-9. The delta protocol's quarantine cannot cover the claim file, and the leak is not merely a leak

**Claims:** all 69, structurally. **Found:** Phase 3 round 2, before the round rather than after it.

The delta protocol has three steps: read only the claim file, write the Node mechanism from that text alone and
record it dated, then open the sibling and record the delta. The quarantine names the sibling's conformance
mechanism column, its generated README table, its architecture test tier, and its verification proof tables. Round
2 extended it to `kernel/dotnet-react/server/src/**`, because three of that round's four claims are realized in
production code and in committed configuration rather than in tests, and the standing list would have left the
answers in plain sight.

**The extension does not close the hole, and no extension can.** S-1 records that the catalog's Enforcement
section holds exactly one edition by construction, and has argued it as a schema defect. Every claim file carries
an `- Edition:` bullet naming the .NET realization, and step 1 says to read the claim file. So round 2's step 2
was written already knowing that the sibling asserts `UserSecretsId` in every csproj, scans `server/src` and
`scripts/` from a test named in the bullet, bans `DateTime` in favour of `DateTimeOffset` across four assemblies
including persistence, and validates options with `ValidateOnStart`. That is most of four mechanisms, handed over
before the prediction is written, and it cannot be quarantined without quarantining the claim.

So S-1 is not only about where a second edition writes its realization. It is about whether the catalog can be
read by anyone who has not already been told one answer, and the delta protocol is the first thing to depend on
that. Round 2 marked its predictions `[informed]` where the claim file supplied the answer, which is the best
available mitigation and is not a fix.

**And the leak carries wrong information, which is worse than the leak.** DATA-5's Edition bullet reads
"`ValidateOnStart` on all option types in the skeleton". Measured across the whole of `kernel/dotnet-react/server/src`:
there is no `ValidateOnStart`, no `AddOptions`, and no options binding of any kind. The mechanism is a hand-rolled
four-line `Required(string key)` closure over `builder.Configuration[key]`. See E-14. A step 2 written from the
claim text is therefore not merely pre-informed about the sibling; it can be pre-MISinformed, and the writer has
no way to tell which, because the whole point of step 2 is that they have not looked.

**For the adjudication pass.** This composes with S-1 rather than standing alone, and it changes what the repair
has to achieve. Moving realizations out of the catalog and leaving only the mechanism class would fix S-1's
"nowhere for the second edition to write" AND this, in one move; adding an `- Edition (<name>):` bullet per
edition would fix the first and make the second strictly worse, because a reader of the claim file would then be
handed every edition's answer instead of one.

### A-5. TIME-1 fuses two independent properties, and the second stack has one of them

**Claim:** TIME-1. **Locus:** `centralized`. **Found:** Phase 3 round 2, measured. **Class A confirmed.** This is
the finding of the round, and it refutes the hypothesis the build carried into it.

The handover's seeded hypothesis was "the ban is on a type, and JavaScript ships one `Date` and it is the unsafe
one". Measured on this edition's pinned runtime:

- `new Date('2026-07-26T10:00:00+10:00')` and `new Date('2026-07-26T00:00:00Z')` are the same value, and
  `toISOString()` renders UTC. A JS `Date` is milliseconds since the epoch: an INSTANT.
- The originating offset is discarded at parse and there is no accessor for it.

So a JS `Date` is **not** the unsafe type: it does not carry the ambiguity that TIME-1's harm paragraph is
entirely about ("ambiguous at every DST transition and every cross-region deployment"). It is also not the
permitted type, because it is not offset-aware. It satisfies neither side of the claim's two-way partition.

**The reason is that "UTC-anchored offset-aware" is two properties written as one phrase:**

1. **Unambiguity.** The value denotes exactly one instant. This is what the harm paragraph argues for, what the
   ban on naive datetimes buys, and what a JS `Date` has.
2. **Offset retention.** The value remembers the local offset it was recorded at, so an audit trail can be
   rendered as the actor experienced it. The harm paragraph never mentions this, no sentence in the claim
   justifies it separately, and a JS `Date` lacks it.

`DateTimeOffset` supplies both, so on the platform the catalog was written from the two are indistinguishable and
there was never a reason to separate them. A second stack that has one and not the other makes the claim
unanswerable as written: is a JS `Date` compliant? The statement says no. The harm says yes.

**What was done instead:** the two properties are carried separately, which is the only honest realization
available. The instant is a `Date`, obtained from one clock seam; the offset, where a surface needs it, comes
from `clock.offsetMinutesAt(instant, zone)` and is stored beside it. The wire form carries both natively and is
the only surface that does, because `format: 'date-time'` is RFC3339 and RFC3339 requires an offset.

**A second measurement, recorded because it refutes the other seeded hypothesis.** The handover suggested Node
might be the STRONGER realization, since wall time plus an IANA zone id is what TIME-1's own weakening note says
`DateTimeOffset` is insufficient for. `Temporal.ZonedDateTime` is exactly that shape. It is **not available**:
`typeof globalThis.Temporal` is `undefined` on Node 24.13.1 with V8 13.6. A polyfill is a dependency under DEP-1
and was not taken in a pass with no scheduling slice to need it. Asserted as a passing test rather than left as a
comment, so that the day the runtime gains it, the test goes red and this finding is revisited rather than
silently left wrong. That is the discipline the Phase 2 audit's post-`ready()` correction established: a fact
about a version is a state, not a fact.

**For the adjudication pass.** TIME-1's statement should name the two properties separately and say what each
buys, because an edition can supply one without the other and the claim currently cannot express that. The
weakening note already gropes toward it by observing that a fixed offset is not a zone; the same sentence one
step earlier is that an instant is not an offset.

### B-5. TIME-1's mechanism class names assemblies

**Claim:** TIME-1. **Found:** Phase 3 round 2.

`Mechanism class: an architecture test reflecting over domain, contracts, application, and persistence assemblies
rejecting properties/parameters of forbidden time types.`

An assembly is a .NET artifact. This is the same class as B-1 and B-3 and it is more blatant than either: B-1's
claims said "a runtime scan over the composed route table", which reads portable and leaks a capability
underneath; here the portable layer names the packaging unit of one runtime outright, along with reflection over
it, in a stack where types do not survive to runtime at all.

The portable content is that the ban covers **every layer where a time value is declared or persisted**, which is
a statement about surfaces rather than about assemblies, and which a second edition has to translate before it can
begin. Measured, the translation is not one-to-one in either direction: this edition's surfaces are the wire
contracts (JSON Schema on the route table) and the source text (a lint on the clock constructors), and it has no
persistence surface at all, so a four-item assembly list maps onto a two-item surface list plus a hole.

### E-11. SEC-5 reads `proven` while the edition's own signing key would sit undetected in the file the claim is named for

**Claim:** SEC-5. **Status carried:** `proven`. **Found:** Phase 3 round 2, step 3, **measured with a control.**

`Jwt:Key` is the edition's principal development secret. `scripts/dev-setup.sh` generates it and stores it with
`dotnet user-secrets set "Jwt:Key"`, and `Program.cs` reads it as a mandatory key. Committed in plaintext to
`server/src/Kernel.Api/appsettings.json`, it leaves **all 49 architecture tests passing and the CI secret-scan
silent**. Both of SEC-5's mechanisms miss it, for two independent reasons, and both were reproduced directly:

- **`SecretConfigShapeTests` matches containment in the wrong direction.** The predicate is
  `SecretShapedKeys.Any(k => leafKey.Contains(k, OrdinalIgnoreCase))` over
  `["password","pwd","secret","apikey","api_key","accesskey","privatekey","token","signingkey"]`. The leaf key is
  `Key`, which is SHORTER than every entry that would describe it, so nothing matches. This is E-9's finding in a
  fourth registry and in a third direction: E-9 recorded equality missing the COMPOUND (`emailAddress` walking
  past `email`); this is containment missing the ATOM (`Key` walking past `signingkey`).
- **The CI grep is case-sensitive, against a platform whose configuration convention is PascalCase.** The pattern
  requires the literal lowercase `password|pwd|secret|apikey|api_key` before the separator and the command
  carries no `-i`. Measured: `secret: "Sup3rSecretValue123"` matches, `Password: "Sup3rSecretValue123"` does not.
  The workflow's own literal `MSSQL_SA_PASSWORD: 'Ci_Harness_Pass123!'` sits inside a scanned file and is
  invisible for exactly this reason, which is also why the scan currently passes.

So SEC-5's two mechanisms are a belt and braces that fail on the same input for different reasons, which is the
worst shape a pair of mechanisms can have and the shape A-3 exists to name: the claim asserts two mechanisms and
asserts nothing about their independence, and independence of MECHANISM is not independence of BLIND SPOT.

The Node matcher catches every spelling, measured: `Key`, `key`, `Password`, `PASSWORD`, `ApiKey` and
`signingKey` all match; `keyboardLayout` does not. That is not a scoreboard entry. The reason it catches them is
the token matcher this edition was forced to build by E-9, for three claims in a different family, and the cost
is E-9's cost: `tokenCount` matches `token`, and a false positive is what a run buys.

**What flows back:** the sibling's key list needs `key` as a whole-word entry rather than only as the tail of
four compounds, and the CI grep needs `-i`. Both are one-character-scale changes to mechanisms that read `proven`.

**Repaired 2026-07-26 by the flow-back pass, both mechanisms, and the committed-secret question answered first.**

**No secret is or ever was committed.** `appsettings.json` holds `Jwt:Issuer` and `Jwt:Audience`, both the string
`kernel`, and no `Jwt:Key`. `git log --all` over `*.env` returns nothing and `.env` is untracked. The finding was
demonstrated by injection, as its own text implies and as this pass confirmed before touching anything. Separately
and unprompted, the repaired scan's first run DID find a committed credential-shaped literal elsewhere in the
tree, which is filed as E-17.

**Both blind spots reproduced separately, then closed separately.** With `Jwt:Key` planted in `appsettings.json`,
the architecture suite passed 49 of 49, reproducing the containment defect exactly. Direction by direction against
the shipped mechanisms: on the leaf key `Key` the arch test's `Contains` predicate was blind and the CI grep was
blind; on `Password:` the arch test caught it and the CI grep was blind (case); on `"password":` the arch test
caught it and the CI grep was blind (E-16, quoting). After the repair all four inputs are caught by both.

- `SecretConfigShapeTests` now matches by TOKEN, not containment: the key is split on camel, Pascal, snake and
  kebab boundaries and each part is tested against the registry. With the plant in place exactly one test goes
  red, the right one; reverted, the suite is green. A fifteen-case `[Theory]` asserts the predicate's extent, and
  the E-9 cost is written into it as a PASSING case (`TokenCount` is secret shaped, and narrowing that later has
  to break a test and be argued) rather than wished away.
- The CI grep is gone. It is replaced by `tools/secret-scan.mjs`, composed from the shared tier into both
  editions, carrying `--self-test` with eleven positive and thirteen negative controls that CI runs before the
  scan. See E-16 for why the grep's three defects survived four rounds, which is a property of where it lived
  rather than of what it said.

**Two things the repair changed that the finding did not predict.** The scan reads `git ls-files --cached --others
--exclude-standard` rather than walking the working tree, because the claim is about what is COMMITTED and walking
the tree reported a correctly ignored local `.env` as a committed secret; that is a false positive that trains a
reader to ignore the scan, and it is explicitly NOT an answer to E-12, which is about a path and stays open. And
justified exceptions moved into a per-edition `secret-scan.allow.json` keyed on (file, key) with a mandatory
reason, after a shared list carried one edition's exceptions into the other where they were reported stale.

### E-12. SEC-5 reads `proven` while a development secret lives inside the repository tree

**Claim:** SEC-5. **Status carried:** `proven`. **Found:** Phase 3 round 2, step 3. Recorded separately from E-11
because it is a claim-conformance defect rather than a detection defect.

SEC-5's statement is explicit: "Development secrets live in the developer-local secret store, outside the
repository tree." The edition satisfies it for `Jwt:Key`, through .NET User Secrets, which is a platform facility
supplying a well-known per-project path outside the tree plus a manifest field an arch test can assert.

It does not satisfy it for the other development secret. `scripts/dev-setup.sh` generates `MSSQL_SA_PASSWORD` and
appends it to `.env` at the edition root, and `.gitignore` lists `.env` with the comment "Local dev secrets
(SEC-5): the SA password lives here, never committed". The edition names the claim in the comment that documents
the exception to it.

A gitignore entry is a property of a tool's configuration; "outside the repository tree" is a property of a path.
The difference is not pedantic: `git add -f` overrides the first, an archive or a copy of the working tree carries
the file regardless, and a branch predating the ignore entry keeps it forever. Nothing notices, because
`SecretConfigShapeTests` scans JSON files under `src/` and `.env` is neither.

**The part worth keeping is what this does to a prediction.** Round 2's step 2 predicted this as SEC-5's class C
casualty in the OPPOSITE direction: that Node, lacking a User Secrets equivalent, would be pushed down to a
gitignored `.env` inside the tree and would therefore realize the claim more weakly than the sibling. Measured,
the sibling is already there for one of its two secrets. So the class C prediction is refuted, the portability
gap is not where it was expected, and what the second edition actually surfaced is that the FIRST edition never
met the claim's sentence. The Node realization asserts the property directly, as a statement about a path
(`path.relative(EDITION_ROOT, SECRET_STORE)` must escape the root), which is a check the sibling could run today
and does not have.

### E-13. CFG-1's script sentence is enforced by nothing

**Claim:** CFG-1. **Status carried:** `proven`. **Found:** Phase 3 round 2, step 3.

CFG-1's statement carries a sentence of its own: "Scripts are part of the code surface: a script never duplicates
a committed configuration value, it reads it." Its harm paragraph names the incident twice over: "then a script
duplicating committed issuer and audience values so the two copies could drift".

`OperationalSettingsTests` scans host source and shipped scripts for two regular expressions, an AI model id and
four named provider endpoints. That is the entire test. **No mechanism compares a script against the committed
configuration**, so a script that pasted the committed issuer would pass, and the recurrence the claim was minted
from is unguarded.

`scripts/e2e.sh` does read them, from `appsettings.json`, with a comment explaining why. That is the discipline
holding once, by hand, in the file that met the problem, and the sibling's conformance row records it as though it
were a mechanism: "`scripts/e2e.sh` reads Jwt values from committed appsettings, never duplicating them". That is
a true statement about the current state of one file. It is the pattern E-4 names, in a third claim: **the
`proven` bar is "a mechanism exists and a test proves it binds", and nothing checks that the mechanism covers
what the claim says.**

**What was done instead:** the Node scan compares every parsed string literal in a script surface against the
values in committed configuration and reports a match by key. It is the only exact check in that file, everything
else being a heuristic registry. Its stated limit: values shorter than eight characters are skipped, because a
check that fires on `info` or a port number is a check somebody deletes, and the sibling's committed issuer and
audience are both the six-character string `kernel`, so neither edition's mechanism would catch a script
duplicating those. Both editions are uncovered for short configuration values and the claim says nothing about
length, because it never had to.

### E-14. DATA-5's Edition bullet names a mechanism the edition does not have

**Claim:** DATA-5. **Status carried:** `proven`. **Found:** Phase 3 round 2, step 3, measured.

DATA-5's `Edition:` bullet reads "`ValidateOnStart` on all option types in the skeleton". Measured across the
whole of `kernel/dotnet-react/server/src`: there is no `ValidateOnStart`, no `AddOptions`, and no options binding
of any kind. The one `IOptions<>` in the tree is `PermissionPolicyProvider` consuming `AuthorizationOptions`,
which belongs to SEC-1. The realization is a hand-rolled four-line `Required(string key)` closure over
`builder.Configuration[key]` in `Program.cs`, proven by `StartupConfigTests` across four keys.

Two consequences, separated because they are different in kind:

- **The claim's `Mechanism class` is satisfied and its `Edition` line is false.** The class says "options
  validation executed at startup (not first-use), with tests asserting startup fails on each mandatory key's
  absence", and a `Required()` read above `builder.Build()` with a per-key test is exactly that. So this is not a
  claim that is unmet; it is a record that describes the wrong mechanism, in the one field a reader consults to
  learn how the claim was realized.
- **It is the first measured instance of S-9.** The delta protocol tells a builder to read the claim file and
  nothing else, and the claim file told this pass that the sibling validates options. A step 2 is therefore not
  merely pre-informed about the sibling, it can be pre-misinformed, and the writer cannot tell which without
  breaking the quarantine that makes step 2 worth anything.

**Two smaller measurements in the same mechanism, both confirming step-2 predictions.** `Required()` throws on the
first missing key, so a three-key misconfiguration is three failed deploys, and `StartupConfigTests` blanks
exactly one key per case, so the test shape and the mechanism shape agree with each other and neither can see it.
And `IConfiguration` is a dictionary: an appsettings key nobody reads is ignored with nothing to report it
(`Harness:Enabled` is read directly and declared nowhere). The Node realization refuses both, because the settings
document is closed against a declared spec.

### E-15. TIME-1's scan omits an assembly, and the gap meets E-6's on one file

**Claim:** TIME-1. **Status carried:** `proven`. **Found:** Phase 3 round 2, step 3, **measured with a control.**

`TimeTypeTests` scans three assemblies: Contracts, App and Persistence. It does not scan `Kernel.Api`.

Measured: a public class carrying a naive `DateTime` property, added to `server/src/Kernel.Api/Platform/`, leaves
49 of 49 green. The identical class added to `server/src/Kernel.Contracts/` turns the suite red with the TIME-1
message. So the guard binds correctly on the surface it covers and is absent one assembly over.

On its own that is defensible: MOD-2 places contracts in the Contracts assembly, so a request or response type
should not be in Api. It stops being defensible when composed with a finding already in this register. E-6 records
that `IsBodyDto` carries a fifth, unrecorded exclusion, `type.Namespace is null`, so a public DTO declared in
`Program.cs` is skipped by SEC-2's body scan entirely, and that `NamingPlacementTests` explicitly exempts
`Program.cs` from the one-public-type rule. `Program.cs` is in `Kernel.Api`.

**So a request DTO declared in `Program.cs` is invisible to SEC-2's body scan and to TIME-1's type scan at the
same time**, by two independent gaps that happen to meet on the one file three separate mechanisms have agreed to
exempt. Neither gap was designed; the exemption that joins them was, for an unrelated reason.

**And the two editions check disjoint surfaces for this claim.** The sibling checks C# types in three assemblies
and trusts the serializer for the wire form; this edition checks the wire form and has no types to check. Both
mechanisms are real, neither covers the other's surface, and TIME-1's statement ("domain types, contracts, and
persistence") is satisfied by neither alone. A single-edition catalog cannot see that, because with one witness
the mechanism is the claim.

### A-6. CFG-1 names three homes for a value and this stack has four

**Claim:** CFG-1. **Locus:** `centralized`. **Found:** Phase 3 round 2, step 2, before the sibling was opened.
**Class A confirmed; class C refuted.**

CFG-1 partitions the world into two right homes (committed configuration, the secret store) and one wrong home
("A literal in code is the third, wrong home and is banned"). Its mechanism class is a scan for
operational-setting literal shapes, which can only find things in the third home.

**Node has a fourth: the ambient process environment.** `process.env.PORT ?? 5080` is not a literal in code, so
the literal registry cannot see it; it is not committed configuration, so it escapes the config-review surface and
the per-environment surface; and the `??` is a silent default of exactly the kind DATA-5 forbids one claim over.
Every harm CFG-1's own harm paragraph names applies to it, and CFG-1's mechanism is blind to it by construction.

This is not hypothetical and not a prediction about a future project: that line shipped in
`kernel/node-react/server/src/main.ts`, in the edition that reports on this claim, and was found by reading CFG-1
rather than by reading anything else.

**Class C is refuted, and the reason is worth stating because it is the repair.** The fourth home does not lower
the locus. It is closed by bringing the environment INSIDE the config system rather than banning it: an
environment variable may only override a key the spec already declares, under a name derived from that key
(`http.port` becomes `KERNEL_HTTP_PORT`), so the value stays declared, reviewable and per-environment while
deploy-time override remains available. A ban would have been routed around, because overriding a setting at
deploy time is legitimate.

**Measured at step 3: the sibling does not have the problem, for the reason predicted before looking.** `Program.cs`
reads configuration only through `builder.Configuration[key]`, and .NET's default configuration builder already
includes an environment-variable provider, so an environment read there arrives through the config system with a
declared key and a per-environment surface. The claim generalized from a platform where the fourth home is
already inside the first, and said nothing, because there was nothing to say.

### S-10. A closure obligation has a remedy as well as a when and a depth

**Claims:** SEC-2, DATA-5, and structurally every claim whose surface is a closed declaration. **Found:** Phase 3
round 2, building DATA-5 on the machinery E-10 produced. **A third dimension on S-5's obligation.**

S-5 proposes that a portable mechanism class has three parts: surface, predicate, completeness obligation. The
Phase 2 audit added that the obligation has a **when**. The round 1 audit added, as E-10, that it has a **depth**.
Round 2 adds that it has a **remedy**, and that the remedy is not a free choice.

Both surfaces in this edition are closed declarations and both are closed for the same reason, so that a scan over
the declaration is a true statement about what arrives. **Their runtime behaviours on an undeclared member are
opposites, and both are correct.** On the request surface an undeclared field is STRIPPED, silently, before the
handler runs. On the settings surface an undeclared key is REFUSED, loudly, and the process does not start.

The discriminator is who wrote the value. A caller may be hostile, has no expectations worth honouring, and
should learn nothing from the difference between a field that was ignored and a field that was rejected. An
operator is trusted, is trying to configure the system, and believes the key did something; a setting that is set
and never read is a deploy that thinks it is configured and is not. Stripping the operator's key would be a silent
failure of exactly the kind DATA-5 exists to prevent, and refusing the caller's field would turn a stray property
from a confused client into a failed request, which is the reasoning A-2 already recorded for the header strip.

**For the adjudication pass:** the completeness obligation now reads as surface, predicate, and an obligation with
three parameters (when the enumeration is taken, how deep the closure goes, and what happens to a member that is
not declared). None of the three is stated in any claim, all three have been discovered one at a time by building,
and each was invisible until a mechanism was built that got it wrong.

### E-5 second instance. A registry of forbidden values contains the forbidden values

**Claims:** CFG-1, SEC-5. **Found:** Phase 3 round 2, building the configuration scan.

E-5 records that documenting the conformance gate broke it: the README quoted the gate's marker strings inside a
sentence, the generator matched the prose mention first, and the gate then guarded the wrong span while reporting
ok. Its second lesson was "documenting a mechanism should not be able to break it", closed with "Recorded here
rather than proposed as a claim, because one instance is not a pattern yet."

**This is the second instance, in an unrelated mechanism, and it arrived twice in one afternoon.** An exemption
must name the literal it exempts, so the exemption list contains a provider-endpoint URL, so the file holding the
exemption list failed its own provider-endpoint check. The same is true of `registries.ts`, which is a list of the
names three other claims forbid. Separately and first, the text-based version of the same scan reported three
files for READING `process.env`, and all three were the comment explaining why `process.env` is banned and the
error message telling an author what to do instead.

The second of those is repaired in the mechanism class rather than by an exemption, and the repair is a finding in
its own right: **CFG-1's mechanism class says "a cheap architecture test over host source", and a text scan is not
sufficient for what CFG-1 has to ban in this stack.** A model id is a literal SHAPE and text is the right surface
for it. The ambient-environment read is a syntactic FORM, and a form has to be recognized where forms live, so the
source is parsed and the checks run over nodes. The parser is the `typescript` package the edition already pins,
so nothing is added under DEP-1.

The first of those is not repairable that way, because a registry genuinely does contain its own forbidden values,
so two files are named as the mechanism's own data and excluded from the literal checks. The cost is stated rather
than argued away: a real credential written into one of those two files is invisible to this scan.

**Two instances now, in mechanisms with nothing in common except that both are scans with a registry.** That is
enough to say what the shape is: a scan whose predicate is a set of literals cannot be run over the file that
declares the set, and a scan that reports on a construct cannot be run over the text that names the construct.
Whether that is a claim is an adjudication question; it is at least a rule any edition building a scan should be
told.

**Third instance, 2026-07-26, found by the flow-back pass without looking for it, and it moves the finding from a
rule about writing to a rule about composing.** Replacing SEC-5's CI grep with `tools/secret-scan.mjs` put a file
into both editions that declares a registry of secret-shaped key names and eleven credential-shaped controls
asserting what it catches. The node-react configuration scan failed on it on the first run after composition,
naming the file and the term.

Both earlier instances were files the edition authored, so the rule read as advice to whoever writes a scan:
watch out for your own registry. This one was composed in from `kernel/shared/`, and neither mechanism knows the
other exists. The rule is therefore not about authorship: **any mechanism whose predicate is a set of literals
collides with any other mechanism that scans for those literals, and the collision is a property of the pair, not
of either one.** An edition adding a shared-tier scan can break an unrelated edition-local scan it has never
read, in the direction that reports a false violation rather than a missed one, which is the survivable
direction but not a free one.

Two smaller notes kept because they bear on the remedy. The new scan already excludes ITSELF from its own walk
for exactly this reason, so two mechanisms independently arrived at the same exemption for the same file, which
is some evidence the exemption is structural rather than a convenience. And the composed file has a protection
the edition-authored registries do not: `compose --check` pins its bytes to the shared tier, so a credential
cannot be parked in it without failing a different gate first. That does not close the hole; it means the hole
has a second guard over it, which the other two named files do not.

### E-16. The CI secret scan could not see a quoted key, which is every key in the file the claim is named for

**Claim:** SEC-5. **Status carried:** `proven`. **Found:** the flow-back pass, 2026-07-26, while repairing E-11.
**Measured, with controls, before and after.**

E-11 records two reasons SEC-5's CI grep was blind: no `-i` against a PascalCase configuration platform, and a
key list carrying `key` only as the tail of four compounds. Repairing it surfaced a third, independent of both
and worse than either.

The pattern was `(password|pwd|secret|apikey|api_key)[[:space:]]*[:=][[:space:]]*.?[A-Za-z0-9+/_-]{8,}`. It
requires the key term to be followed by optional whitespace and then a separator. **In JSON the key is quoted, so
the character after the term is `"`, not a separator, and the match never starts.** Measured directly:
`{ "password": "Sup3rSecretValue123" }` in a `.json` file is invisible to the shipped scan, and so is
`{ "secret": "..." }`. The one spelling that matched, and the one E-11 measured, was unquoted YAML
(`secret: "Sup3rSecretValue123"`).

The consequence is larger than E-11's. SEC-5's statement is about committed CONFIGURATION, this stack's
configuration format is JSON, and `appsettings.json` is the file the claim's own harm paragraph is about. So the
CI half of SEC-5 could not see a secret in any JSON file in either edition, under any spelling, in any case, and
had been reporting green on that basis since the workflow was written. The case-sensitivity defect E-11 found is
a narrowing of the net; this one removes the net from the surface that matters most.

**Why three defects sat in one regular expression for four rounds, which is the part worth keeping.** The scan
was a regex embedded in a YAML `run:` block. Nothing could execute it except a CI run, nothing recorded what it
was supposed to catch, and its green result was indistinguishable from the green result of a scan that matched
nothing at all. E-4 names the pattern "the `proven` bar is 'a mechanism exists and a test proves it binds', and
nothing checks that what the mechanism tests is what the claim says"; this is the degenerate case, where nothing
proved it bound to anything.

**Repaired**, in `kernel/shared/tools/secret-scan.mjs`, composed into both editions. The detector is a function,
the CI job calls the script, and `--self-test` runs eleven positive and thirteen negative controls before the
scan runs, so the scan's EXTENT is asserted in the same artifact as the scan and a narrowing goes red here rather
than passing unnoticed in a run nobody rereads. The three inputs that evaded the grep are three of the controls,
named as such.

### E-17. A committed signing key in the architecture-test harness, found by the mechanism that was repaired to find it

**Claim:** SEC-5. **Status carried:** `proven`. **Found:** the flow-back pass, 2026-07-26, on the FIRST run of the
repaired scan. **Not injected: this is in the shipped tree.**

`server/tests/Kernel.Tests.Architecture/KernelApiFactory.cs` line 18 declares
`public const string JwtKey = "kernel-architecture-tests-symmetric-signing-key-0123456789";`. It is a real,
committed, credential-shaped literal in a tracked file, and no pass of this register had named it. Three
mechanisms should have had an opinion and none did: `SecretConfigShapeTests` scans only JSON under `src/`, the CI
grep was blind for the three reasons in E-11 and E-16, and the leaf-key spelling is `JwtKey`, which is the exact
containment failure E-11 is about.

**It is not a vulnerability, and saying why is the point.** It signs tokens for an in-process test host that
serves no traffic, holds no data and is constructed per test run; it must be a committed constant because the
same tests both mint and verify with it. It is allowlisted in `secret-scan.allow.json` with that reasoning
written out, which is the form E-8 says a carve-out owes and the shipped anonymous allowlist could not hold.

**What this measures is the repair, not the key.** The value of a detection mechanism is what it finds that
nobody was looking for, and the first run of this one found a committed credential that four rounds of reading
had walked past. It is filed separately from E-11 rather than folded into it because E-11 is a finding about two
blind mechanisms and this is a finding about the tree they were blind to, and the register's own rule is that a
count is not a reason to merge.

### E-18. Left to itself, resolution picks the version that satisfies neither rule

**Claim:** DEP-1, DEP-2. **Found:** the flow-back pass, 2026-07-26, executing E-3. **Measured.** A sharpening of
E-3's point 3 rather than a restatement of it, and the sharpening is general.

E-3's point 3 records that the cooling-off window and a live advisory can have no overlapping solution, evidenced
by `vite` at the 90-day window, and the window ruling closed that INSTANCE by cutting the window to 30 while
insisting the catalog gap stayed open. Executing the bump at 30 days confirms the insistence was right, twice
over.

**The conflict recurred immediately, in a different package.** `postcss` is reached transitively through `vite`
and carries GHSA-r28c-9q8g-f849. Measured against the 30-day window (cutoff 2026-06-26): 8.5.15 (2026-05-19)
clears the window and carries the advisory; the first release clearing the advisory is 8.5.18 (2026-07-12), which
is inside it. There is no version of postcss satisfying both rules, at a window that had just been shortened
specifically because the previous conflict was thought to be a function of the window's length. It is not. A
window of any length can fail to overlap the set of releases clearing a live advisory, and shortening it changes
the odds and not the shape.

**The new part, which E-3 does not contain and could not have.** Left to npm's own resolution, the tree landed on
postcss 8.5.16 (2026-06-28): **inside the window AND still vulnerable**, which is the one outcome that satisfies
neither rule. This is not bad luck. A resolver maximizes version subject to a semver range, and both rules here
are constraints the resolver has never heard of, so the version it picks is uncorrelated with either. The
practical statement for any claim that pairs a recency floor with an advisory floor: **an unpinned transitive
dependency does not land on a compromise between the two rules, it lands somewhere unrelated to both, and the
"somewhere unrelated" is frequently worse than either rule taken alone.**

**And the tension is invisible to DEP-1's ledger, because DEP-1's ledger is per DIRECT dependency.** `postcss` has
no row and, under the claim as written, is owed none, so the conflict has nowhere to be recorded as a conflict.
E-4 repaired the ledger check to key on name and version together; this is the same defect one level out, in the
claim rather than the checker.

**What was done:** postcss is pinned to 8.5.15 through an `overrides` entry in the shared tier, honouring the rule
DEP-1 actually states (the window) and leaving the advisory open and NAMED in both editions' `VERSIONS.md` rather
than breaking a stated rule silently. That is a judgement call in the absence of a rule, it is recorded as one,
and the adjudication pass still owes DEP-1 the resolution order E-3 asked for. Revisit when 8.5.18 clears the
window (2026-08-11).

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

## Audit, Phase 3 round 1 (2026-07-26)

The third independent audit, run against the endpoint spine. **It refuted the pass's central design argument.**
B-4's property, that a closed declaration is a runtime filter and therefore that a scan over the declaration is
a true statement about what arrives, held at depth 0 and nowhere below it. Four evasions were live, meaning the
forged value reached the handler with the scan silent, and four more were scan-blind. Recorded as E-10 above,
because it is S-5's obligation missing a dimension rather than an implementation slip.

Two mechanisms turned out to be shipped without ever executing: the carve-out list, whose suppression and
staleness branches were both dead code, and the wiring between `composeApp` and the scan, which could be deleted
entirely with 72 tests, `tsc` and `eslint` all clean. Running the first for the first time found two defects in
its key. A third guard, `definePolicies`' refusal of an empty permission set, had no test that could invoke it.

**What the audit could not break.** The deny-by-default hook survived eight bypass attempts (route-level
`onRequest`, `preParsing`, `preValidation`, `preHandler`, `setNotFoundHandler` with and without its own hook
chain, `setErrorHandler`, and a hook inside an encapsulated child), and the reason is structural rather than
lucky: the hook is installed in the expression that creates the instance, so every other hook is a later hook.
No policy can be forged into the identity set. `request.credential` does not leak across sequential or
concurrent requests. And the builder's own prime suspect is refuted: `request.raw.headers` and `request.headers`
are the same object in Fastify 5, measured over real HTTP, so the strip reaches both.

The audit also corrected the register on six points, each folded into the finding it corrects:

- **The .NET architecture suite is runnable here**, and three passes have marked sibling verdicts
  "read-from-source" on an untested assumption. `KernelApiFactory` substitutes SQLite; only the integration
  project needs Docker. Baseline 49 of 49 (E-7).
- **E-7b's counterfactual was wrong.** Deleting `app.UseAuthorization()` turns 13 tests red, not zero. The
  finding's thesis survives on a different lever: nulling `PermissionPolicyProvider.GetFallbackPolicyAsync()`
  opens every metadata-free endpoint to an anonymous caller with all 49 tests green (E-7).
- **E-6's premise was false.** The shipped contracts are not flat: `NoteListResponse` nests a collection of
  `NoteResponse`, which carries two forbidden names. The register asserted a property of the sibling's contracts
  without enumerating them, in the finding whose subject is that exact error (E-6).
- **E-8's HUM-1 half is refuted as stated.** The three categories are an enforced floor, not a ceiling; a fourth
  is ignored rather than rejected (E-8).
- **E-9 loses one of its four exhibits and gains its real conclusion.** `createdAtUtc` is hand-enumerated in the
  sibling and is caught. More importantly the two matchers are incomparable rather than ordered, and the Node
  matcher lost to equality on every all-lowercase concatenation, including over real HTTP on the header surface
  where lowercasing makes its advantage unavailable by construction (E-9).
- **B-2's table now has a third wrong row**, and the correction to the `allOf` row over-corrected in favour of
  the newly favoured side (B-2).

## Phase 3 round 2, 2026-07-26: configuration and time

CFG-1, SEC-5, DATA-5 and TIME-1, chosen by re-deriving from the claim files and both conformance records rather
than by taking the round 1 handover's sequencing, which its own author flagged as contaminated. Three grounds,
recorded because the choice is itself a method question: a round is only a portability test where the sibling has
a realization to differ from, and TEN-6 is `owed` in both editions so its step 3 would be empty by construction;
these four name each other by id in the catalog's own text, so A-3's relationship problem can only be tested by
taking them together; and none of the four is a scan over the route table, which is the one mechanism class four
rounds have attacked.

**What this round measured rather than read.** The sibling's architecture suite was run at every step (baseline
49 of 49), and every assertion about what it catches is a mutation with a control, with the tree restored after
each. Three passes of this register have been corrected for inferring a sibling property from what a mechanism
ought to do, and the discipline held: the round's two largest findings, E-11 and E-15, are both cases where
reading the source suggested a gap and running it proved one, and E-12 is a case where reading the source found
something no amount of reasoning about mechanisms would have predicted.

**Nine findings, and the shape of them is different from round 1's.** Round 1 produced findings about one
mechanism class examined from two sides. This round produced four defects in the shipped sibling (E-11 through
E-15), two gaps in claims that one edition could not surface (A-5, A-6), one leak in a portable layer (B-5), one
new dimension on the completeness obligation (S-10), and one finding about the protocol itself (S-9).

**The two pre-registered predictions, and how they came out.** Both were written into `record/delta-log.md` before
any mechanism was built, with falsifiers named.

- **P-1** predicted that every claim would need one confined seam plus a lint banning the affordance elsewhere,
  and that the sibling would need none, because each distinction is a type or a platform facility there. It holds
  at three of four (CFG-1's environment, SEC-5's filesystem, TIME-1's clock) and fails at two points: CFG-1's
  literal scan ported with no confinement at all, which is exactly the falsifier P-1 named in advance, and
  DATA-5 needed no lint because its ordering obligation is bought with a required constructor parameter instead.
  So the general statement survives in a weaker form than a clean confirmation would have given it, and it was
  weakened by the mechanism it predicted its own failure in.
- **P-2** predicted that S-8 recurs, and named the halves from the claim text before building. Confirmed at three
  of four. Round 1 found S-8 on TEN-1 and recorded it as one claim's problem; it is now four claims out of five
  with separable obligations and one status word, which is a rate the adjudication pass can use rather than an
  anecdote.

**One record defect found in passing, not repaired.** B-4 is cited by id three times, in E-10, in the round 1
audit summary, and as a row in the flows-back table, and it has no entry of its own in the register. Recorded
here rather than reconstructed, because writing a finding under an id from three secondhand references is how a
register acquires a finding nobody made.

**Closed 2026-07-26 at the adjudication pass, and the count was an undercount.** A mechanical sweep found seven
citations across four files, not three, two of them in shipped artifacts (`kernel/node-react/conformance.json`
and the README table generated from it), so a seeded project inherited the dangling id. The refusal to
reconstruct was right and the resolution is not reconstruction: B-4's substance is a behaviour of running code,
so it was re-measured on the pinned framework and the entry written from that measurement, carrying E-10's
correction. The loop now carries a cited-but-undefined-id check, so this class of defect fails a build rather
than waiting for a sweep.

## Flow-back applied to the sibling, 2026-07-26

The first time findings in this register have been applied to `kernel/dotnet-react/` rather than queued. Done
because the round 4 audit established that the sibling's architecture suite RUNS here (49 of 49, SQLite
substituted by `KernelApiFactory`, no Docker), so these are red-green proven rather than reasoned. Everything
else in the flows-back table stays queued.

**1. Two shipped artifacts were stating coverage that does not exist.** The SEC-2 row of
`kernel/dotnet-react/conformance.json`, and the README table generated from it, both read "`EndpointSpineTests`
scans every body-bound DTO for server fields, nested and immutable constructor-bound DTOs included". The
constructor half is true and the nested half was never implemented. That is a `proven` row in the
machine-readable ledger a seeded project inherits, asserting the exact property E-6 found missing, and no
adjudication was needed to fix it because the row was simply wrong about its own mechanism. Rewritten to say
both guards are flat, with the `Namespace is null` exclusion and the `NoteListResponse` nesting named in the
note. TEN-1's row was corrected the same way: it claimed the scan "bans tenant route/query params", and the
query half is type-dependent while the header surface is checked by nothing.

Status left at `proven` on both, deliberately and arguably. The properties hold in the shipped edition: no
nested type sits on the request side of a route, and no endpoint exposes a tenant parameter. What was wrong was
the description of the mechanism's reach, and a reader can now see the gap. Lowering a status because a guard is
narrower than a reader might assume, while the claim's property demonstrably holds, would be a different
judgement and it belongs to the owner.

**2. E-7 is repaired, both halves.** The fallback is now a deny rather than `RequireAuthenticatedUser`, so a
metadata-free endpoint is unreachable rather than open to every authenticated caller in the system. And
`The_fallback_policy_denies_by_default` now resolves the policy from `IAuthorizationPolicyProvider`, which is
what `AuthorizationMiddleware` consults, and EVALUATES it against an anonymous principal and against a fully
permissioned authenticated one, instead of asserting that a requirement object is present in an options list.
Both mutations are now caught: nulling `PermissionPolicyProvider.GetFallbackPolicyAsync` (which previously left
all 49 green) and reverting the fallback to bare authentication.

The change had one consequence nobody predicted, and it is the same one the Node edition met. ASP.NET applies
the fallback to requests that match NO endpoint as well as to endpoints carrying no authorization metadata, so
an unknown route now answers 403 rather than 404. `WireConventionTests.Unknown_route_returns_problem_json` went
red and is rewritten in place with the old assertion and the reason kept, in the discipline this repo uses for a
refuted assertion. The test's actual subject, CON-1's one wire dialect, is unchanged: the error still renders
problem+json. Two editions independently arriving at 403-for-unmatched-URL from different mechanisms is worth
noting for the adjudication pass, because neither claim predicts it.

**3. E-9's sibling half is widened.** `ForbiddenTenantParams` carried no `workspace` and no `account` in any
spelling. Both are added, with their compounds, because equality matching means every spelling has to be
enumerated.

Not done, and still queued: E-6's guards remain flat (making the reflection recurse is a mechanism change, not a
record correction), E-2's `BindsFromUrl` still under-includes the URL-bound set, and E-8's allowlist is still a
`string[]` of paths.

## Flow-back round 2, 2026-07-26: the E-class repair pass

The second pass applying this register to `kernel/dotnet-react/` rather than queueing it, and the first one whose
whole subject is class E. Baseline confirmed before anything was mutated: the sibling architecture suite at
**49 of 49**, no Docker needed (`KernelApiFactory` substitutes SQLite; only `Kernel.Tests.Integration` needs the
engine). Suite after the pass: **67 of 67**. Every repair below was red-green proven by planting the violation,
observing red, and reverting; where a control was needed to show the OLD mechanism was blind, the old mechanism
was restored with the violation still in place and observed green.

**No claim file was edited and no ruling was pre-empted.** `kernel/claims/` and `record/adjudication-digest.md`
are untouched.

**Quarantine: nothing new was burned.** Every claim opened was already burned (SEC-1, SEC-2, TEN-1, SEC-5, DEP-1)
or is the pass's own shared tooling. `ContractShapeTests` was NOT opened; E-6's second guard is left flat and
recorded as blocked on MOD-2's delta pass, which is the one place this pass declined a repair it could otherwise
have made.

### Repaired

| Finding | Claim | What changed | Proof |
|---------|-------|--------------|-------|
| E-11 | SEC-5 | Token matching replaces containment in `SecretConfigShapeTests`; the CI grep is replaced by `tools/secret-scan.mjs` | plant `Jwt:Key`, 49/49 green before, exactly one test red after, reverted green; each blindness direction proven separately against the old and new mechanisms |
| E-16 | SEC-5 | new: the grep could not see a QUOTED key, so it was blind to every JSON file in both editions | measured before and after against `{"password": "..."}` and `{"Key": "..."}` |
| E-17 | SEC-5 | new: a committed test signing key in `KernelApiFactory.cs`, allowlisted with its reason | found by the repaired scan's first run, not injected |
| E-6 | SEC-2 | `BindableMemberNames` recurses through properties, constructor parameters, arrays and generic arguments | nested `AuthorDto(CreatedBy)` on a real endpoint: red repaired, green with recursion disabled, reverted green; plus a direct depth assertion |
| A-2 | TEN-1 | a declared-header scan via `IFromHeaderMetadata`, plus a runtime forged-header test | both `[FromHeader]` shapes red; middleware mutated to prefer `X-Tenant-Id` turns exactly the runtime test red |
| E-8 | SEC-1 | allowlist is `(Method, Pattern, Why)`, case-insensitive, with staleness and justification checks | anonymous POST, stale entry and empty justification each proven red separately |
| E-3 | DEP-1 | shared client tier re-planned against the 30-day window: 14 advisories to 1 root, 0 critical | `npm ci` and `npm run verify` green in BOTH editions |
| E-18 | DEP-1 | new: unpinned resolution lands on the version satisfying neither rule; postcss pinned and the conflict named | measured against the registry |

### Deferred, with the reason

| Finding | Claim | Why it is not repaired here |
|---------|-------|------------------------------|
| E-1 | DEP-1 | The CI toolchain floats (`actions/checkout@v4`, `node-version: '24'`, `dotnet-version: '9.0.x'`). Pinning it is not the hard part; giving each pin a dated ledger row is, because DEP-1's window needs publish dates from a different source than npm, and the ledger check in the shared linter has no reader for a workflow file. That is a coherent pass of its own across two workflows, the repo-level workflow and `docs-lint.mjs`, and doing half of it would leave a ledger that looks complete and is not. |
| E-2 | SEC-2, SEC-3, TEN-1 | `BindsFromUrl` under-includes the URL-bound set. E-2's own argument is that ONE predicate cannot serve both claims: widening it to catch `IParsable` value objects fixes SEC-3 and TEN-1 coverage and worsens SEC-2's over-exclusion, and tightening it does the reverse. The repair is a split into two predicates with opposite failure directions, which is a design decision this pass should not take unilaterally while SEC-3 awaits ruling 6. |
| E-12 | SEC-5 | `.env` sits inside the repository tree while SEC-5's statement says development secrets live outside it. The repair moves `MSSQL_SA_PASSWORD` out of the tree, which touches `scripts/dev-setup.sh`, the compose file and the runbook, and none of it can be exercised here because Docker is not running in this environment. A read-from-source change to the secret-provisioning path with no run behind it is exactly what this pass was told not to do. Explicitly NOT closed by the new scan reading tracked files: that is a change to which FILES are scanned and says nothing about where the path is. |
| E-13 | CFG-1 | No mechanism compares a script against committed configuration. Portable, and worth doing. Left because the sibling's committed issuer and audience are both the six-character string `kernel`, below the eight-character floor the Node mechanism uses and below any floor that would not fire on a port number, so the mechanism would ship green while the recurrence the claim was minted from stayed unguarded. Landing it needs an answer to short configuration values, which neither edition has. |
| E-14 | DATA-5 | The claim's `Edition:` bullet names `ValidateOnStart`, which the edition does not have; its mechanism class is satisfied. The false text is in `kernel/claims/DATA-5`, which this pass may not edit. This is an adjudication item, not an edition repair, and is the cleanest instance of S-9 in the register. |
| E-15 | TIME-1 | `TimeTypeTests` omits `Kernel.Api`. TIME-1 awaits ruling 2 and the handover excludes its mechanism. Recorded observation, not acted on: the repair itself (adding one assembly to a scan list) is trivial and the reason to wait is governance, not difficulty. |

### Already resolved before this pass

| Finding | Where |
|---------|-------|
| E-4 | Repaired in the shared linter (the ledger check now keys on name AND version and requires a publish date). |
| E-5, E-5 second instance | Repaired when found; the marker locator is line-anchored and refuses ambiguity. |
| E-7 | Repaired in flow-back round 1: the fallback denies outright and the test resolves the policy from `IAuthorizationPolicyProvider` and evaluates it. Re-confirmed green here. |
| E-9 | Sibling half widened in flow-back round 1 (`workspace`, `account` and compounds). The morphology cost is now asserted rather than described, as a passing case in the new SEC-5 theory. |
| E-10 | Repaired in `kernel/node-react/` when found. |

### One thing this pass changed its mind about

The handover proposed that TEN-1's and SEC-2's rows were false and should be repaired or lowered. Both were
repaired, so neither is lowered. But the reason the SEC-2 row can now read `proven` honestly is narrower than
"the guard recurses": the HOST scan recurses and the CONTRACTS scan does not, and the row says so. A reader who
takes `proven` to mean both guards reach every depth would still be wrong, which is why the mechanism string
names the surviving flat guard instead of describing the repair as complete.

## Framework ruling (Phase 1 output)

**Fastify 5.8.5, and the choice follows from the spike rather than from preference.** The requirement was a
composed route table obtainable completely after startup. Express exposes its router stack only as private
internals with no guarantee across middleware-mounted subrouters; Fastify's `onRoute` is on the registration
path itself, survives encapsulation, and is paired with a framework refusal to register after boot, which
closes the table. The JSON Schema surface it already carries for validation doubles as the contract
enumeration, which is what makes B-2 come out the way it does.

Version chosen under DEP-1: 5.8.5, published 2026-04-14, the newest release clearing the then-current 90-day
window as of 2026-07-26. 5.9.0 (2026-06-28) and 5.10.0 (2026-07-05) were inside that window and were not taken.
The window pass later the same day cut it to 30 days, which does not obligate a move: DEP-1 sets a floor on age,
not a duty to take the newest release that clears it.

## Seeded hypotheses, from the handover

Each was found by reading, not by building, and is a hypothesis until the mechanism is attempted. Confirming
one is a finding; refuting one is a better finding. Status is updated as Phase 3 reaches each claim.

| Hypothesis | Claims | Class | Status |
|------------|--------|-------|--------|
| `DbContext` named in the portable layer; expected trivially neutral | DATA-1 | B | not yet tested |
| Mechanism class is runtime reflection or a type-set scan, which TypeScript erases | SEC-1, SEC-3, TEN-1 (route half) | B, possibly C | **B confirmed, C refuted** (B-1): the leak is free enumeration, not reflection, and `centralized` survives |
| The same, on the contract half | SEC-2, TEN-1 (contract half) | B, possibly C | **refuted and inverted** (B-2): Node is the stronger realization |
| The same, on the remaining four | DATA-9, SEC-7, TIME-1 | B, possibly C | **B confirmed on TIME-1 and more blatant than B-1** (B-5): the portable layer names "assemblies" outright, not merely a capability underneath portable words. C refuted: the contract half is reachable as a format scan over the route table. DATA-9 and SEC-7 not yet tested |
| The ban is on a type, and JavaScript ships one `Date` and it is the unsafe one | TIME-1 | A | **refuted, and the refutation splits the claim** (A-5): a JS `Date` is an instant, so it lacks the ambiguity TIME-1's harm paragraph is about, and it discards the originating offset, so it lacks the property TIME-1's statement requires. It satisfies neither side of a two-way partition, because "UTC-anchored offset-aware" is two properties that `DateTimeOffset` supplies together |
| Node may be the STRONGER realization (wall time plus IANA zone id is native) | TIME-1 | flows back to the edition | **refuted at this runtime** (A-5): `typeof globalThis.Temporal` is `undefined` on Node 24.13.1 / V8 13.6, so `Temporal.ZonedDateTime` is not available and a polyfill is a DEP-1 decision. Asserted as a passing test so the day it arrives the test goes red |
| A portable mechanism class needs three parts: surface, predicate, and completeness obligation | all centralized | S | **confirmed** (S-5), and Phase 3 adds a fourth part the catalog has no words for: where a claim names two mechanisms and asserts a relationship between them, the relationship is part of the claim (A-3) |
| The header surface would be TEN-1's portability casualty | TEN-1 | C | **class C refuted, and the finding inverted into A-2**: the sibling does not reach headers either, so it is a gap in the claim rather than in the stack |
| The route-table residual hole (a hook answering without a route) is irreducible | all route-scan claims | S-5 bullet | **partly refuted** (A-4): SEC-1's fallback closes it against everything the framework's request pipeline can express, because it consults the request rather than the table. The round 4 audit then served `/ghost` at 200 through a `request` listener on `app.server`, which is below the dispatcher and below every hook, so the hole is narrowed rather than closed and is held there by a lint |

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
| B-4 | SEC-2 | Fastify validates with `removeAdditional`, so a body schema closed with `additionalProperties: false` does not describe the accepted fields, it STRIPS every field it does not name before the handler runs. A request carrying `tenantId` reaches the handler without one. **Corrected by the round 4 audit: this holds only at the level that closes itself, so it was true of the top level and false of every nested one until the closure obligation was made recursive. See E-10.** The .NET edition's mass-assignment defence is a scan that fails the build; here the same declaration is also a runtime filter, and the two together are strictly stronger than either. Measured, and asserted in `routeSurface.test.ts`. |
| B-2 | SEC-2, TEN-1 | Attaching the contract to the route removes both the assembly heuristic and the name-suffix filter. No .NET repair is proposed here: the point is that the .NET weakening notes understate the gap, and the record should say so. |
| E-6 | SEC-2 | Both SEC-2 guards are flat. `BindableMemberNames` does not descend into a property's type or a collection's element type, and `ContractShapeTests` enumerates only `*Request` types, so a nested DTO is never enumerated at all. A server-controlled field one level down passes both. No live instance, because the shipped contracts are flat records. |
| E-7 | SEC-1 | The fallback is `RequireAuthenticatedUser()`, so an endpoint with no authorization metadata is reachable by every authenticated caller with no permission, across tenants. And the test that would notice asserts a requirement object is present in an options list, so it cannot distinguish that host from one that never calls `UseAuthorization()`. Both repairs are cheap: deny outright, and compose an ungated endpoint and read the status code. |
| E-8 | SEC-1 | The anonymous allowlist is a `string[]` of paths: no justification field despite the claim requiring one, keyed by path so one anonymous GET pre-authorizes every method on that URL, and with no staleness check. |
| E-9 | SEC-2, SEC-3, TEN-1 | The registries match by case-insensitive equality, so `emailAddress`, `noteStatus` and `createdAtUtc` walk past entries for `email`, `status` and `createdAt`. A token-run matcher catches all three and needs a shorter list. |
| A-4 | SEC-1 | The residual hole both editions carry (a URL served by a hook with no route behind it) is closed by a fallback that consults the request rather than the route table. The sibling's fallback runs after routing, so whether the same closure is available there is a measurement nobody has taken. |
| E-7 (round 4) | SEC-1 | The fallback test cannot see the mutation that matters. `AuthorizationMiddleware` takes the fallback from the custom `IAuthorizationPolicyProvider`, not from `IOptions<AuthorizationOptions>`; returning null from `PermissionPolicyProvider.GetFallbackPolicyAsync()` opens every metadata-free endpoint to an anonymous caller with all 49 tests green. One test fixes both halves: register a metadata-free probe endpoint in the test host and assert the status code for an anonymous caller and for an authenticated one with no permission. |
| E-6 (round 4) | SEC-2 | Two shipped artifacts state the recursion that does not exist. `kernel/dotnet-react/README.md` and the SEC-2 row of `kernel/dotnet-react/conformance.json` both say the scan covers "nested and immutable constructor-bound DTOs", and the conformance row is the machine-readable ledger carrying SEC-2 as `proven`. Also: `IsBodyDto` has a fifth, unrecorded exclusion, `type.Namespace is null`, so a public DTO declared in `Program.cs` is skipped by the body scan entirely. |
| E-2 (round 4) | SEC-3, TEN-1 | `BindsFromUrl` under-includes the URL-bound set: any `IParsable` value object, any legacy `TryParse` type, `TimeSpan`, `Uri`, `IPAddress` and `StringValues` all bind from route or query and yield nothing to the scan. Wrapping a tenant id in a strong type silently blinds TEN-1's named mechanism. |
| E-9 (round 4) | SEC-2, SEC-3, TEN-1 | `ForbiddenTenantParams` omits `workspace` and `account` entirely, in either spelling. Separately, `ToolExecutor.ServerOwnedKeys` is the same equality matcher in PRODUCTION code rather than a test, where an actor-supplied `tenantIdentifier` is not stripped. |
| E-11 (round 2) | SEC-5 | `Jwt:Key` committed in plaintext to `appsettings.json` leaves all 49 architecture tests green and the CI secret-scan silent, measured. `SecretConfigShapeTests` matches `leafKey.Contains(entry)` and `Key` is shorter than every entry that would describe it; the CI grep carries no `-i` and .NET config keys are PascalCase, so `Password:` escapes and the workflow's own `MSSQL_SA_PASSWORD` literal is invisible. Two changes: add `key` as a whole-word entry, and add `-i` to the grep. |
| E-12 (round 2) | SEC-5 | `scripts/dev-setup.sh` writes `MSSQL_SA_PASSWORD` to a gitignored `.env` at the edition root, so a development secret lives inside the repository tree while the claim requires "outside the repository tree" and the row reads `proven`. A gitignore entry is a property of a tool's configuration; the claim asks for a property of a path. The Node edition asserts the path directly, which the sibling could do today. |
| E-13 (round 2) | CFG-1 | The claim's sentence "a script never duplicates a committed configuration value, it reads it" is enforced by nothing. `OperationalSettingsTests` scans two literal patterns and never compares a script against committed configuration, so the recurrence the claim was minted from is unguarded; the conformance row records the current state of `e2e.sh` as though it were a mechanism. |
| E-14 (round 2) | DATA-5 | The `Edition:` bullet names `ValidateOnStart` on all option types. Measured: no `ValidateOnStart`, no `AddOptions`, no options binding anywhere in `server/src`. The mechanism is a hand-rolled `Required()` closure, which satisfies the claim's mechanism CLASS; the record describes the wrong mechanism. Also: `Required()` throws on the first missing key, so three missing keys is three failed deploys. |
| E-15 (round 2) | TIME-1 | `TimeTypeTests` omits the `Kernel.Api` assembly. Measured with a control: a naive `DateTime` property on a public type in `Kernel.Api` leaves 49 of 49 green; the identical type in `Kernel.Contracts` turns the suite red. It composes with E-6's `Namespace is null` exclusion on `Program.cs`, so a request DTO declared there escapes SEC-2's body scan and TIME-1's type scan at once. |
