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
reconciled against either edition's mechanism column, because 61 claims still owe a step 2. (That reason was retired on 2026-07-27 with the delta protocol's research phase; the constraint stands on the reason in the digest's corrected head note.)

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

**RULED AND APPLIED, adjudication pass 2026-07-26 (ruling 10, option b).** `locus` is an enum of exactly two
values and every qualification moves to a free-text `locus_note`. 20 files split, mechanically on the leading
word, giving 55 `centralized` and 14 `per-seam`, which is the tally the catalog already quoted, so nothing moved
when the prose became a field and no hybrid was flattened. A docs-lint check enforces the enum wherever the
catalog is present and announces its skip where it is not, red-green proven in eight probes including the seeded
shape. One probe found a hole the finding did not predict: the shared front-matter parser reads a key with an
empty value as absent, so `locus_note:` with nothing after it was invisible, and the check reads the raw block
because of it. Class C is now a mechanical comparison rather than an eyeball judgement, which was the reason to
do it.

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

**RULED AND APPLIED, adjudication pass 2026-07-26 (ruling 8c, yes).** CON-2's weakening notes now name the
precondition (both consumers live under one root that travels together) and the sanctioned alternative (one
authoritative source plus a materializer with a drift check, which is what `kernel/tools/compose.mjs` already
is), with this repository's own shared tier named as the measured case. The statement is unchanged, because it
is right wherever its precondition holds. Two copies plus a test comparing them stays rejected, and the
difference is stated: a materializer has a source and copies, the rejected shape has two peers and an opinion.

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

**RULED AND APPLIED, adjudication pass 2026-07-26 (ruling 2, option c).** The file schema now states that a
mechanism class is a surface, a predicate, and a completeness obligation carrying three parameters, and each
parameter is written into the schema with the measurement that found it. A `- Completeness obligation:` bullet
is written into the eight built claims only (SEC-1, SEC-2, SEC-3, TEN-1, CFG-1, SEC-5, DATA-5, TIME-1); the
other 61 gain theirs at the pass that builds them, because an obligation written in advance of a mechanism is an
aspiration and guessing is what put a false mechanism in a claim file once already. Two shipped rows in
`kernel/dotnet-react/` are falsified by it, SEC-2 and TIME-1, and both now read `owed` with their built halves
stated as `proven` obligations rather than collapsing to one word.

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

**RULED AND APPLIED, adjudication pass 2026-07-26 (ruling 2), which is where this finding was folded rather
than into the portable-vocabulary ruling.** Free enumeration is not a vocabulary leak, it is the unstated first
parameter of a completeness obligation: what the claim was assuming is that the surface can be enumerated at all,
and when. The schema now says so, and the route-scan claims state when their enumeration is taken.

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

**Status consequence, adjudication pass 2026-07-26.** Still open and still blocked on the same split, but it
is no longer sitting under a row that reads `proven`: SEC-2, SEC-3 and TEN-1 in `kernel/dotnet-react/` now carry an
enumeration obligation that reads `owed` and cites this finding by id, so the hole this finding measured is visible
in the machine-readable record rather than only in a prose note.

**REPAIRED 2026-07-27, and the remedy is wider than the one this finding proposed. That is worth naming.**

This finding argued for a split: one predicate cannot serve SEC-2 and SEC-3/TEN-1 because the two claims need
opposite errors, so make it two. The split was built and then abandoned within the same pass, because measuring
it produced a better answer. Reflection cannot reproduce the binder's rules: `Uri` has no static `TryParse` and
does not implement `IParsable`, and it binds from the URL anyway. A predicate written from `IParsable` plus a
`TryParse` probe therefore had exactly this finding's defect on its first day.

What the framework does publish is its own conclusion. `RequestDelegateFactory` records the body it inferred as
`IAcceptsMetadata` on the composed endpoint, and that is available to the scan. So neither enumeration reimplements
anything now:

- **SEC-2's body set** is `IAcceptsMetadata.RequestType` per endpoint, with the parameter walk kept as a second
  net and a non-vacuity assertion, because a body enumeration that finds nothing passes forever.
- **SEC-3's and TEN-1's URL set** is enumerated BY EXCLUSION: the framework's declared body type, registered
  services and a closed list of pipeline types are set aside, and every other parameter is a value a caller can
  spell. Under-inclusion is no longer possible for a declared parameter, because a type nobody has thought of is
  now inside the surface by default rather than outside it. That inverts the failure direction this finding named
  as the dangerous one.
- What survives of `BindsFromUrl` answers a different question, "is this a scalar the binder fills from one
  string", which is about the type and not about routing.

Both directions are held to the real binder by
`Both_enumerations_agree_with_the_real_binder_over_a_corpus_of_parameter_types`, which builds a throwaway host per
corpus type, lets `RequestDelegateFactory` classify a parameter named `tenantId`, and asserts that whichever
surface the framework put it in is the surface that scans it. The corpus is this finding's own measured list:
`TenantKey : IParsable`, `TimeSpan`, `Uri`, `IPAddress`, `Int128`, a legacy `TryParse` class, `Guid[]`,
`TenantKey[]`, `List<T>` and a plain record. This is what the finding said did not exist: a way for the two
implementations to disagree and something to fail when they do.

**Proven against the composed host, both ways.** A query parameter named `tenantKey` typed `TenantKeyProbe :
IParsable` was mapped on a real route: red now, and green under the mechanism restored from HEAD with the same
parameter still planted. The route-parameter case is NOT a proof of this repair and was rejected as a control
when it came up green on both sides: route pattern parameters were always read by name without consulting a
type, which is what TEN-1's row already says.

**Status consequence.** SEC-3's enumeration obligation and TEN-1's query-surface obligation read `proven`. SEC-2's
enumeration obligation stays `owed`, on the other half, and only that half: see E-6.

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

**RULED AND QUEUED, adjudication pass 2026-07-26 (ruling 11a).** Queued in `record/candidates.md` with its
three instances and its named, unbuilt mechanism, and deliberately not minted: minting a claim whose enforcement
does not exist is the aspirational-claim failure this candidate is itself about. What settles it is building the
synthetic minimal edition fixture, at the next pass that touches the shared tier.

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

**RULED AND APPLIED, adjudication pass 2026-07-26 (ruling 7, option b).** HUM-1's mechanism class now names
a committed ownership declaration and a merge gate on the hosting platform, with the split stated: which paths are
irreversible is portable and fixed, where each one lives is the edition's to declare, and whether the remote
enforces the gate is the arming step. The same artifact named in the weakening notes was repaired with it, because
repairing one and not the other would have left the file arguing with itself.

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

**RULED AND APPLIED AND EXECUTED, adjudication pass 2026-07-26 (ruling 9).** The half this finding recorded
as explicitly unclosed is closed: DEP-1's statement now carries the resolution order (a live advisory outranks the
cooling-off window, above the 7-day hard floor, by explicit owner decision), and any pin taken under that rule
carries a ledger row whether the dependency is direct or transitive, which is the recording gap this finding named
one level out. DEP-1's weakening notes now record that the window's value is independent of any standing policy
outside this repository, so the next pass cannot re-derive it from a document the catalog cannot see. DEP-2's
trigger moves to the next edition build pass in both editions' rows, on this finding's argument that a trigger
names the event that makes a mechanism buildable and not the event that makes its absence noticed.

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

**RULED AND APPLIED, adjudication pass 2026-07-26 (ruling 5, option b).** TEN-1's mechanism class now
requires a mechanism of a different kind for the fourth surface, and says why: a caller may send a header nobody
declared, there is no enumeration of the headers a request can carry, so the surface takes a runtime mechanism
(tenant-shaped headers removed or the request refused before any handler, plus a test that tenant resolution does
not consult a header even when one arrives) and neither half substitutes for the other. The statement is
untouched, because it was right; a claim that narrows its statement to match a mechanism nobody built is the
aspirational-claim failure run backwards.

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

**RULED AND APPLIED, adjudication pass 2026-07-26 (ruling 4, option b).** The file schema now states that an
asserted relationship between two of a claim's mechanisms is part of the claim, and that the edition owes evidence
for the relationship and not only for each mechanism. SEC-1 carries the resulting `- Mechanism relationship:`
bullet: independence means the two fail on different inputs, the scan reads the enumeration and the fallback
answers a request the enumeration never contained, and splitting on what each consults rather than on when it runs
is what buys the independence back. Scoped inside a claim; the cross-claim case has one witness and is queued in
`record/candidates.md`.

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

**Status consequence, adjudication pass 2026-07-26 (ruling 2).** The repaired host half now reads `proven` as
an obligation in its own right, and the flat contracts half reads `owed` beside it with MOD-2's delta pass as its
trigger. The row is `owed` overall. The sentence this finding argued for, that a reader taking `proven` to mean
both guards reach every depth would be wrong, is now unnecessary, because the record no longer says `proven`.

**The host half's SECOND exclusion is closed too, 2026-07-27, and the contracts half is now the only one open.**

This finding's own postscript recorded a fifth, unwritten exclusion in `IsBodyDto`: `type.Namespace is null`, so a
public DTO declared in `Program.cs` was outside the body scan entirely. It is gone, along with the predicate it
lived in (see E-2). Proven on a real route: `public sealed record GlobalRequest(string Title, string CreatedBy)`
declared after the top-level statements and posted to `/probe-body` is red now, and green under the mechanism
restored from HEAD with the same record still planted. E-15 records the other half of the same composition, and
`TimeTypeTests` had the identical exemption under a different name; both are gone.

**`ContractShapeTests` is still flat, still `*Request`-only, and still not repaired here**, for the reason it was
not repaired in round 6: it is MOD-2's realization and MOD-2 has not had its delta pass. What changed is that the
residual is now measured rather than described. Planted and run:

| Shape | Both guards |
|---|---|
| `OrphanRequest(string Title, ProbeAuthor Author)` in Contracts, `ProbeAuthor` carrying `CreatedBy`, on no route | green: the flat net does not descend, and the host net has no route to enumerate |
| the identical type, bound to `POST /probe-orphan` | red at depth 1, from the host net alone |

So the uncovered set is exactly: contract types that no route binds, which cannot be posted to, and which are
caught the moment they gain a route. That is the price of leaving the third net flat, and it is the number the
owner is deciding against when they rule on whether to burn MOD-2's delta pass to repair it.

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

**RULED AND APPLIED, adjudication pass 2026-07-26 (ruling 6, option b), with the wider scope E-16 argued
for.** The comparison is part of the mechanism class, stated once in the file schema as a rule over ANY mechanism
whose predicate matches a name against a list, and written as an obligation into the four measured claims: SEC-2,
SEC-3, TEN-1 and SEC-5. The rule names what the comparison must resolve (compounds, concatenations,
decompositions, plurals) and how the surrounding format spells a name, and it says that enumerating the spellings
by hand is a list standing in for a comparison and does not discharge it. Three shipped rows in
`kernel/dotnet-react/` are falsified: SEC-2, SEC-3 and TEN-1, each now `owed` with a comparison obligation that
reads `owed` beside a predicate obligation that reads `proven`.

**REPAIRED in `kernel/dotnet-react/` 2026-07-27, by a third matcher rather than by porting the second.**

The audit's central correction is what made the port wrong: the two matchers are incomparable, not ordered, and
six inputs escape both. So `NameComparison` is built to beat both, and each of its four rules answers one class
the three claims name:

| Rule | Class | What it buys |
|---|---|---|
| tokenize on camel case, separators AND letter/digit boundaries | compounds | `emailAddress`, `user_email`, `email1` |
| re-glue every contiguous run of tokens into a candidate word | decompositions | `e_mail`, `e-mail`, `EMailAddress` |
| a candidate word that BEGINS or ENDS with an entry matches it | concatenations | `firstname`, `notestatus`, `tenantid`, the class the token matcher cannot reach |
| fold `s`/`es`, and derive an entry's tail past a one-letter particle | plurals, decompositions | `emails`, and `mail` from `email` |

All six inputs that escape both editions are asserted, and so is the evidence that this is a comparison and not a
longer list: **the registries got shorter.** `firstname`, `lastname`, `dateofbirth`, `tenantid`, `orgid`,
`organizationid`, `organisationid`, `workspaceid`, `workspaceslug` and `accountid` stopped being entries and are
now derived from `name`, `tenant`, `org`, `organisation`, `workspace` and `account`; `CreatedAtUtc`, `Roles` and
`Permissions` are derived from their base words. Every dropped spelling is asserted to still match, which is the
only thing standing between "a comparison replaced the list" and "the list was deleted".

The costs are asserted as passing tests rather than described: `fileName` matches `name` (the sibling met the same
cost and wrote it down), `voicemail` matches `email` because it ends with those letters and carries no boundary,
and the tail rule derives non-words from every entry. The boundary those costs stop at is asserted too: `origin`
does NOT match `org`, which is the prefix alternative this finding records the sibling rejecting, and it is
rejected here by requiring a short entry's residue to be a declared affix.

**And this finding's own exhibit list needed one more correction, in the same direction as the audit's.** E-9
quotes SEC-2's weakening note, "a field named `newState` slips past a registry listing `status`". Measured against
the comparison and this registry, `newState` is CAUGHT, and not by `status`: `state` is an entry beside it and
`newState` is a compound of that. The note is true of the entry it names and false of the registry it describes.
The honest replacements are a genuine synonym (`approvalStage`, `lifecyclePhase`) and both are asserted as
residuals. This is the third time an exhibit in this finding has been refuted by running it rather than reading
it, and the thesis has survived all three.

**What still walks past, asserted in the direction of the hole so closing it later goes red:** a synonym, an
abbreviation the registry does not carry, a reordering (`birthDate` against `dateOfBirth`), a plural that is not
`s`/`es`, and a parameter whose name says nothing.

**Status consequence.** The comparison obligation reads `proven` on SEC-2, SEC-3 and TEN-1 in
`kernel/dotnet-react/`. SEC-5's registry still matches by its own rule and was not in this pass's work list.

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

**RULED AND APPLIED, adjudication pass 2026-07-26 (ruling 3, option c, with a weakest-wins roll-up).**
`conformance.json` rows may carry an `obligations` array, one entry per separable duty with its own status and
its own sentence; the row declares a roll-up status and the tool checks it against the weakest obligation rather
than computing it, so a hand-edited row cannot disagree with its own halves. Eight validation paths and the
renderer, red-green proven in eleven probes, composed into both editions. 13 rows carry obligations: 9 in
`kernel/dotnet-react/` and the 4 measured here. All four of the rows this finding was measured on now state their
built half as `proven` inside a row that still reads `owed`, which is what the finding asked for.

**And it does not reach three of the nine sibling rows**, which is recorded as S-11 rather than smoothed: where a
row's weakest obligation is a deferred extension rather than an unbuilt half, weakest-wins reads `owed`, and
`owed` means "not built" in this vocabulary, which would be false of a mechanism that gates merges today.

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

**RULED AND APPLIED, adjudication pass 2026-07-26 (ruling 8a, yes).** TIME-1's statement now separates the
two properties and says what each buys: unambiguity, which is what its entire harm paragraph is about, and offset
retention, which is what the display edge and an incident reader need. A type with the first and not the second is
named as neither the forbidden shape nor the permitted one, and an edition realizing the claim on such a type
states which property it has and where the other is carried, rather than reporting the ban satisfied.

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

**RULED AND APPLIED, adjudication pass 2026-07-26 (ruling 7, option b).** TIME-1's mechanism class now reads
"every layer the statement names", by whatever means that stack exposes its declarations, and PERF-4's reads "the
server's own code, in whatever unit that stack compiles or ships it as". DATA-1 is deferred to the pass that
builds it, as ruled: its substitution sounds easy and is exactly the kind of translation this register has been
wrong about when it was done from an armchair. The four remaining instances in Weakening-notes sections are open
and recorded as B-6.

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

**RULED AND APPLIED at the catalog level, adjudication pass 2026-07-26 (ruling 4).** The repair landed in
the edition on the day this was found; what the catalog owed was the rule that made the gap statable, and SEC-5
now carries it as a `- Mechanism relationship:` bullet. Independence of mechanism is not independence of blind
spot, and the claim now says so rather than leaving it as a fact about one edition's bad afternoon.

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

**RULED AND APPLIED, adjudication pass 2026-07-26 (ruling 2).** The deliberate non-repair ends here as
predicted: TIME-1's completeness obligation now requires the layer set to be derived from a rule the test can check
rather than a hand-written list, with this finding's control as the argument, and `kernel/dotnet-react/` TIME-1
reads `owed` with the omitted layer as its own obligation. The one-line repair is still owed and now has a trigger
and a status instead of a governance hold.

**REPAIRED 2026-07-27, and not by adding the missing assembly.** Adding `Kernel.Api` to the array would have
closed this instance and left the defect, which is the hand-written list itself; TIME-1's completeness obligation
asks for "a rule the test can check rather than a hand-written list" and for the remedy that makes it checkable,
"a layer that exists and is not in the enumeration fails the build too". So `TimeTypeTests` now derives its layer
set from the projects under `server/src`, loads each one beside the test binary, and fails a test of its own when
a declared layer has no assembly there. The derivation is cross-checked against the composed host's own assembly
graph, so a walk that returns nothing cannot read green.

Three controls, each planted, confirmed red, and reverted:

| Control | Result |
|---|---|
| a naive `DateTime` on a public type in `Kernel.Api/Platform/`, this finding's own control | red, naming the layer |
| the same type declared in `Program.cs`, where it has no namespace at all | red |
| an unreferenced project added under `src/`, carrying no time type whatever | red, on both facts, naming the layer |

The second control is the composition this finding is really about, and it took a second repair to close.
`PublicSurface` stopped its hierarchy walk at the first type it judged framework, and it judged a null namespace
to be framework, so a public record declared in `Program.cs` was skipped even once the layer was scanned. That is
the same exemption E-6 found in `IsBodyDto` under a different name, and the two of them met on the one file three
mechanisms exempt. Both are gone: the global namespace is app code in both scans as of 2026-07-27.

**Status consequence.** TIME-1's layer obligation reads `proven`. The row stays `owed` on the monotonic-durations
half, which has no realization here and is not part of this pass; see S-11, which this row is now a fourth
instance of.

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

**RULED AND APPLIED, adjudication pass 2026-07-26 (ruling 8b, yes).** CFG-1's statement names the ambient
process environment as a fourth home and, unlike the third, does not ban it: overriding a setting at deploy time
is legitimate and a ban would be routed around. It is closed by being brought inside the config system, so an
environment read resolves only through the declared configuration surface under a name derived from a declared
key, and an ad hoc read anywhere else is named as the same defect as a literal in code and one worse. The
mechanism class and the completeness obligation both cover the third route.

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

**RULED AND APPLIED, adjudication pass 2026-07-26 (ruling 2).** The remedy is the third parameter of the
completeness obligation in the file schema, with this finding's measurement as its argument: two closed surfaces
in one edition have opposite correct behaviours on an undeclared member, so the remedy is a ruling the claim owes
and not a default. Written into the eight built claims. DATA-5's obligation states the operator-facing remedy
(refuse an undeclared key) beside SEC-2's caller-facing one (refuse or remove, ruled per surface) and says why
they are deliberately opposite.

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

**RULED AND APPLIED, adjudication pass 2026-07-26 (rulings 4 and 6).** This finding is why ruling 6 is a
schema rule rather than three claim edits: the same failure arrived in a fourth claim that is not a name-registry
claim at all, so the property belongs to any name-matching predicate. SEC-5 accordingly carries a comparison
obligation naming the format-spelling case (a key written as `"password":` in one format and `Password=` in
another is the same key, and a pattern anchored on one separator sees neither), and the same claim carries the
`- Mechanism relationship:` bullet ruling 4 minted, because this finding is the third of the three independent
blind spots that made the pair's union less than it looked.

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

**RULED AND APPLIED, adjudication pass 2026-07-26 (ruling 4).** The joint gap this instance demonstrates is
now stated in SEC-5's `- Mechanism relationship:` bullet: the evidence the claim asks for is an assertion that the
union of the two mechanisms' scopes covers the tracked set, plus a control that a credential planted in each
half's territory is caught by that half. Each scope was defensible alone, and the union was assumed to be total by
nobody in particular, which is exactly what an unstated relationship costs.

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

**RULED AND EXECUTED, adjudication pass 2026-07-26 (ruling 9a).** The advisory wins. `postcss` is re-pinned
from 8.5.15 to 8.5.18 in the shared tier, recomposed into both editions, and the pin carries the first row of a new
"Pins taken under DEP-1's advisory rule" section in both `VERSIONS.md` files, naming the advisory, the decision,
and the date the pin clears the window (2026-08-11). Measured after: `npm audit` reports **0 vulnerabilities** over
the shared client tier and over both editions' composed client trees, down from 1 high. The pin is above the 7-day
floor, which did not have to bend. This finding's general point survives the fix and is now in the claim: deciding
nothing is not neutral, because a resolver picks a version uncorrelated with both rules.

### B-6. The portable-layer rule now has four open instances the ruling that stated it does not name

**Claim:** AI-3, DATA-2, TEN-1, TIME-1. **Found:** the adjudication application pass, 2026-07-26, applying
ruling 7. **Measured** by reading the four Weakening-notes sections, not by the keyword scan that first counted
them.

Ruling 7 states a rule in the file schema (the portable layer names no artifact, type, tool, or convention
belonging to one stack) and repairs three instances: HUM-1, TIME-1, PERF-4. All three are `Mechanism class:`
bullets, which is the surface the ruling's evidence table measured. S-1 recorded a second surface at the same
time, five Weakening-notes sections, and ruling 1 explicitly left them to rulings 7 and 8; neither ruling names
them, so the pass repaired one of the five as collateral (HUM-1's, because it names the same artifact as the
mechanism-class instance in the same file, and repairing one and not the other would have left the file arguing
with itself) and left four:

| Claim | What the weakening note names |
|---|---|
| AI-3 | one runtime's packaging unit, in the sentence scoping the prompt-literal ban |
| DATA-2 | one data-access library's materialization call, as the example of the unbounded read |
| TEN-1 | one runtime's packaging unit, in the sentence bounding the contract scan's reach |
| TIME-1 | three of one runtime's date types, in the sentences permitting calendar concepts and describing the offset-versus-zone gap |

**Why this is a finding and not a cleanup.** The catalog now carries a stated rule with four known violations in
it, which is a worse state than an unstated rule with four instances: a rule that is stated and not held is the
aspirational-claim failure applied to the catalog's own governance. It is left open deliberately rather than
repaired quietly, because the scope guard on this pass is that an edit no ruling authorizes is a finding, and
because three of the four (DATA-2's and TIME-1's especially) are the cases ruling 7 itself flagged as needing a
build rather than an armchair: the portable substitution for a named date type is the pair of properties TIME-1's
statement now separates, and getting that wrong in the weakening note would undo ruling 8a in the same file.

**What it costs while open:** nothing an edition can trip on today, since both editions read the mechanism class
and not the weakening note. It costs the next editor, who will read the schema rule, find four counter-examples,
and have to discover which of the two is authoritative.

### S-11. The weakest-wins roll-up cannot express a row whose weakest obligation is a deferred extension

**Claim:** the conformance vocabulary, therefore all 69. **Found:** the adjudication application pass,
2026-07-26, applying ruling 3 to the nine rows the ruling names. **Measured on those nine**, not reasoned from
the schema.

Ruling 3 gives a row per-obligation statuses with a roll-up in which the weakest obligation wins. Six of the nine
rows decompose cleanly and keep their status: their second status in prose is either a per-seam residue that
`patterned` already means (TEN-2, SEC-6, UI-4's two directions, AI-2) or a named upgrade behind a mechanism that
is built and tested (SEC-4's durable version store, SEC-5's second scanner). Three do not:

| Row | The second status in prose | What weakest-wins would make the row read |
|---|---|---|
| TEN-4 | the write-provenance stamps are `owed`, trigger: the next edition build pass | `owed`, for a save-pipeline guard that runs on every write today |
| UI-4 | the prototype-to-ledger exporter is `owed`, and the statement names it | `owed`, for two fidelity directions that are tested and gating |
| DEP-1 | the kernel-provenance check is `latent` until an instantiation fills a real pin | `latent`, for exact pins, lockfiles, locked-mode restore and the ledger, all of which run in the loop |

**The defect is in the vocabulary, not in the ruling.** `owed` is defined as "not built; recorded with the
trigger that promotes it. Out of the v1 cut line, not lost", so it carries a claim about the CUT LINE and not only
about strength. Rolling an in-cut proven duty together with an out-of-cut deferred one and taking the weakest
produces a word that is false in the vocabulary's own terms: TEN-4 is built, gating, and red-green proven, and no
reading of `owed` describes it. The conservative direction is right for a security claim and the failure is at the
bottom of the scale, where "weakest" and "absent" are the same word.

**What was done, and it is deliberately partial.** All 13 named rows gained the structure. For these three, the
obligations written are the duties the row's status actually covers, and the deferred piece stayed in the note
where it already was. Ruling 3 is therefore applied for 13 rows and does not reach 3 second statuses, which is
recorded here rather than smoothed by moving three shipped statuses no ruling authorized: the pass's own scope
guard is that an edit no ruling authorizes is a finding, not a repair.

**A fourth instance, 2026-07-27, and it arrived by a row being RAISED rather than by the ruling being applied.**
TIME-1's layer obligation moved from `owed` to `proven` when E-15 was repaired, leaving the row with two
obligations that are built, gating and red-green proven and one, the monotonic-durations lint, that has no
realization here at all. Weakest-wins makes the row `owed`, which is the same false reading the three rows above
carry: nothing about `owed` describes a scan that fails the build today over every layer the server declares.

The instance is worth recording separately because it shows the defect is not an artifact of the application
pass. It reappears every time a row's last deferred extension outlives its shipped duties, which is the normal
shape of a claim that grew an extension after its mechanism was built. Per the pass instruction, no fifth status
word was invented and the row reads conservatively.

**What would close it,** neither proposed nor priced here: an obligation would carry whether it is inside the
edition's cut line, and the roll-up would take the weakest obligation that is. That is a second field and a
second rule on the same structure, so it wants a ruling and evidence from a third edition rather than a same-pass
extension.

### E-19. A conformance note went stale inside the same pass that repaired the mechanism it describes

**Claim:** SEC-5, in `kernel/node-react/`. **Found:** the adjudication application pass, 2026-07-26, writing
ruling 3's obligations into the row. **Measured**, not inferred: `.github/workflows/ci.yml` in that edition runs
`node tools/secret-scan.mjs --self-test` and then `node tools/secret-scan.mjs` as a required job.

The row's note reads that "the CI secret-scan gate the claim names as its second mechanism is not built, so a
credential assigned to a non-secret-shaped name is invisible". That was true when it was written and stopped
being true a few hours later, in the E-16 repair, which replaced a YAML grep with a composed shared-tier scanner
and wired it into both editions' loops. The repair updated the sibling's row and the register entry and did not
update this row, because the row belongs to the edition the repair was flowing back FROM.

**Why it is recorded rather than quietly corrected.** The register's own standard is that a status the record
cannot honestly carry is a finding, and this is one: the row understated its own edition by one whole mechanism.
It is also the second instance of a shape worth naming, the first being E-14: a prose sentence describing another
tree's mechanism has no checker on either side, and here both trees were in the same repository and the same day.
The gate that exists (`conformance.mjs`) proves the record is internally consistent and cannot read a claim a note
makes about the world.

**What changed:** the obligation is written as `proven` with the mechanism named, and the note's stale clause is
removed. No status changed: SEC-5 in that edition rolls up to `owed` on the vault port either way.

### E-20. A row can meet every obligation it carries and still not meet its claim

**Claim:** SEC-3, and SEC-2 in the same shape. **Found:** the raise pass of 2026-07-27, closing E-2 and E-9.
**Measured**, with a control, before the row was written.

SEC-3 carried three obligations after the adjudication pass: a predicate, an enumeration, a comparison. E-2 closed
the enumeration and E-9 closed the comparison, both proven both ways, so the roll-up would have returned the row
to `proven`. It does not, and the reason is not a mechanism that fell short. It is that the three obligations do
not add up to the claim.

SEC-3's completeness obligation ends: "a query parameter the surface does not declare is refused or removed before
the handler by a ruled decision, never bound silently". Nothing in this edition does that, and it is not a
theoretical gap: a handler declared as `(HttpContext context) => context.Request.Query["emailAddress"]` was mapped
on a real route and the whole suite stayed green. The scan cannot see it, because there is no declaration to scan,
which is precisely the argument TEN-1 makes about headers and answers with a runtime mechanism rather than a scan.

So a fourth obligation is written into the row and reads `owed`, and the row reads `owed` with it. **This is not
the claim being softened and not the mechanism being blamed.** The duty was in the claim before the adjudication
pass and the row simply never carried it, so the row could have read `proven` while the claim's own last sentence
went unmet. Ruling 3 gave a row per-obligation statuses; nothing checks that a row's obligations COVER its claim,
and `conformance.mjs` cannot check it, because it can compare a row against the catalog's file list and not
against the catalog's prose.

**The same shape sits on SEC-2** and is left where it is: its remedy sentence says "a member the contract does not
declare must not reach the handler, and whether it is refused or removed is a ruling recorded per surface", and
this edition's serializer silently drops unknown members with no ruling recorded anywhere. SEC-2's row already
reads `owed` on the MOD-2 blocker, so adding the obligation moves no status; it is named here rather than written
into the row, because a pass that starts adding unruled obligations to rows is doing the adjudication's job.

**What it costs while open:** SEC-3 reads `owed` for a duty no mechanism in this repo has ever discharged, which
is honest and is also indistinguishable, at the row level, from the two mechanisms that were repaired this round.
The obligation text is where the difference lives.

### S-12. The quarantine was breached by reading, in the pass that was told not to breach it by writing

**Claim:** MOD-2, and the delta protocol structurally. **Found:** the raise pass of 2026-07-27, by the agent that
did it, at the point of writing the report.

The pass's standing constraint was that `ContractShapeTests` is MOD-2's realization, that MOD-2 still owes a step
2, and that the decision to open it belongs to the owner. The file was not edited. **It was read**, early, while
building the picture of SEC-2's two guards, and before the constraint had been weighed against the reading list.
Under the delta protocol that is the same breach as an edit: step 2 is written from the claim text alone, and a
reader who has seen one edition's answer cannot un-see it.

Three things make this worth a finding rather than an apology.

- **The read was avoidable and the measurement that mattered did not need it.** What the pass actually had to know
  was the SIZE of the residual the flat net leaves, and that was established behaviourally, by planting a nested
  violation on an unrouted contract and then routing it (E-6). The file's source was not required for any
  conclusion in this pass.
- **The register had already leaked it.** E-6 quotes the filter verbatim, down to
  `Type.Name.EndsWith("Request", StringComparison.Ordinal)`, and the round 6 verification round names the file's
  flatness twice. A step 2 written for MOD-2 from the claim file plus this register was already informed before
  this pass touched anything, which is S-9's point aimed at a second surface: the quarantine covers the sibling's
  code and cannot cover the record ABOUT the sibling's code, and this register is read at the start of every pass.
- **The cost is asymmetric and small in one direction only.** MOD-2's step 2 loses its independence for the
  placement rule that `*Request` naming encodes. It does not lose the rest of the claim.

**Not proposed here:** whether a leaked claim should be marked burned in the delta ledger the way S-9's `[informed]`
marking does, or whether the protocol should treat the register as inside the quarantine and require step 2 to be
written before the register is read. Both are rulings, and both are larger than this pass.

**RE-GRADED 2026-07-27: there was no breach, and the constraint that made it look like one was false.** Measured
without reading the mechanism, by boolean substring tests: MOD-2's conformance row names `NamingPlacementTests`
and does not name `ContractShapeTests`; `ContractShapeTests.cs` contains the string "MOD-2" zero times; its own
summary names SEC-2; and the three files that do name MOD-2 are `NamingPlacementTests`, `EndpointSpineTests` and
`NameComparisonTests`. `ContractShapeTests` is SEC-2's guard, SEC-2 was legitimately burned by its own delta
pass, and the agent that reported this was reading its own claim's realization.

The premise originated in the flow-back pass, was propagated into a commit message and then into a handover as a
standing constraint, and was carried by three passes without ever being measured. Its cost was not the breach it
appeared to be; it was that the repair it blocked went unmade for three rounds while both SEC-2 and TEN-1 sat
below their claims.

**RULED 2026-07-27, and the structural half is closed with a measurement rather than a policy.** The second
bullet above said the quarantine cannot cover the record ABOUT the sibling's code and that nothing detects the
leak. The first part stands. The second was wrong, and it was wrong in a way worth naming: it treated the leak as
unbounded because its SOURCE is unbounded, when what matters is its REACH, and the reach is enumerable. A finding
leaks a claim's realization by naming an artifact that claim owns, and the conformance record already says who
owns what. `docs-lint` now reports it: for every finding, the claims that own an artifact it names and are not
its subject. Measured, the .NET report names 12 of 69, seven already burned by their own step 2, so the live cost
is five of the 61 claims still owing one. Six rounds of findings, five contaminated claims.

Two shapes reach the leak and the first draft of the check saw only one. A fused realization leaks to every claim
sharing it, which is `EndpointSpineTests` reaching four claims at once and is the loud case. But a finding also
names a NEIGHBOUR's artifact it shares with nobody, which is how E-22, a finding about SEC-2 and TEN-1, informed
CON-1 through one member-qualified mention of `WireConventionTests`. Filtering to shared artifacts, which is what
the first draft did on the argument that an unshared artifact cannot leak, silently dropped that entire class. The
argument was clean and it was false, and it is the same error shape as E-22 itself: a surface enumerated by a
predicate narrower than the surface.

The ruling on what the report costs is that it costs nothing beyond itself. No claim is marked, none is barred,
and nothing is redone, because contamination has never been measured to damage a finding: all eight step 2s in
the delta log were informed by the `Edition:` bullet before ruling 1 removed it, and DATA-5's was informed by a
sentence describing a facility the edition does not have. The report dated into each round's ledger is the
marking, and it is strictly better than a label, because the register only grows and a dated snapshot is the only
honest answer to what a step 2 could have seen at the time it was written.

**What the report cannot see, stated so it is not read as a proof.** It sees quoted artifacts. A finding that
describes a sibling's mechanism in prose without naming anything leaks and is invisible to it, so the number is a
lower bound and the residual is the finding author's honesty. It also over-reports, because a mechanism string
names framework vocabulary next to its own artifacts and the Node SEC-2 row cites `allOf` and `anyOf`. Both
directions were left in rather than filtered: a vocabulary registry to suppress the false half is the drift this
register already has findings about, and over-reporting into a note that never fails is the safe direction.

**What survives, and it is the half that mattered.** The structural finding is untouched: the register leaks
realizations across claims, E-6 does quote this file's filter verbatim, and nothing detects that. The register is
the one document that cannot be quarantined, because it is what a builder must read to know what has been found.
That is S-9 one level out and it is still open.

**And a second lesson this re-grading is the evidence for.** A constraint that blocks a repair should be measured
before it is honoured, on the same standard as a finding. Three passes treated "this file belongs to MOD-2" as
established because a previous pass had written it down, which is exactly the failure the delta protocol exists
to prevent, applied to the protocol's own rules rather than to a claim.

### E-21. The build brief still describes the mechanisms four rounds of repairs replaced

**Claim:** SEC-1, SEC-2, SEC-3, TEN-1, TIME-1, structurally all of them. **Found:** the raise pass of 2026-07-27,
checking whether anything else in the edition describes the mechanisms it changed. **Measured** by reading
`kernel/dotnet-react/BUILD-BRIEF.md` against the current sources.

The brief's architecture-test section describes `EndpointSpineTests` as allowlisting anonymity with a string set
`{ "/health" }`, asserting `IOptions<AuthorizationOptions>.FallbackPolicy is not null`, and matching a tenant list
of five names by "exact lowercase match". Every one of those was replaced: by a `(Method, Pattern, Why)` record
array with staleness and justification checks (E-8), by resolving the policy from `IAuthorizationPolicyProvider`
and EVALUATING it (E-7), and by a comparison over base words (E-9). Its `TimeTypeTests` entry names three
assemblies, which this round replaced with a derivation (E-15). Its `ContractShapeTests` entry is still accurate,
which is its own comment on which mechanisms have moved.

**This is the third instance of a shape already in the register** (E-14, then E-19): a prose artifact describing a
mechanism, with no checker on either side. `conformance.mjs` proves the conformance table matches the JSON and
`docs-lint.mjs` proves a cited finding exists; neither can read a sentence about what a test does.

**Not repaired**, and the reason is a question rather than a hold: the brief is dated build instructions for v1
and reads as a historical artifact, so bringing it forward would make it a second live description of the
mechanisms, which is what E-19 was about. Whether it is an archive or a spec is a decision, not an edit
(trigger: an adjudication ruling on the status of the build brief, which is where the same question about
`README.md` prose belongs too).

**RULED 2026-07-27: archive. Applied by one word**, `status: authoritative` to `status: archived` in the front
matter, plus a dated paragraph naming the four mechanisms that moved and pointing at `conformance.json`, the
generated table and the tests as what the edition enforces today. `archived` was already in docs-lint's status
vocabulary and already legal at the edition root, so the finding's own repair cost nothing to build. The file is
not brought forward, for the reason it states: a forward-carried brief is the E-19 defect with a date on it.

**The ruling was reached through a false premise, and the correction is the more useful half.** The question was
put as "delete it, since documentation drifts, and its being about .NET and not Node is proof it already has".
Measured, both halves fail. There are TWO briefs, one per edition, and the Node one is not documentation at all:
it is the only definition of the delta protocol, of the A/B/C failure classes that type every A, B and C finding
in this register, and of the sentence that makes this register the deliverable rather than the edition. Deleting
it would delete the specification of the method that produced the register. And deletion is not a documentation
act in either edition, because `docs-lint` detects the kernel context by the presence of `BUILD-BRIEF.md` and
`VERIFICATION.md`, so removing one flips the DEP-1 provenance placeholders from legal to illegal. Measured by
moving the .NET brief aside: three DEP-1 failures, for Remote, Commit and Catalog pass date.

**The general rule that falls out, and it is worth more than this finding.** Prose that DESCRIBES a mechanism
drifts and should be deleted or archived, which is E-14, E-19 and E-21, all three. Prose that DEFINES the method
cannot drift, because there is no code for it to disagree with, and it has no other home. The two are
indistinguishable by filename, live at the same path in two sibling editions, and want opposite treatment.

### E-22. TEN-1's tenant registry reached URL parameters and nothing else

**Claim:** TEN-1. **Status carried:** `proven` until the adjudication lowered it. **Found:** 2026-07-27, while
raising TEN-1's request-contract obligation. **Measured, with a control on both surfaces.**

TEN-1's statement has two halves and the second one is explicit: tenant identity never travels as a parameter,
**and no request contract carries a tenant identifier field**. Every mechanism in the edition served the first
half. `ForbiddenTenantParams` was read by the URL scan and by nothing else, so no body member was ever compared
against it, on any route, in either guard.

The single exception is an accident. `TenantId` is caught, because SEC-2's separate `ServerControlledFields`
registry happens to list it for a different reason. Every other spelling TEN-1's own registry forbids was caught
by nothing at all: measured, a request contract carrying `WorkspaceId` and `OrganisationId` passed all 100
architecture tests, and so did the routed `CreateNoteRequest` with a `WorkspaceId` added to it.

**Why it survived four rounds of attention on this exact claim.** TEN-1's row was read, lowered, and raised
across three passes, and each time the question asked was whether the SURFACE was enumerated completely. It was.
The predicate was never applied to it. That is ruling 2's structure catching a defect ruling 2 does not name:
a mechanism class is surface, predicate and completeness obligation, and an obligation phrased as "the surface is
enumerated completely" is silent about whether the predicate runs over what the enumeration returns. The
obligation was true and the claim was false at the same time.

**Repaired:** both guards apply the tenant registry to every body member at every depth. Red-green proven on an
unrouted contract (1 of 100 fails) and on the routed contract (3 of 100 fail), green when reverted, source tree
byte-reverted after each.

**For the next adjudication, and it is small.** An obligation that names a surface should be readable as naming
the predicate over that surface, or the two should be separate obligations. This is the first measured case of
an obligation being met while the claim it belongs to is not.

### E-23. HUM-1's locally testable half passes on a CODEOWNERS naming no human

**Claim:** HUM-1. **Status carried:** `proven` on the locally testable half. **Found:** 2026-07-27, by the first
execution of the instantiation acceptance test. **Measured in a seeded tree, with a control.**

`docs-lint` asserts that every surface in `edition.json`'s `irreversibleSurfaces` is covered by a CODEOWNERS line
matching `/\s@\S+/`. The owner the kernel ships is the literal `@OWNER`, a placeholder that manifest step 1
renames to the product owner. `@OWNER` matches `/\s@\S+/`.

So the check reads "is there an owner-shaped token on a line covering this path", and a placeholder is
owner-shaped. Measured: a project seeded from this edition, with all four occurrences of `@OWNER` left
unreplaced, gives `docs-lint: ok` and exit 0. All three irreversible surfaces (migrations, wire contracts,
contract docs) were owned by nobody and the gate said fine.

**This is worse than the unverified arming half beside it.** TEST-3 and HUM-1 both carry the honest asterisk
"mechanism built, not yet armed" for the remote merge gate, which is a named and recorded condition. This half
carried no asterisk because it was believed local and testable, and it was neither: it was a false green. A
reader auditing the record sees one conditional half and one proven half, when what exists is one conditional
half and one hole.

**Repaired.** `docs-lint` now separates covered from owned: an entry whose only owners are the placeholder fails
outside the kernel repo, and stays legal inside it. The kernel-context detection is not new, it is DEP-1's, which
legalizes the provenance placeholders in this same file by the presence of BUILD-BRIEF.md and VERIFICATION.md;
the definition is hoisted so both claims read one detection rather than two.

**Red-green, all four states measured.** Seeded tree with `@OWNER`: red, three failures, one per surface, each
naming the path and the placeholder. Seeded tree with a real handle: `docs-lint: ok`. Kernel repo unchanged:
`docs-lint: ok`, placeholders still legal, both editions. Control, the one that matters: the pre-repair
`docs-lint` restored with the placeholder still in place goes green again, which reproduces the hole and proves
the repair was the thing that closed it.

**What it says about the claim.** HUM-1's mechanism class was ruled portable on 2026-07-26 (ruling 7) as "the
irreversible surfaces are enumerated, and each is declared to require a named human review". The enumeration was
built and the declaration was checked for shape. Nothing checked that the declaration named a human. That is
E-22's structure again, one round later and in a different family: the obligation was met and the claim was not.

### E-24. Instantiation ships no mechanism that arms the gate, and none that reads it back

**Claim:** TEST-3, HUM-1. **Status carried:** `proven`, "conditional on TEST-3's loop being armed at
instantiation". **Found:** 2026-07-27, first execution of the acceptance test. **Measured by exhaustive search.**

TEST-3's own weakening note predicts this defect verbatim: "'Set at instantiation' is exactly the step that gets
skipped, so the kernel acceptance test must verify that instantiation actually arms the gate, not merely that the
workflow file exists." The acceptance test ran. It can verify only what instantiation ships, and instantiation
ships one imperative sentence.

Measured: the entire repository contains zero occurrences of `api.github.com`, `octokit`, `GH_TOKEN`,
`GITHUB_TOKEN`, `gh api`, `gh repo`, `gh pr`, `ruleset`, `required_status_checks`, `required_pull_request_reviews`
and `require_code_owner`. Every hit for "branch protection" is prose in a README, a claim file, a skill or a code
comment. The only executable files the edition ships are the four db and dev scripts plus `e2e.sh`, and none
mentions the forge. Manifest step 4 is a sentence a human executes by hand in a web interface, with no script, no
ruleset file, no post-condition check, and nothing that reads the armed state back.

Part C's verification item has the same shape: "a test PR touching `Migrations/` must show the required
code-owner review" names no command, needs a remote and a second identity, and leaves no artifact in the seeded
repo, so nothing carries the fact that it ever passed.

**Arming was not observed and is not observable by any means the edition ships.** 37 realized rows inherit the
condition. The condition is honestly recorded in both the catalog and the record; what is missing is the thing
the condition names.

**Not repaired here.** Building it is a real piece of work (a ruleset writer plus a readback assertion, against a
forge API, needing an owner token) and it is a decision about which forge the kernel presumes, which is exactly
the portability question class B exists for. Recorded, with the acceptance test's own measurement behind it,
rather than improvised.

**Repaired 2026-07-27 at 670fb01+, the verification half, by the owner's ruling (option c).**

The decision was which forge the kernel presumes and whether it writes the gate or only reads it. Reading the two
claims settled the second half: TEST-3's weakening note asks that "the kernel acceptance test must verify that
instantiation actually arms the gate", and HUM-1's says "the manifest carries the arming step and the kernel
acceptance test verifies instantiation arms it". Both assign arming to the human and verification to the kernel.
This finding's own repair note proposed "a ruleset writer plus a readback assertion", which over-scoped what
either claim requires; the writer is a convenience and the readback is the obligation.

`kernel/shared/tools/gate-check.mjs`, composed into both editions:

- The required check names are DERIVED from the workflow file, never listed. A hand-written job list is a second
  copy of the workflow that agrees with itself while the workflow changes, which is the defect this edition has
  now measured five times (E-51, E-53, E-60, E-61, E-64).
- It reads rulesets AND classic branch protection, because a repository gated the other way would otherwise be
  reported ungated.
- It catches a ruleset in `evaluate` mode, which reports every rule and blocks nothing. That is TEST-3's own
  defect one level down, and it is the case a writer would have been most likely to create silently.
- It requires a pull request, not only status checks: every required check is bypassable by pushing to the
  default branch, and a gate that only names checks is armed against nobody.
- It FAILS, never passes, when there is no remote, no token, no readable workflow, or no job in the workflow.
  This is the policy call inside the ruling: an unread gate is not an armed gate, and a check that cannot reach
  the thing it checks reporting ok is the entire finding it was built to close.
- `--self-test` drives the predicate against six violations and seven controls, isolated from the network, so it
  is exercisable without a forge and runs in both editions' CI.

Measured: self-test green in both editions; the kernel-context path names the workflow's 5 jobs (dotnet) and 4
(node) rather than passing silently; and in a seeded-shape tree the no-remote, no-token and no-jobs paths each
exit 1 with a distinct message.

TEST-3 and HUM-1 move from `owed` to `latent`, which is the honest status: built, never run against a real forge,
because that needs a token this repository does not have. The manifest's unrunnable verification line, "a test PR
touching `Migrations/` must show the required code-owner review", is replaced by the command.

Still not done, and deliberately: nothing arms the gate, the node edition has no manifest to cite the command
from (E-65), and the live path has never executed. The forge question is answered only as far as the readback
needed: GitHub, in the edition, which ruling 7 already sanctioned for the edition layer.

### E-25. The instantiation file set is incomplete and part A contradicts itself

**Claim:** the manifest, and through it TEST-3 and SEC-5. **Found:** 2026-07-27, executing part A.

Part A enumerates thirteen items to copy, then says three lines later "this is a straight copy of the edition
directory". These produce different trees, and the difference is load-bearing in both directions.

The enumeration drops two git-tracked files that the edition needs:

- `.claude/settings.json`, the `UserPromptSubmit` hook that injects the turn-ledger reminder on every human
  prompt. It exists because PC-10 measured that the CLAUDE.md rule alone drifts under long-context sessions. It
  is the one mechanical defence against the MET-08 and MET-05 decay that x2:seed exists to prevent, and copying
  the named file set deletes it. x2:seed step 4 tells the builder the opposite in as many words: "it is part of
  the manifest's file set". It is not.
- `secret-scan.allow.json`. Missing, the allowlist silently reads empty, and `node tools/secret-scan.mjs` exits 1
  with four SEC-5 violations in a freshly seeded project. `secret-scan` is one of the five jobs manifest step 4
  says branch protection must require, so the gate cannot go green on day one. Control: dropping the edition's
  own allowlist in, with its paths renamed, flips it to exit 0.

The straight-copy reading picks up what the enumeration correctly excludes: a gitignored `.env` holding a live
dev SA password (E-12 records the file, not this consequence), a gitignored `server/src/Kernel.Probe/` left over
from a red-green proof, `node_modules`, and every `bin` and `obj`. The literal copy measured 380M. The same
paragraph also says README.md, BUILD-BRIEF.md and VERIFICATION.md stay behind, which a straight copy does not do.

**Compounding it, part C never runs the secret scan.** The verify-as-a-set list names the build, the tests, the
client verify, `e2e.sh`, docs-lint, the dash greps and branch protection. `secret-scan` appears nowhere, which is
why a red required job is invisible to the set that exists to catch exactly this.

### E-26. The documented development port is wrong, so the composed client cannot reach its own server

**Claim:** UI-5, and the runbook. **Found:** 2026-07-27, booting the seeded host.

Five places pin 5080: the manifest, the runbook, `.vscode/tasks.json`, the client composition root, the harness
and the smoke. There is no `launchSettings.json` anywhere in the edition, no `UseUrls`, no `ASPNETCORE_URLS`
default and no Kestrel port configuration. Measured, booting exactly as the runbook says: `Now listening on:
http://localhost:5000`.

Only `scripts/e2e.sh` sets `ASPNETCORE_URLS` explicitly, and its own comment says why, which is why the scripted
path works and the documented developer path does not. Following the runbook, the client's default base URL
points at a port nothing is listening on. UI-5's whole subject is that a headline flow which never reaches the
server is the failure mode, and the documented local loop is in exactly that state.

**Repaired 2026-07-27 at ad8ff35+.** Measured live first, because the finding was written from a boot that
nobody had repeated: with the tree clean and the API started exactly as the runbook says, `Now listening on:
http://localhost:5000`. Eight sites across seven files document 5080 (the manifest, the runbook twice, the
`.vscode` task's detail string, the client composition root, the harness, the smoke and `e2e.sh`), and every one
of them is an assertion with nothing behind it: only `e2e.sh` and CI bind a URL, and both do it explicitly, so
neither is on the documented developer path.

The finding said five places; it is eight. Corrected here rather than left, because the number was the argument
for which side to change.

Repaired by adding `server/src/Kernel.Api/Properties/launchSettings.json`, one file, rather than rewriting eight
sites to 5000. Port 5000 is claimed by the macOS AirPlay Receiver, which is the likely reason 5080 was chosen in
the first place, so making the code match the worse number would have cost more and bought less. Re-measured
after: `Now listening on: http://localhost:5080`. The 157 architecture tests stay green, which is the check that
mattered, because `SecretConfigShapeTests` scans committed JSON under `server/src` and this adds one.

A second defect surfaced while verifying, not in the original finding and plausibly the reason it survived:
`scripts/e2e.sh` justified its explicit `ASPNETCORE_URLS` with "because launchSettings.json only applies under
`dotnet run`". No such file existed. The comment described the developer path as covered by a file that was not
in the tree. Corrected with the repair.

### E-27. UI-1 is `proven` against the kernel's own placeholder, and manifest step 6 cannot run when it is told to

**Claim:** UI-1. **Status carried:** `proven`, with no instantiation asterisk. **Found:** 2026-07-27.

Manifest step 6 demands the complete Claude Design export imported into `design/prototype/`, the lock record
filled in, `tokenCoverage.test.ts` re-pointed at the real export and `src/theme/tokens.ts` re-transcribed until
green. By the method's own ordering that export cannot exist yet: x2:seed runs immediately after gate 1, its Next
is decompose, decompose produces D-000, and x2:design runs only once D-000 exists. The export is two skills away.
Step 6 also duplicates x2:lock, whose done-checks are the same list.

The manifest says nothing about what to do when there is no export, and part C says "the seed is not done until
all pass". Formally that blocks seeding. In practice it does not, and that is the worse answer: the edition ships
a placeholder `design/prototype/_ds/colors_and_type.css` carrying 58 variables, deliberately over UI-1's floor of
50, whose own header says to replace it at instantiation. Measured: `npm run verify` passes with
`tokenCoverage.test.ts` green in a project whose design system is the kernel's placeholder and whose product
design does not exist.

So UI-1 reads `proven` in a seeded project on the strength of the kernel's own filler. TEST-3 and HUM-1 both
carry "mechanism built, not yet armed". UI-1 needs the same asterisk and does not have it. This is the same shape
as E-23: a check that confirms a placeholder is shaped like the real thing.

**Repaired 2026-07-27 at ad8ff35+.** Part A now enumerates `.claude/` and `secret-scan.allow.json`, and says
plainly that the enumeration IS the file set rather than carrying both readings in one sentence. The
straight-copy reading is not merely redundant, it is wrong in the other direction too: it takes the gitignored
`.env`, which holds a live development SA password.

`skills/seed/SKILL.md` had already asserted the hook was "part of the manifest's file set" while the manifest did
not list it, so the skill and the definition it executes disagreed, and the skill was right.

Step 1's rename list gains `secret-scan.allow.json`, because one of its entries names a test file whose path
renames with the product and its own header says an entry matching nothing fails the scan: carrying it unrenamed
converts one defect into another.

Part C gains the secret scan. It had omitted it while step 4 told the seeder to require the `secret-scan` job, so
the one list whose purpose is catching a gate that cannot go green on day one could not see that gate.

### E-28. docs-lint is fixture-free, and the documented edit path disables it with every gate green

**Claims:** DOC-1, TEN-5, DEP-1, HUM-1. **Status carried:** `proven` on DOC-1 and DEP-1, `latent` on TEN-5.
**Found:** 2026-07-27, planting round for batch 1. **Measured, at the correct edit site, with a control.**

`docs-lint.mjs` carries the whole locally testable half of four claims and has no self-test and no fixture. The
repair precedent is one directory away and predates this: `tools/secret-scan.mjs` ships `--self-test`, six
references to it, and CI runs it as its own step before the scan, because E-11 was a regex nobody could execute.
`docs-lint.mjs` is the same shape and did not get the same repair. `conformance.mjs` has none either.

The probe was run the way the build brief says to change a shared file, not the way it says never to. The TEN-5
ledger row filter in `kernel/shared/tools/docs-lint.mjs` was changed to select on a prefix no line can start
with, then `node kernel/tools/compose.mjs` was re-run so both editions carried it. Every gate stayed green:
`compose: ok (36 shared files match in 2 edition(s))`, `docs-lint: ok` in both editions, `conformance: ok (69
rows)` in both. A real violation planted underneath, a ledger row with an empty sole-reader cell, still produced
`docs-lint: ok`, exit 0.

**What `compose --check` does and does not buy.** It catches the one-sided edit, editing an edition's composed
copy, which is the mistake the brief already forbids. It compares the two copies to the shared source and cannot
observe whether any of the three still does anything. So the mechanism that looks like it guards the guard
guards only the disallowed edit path, and the allowed one is open.

**Repaired, 2026-07-27, with three controls.** `docs-lint.mjs` gained a `--self-test` mode, following
`secret-scan.mjs` exactly. Three predicates are lifted out of the file walk and into pure functions of their
input, `docLifecycleFindings(rel, text)`, `bypassLedgerFindings(text)` and `imageFindings(rel, text,
hasLedgerRow)`, and the scans became loops over files and those functions and nothing else. That last part is
what makes the controls worth anything: a narrowing that silences the scan silences the predicate the controls
drive, so it cannot be silenced in one place and asserted in another.

Fourteen CATCH controls and eleven IGNORE controls, both editions, `docs-lint --self-test ok: 14 caught, 11
ignored`. It runs as its own CI step ahead of the lint, in this repo's `kernel.yml` and in both editions'
template `ci.yml`, which is the ordering `secret-scan.mjs` already had.

| control | `compose --check` | `docs-lint` | `docs-lint --self-test` |
|---------|-------------------|-------------|--------------------------|
| ledger row scrape narrowed to match no line | ok | **ok** | **FAILED**, 1 missed |
| image host allowlist narrowed to a registry that does not exist | ok | **ok** | **FAILED**, 4 missed |
| folder-kind map emptied | ok | red | FAILED, 3 false positives |

The first two are the E-28 shape exactly: the scan cannot see its own narrowing, and now something can. The
third is included because it is the case that was never the problem, a narrowing loud enough for the scan itself
to catch, and it is worth knowing which of the three the new mode was actually needed for.

**Four known gaps are asserted as PASSING controls, not silently left out.** E-34's unresolved test name, E-35's
positional row parse in both its forms, and E-38's Docker Hub blindness are each written into the IGNORE set with
the finding id in the reason. Each is an `owed` obligation with a named trigger in `conformance.json`, so closing
one breaks this test and has to be argued rather than discovered by a red build. That is the device
`SecretConfigShapeTests` uses to record the cost of token matching, applied to a gap instead of a false positive.

**Still open:** E-30, the same defect in the shared eslint config, which has no fixture surface and is not a node
script, so it needs a vitest suite driving ESLint's API rather than a `--self-test` flag.

**Repaired 2026-07-27 at ad8ff35+, the manifest half.** The status half needed no repair and the finding's first
line is stale as written: UI-1 was lowered from `proven` to `latent` earlier the same day, so the asterisk this
finding said it lacked is present.

Step 6 now says what is true. The export cannot exist when the step runs, because x2:seed's Next is decompose,
decompose produces D-000, and x2:design runs only once D-000 exists, so the step demanded an artifact two skills
downstream of the skill executing it, offered no fallback, and sat under a part C that says the seed is not done
until all of it passes. Read literally, seeding could never complete. In practice the step was skipped, the
placeholder stayed, `npm run verify` went green, and nothing could tell the difference.

The repair carries the debt instead of pretending: the placeholder ships, `design/prototype/README.md` is written
with a line that says so, and the real import plus the re-pointing and re-transcription move to x2:lock, whose
done-checks were already that same list. The manifest had been duplicating another skill's contract.

### E-29. CFG-1's registry can be reduced to reaching nothing with all 100 tests green

**Claim:** CFG-1. **Status carried:** `proven`. **Found:** 2026-07-27. **Measured, no plant required.**

`OperationalSettingsTests` is two compiled regexes behind a single `[Fact]`. Replacing
`(?:claude|gpt|gemini|mistral)` with a vendor token that appears nowhere, and the four provider hosts with one
that does not exist, leaves `dotnet test tests/Kernel.Tests.Architecture` at `Passed! Failed: 0, Passed: 100`.
No violation is needed to demonstrate it: with the registry neutered and the tree otherwise untouched, nothing
in the edition reports that the cheap net now catches nothing.

**The repair precedent is in the same directory.** `SecretConfigShapeTests` asserts its predicate's EXTENT as a
`[Theory]`, with positive cases and, importantly, negative ones (`Issuer`, `Audience`, `Monkey` all expected
false), so narrowing that predicate breaks its own test. `OperationalSettingsTests` was written without it. The
two files sit beside each other and one of them is guarded.

### E-30. UI-2's config can be reduced to reaching nothing with `npm run verify` green

**Claim:** UI-2. **Status carried:** `proven`. **Found:** 2026-07-27. **Measured, with a control.**

`kernel/shared/client-web/eslint.config.js` holds the entire claim in hand-written alternations. Prefixing
`NAMED_COLORS` and `DIM_CAMEL` with tokens that match nothing leaves `npm run verify` green in full: `tsc
--noEmit` silent, 16 tests passed, `eslint .` exit 0. The control is the part that matters: with `DIM_CAMEL`
neutered, `style={{ padding: 12 }}` planted into a real screen passes silently, having been red one command
earlier.

Nothing in either edition feeds the config a known-bad input. The file's own comment records this exact class of
defect being found and repaired once already ("the old value-only selector was vacuous for `borderRadius: 8`"),
which is the argument for a fixture rather than against one.

**Repaired, 2026-07-27, with five controls.** `src/__tests__/ui2LintExtent.test.ts` in the shared tier drives
ESLint's own API over 19 CATCH and 22 IGNORE controls held in `src/__fixtures__/ui2-lint-extent.fixture.json`,
plus an independent named-colour floor of 54 and an independent list of 21 gated dimension axes. Forty-nine
assertions, composed into both editions, which move from 16 client tests to 65.

| probe against the shipped config | `eslint .` | extent test |
|----------------------------------|-----------|--------------|
| three colour names swapped out | **green** | red |
| whole colour alternation matches nothing | **green** | red, 3 |
| dimension alternation matches nothing | **green** | red, 3 |
| widened, `lineHeight` newly gated | **green** | red |
| severity dropped from `error` to `warn` | **green** | red |

Five sabotages, `eslint .` green for every one, the test red for every one. That is the finding and its closure
in one table.

**Three things this cost, all of them worth recording because each was a wrong first answer.**

The controls live in JSON rather than in the test source. The colour selectors match ANY string or template
literal, not only style-object properties, so a known-bad fixture held as a source string makes the guard test
fail the rule it is asserting. Placing the test under `src/theme/__tests__/`, where `no-restricted-syntax` is
off, dodges that and was rejected: an extent assertion must not depend on where it sits relative to the
exemptions of the config it asserts.

The first cut held ONE named-colour control against an alternation of 61 members, so a narrowing that deleted
sixty of them passed. The second cut fixed that by reading the member list out of the config and driving every
member through the linter, and a probe that swapped three names for four passed again, because a list read out
of the thing under test shrinks when the thing under test shrinks. Both halves are now kept: an independent
floor catches removal, and the derived sweep catches a selector broken while the list still looks complete.
Neither alone was enough, and only running the control showed it.

What the config bans is read back through `calculateConfigForFile` rather than by importing `eslint.config.js`.
That began as a way around an untyped-import type error and is the better mechanism regardless: it is the config
as ESLint resolves it FOR THAT PATH, and it carries the severity, which is what makes UI-2's "no warn-and-ship
tier" obligation assertable at all.

**Not closed by this.** The fourteen KNOWN GAP entries are recorded as passing controls, marked with E-31, and
remain `owed` obligations on UI-2's row. Only two of them had ever been planted; the other twelve were predicted
from reading the selectors and are confirmed by this test as measured facts rather than readings.

### E-31. UI-2's dimension ban misses every negative literal, and the ungated axes

**Claim:** UI-2. **Status carried:** `proven`. **Found:** 2026-07-27. **Measured, nine plants.**

Seven plants went red with the message naming UI-2: `color: "#ff0000"`, `color: "rebeccapurple"`, `padding: 12`,
`top: "-8px"`, `borderRadius: 4`, `border: "1px solid"`, `fontWeight: 550`. Two went green:

- `marginTop: -8`. Both numeric dimension selectors use the direct-child combinator, `Property[key.name=...] >
  Literal[raw=...]`. A negative numeric parses as `Property > UnaryExpression > Literal`, so the literal is a
  grandchild and the selector cannot reach it. The string form `'-8px'` is caught; the bare negative is not. The
  px/rem selectors do not backstop it, because they test `value`, which is undefined for a number.
- `borderTopWidth: 1`. The axis appears in neither `DIM_CAMEL` nor the `^(?:borderWidth|border)$` selector, so
  the per-side widths and `outline`/`outlineWidth` are unguarded while `border` is.

The first is a syntactic hole in a mechanism that reads as total. The second is the standing per-seam debt the
`patterned` tag exists to name, and naming it is why the row moves there rather than staying `proven`.

### E-32. DOC-1's walk skips any directory named bin, obj, dist or node_modules, at any depth

**Claim:** DOC-1. **Status carried:** `proven`. **Found:** 2026-07-27. **Measured.**

`SKIP_DIRS` is matched by directory BASENAME inside the recursive walk, not by path prefix from the build-output
roots it was written for. So `docs/work/bin/handover.md`, a markdown file with no front matter at all, is never
enumerated and `docs-lint` reports ok. One four-character directory name holes both the completeness obligation
and the closure obligation at once, inside `docs/` itself.

### E-33. DOC-1's stateless halves were never built, while the row read `proven` and its own note said so

**Claim:** DOC-1. **Status carried:** `proven`, with the note "forward-only status transitions not linted,
stateless". **Found:** 2026-07-27. **Measured, four plants.**

Measured green, all four: a status moved forward (`authoritative` to `archived`) and then backward (`archived`
to `authoritative`) produce byte-identical clean output, because the tool holds no prior value and opens no
history, so no transition of any direction is representable to it. An archived runbook still cited by the
edition README as the way to run the system passes. A work document declaring `slice: whenever` passes, because
the key's presence is checked and its value never is. A stored descriptive narrative of how the server works
passes under any legal kind, because the guard reads the folder and the declared kind and never the content.

**The defect is not that these are unbuilt.** It is that the row said so in prose and read `proven` anyway. The
per-obligation array from ruling 3 was available and is the instrument this row needed; it is applied now.

### E-34. TEN-5 resolves no test and verifies one cell

**Claim:** TEN-5. **Status carried:** `latent`. **Found:** 2026-07-27. **Measured, four plants and a control.**

The ledger guard binds for exactly two conditions, both confirmed red with the message naming TEN-5: the ledger
file is absent, and a row's third pipe-cell is empty. Everything else the claim asks for is green:

- A row naming `NoSuchTestAnywhereInThisRepo` passes. `docs-lint` never opens a test file, so the claim's actual
  remedy, that the named sole-reader test IS the mechanism, is unreachable by this guard under any input.
- A row whose justification cell is empty passes; only the third cell is read.
- A second ledger, `docs/claims/scheduler-bypass-ledger.md`, carrying its own bypass row, passes unexamined.

`latent` was the honest tag for an empty ledger and it is no longer sufficient, because the mechanism has now
been executed against a real surface and most of what the claim asks for is not in it.

### E-35. TEN-5's ledger parse is positional, and empties silently on reformatting

**Claim:** TEN-5. **Found:** 2026-07-27. **Measured, two probes.**

Rows are lines beginning with `|`, then `.slice(2)` to drop the header and separator, and the test is
`split('|')[3]`. Both assumptions are load-bearing and neither is asserted:

- Rewriting the table as a bullet list, with the document still titled the tenant bypass ledger and still
  declaring a bypass with no test, yields `docs-lint: ok`.
- Inserting an `Owner` column shifts the sole-reader cell off index 3, so the guard reads the justification
  instead. A row with a visibly empty sole-reader cell then passes.

### E-36. CFG-1's script-duplication half is unguarded, and the row's own mechanism text asserts it

**Claim:** CFG-1. **Status carried:** `proven`. **Found:** 2026-07-27. **Measured.**

The row's mechanism reads, in part, "`scripts/e2e.sh` reads Jwt values from committed appsettings, never
duplicating them". Appending literal `ISSUER` and `AUDIENCE` values to `scripts/e2e.sh` leaves the suite at
`Passed! Failed: 0, Passed: 100`. The registry covers model ids and provider endpoints and nothing else, so the
duplication shape that the acceptance-test pilot actually hit, and that the test's own summary comment cites as
the reason scripts are a first-class surface, has no predicate.

The three plants that do bind bind correctly: a model id in `scripts/dev-setup.sh`, a model id in
`Kernel.Api/Program.cs`, and `https://api.anthropic.com` in `Kernel.App/Agents/ToolExecutor.cs` each fail
`OperationalSettingsTests` by name.

### E-37. DEP-1's mechanism class has unguarded members

**Claim:** DEP-1. **Status carried:** `proven`, on two obligations both reading `proven`. **Found:** 2026-07-27.
**Measured, seventeen plants: four red-correct, twelve green, one red-different.**

Named members of the mechanism class with no predicate behind them:

- Source mapping. Deleting the entire `<packageSourceMapping>` block from `server/nuget.config` leaves
  `docs-lint` green.
- `package.json` `overrides` is never read, because the npm reader spreads only `dependencies` and
  `devDependencies`. The transitive pin taken under the advisory rule, which is the one DEP-1 gained an explicit
  resolution order for at ruling 9a, is invisible to the ledger check that exists to vouch for it.
- No cross-surface digest comparison. The check asserts a digest is present and the repo:tag is ledgered, never
  that two surfaces name the same digest.
- The cooling-off window number is asserted independently in at least eight files and read by nothing, so
  `VERSIONS.md` can disagree with every other file and no guard notices.
- Publish dates are shape-tested only, a regex for the date format. No date is parsed and today's date is never
  obtained, so a dependency ledgered as adopted one day after publication passes.

The one red-different is worth its own line: the lockfile-drift remedy does fail the build, but npm's own
`EUSAGE` names npm, not DEP-1 and not the registry, and it fires in a different CI job from every other DEP-1
check. Under the third-outcome rule that is a guard that does not bind for this claim, not a pass.

### E-38. DEP-1's image check cannot see Docker Hub shorthand or an extensionless Dockerfile

**Claim:** DEP-1. **Found:** 2026-07-27. **Measured.**

`imageRef` is a four-host allowlist, `mcr.microsoft.com|docker.io|ghcr.io|quay.io`. Docker Hub shorthand, which
is the most common way an image is spelled and is the violation shape the obligation itself states
(`FROM node:22-alpine`), matches nothing and passes. Separately, `IMAGE_SCAN_EXTENSIONS` has no entry an
extensionless `Dockerfile` can match, so the surface the obligation names first cannot be opened at all, even
for a correctly hosted image with no digest. The check that does bind, an unpinned `mcr.microsoft.com` image in
a shell script, binds correctly and names DEP-1.

### E-39. This repository's CI runs no dotnet at all

**Claims:** every dotnet row whose mechanism is an architecture test or the client lint. **Found:** 2026-07-27.
**Measured.**

`.github/workflows/kernel.yml` has five jobs: `shared-tier`, `conformance`, `node-server`, `client`, `dashes`.
The only occurrences of the string "dotnet" in it are a comment and the edition matrix label. The `client` job
builds `kernel/shared/client-web`, not `kernel/dotnet-react/client-web`.

So `Kernel.Tests.Architecture`, all 113 tests, and the dotnet edition's client verification chain run only when
a human runs them locally. The edition's own `ci.yml` does wire both up, and that file is a template which
becomes real CI only at instantiation, which E-24 established ships no arming mechanism and has never been
executed until this week.

This is not an argument that the guards are wrong. It is the reason a neutered guard survives: E-29 and E-30
both required editing a file, and no continuous process anywhere would have reported either edit.

### E-40. DATA-1's endpoint ban stops at one namespace, and the host's other namespace is unguarded

**Claim:** DATA-1. **Found:** 2026-07-27. **Measured at 1e52bfa.**

`DependencyDirectionTests.Endpoints_do_not_depend_on_Persistence` scopes itself with
`ResideInNamespace("Kernel.Api.Endpoints")`. `Kernel.Api` has a second namespace, `Kernel.Api.Platform`, holding
`TenantScopeMiddleware`, `SessionVersionMiddleware` and `PermissionPolicyProvider`. A type placed there taking
`KernelDbContext` as a constructor dependency passes all 113 architecture tests. The same type one namespace over,
in `Kernel.Api.Endpoints`, is caught and the message names DATA-1.

The claim's own harm paragraph is this defect: B2-2 found "a controller injecting the security database context
directly behind an anonymous surface". The middleware namespace is where an anonymous surface actually lives, so
the guard covers the namespace where the harm is least likely and leaves the one where it was observed.

The row read `proven`.

**Repaired, 2026-07-27, with four controls.** `DependencyDirectionTests` was rewritten. The host ban now
covers all of `Kernel.Api.*` rather than `Kernel.Api.Endpoints`, and the composition root is excluded by
construction rather than by an allowlist: top-level statements put `Program` in the global namespace, which
`ResideInNamespace("Kernel.Api")` does not match, so no name has to be maintained. Two assertions were added for
the mechanism-class members that had none, and every selection is now asserted non-empty. Four assertions became
seven; the suite moved from 113 to 122.

| control | before | after |
|---------|--------|-------|
| host type in `Kernel.Api.Platform` takes `KernelDbContext` | **green** | red, names DATA-1 |
| persistence type takes `NoteService` | **green** | red, names DATA-1 |
| host type takes `EfNoteStore` rather than `INoteStore` | untested | red, two assertions |
| selection pointed at an empty namespace, real violation present | **green** | red, "matched no types" |
| none, shipped tree | green | 7 passed |

The registries the two new assertions ban against are discovered by reflection, `Kernel.App` public classes named
`*Service` and persistence classes realizing a `Kernel.App` `*Store` interface, and both are asserted non-empty,
so the repair does not reintroduce E-29's hand-written-list shape while fixing E-41.

One narrowing was caught by re-reading rather than by a control, and is recorded because the control would not
have caught it: the first cut routed the assembly-wide assertions through the same namespace-prefix helper as the
host one, which would have rebuilt E-40 inside the repair for E-40. Assembly-wide assertions now stay
assembly-wide and only gain the non-emptiness check.
### E-41. DATA-1 bans one upward dependency and its mechanism class names another

**Claim:** DATA-1. **Found:** 2026-07-27. **Measured at 1e52bfa.**

The mechanism class reads "no persistence type references application services". The only upward assertion in the
file is `Persistence_does_not_depend_on_Api`, which bans `Kernel.Api`. A persistence type taking `NoteService`, an
application service, as a constructor dependency passes all 113 tests.

Nothing tests the third member either: "store implementations are reachable only via their interfaces" has no
assertion of its own. It is covered incidentally where `App_does_not_depend_on_Persistence_or_Api` reaches, and
not at all in `Kernel.Api.Platform`, per E-40.

**Repaired, 2026-07-27.** See E-40's table: `Persistence_does_not_depend_on_an_application_service` and
`Store_implementations_are_named_only_by_the_composition_root` are the two new assertions, each over a
reflection-discovered registry asserted non-empty.
### E-42. NetArchTest reports success on an empty type set, and DATA-1 never checks the set is non-empty

**Claim:** DATA-1. **Found:** 2026-07-27. **Measured at 1e52bfa.**

With a real violation present in `Kernel.Api.Endpoints`, changing the guard's own filter to
`ResideInNamespace("Kernel.Api.Handlers")`, a namespace no type lives in, leaves all 113 tests green. The library
treats "no types matched" as "no types failed", and nothing asserts the selected set is non-empty.

This is reachable through an ordinary rename: `Kernel.Api.Endpoints` is a namespace string repeated in a test file
that a namespace refactor has no reason to visit. The neutering edit and the refactor are the same edit.

**Repaired, 2026-07-27.** Every selection in `DependencyDirectionTests` is asserted non-empty before it is
asserted clean, with a message that names the selection and E-42. The control is the fourth row of E-40's table:
the same neutering that was green now fails two assertions with "The DATA-1 selection 'Kernel.Api.*' matched no
types, so the assertion below it would pass without looking at anything".
### E-43. TEN-3's tenant-column registry is a four-name list with no extent assertion

**Claim:** TEN-3. **Found:** 2026-07-27. **Measured at 1e52bfa.**

`TenantColumnNames` is `["tenantid", "orgid", "organizationid", "organisationid"]`, hand written, and nothing
asserts what it reaches. Narrowed to a single name no column carries, with `Note` stripped of `ITenantOwned` so a
real violation is present, all 113 tests pass: the marker test finds no tenant-shaped column to complain about and
the key test finds no tenant-owned entity to check, so both halves go vacuous together.

Unlike E-29, the two halves do not fall together from one edit. Narrowing the registry alone leaves the key
assertion binding, because that assertion rides on the `ITenantOwned` marker rather than on the registry: with the
registry dead and the marker intact, flipping `NoteConfiguration.HasKey` to lead with `Id` still turns
`Every_tenant_owned_entity_leads_its_key_with_TenantId` red. TEN-3 is in better shape than CFG-1 was. What is
unguarded is the second obligation only, "no unmarked tenant data", whose whole reach is that four-name list.

**Repaired, 2026-07-27, with the exact neutering as its control.** Two additions. The registry half is E-51:
the four-name list is gone and the extent of its replacement is asserted. The vacuity half is a new assertion,
`The_sets_these_assertions_iterate_are_not_empty`, which fails if the model holds no entities or if none is
marked `ITenantOwned`, with a message saying that an edition genuinely owning no tenant data belongs at `owed`
with that as its trigger rather than `proven` over an empty set.

Control: E-43's own neutering, `Note` stripped of its marker so a real violation is present and the registry
narrowed to a name no column carries. It left all 113 tests green when measured. It now fails the vacuity
assertion by name and thirteen extent cases besides.

### E-44. TEN-3's sanctioned-exception obligation has no mechanism

**Claim:** TEN-3. **Found:** 2026-07-27. **Measured at 1e52bfa.**

The mechanism class requires that "a sanctioned exception carries a named justification and its own guard at the
key assertion", and separately rules that a key-shape exemption does not belong in the TEN-5 access ledger, so it
needs a home of its own. `TenantKeyTests` has no exemption list, no justification field and no guard for one.

There are no exceptions today, so nothing is presently wrong. What is missing is the supported path: a project
seeding from this kernel that needs one has nowhere to record it and nothing forcing the justification, and the
row read `proven` on an obligation with no mechanism to plant against.

**Repaired, 2026-07-27, with three controls.** `KeyShapeExemption` is a second register, separate from the TEN-5
access ledger because the claim rules that a key-shape exemption is not a cross-tenant access path and the two
kinds are recorded in different places. It follows `AnonymousCarveOut`, the register this kernel already trusts
for the same job on SEC-1: a justification per entry, and a stale entry fails.

Four rules, each a pure function of its inputs: an entry naming no entity in the model fails, an entry whose
justification is shorter than a sentence fails, an entry for an entity that already leads its key with the tenant
fails as unnecessary, and a duplicate fails. The shipped register is EMPTY, which is exactly how a mechanism
becomes vacuous, so the rules are proven against fixtures rather than against the shipped state. Proving them
from an empty register would have been E-44's own shape one level up.

| control | outcome |
|---------|---------|
| key flipped to lead with `Id`, no exemption | red, the key assertion |
| same, plus an exemption carrying a real justification | green, the exemption works |
| same exemption, justification reduced to `legacy` | red, the register assertion |

The justification floor is 40 characters and the code says what that is worth: it does not make a bad
justification good, it prevents the one-word entry that carries nothing a reviewer could disagree with.

### E-45. CON-1's enum wire set is not closed: an integer off the wire yields an undeclared value

**Claim:** CON-1. **Found:** 2026-07-27. **Measured at 1e52bfa.** **Code defect, not only a guard gap.**

CON-1's statement is that "enums cross the wire as closed string sets registered through a single converter
configuration". Deserializing the JSON document `7` for a two-member enum through the host's own configured
`JsonSerializerOptions` returns the value `7`. `JsonStringEnumConverter` allows integer values by default, and
`Program.cs` constructs it as `new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)`, taking that default.

The undeclared-string case is correctly rejected, which is why the gap survives a casual reading: the closed set
holds on the spelling a human would try and fails on the one a broken client sends. The remedy is one argument,
`allowIntegerValues: false`, and a test that plants the integer.

No enum exists anywhere in `src/`. The only enum the suite exercises is `SampleEnum`, declared private inside
`WireConventionTests`, so the round-trip test proves the converter is in the options bag and nothing about any
shipped contract.

**Repaired, 2026-07-27, with the pre-repair control.** `Program.cs` now constructs
`new JsonStringEnumConverter(JsonNamingPolicy.CamelCase, allowIntegerValues: false)`, and `WireConventionTests`
plants both shapes through the host's own options: an undeclared string, and the documents `7`, `0` and `-1` as a
Theory. `0` is in the list deliberately; it is a valid member's numeric value, so it is the case a reader is most
likely to think harmless, and CON-1's wire set is strings whatever the number means.

| control | before | after |
|---------|--------|-------|
| undeclared string `"notAMember"` | rejected | rejected |
| document `7` | **accepted, yields `7`** | rejected |
| document `0` | **accepted, yields `FirstValue`** | rejected |
| document `-1` | **accepted** | rejected |

Restoring the pre-repair registration with the new tests in place turns all three integer cases red and leaves
the string case green, which reproduces the hole exactly and shows why the string case hid it.
### E-46. CON-1's "no endpoint invents its own error shape" is unguarded

**Claim:** CON-1. **Found:** 2026-07-27. **Measured at 1e52bfa.**

Two hand-picked routes are asserted to render `application/problem+json`: a malformed cursor and an unknown route.
Nothing enumerates endpoints. Changing `CreateAsync` to return
`Results.Json(new { ok = false, why = ... }, statusCode: 400)` in place of `TypedResults.ValidationProblem` leaves
all 113 tests green.

Both configuration points do bind: removing the enum converter turns two tests red and removing
`AddProblemDetails()` turns `Unknown_route_returns_problem_json` red. The single configuration point is proven.
What is unproven is the sentence the claim spends its harm paragraph on, that no endpoint departs from it.

### E-47. CON-1's opaque-identifier obligation has no mechanism

**Claim:** CON-1. **Found:** 2026-07-27. **Measured at 1e52bfa.**

"Identifiers are opaque strings" is one of the four clauses of CON-1's statement. No test in any project asserts
anything about identifier types. `ContractParityTests` reflects contract types into their camelCase wire names and
compares the name lists against a shared fixture; it never reads a property type, so a `Guid Id` becoming a
sequential `long Id` changes nothing it looks at.

### E-48. DATA-2's store obligations are unguarded, and the one incidental catch names the wrong claim

**Claim:** DATA-2. **Found:** 2026-07-27. **Measured at 1e52bfa.**

`KernelApiFactory` runs the real `EfNoteStore` against SQLite, so the store is inside the tested path. Nothing
asserts anything about how it reads. Three separate plants, each run against both runnable suites:

- `.AsNoTracking()` removed from `GetAsync`: green, 113 and 19.
- `Math.Clamp(limit, 1, INoteStore.MaxPageSize)` removed from `ListAsync`: green, 113 and 19. Its own comment
  reads "DATA-2 hard bound at the store, so a direct caller cannot read unbounded".
- `.Take(limit)` removed from `ListAsync`, an unbounded table read, which is the harm the claim names: green,
  113 and 19.

Removing `.AsNoTracking()` from `ListAsync` is the third outcome, not the second. It turns
`ListNotesToolReadOnlyTests.Read_only_tool_reads_but_never_writes` red, which is AI-2's guard, with the message
"Assert.Empty() Failure: Collection was not empty". DATA-2 is not named, the message describes a tool, and the
catch covers the list path only because that tool happens to read through it. This is E-22's shape exactly: the
surface looks covered and DATA-2's own guard reached nothing.

`NoteServiceTests.List_clamps_the_page_size` is real and runnable but drives a `FakeNoteStore`, so it proves the
service clamp and never reaches the store's.

**Repaired, 2026-07-27, with four controls.** `EfNoteStoreTests` in `Kernel.Tests.Unit`, nine assertions against
the real `EfNoteStore` over SQLite, which needs no Docker daemon.

| control, re-planted | before | after |
|---------------------|--------|-------|
| `.AsNoTracking()` off `GetAsync` | **green, 113 and 19** | red, 1 |
| the store's `Math.Clamp` removed | **green, 113 and 19** | red, 5 |
| `.Take(limit)` removed, the unbounded read | **green, 113 and 19** | red, 5 |
| the keyset cursor filter removed | untested outside Docker | red, 1 |

The fourth row is the one that was not in E-48. Paging the whole table one page at a time and asserting every row
is visited exactly once distinguishes keyset from offset without needing a concurrent writer, and it runs on
SQLite, so DATA-2's keyset obligation stops depending on a suite that cannot start (E-49). The same-timestamp
collision page stays with the integration suite, because Guid ordering is provider-specific and that tie is the
one place it matters.

### E-49. DATA-2's only cited proof of keyset paging cannot run

**Claim:** DATA-2, and TEN-3's engine-level half. **Found:** 2026-07-27. **Measured at 1e52bfa.**

The row cites "integration `KeysetPagingTests` incl. a same-timestamp collision page". `Kernel.Tests.Integration`
builds a SQL Server container through Testcontainers in `SqlServerFixture`. With no Docker daemon it does not
skip, it fails: four failures, `Docker is either not running or misconfigured`. Combined with E-39, which
established that this repository's CI runs no dotnet at all, the cited proof runs on a developer machine with
Docker up and nowhere else.

A suite that fails rather than skips on a missing environment is the worse of the two shapes here, because the red
is indistinguishable at a glance from a conformance failure and teaches a reader to discount it.

**Repaired 2026-07-27 at 14f1b2d+.** `RequiresEngineFactAttribute` skips the real-engine tier, naming the claim
and naming what goes untested, when no container runtime responds. xunit 2 reads `Skip` at discovery, so a
`FactAttribute` subclass setting it in its constructor is the whole mechanism and no package was added;
`Assert.Skip` is a v3 API and moving to v3 for this would have been far larger than the problem.

Measured: 4 failed becomes 4 skipped, and the whole solution now runs clean with no daemon. Control: forcing the
runtime probe to return true turns all four red again, so the attribute is not skipping unconditionally.

Skipping is the smaller dishonesty and it is not free. A tier that silently skips everywhere has never run, which
is why TEST-1's integration obligation stays `latent` rather than moving, and why the skip reason says so.

### E-50. TEN-2's uniform not-found is probed on one verb, and the backstop is a 500

**Claim:** TEN-2. **Found:** 2026-07-27. **Measured at 1e52bfa.**

The mechanism class ends "cross-tenant e2e probes assert uniform not-found behavior". One such probe exists,
`HostSecurityTests.One_tenant_cannot_read_another_tenants_note`, and it is a GET. There is no cross-tenant probe
for delete or for list, and the row carries no obligation for this member at all.

Removing the tenant filter from `EfNoteStore.DeleteAsync` leaves all 113 architecture tests and all 19 unit tests
green. Driving that path over HTTP with a probe written for the purpose returns `InternalServerError`. So the data
does not leak, because TEN-4's `SaveChanges` guard throws, but the answer is not uniform: a cross-tenant read is
404 and a cross-tenant delete with a forgotten filter is 500. A caller can tell the two apart, which is an
existence oracle, and uniform not-found exists to deny exactly that. Uniformity is delivered today only by every
store method separately remembering its own `Where`, and the backstop that catches a lapse announces it.

The probe passes against unplanted code, so it is a valid test and the 500 is caused by the plant.

### E-51. TEN-3 carried a fourth tenant registry, using the comparison E-9 replaced

**Claim:** TEN-3. **Found:** 2026-07-27. **Measured at 4bcbdf4.**

E-9 is the finding that three claims (SEC-3's PII names, SEC-2's server-owned fields, TEN-1's tenant-shaped names)
each compared a registry with `hashSet.Contains(name.ToLowerInvariant())`, which is equality, so `email` was on
the list and `emailAddress` walked past it. `NameComparison` exists to replace that comparison, `ForbiddenTenantParams`
is the canonical tenant registry, and `NameComparisonTests` asserts that every spelling the old lists enumerated
still matches.

`TenantKeyTests` was never converted. It carried its own list,
`["tenantid", "orgid", "organizationid", "organisationid"]`, compared with `Contains(p.Name.ToLowerInvariant())`,
in the same directory as the repair, three rounds after the repair landed.

Measured, thirteen tenant-shaped spellings against the shipped predicate, six escaped:

```
recognised      TenantId  tenantid  TenantID  OrgId  orgid  OrganizationId  OrganisationId
escaped         tenant_id  TenantIdentifier  TenantKey  WorkspaceId  workspaceslug  AccountId
```

The first three of the escaped six are ordinary spellings of the exact property the claim names. The last three
are the entries the node-react round 4 audit added to the canonical registry after measuring the two editions
against each other, so TEN-3 was behind a correction that had already been made and recorded.

This is E-9's own harm restated: no novelty was required. `tenant_id` is the snake_case spelling of `TenantId`.

**Repaired, 2026-07-27, with two controls.** `TenantColumn.IsTenantShaped` is now
`NameComparison.Matches(EndpointSpineTests.ForbiddenTenantParams, name)`, so TEN-3 reads the registry TEN-1's
guards read and stops holding an opinion of its own about what a tenant is. The extent is asserted against an
independently written floor of thirteen spellings plus six ordinary column names that must NOT match, `Origin`
among them, which is the name the node-react edition rejected a prefix rule over.

| control | before | after |
|---------|--------|-------|
| the thirteen-spelling floor | **6 escaped** | 13 recognised |
| the six ordinary names | not mistaken | not mistaken |
| pre-repair equality registry restored | n/a | red, exactly the 6 |

TEN-3's unmarked-data obligation now rests on precisely the registry and comparison TEN-1's `proven` row rests
on. The two stand or fall together, which is the intended consequence and is better than two registries
disagreeing quietly.

### E-52. TEN-4's write-provenance half has no mechanism, no obligation, and a row that reads `proven`

**Claim:** TEN-4. **Found:** 2026-07-27. **Measured at 38ea5c9.**

TEN-4's mechanism class names seven unit tests. Four are provenance: stamp-provenance-on-create,
stamp-provenance-on-modify, overwrite-caller-supplied-stamp, throw-on-unset-actor. None exists, and none can:
`Note` carries `TenantId`, `Id`, `Title`, `Body` and `CreatedAtUtc` and no actor field at all, and
`KernelDbContext.GuardTenancy` stamps `TenantId` and nothing else. `CreatedAtUtc` is stamped by `NoteService`,
not by the pipeline, which is the opposite of what the claim asks: "stamps are assigned by the pipeline
unconditionally: values already present on the object graph are overwritten".

The tenancy half is real and binds. Removing `GuardTenancy()` from the synchronous `SaveChanges` turns
`TenantGuardTests` red, and making the guard skip when scope is unset turns
`Save_without_a_scope_throws_for_tenant_owned_rows` red, which is precisely the anti-pattern the claim's harm
paragraph describes.

**The defect is where the honest fact was written.** The row carries the free-text note "the write-provenance
stamps are owed (trigger: next edition build pass)", and carries no obligation for them. `conformance.mjs` rolls
up obligations, not notes, so the status reads `proven` and the tally counts a proven row. Someone seeding from
the record sees `proven`; someone reading the prose sees `owed`. This is the overstating row in its purest form,
and it is worse than the ordinary kind because the correct information was already known and written down.

**Repaired 2026-07-27, in part.** Nothing changed about the provenance stamps: they still do not exist, and
building them is a slice with an actor concept, two columns, a migration and a middleware in it, which is a build
pass and not a repair inside a planting round. The trigger stands.

What was repaired is the defect the finding is actually about, which is not the missing mechanism but the row.
The provenance obligation now exists as an obligation, so the roll-up carries it and TEN-4's row reads `owed`
where it read `proven`. The note that had carried this honestly in prose stays, but nothing depends on anyone
reading it.

The general rule this earns: a note is where you put what you could not make the machine check. If the machine
COULD have checked it, and you wrote a note instead, you have recorded the defect and shipped it.

### E-53. AI-1's server-owned key registry is a sixth hand-written list, and its comment claims a parity it does not have

**Claim:** AI-1. **Found:** 2026-07-27. **Measured at 38ea5c9.**

`ToolExecutor.ServerOwnedKeys` is a `HashSet<string>` with `OrdinalIgnoreCase`, twenty-one entries, matched by
equality. Eleven identity-shaped keys measured against it, five survived into the tool arguments:

```
rejected   tenantId  TENANTID  tenant_id  orgId  organizationId  userId
survived   workspaceId  accountId  workspaceSlug  tenantIdentifier  actorId
```

The registry's own comment says it carries "the tenant synonyms (org*) the URL and EF-model guards also reject".
After E-51 those guards read `ForbiddenTenantParams`, which includes `workspace` and `account`. So the comment
asserts a parity that is now measurably false, and the claim's harm is exactly the vector: "a tool schema
mirroring an IdP's or a tenant's claim vocabulary is the realistic confused-deputy vector", which is what
`workspaceId` and `accountId` are.

This is E-9's comparison a sixth time and E-51's second instance, and the first one in production code rather
than in a test. `NameComparison` lives in the test assembly, so the repair is not a one-line swap: either the
comparison moves into the App assembly where the runtime chokepoint can read it, or AI-1 keeps a registry that
provably disagrees with the guards it claims to match.

**Repaired 2026-07-27 at a2eb4cf+.** `NameComparison`, `NameRule` and `NameMatchMode` moved out of the test
assembly into `Kernel.App.Platform.Naming`, and the tenant registry with them, as
`Kernel.App.Platform.Tenancy.TenantNames`. `ToolExecutor` now asks the same comparison, over the same tenant
list, that the URL scan and the EF-model scan ask. `EndpointSpineTests.ForbiddenTenantParams` and TEN-3's
`TenantColumn` both read the shared registry rather than restating it.

Extent is asserted in `ToolExecutorTests` against a twenty-name floor written independently of the registry, with
a ten-name cost side beside it: `scopeOfWork`, `subtotal`, `roleplayPrompt`, `groupBy` and `origin` must all
survive. That cost side is what fixes the match modes. The tenant and identity entries are runs; the OIDC claim
vocabulary (`scope`, `role`, `act`, `sub`) is whole-name, because as runs they strip ordinary arguments out of
every tool schema in the system, and a chokepoint that silently eats good arguments is one developers route
around.

Control: restoring the twenty-one entry equality set with the new theory in place turns six cases red, not the
five this finding recorded. The sixth is `organisation_id`; the original measurement used `organisationId`. The
count depends on the floor it is measured against, which is the argument for writing the floor down.

### E-54. SEC-4's algorithm pinning is proven by one sample and is blind to the list widening

**Claim:** SEC-4. **Found:** 2026-07-27. **Measured at 38ea5c9.**

`A_token_signed_with_a_different_algorithm_is_rejected` mints an HS384 token over the same key and asserts 401.
That proves HS384 is excluded. It says nothing about what the list contains. Adding `SecurityAlgorithms.RsaSha256`
to `ValidAlgorithms` leaves all twelve `HostSecurityTests` green, so the configuration can stop being pinned to
exactly one algorithm without anything reporting it.

The claim's statement is "pins the exact expected signing algorithm". Exact is a property of the whole list and
nothing reads the whole list. The repair is the same one this register now carries three times: assert the
configured `TokenValidationParameters.ValidAlgorithms` equals `[HS256]`, read off the host, and keep the
behavioural test beside it.

**Repaired 2026-07-27 at a2eb4cf+.** `Token_validation_pins_exactly_one_algorithm` reads `ValidAlgorithms` off
the composed host and asserts it equals `[HS256]`. It reads every scheme whose handler is `JwtBearerHandler`, not
`JwtBearerDefaults` by name, because a second scheme with looser validation is how a pin like this stops being
total. Four controls, all at a2eb4cf plus the repair: widening the list to include `RsaSha256` goes red; a second
bearer scheme configured loosely goes red naming that scheme; narrowing the scan to no scheme goes red on its own
non-empty assertion; and the pre-repair configuration with the new assertion in place goes red with exactly one
failure.

### E-55. SEC-4's RequireSignedTokens is entirely unguarded

**Claim:** SEC-4. **Found:** 2026-07-27. **Measured at 38ea5c9.**

Setting `RequireSignedTokens = false` leaves all twelve `HostSecurityTests` green. The claim's statement names it
in the same sentence as algorithm pinning: "pins the exact expected signing algorithm and requires signed
tokens".

`Tampered_signature_is_unauthorized` does not cover it: a tampered signature is a signature that fails to
validate, which is a different question from whether a signature is required at all. The row read `proven` on an
obligation whose second half nothing had ever fed a violating input to.

**Repaired 2026-07-27 at a2eb4cf+.** `Token_validation_requires_a_signature` reads the flag off every bearer
scheme, and `An_unsigned_token_is_rejected` sends a hand-assembled alg:none token through the host.

The control corrected a prediction, which is the part worth keeping. The expectation was that the behavioural
test could not isolate the flag, because with the algorithm pinned to HS256 an alg:none token should be refused
by the pin whether or not signatures were required. Measured: with `RequireSignedTokens = false` and
`ValidAlgorithms` still `[HS256]`, the unsigned token AUTHENTICATES. An unsigned token never reaches signature
validation, so the algorithm pin never runs. The prediction was reasoned and wrong, and the control is the only
reason that is known.

### E-56. SEC-6's dotnet row cites a client-side TypeScript redactor for a server-side claim

**Claim:** SEC-6. **Found:** 2026-07-27. **Measured at 38ea5c9.**

The dotnet edition's SEC-6 row records its mechanism as "`redact.ts` scrubs Authorization and JWT-shaped strings;
`redact.test.ts`", and marks the obligation "secret-shaped values are scrubbed by one redactor" as `proven`.
Those files are `client-web/tools/harness/redact.ts` and its test. They are the harness output surface, on the
client, in TypeScript.

The claim's mechanism class names three surfaces: "hub/realtime logging, harness output, error handlers". Of the
three, only harness output is covered, and the dotnet **server** has no log-safety mechanism at all: `ILogger`,
`Serilog` and any redaction helper return zero occurrences across `server/src`. `app.UseExceptionHandler()` is
wired, so the framework logs unhandled exceptions, and nothing asserts what those entries contain.

A row that satisfies a server-side claim with a client-side file is the shape a reader cannot catch by reading,
because the file names look plausible and the claim's own vocabulary ("harness output") appears in both.

**Repaired 2026-07-27 at a2eb4cf+.** `LogSafetyTests` reads the server's real sink: a capturing `ILoggerProvider`
installed into the composed host, a request carrying a bearer token, a create that SUCCEEDS through the real
store so the content actually travels into an EF command, and then a read that throws so the real
`UseExceptionHandler` is on the surface being measured. It asserts the token, a JWT-shaped string and the request
body's content are all absent from what the sink received.

Three controls at a2eb4cf plus the repair: logging request headers in the pipeline, which is the ordinary
diagnostic mistake, turns the token and JWT assertions red; `EnableSensitiveDataLogging()` on the DbContext turns
the content assertion red; unwiring the capture turns the arrangement's own non-empty guard red while the other
three pass on an empty log, which is why that guard is there.

SEC-6's row moves to `patterned`, not `proven`, and that is the honest ceiling: the claim's locus is per-seam and
every new logging surface owes its own test. The one surface the claim names that this edition does not have is
the hub, because there is no hub.

Two things came out of building it. The redactor's JWT pattern over-matches every dotted identifier (E-58). And
`Parameters=[]` in EF's command log is doing real work: the content assertion passes because EF redacts parameter
values by default, so this test is now the thing standing between `EnableSensitiveDataLogging()` and a log full
of note bodies.

### E-57. A new tool can declare itself read-only while writing, and nothing notices

**Claim:** AI-2. **Found:** 2026-07-27. **Measured at 38ea5c9.**

`ListNotesToolReadOnlyTests` binds: making `ListNotesTool` write turns it red. Adding a SECOND `ITool` whose
`IsReadOnly` returns true and whose `InvokeAsync` creates a note leaves both suites green, because nothing
enumerates tools.

AI-2 is a per-seam claim and its weakening note says so, so the row reading `patterned` is honest and this
finding does not lower it. It is recorded because the per-seam obligation is mechanizable and currently is not
mechanized: a check that every `ITool` implementation is named with its trust tier, and that every one declaring
`IsReadOnly` has a guard test, converts "each new tool owes its own test" from review debt into a gate. That is
the same move `EndpointSpineTests` already makes for SEC-1's endpoints, in the same edition.

### E-58. The harness redactor's JWT pattern matches every dotted identifier, so it rewrites what it should leave alone

**Claim:** SEC-6. **Found:** 2026-07-27. **Measured at a2eb4cf.**

`client-web/tools/harness/redact.ts` ends with
`/[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g` for "any JWT-shaped token that survives". Three
dot-separated runs of eight or more token characters is not a JWT shape, it is the shape of a namespaced
identifier. Found by porting the same pattern to the server side, where its first match on a real captured log
was the string `Microsoft.EntityFrameworkCore.Database.Command`.

On the server that was a false failure and was fixed by anchoring on `eyJ`, the base64url of `{"`, which begins
every JWT header segment because every JWT header is a JSON object. On the client the same over-match fails
nothing and is therefore worse: it silently rewrites dotted identifiers in harness output to `[REDACTED-JWT]`,
and the file's own neighbouring comment shows the author was already thinking about not corrupting NDJSON
("Match only token characters, not a greedy `\S+` that would swallow a following `"}`").

A redactor's false positives are invisible by construction: nobody diffs a redacted log against the original,
because if they could, they would not need the redactor. `redact.test.ts` proves the true positives and asserts
nothing about what survives, which is the same one-sided shape as SEC-4's algorithm test (E-54).

**Not repaired here.** It is the sibling edition's file, reached through `kernel/shared/`, and the repair belongs
with the node-react rounds rather than inside a dotnet repair pass. Recorded with the fix known: anchor the
pattern, and add a passing case for a dotted identifier that must survive.

### E-59. Two ways a measurement can be taken against a binary that is not the source it names

**Claim:** none; this is a defect in the method's own plant-and-revert protocol. **Found:** 2026-07-27.

Both were caught this session, and neither by a rule that was in the protocol.

**A stale scratch backup.** `Program.GOOD.cs` was taken before a repair landed and used to restore after a later
plant, silently reverting the repair. It surfaced three plants later as failures first attributed to the plant in
hand. The protocol says revert byte-for-byte; it did not say the copy must be taken in the round that uses it.

**A restore that MSBuild did not see.** Restoring a planted file with `mv` preserves the original mtime, so the
restored source can be older than the build output and the incremental build skips it. `dotnet test` then reports
a run of the PLANTED binary while `git status` shows a clean tree and the source on disk is correct. Here the
plant was a vacuity probe on `LogSafetyTests`, and the restored run kept failing with the probe's symptom for
three consecutive runs.

Both make a measurement wrong in the direction that matters: they report the code you did not write. Two rules
follow, and they are cheap. Take a backup in the round that uses it and delete it at the end of that round.
Restore with `cp`, never `mv`, so the mtime moves forward, and treat a red that persists after a restore as a
build question before it is a code question.

What actually caught the second one was the arrangement's own non-empty guard: three of the four log-safety
assertions passed happily against an empty log, and the guard that asserts the surface was exercised did not.
The vacuity guards in this edition are there to catch a guard that reaches nothing; this is the first time one
caught a measurement that reached nothing.

### E-60. CON-2's corpus pins the three contracts someone remembered, and neither consumer enumerates anything

**Claim:** CON-2. **Found:** 2026-07-27. **Measured at 58d13de.**

The fixture is genuinely one physical file, linked into the server test project with `None Include` + `Link`, so
the mechanism class's actual sentence is satisfied and no copy exists to rot. What is not satisfied is the
statement's first word, "Every".

| plant | result |
|-------|--------|
| rename `NextCursor` to `NextPageCursor` on `NoteListResponse` | red, `ContractParityTests` |
| add a fourth hand-mirrored contract (`RenameNoteRequest`) with no fixture entry | **green, 157 of 157** |
| add a fixture key (`archiveNoteRequest`) that neither side consumes | **green on both sides** |
| add an optional field to the client's `Note` interface | **green** |

Three hand-written lists, not one corpus: the C# consumer names its three types in `[InlineData]`, the client
consumer names its three in three `it(...)` blocks, and the fixture names three keys. Any one of them can grow or
shrink without the other two noticing, in either direction.

The fourth plant is the subtler one. The client consumer builds a literal typed as the contract type and reads
`Object.keys` off the literal, so it sees the fields the literal happens to set. A required field added to the
interface fails compilation, which is why this looks safe; an OPTIONAL field does not, and an optional field is
exactly how a wire contract grows.

**Repair, and it is small.** Server side: enumerate every public type under `Kernel.Contracts` and assert each has
a fixture key, which closes the "every contract" direction totally rather than by list. Both sides: assert every
fixture key has a consumer, which closes the stale direction. Client side: derive the key set from the type
rather than from a literal, or accept the limit in the row.

### E-61. DATA-5 fails all three of its own completeness obligations while reading `proven`

**Claim:** DATA-5. **Found:** 2026-07-27. **Measured at 58d13de.**

DATA-5 is unusual in the catalog: it spells out its completeness obligation in three named parts, **when**,
**closure** and **remedy**. Each was planted separately.

| obligation | plant | result |
|------------|-------|--------|
| when: validation at startup, structurally | four keys, one blanked at a time | red per key, and the reads feed the JWT options and the DbContext, so the serving surface genuinely cannot be built without them |
| closure, over every key the application declares mandatory | add a fifth `Required("Webhook:Secret")` and satisfy it in both factories | **green, 157 of 157** |
| closure, over every key a committed document declares that the application does not | add `Webhook:Secretz` to `appsettings.json` | **green** |
| remedy, names every failing key rather than the first | blank three keys at once | **names one**: `Jwt:Issuer` |

The "when" half holds and is the half the row was written about. The other two do not, and the claim anticipated
both in its own words: the closure obligation says the undeclared direction is "the direction that is easy to
miss", and the remedy obligation says a validator that stops at the first "turns a three-key misconfiguration
into three failed deploys". Measured: three missing keys, one named.

E-14 recorded the remedy half by reading, in an earlier round. This is the same defect measured against a running
host, plus the two closure halves that reading had not reached.

The repair for the first closure half is not a longer `[InlineData]` list, which is the same hand-written list one
entry longer. `Required()` is a local function, so its call sites are enumerable by a source scan, and the theory
can be driven from that scan: every key the application actually demands gets a test, by construction.

### E-62. MOD-1's cross-module rules do not exist, and its row cites another claim's lint

**Claim:** MOD-1. **Found:** 2026-07-27. **Measured at 58d13de.**

The row reads `latent`, with the note "single module; the cross-module rules have no second module to constrain,
so the second module is their first real run". That describes a mechanism waiting for a surface. There is no
mechanism.

Planted a second module, `Kernel.App.Widgets.WidgetService`, taking a direct constructor dependency on the Notes
module's `NoteService` rather than an interface registered at the composition root, which is the reach MOD-1's
mechanism class says the arch rules reject. Green, 157 of 157. The string "module" appears in no test in the
project. `DependencyDirectionTests` constrains LAYERS (App, Persistence, Api); a module is a different partition
and nothing partitions it.

The row's other cited mechanism, "client deep-path import bans", is `serviceBan` in the shared eslint config,
whose own message reads "screens receive data and callbacks (UI-5)". It is UI-5's ban on screens reaching the
transport, cited for MOD-1's ban on modules reaching each other's internals. Same file, same rule name, different
claim, and MOD-1 has nothing of its own there either.

`latent` is the wrong status for this. `latent` means built but never executed, which is a real and useful state;
this is not built. It goes to `owed` with the trigger the note was already reaching for: the second module.

### E-63. MOD-2's artifact-kind registry is closed over six suffixes and open to every kind not in it

**Claim:** MOD-2. **Found:** 2026-07-27. **Measured at 58d13de.**

Two plants bind: a second public type in a file turns
`Every_source_file_holds_one_public_type_named_for_the_file` red, and a `MapGet` in a `*Middleware.cs` turns
`Routes_are_declared_only_in_endpoint_files` red. The naming and route halves of this claim are real.

The registry half is not. `Registry_suffixes_live_in_their_legal_location` checks six suffixes: `Ef*Store`,
`*Store`, `*Endpoints`, `*Configuration`, `*Middleware`, `*Service`. A file named for any other kind is
unconstrained. Planted `NoteRepository.cs`, a data-access kind in `Kernel.Api/Platform/`, which is both a new
artifact kind and a placement no layer rule allows. Green, 157 of 157.

MOD-2's statement is "Artifact kinds form a closed registry; introducing a new kind is a deliberate kernel edit,
not an ad hoc naming choice." The test enforces where the six known kinds live. Nothing notices a seventh
arriving, which is the sentence's actual subject.

The repair is the same shape as every other closure repair in this edition: derive the kind from the file name's
suffix, and fail on a suffix the registry does not declare. That makes adding a kind exactly what the claim asks
for, a deliberate edit of the registry.

### E-64. One pinned image digest, four copies, and any one of them can drift alone

**Claims:** TEST-1, DEP-1, CFG-1. **Found:** 2026-07-27. **Measured at 58d13de.**

The SQL Server image is pinned by tag and digest in `VERSIONS.md`, and the same 71-character literal is written
out again in `SqlServerFixture.cs`, `scripts/db-up.sh`, `.github/workflows/ci.yml` and
`docs/runbooks/local-development.md`. Each copy carries a comment saying it is the pinned value from VERSIONS.md;
`SqlServerFixture.cs` says it is stated explicitly "so all three tiers run the same engine build as the runbook
and CI".

Planted: change the digest in `SqlServerFixture.cs` alone to sixty-four zeroes. Architecture 157 of 157 green,
docs-lint ok, conformance ok. Nothing anywhere compares the copies to VERSIONS.md or to each other, so the
sentence "all three tiers run the same engine build" is an aspiration held by a comment.

CFG-1's statement has this exactly: "a script never duplicates a committed configuration value, it reads it",
which E-13 already recorded as unenforced. This is a measured instance of it, in the one place where the value
being duplicated is a supply-chain pin.

It is also TEST-1's "exactly one provisioning path" from the other side. There are three: Testcontainers for the
integration tier, `scripts/db-up.sh` for development, and a GitHub Actions `services:` container plus
`dotnet ef database update` for e2e. The claim's harm paragraph names this shape, "a container-based path plus a
parallel shell-docker path", as what rots into "which one is true". The four-copy pin is the rot, visible.

A shell script cannot read a markdown table, so the honest repair is one committed machine-readable pin the
script, the fixture and the workflow all read, with `VERSIONS.md` generated from it or checked against it.

### E-65. The node-react edition ships no instantiation manifest at all

**Claims:** TEST-3, HUM-1, and every claim whose enforcement is conditional on arming. **Found:** 2026-07-27
while scoping E-24's repair. **Measured at 670fb01.**

`kernel/dotnet-react/README.md` carries the instantiation manifest: part A the file set, part B the ordered setup
steps, part C the verify-as-a-set list. `kernel/node-react/README.md` has five sections and none of them is a
manifest. No file set, no setup steps, no verify list, and no arming step.

`skills/seed/SKILL.md` step 2 says "The edition README's 'Instantiation manifest' section is the definition" and
"The manifest's contents are the kernel's to define; this skill runs it and does not restate it." For the node
edition there is nothing to run. The skill would reach step 2 and find no definition.

This was invisible because the dotnet edition is the one the acceptance test was executed against, and because
the manifest is prose in a README rather than an artifact anything checks. Both editions' READMEs pass docs-lint.

**Partly repaired 2026-07-27.** `tools/gate-check.mjs` composes into both editions and both run it, so the node
edition has the readback even though it has nowhere to cite it from. The manifest itself is not written: it is a
statement about what that edition ships and how it is set up, which is edition work rather than a repair inside
this pass. Trigger: node Phase B, which is where that edition's shipped surface gets settled.

The general shape is worth keeping separately from the instance. Two editions of one kernel, and the check that
both are complete is that a human reads both READMEs. `conformance.json` is machine-checked in both, 69 rows in
each, because it is a data file with a tool. The manifest is the same kind of obligation with no tool.

**Repaired 2026-07-27 at ad8ff35+.** `kernel/node-react/README.md` gains an `## Instantiation manifest` section
in the same A/B/C shape and the same position as the sibling's, written from the measured delta between the two
trees rather than copied: eleven travelling items rather than thirteen, because this edition ships no `scripts/`
and no `.vscode/`; a rename list with no `.sln`, no `UserSecretsId` and no connection-string key, but with
`server/config/settings.json`'s placeholder issuer and audience; and no e2e bullet in part C, because this
edition binds its harness and smoke to no runner.

Step 4 is worded "every job the workflow declares" rather than a number. The sibling says "all five jobs" and
this edition's workflow declares four, so a number would have been wrong here the day it was written;
`gate-check.mjs` derives the names from the workflow, so the readback line ports verbatim.

Two absences are named in the manifest rather than left for a seeder to discover: no e2e runner, and
`docs/runbooks/` holding only a template, so step 5 points at no runbook.

Found while writing it: this README's "Running it" block described the server as serving "on PORT (default
5080)". `server/src/main.ts` deliberately REMOVED `process.env.PORT ?? 5080` as CFG-1's own finding, recording
that an env read is not a literal in code, is not committed configuration, and that the `??` was a silent default
of exactly the kind DATA-5 forbids. The README was still advertising the anti-pattern the code was repaired to
remove. Corrected to name the settings seam.

### E-66. TEST-1's ban on fake in-memory providers was never measured, and measuring it moves two of its own claims

**Claim:** TEST-1. **Found:** 2026-07-27, from the owner's question about whether a fake provider would do.
**Measured on macOS arm64, EF Core 9.0.6, no container.**

TEST-1 bans EF Core InMemory and states the harm: "Fake in-memory providers pass queries the real engine rejects
and miss the semantics tenancy depends on (query filters, collations, constraint behavior)". The ban is enforced
and red-green proven (a package reference turns `Test_projects_do_not_reference_ef_in_memory` red). The harm
behind it had never been measured in this edition, which makes it an asserted claim of exactly the kind this
whole exercise exists to distrust.

One model, one set of probes, both providers, each probe asking only whether the store does the safe thing.
No raw SQL anywhere, because EF InMemory does not support it and a provider refusing to run a statement is not a
provider that caught the defect in it. Colliding writes go through a SECOND context over the SAME store, so EF's
identity map cannot be what refuses them.

| does the store do the safe thing? | SQLite `:memory:` | EF InMemory |
|---|---|---|
| duplicate primary key is refused | yes | yes |
| null in a required column is refused | yes | yes |
| unique index violation is refused | yes | **NO** |
| value past max length is refused | **NO** | **NO** |
| foreign key to a missing row is refused | yes | **NO** |
| a query the engine cannot run fails at test time | yes | **NO** |
| a rolled back transaction leaves nothing behind | yes | **NO** |
| concurrent-token conflict is detected | **NO** | **NO** |

Four differences, every one in SQLite's favour, and three of them are the harm sentence verbatim: a unique index
that is not an index, a foreign key that is not a key, and a query that runs green in the test and throws in
production. The rolled-back transaction is the one worth naming separately, because it is not a constraint at
all: EF InMemory accepts `BeginTransaction` and ignores it, so a test asserting rollback behaviour passes while
proving nothing.

Two rows say SQLite is unsafe too, and they stay in the table because they are the substance of TEST-1's own
weakening note ("SQLite in the fast tier is a deliberate semantic compromise"). Max length is real: SQLite has
type affinity and no length constraint, so a column the shipped schema declares `nvarchar(10)` accepts five
hundred characters in the fast tier. The concurrency row measures a lost update with no token modelled, so it
indicts neither provider and marks what the fast tier cannot answer.

**Nothing to repair; two things to record.** The ban is correct and now has evidence under it rather than an
assertion. And this measurement cannot become a test in this edition, because the test would have to reference
the banned package. It is a measurement in the register, not a guard, and saying so is more honest than moving
the ban to accommodate its own proof.

**The platform question that prompted it, answered separately.** Both providers are pure managed code and both
ran here on arm64 with no container. The Docker dependency in this edition is not the fast tier and never was:
215 of 219 tests already run on SQLite `:memory:`. It is SQL Server, which is amd64-only and needs emulation on
Apple Silicon, which is why `scripts/db-up.sh` carries a colima and Rosetta precheck. Swapping the fast tier's
engine would not remove a container from anything.

### E-67. TEST-2's completeness self-audit enumerates one hardcoded class, and only half of that class

**Claim:** TEST-2. **Found:** 2026-07-27. **Measured at 75ae4bb.**

The self-audit is the mechanism TEST-2 rests its strongest sentence on: "the harness self-audits (it enumerates
the service methods, diffs them against what actually ran, and fails on an uncovered method), so completeness is
declared, never interrogated." Its reach is one line:

    Object.getOwnPropertyNames(NotesRepo.prototype)

Two holes, both planted and both green.

**A second data service is invisible.** Added `src/data/tagsRepo.ts`, a `TagsRepo` with two public methods and no
scenario. `tsc --noEmit` clean, eslint clean, 65 of 65 tests pass, and the harness coverage line is
byte-identical: it names the same three NotesRepo methods and never mentions TagsRepo. The claim says "every
public method of every client data service"; the audit knows one class, by name, written into the harness.

**A method declared as a class field is invisible.** Added `purgeAll = async (): Promise<void> => {...}` to
`NotesRepo`. That is an instance property, not a prototype member, so `getOwnPropertyNames(prototype)` never sees
it: it cannot be reported uncovered, because it is not in the set that gets diffed. The arrow-function class field
is an ordinary way to write a method in TypeScript, chosen for `this` binding, not an exotic evasion.

The audit's design is right and better than a hand-written list, which is why this is a reach defect rather than a
shape defect. The repair is the same move made twice: enumerate the data-service MODULES (the `src/data/` exports
that are classes) rather than naming one, and enumerate instance members of a constructed instance as well as
prototype members.

**Not measurable here:** whether an uncovered method actually fails the run. With no server every scenario throws
before reaching its repo calls, so `driven` is under-populated and the coverage line is red for that reason. That
half needs the stack up.

### E-68. UI-4's de-fabrication direction only sees elements that volunteer to be seen

**Claim:** UI-4. **Found:** 2026-07-27. **Measured at 75ae4bb.**

UI-4 exists for two directions, and the de-fabrication one is the reason it exists: "Generated UI drifts in both
directions: silently omitted states the prototype specified, and fabricated elements the prototype never
contained. Both read as done in a demo; only a two-directional ledger catches them mechanically."

The suite collects `container.querySelectorAll('[data-atom]')` and asserts every collected atom is in the ledger.
So the set it checks is the set of elements that carry `data-atom`, which is to say: the elements that have
already declared themselves part of the ledger's vocabulary.

| plant | result |
|-------|--------|
| a ledger atom renamed so it stops rendering | red, exhaustiveness |
| a fabricated `<div data-atom="promo-banner">` | red, de-fabrication |
| a fabricated `<p>` with no `data-atom` | **green, 65 of 65** |

Both directions bind for atoms that opt in. Fabricated UI that does not opt in is not caught by either, and
nothing else catches it: the same `<p>` passes `tsc`, eslint and every test in the client suite.

This is the sharpest form of a pattern this register keeps finding, and it is worth naming as a class rather than
an instance. A guard whose SUBJECT is drawn from a marker the code under test applies to itself can only ever
police the code that is already cooperating. UI-2's lint has the property honestly (it scans all source and picks
out literals). This one does not, and it is the guard whose whole purpose is catching what an AI invented, which
is exactly the code least likely to volunteer a marker.

**Repair, and it is not "add data-atom everywhere".** The de-fabrication assertion needs a subject that does not
come from the atoms: assert over the rendered ELEMENT tree, with a declared allowlist of structurally invisible
wrappers, so an element that carries no `data-atom` is a failure rather than an absence. That inverts the default
from opt-in to opt-out, which is the only version of this test that can catch fabrication.

### E-69. UI-3's screen-side bans are one ban, not three, and the row names a rule the lint does not have

**Claim:** UI-3. **Found:** 2026-07-27. **Measured at 75ae4bb.**

UI-3's statement bans three things in screens: style-sheet creation, raw platform text elements, and direct token
consumption. Only the third is enforced.

Planted a bare `<p>A raw platform text element in a screen.</p>` in `NotesScreen`. Clean `tsc`, clean eslint, 65
of 65 tests. The `themeBan` covers imports from the theme layer and the naming scan covers which paths may import
it; neither has an opinion about a raw element, and UI-2's literal bans only fire on visual VALUES, so an element
with no inline styles passes them all.

Separately, the conformance row reads "`Text`/`Button` are the only token importers". The enforced rule is not
that. The lint exempts `src/components/**` wholesale and the naming scan allows any path starting `components/`,
so a third primitive importing tokens is legal, which is correct against the claim ("the primitive component
layer is the sole consumer") and not what the row says. The row names two files; the mechanism names a directory.
The mechanism is right and the row overstates its precision.

### E-70. UI-5's import ban cannot see transport logic that imports nothing

**Claim:** UI-5. **Found:** 2026-07-27. **Measured at 75ae4bb.**

The ban binds: importing `../../data/notesRepo.ts` into `NotesScreen` fails eslint with UI-5's own message. That
half is centralized and real, and it closes the route the pilot's failure took.

It is a ban on IMPORTS, and UI-5's statement is broader: "The client UI holds no business or transport logic of
its own." Planted a screen-local function that builds its own authenticated request:

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notes`,
      { headers: { authorization: `Bearer ${import.meta.env.VITE_API_TOKEN}` } });

That is a screen reading the API base URL, reading a bearer token, and calling the server. It imports nothing.
Clean `tsc`, clean eslint, 65 of 65 tests.

The realistic arrival is not malice: it is a screen that needs one endpoint the repo does not expose yet, and the
ban that would stop the clean route (import the repo) is silent on the dirty one. A screen-scoped ban on bare
`fetch`, `XMLHttpRequest`, `EventSource` and `WebSocket` is a lint rule of the same kind as the one already there,
and it covers what the import ban structurally cannot.

**Not measurable here:** the composed-entrypoint smoke needs the server up, so UI-5's second half was read and
not run.

### E-71. Sixty-one node rows carried a trigger naming a procedure the owner had closed

**Claims:** 61 rows of the node-react conformance record. **Found:** 2026-07-27. **Measured at e82fc4a.**

An `owed` row is honest only if its trigger names an event that can occur. On 2026-07-27 the owner closed the
delta protocol's research phase (`record/delta-log.md`): "The 61 claims that never got a step 2 do not owe one."
Every one of node-react's 61 owed rows still named that step as its trigger. A trigger naming a closed procedure
is not a deferral, it is an abandonment wearing a deferral's clothes, and it is the exact defect this register
was opened to catch, one level up from the code.

The single number covered three different situations, which is why it needed measuring rather than counting.

**Class B, 35 rows.** Shape: "trigger: this claim's delta pass in the node-react build. It is deferred in every
edition so far: `<a real product event>`." The lead clause is dead and the clause after it is live and matches
the dotnet sibling exactly. Repair: delete the lead clause, promote the survivor. No status moves.

**Class A, 25 rows.** Shape: the dead trigger plus "A realized precedent exists in dotnet-react, so a Node
mechanism is expected to be reachable." That second sentence is a prediction about reachability, not an event, so
subtracting the delta pass left these rows with no discharge condition at all. Nine of them are worse than owed
in the other direction: the mechanism is realized in the shared tier, composed into this edition and passing,
while the row reads not built. Those nine now carry the only honest trigger available, which is the measurement
rather than the build: a violation planted against the claim's own obligation turning the claim's own guard red.
The other sixteen take the product event their dotnet sibling names.

**Class C, 1 row.** DEP-2's trigger was already live; one sentence inside it asserted the dead debt. Deleted.

**Two related defects found in the same scan and repaired with it.**

`kernel/dotnet-react/conformance.json` carried the dead premise twice, in TEN-1's and SEC-2's notes: "the row is
still `owed` ... because repairing it means opening MOD-2's realization before MOD-2 has had its delta pass."
Both rows read `proven` at this commit, so those sentences contradicted the row they sat in, and both were
regenerated into the README table. Struck.

`record/adjudication-digest.md` opens with a standing constraint on all future claim-file edits whose entire
stated justification is "61 claims still owe a step 2", and retracts that premise 673 lines later in the same
document. The constraint itself is defensible on a different reason, which ruling 1's own argument supplies, so
the head note is corrected at the point of use rather than deleted: anyone executing the go-forward plan
inherits the constraint and should not inherit the dead premise. `record/delta-log.md` pointed at the digest
section by its former heading, a dangling cross-reference, now repointed.

**What this cost to find and what it says about the record.** The 61 rows were visible as a grep the whole time.
What was not visible is that the row-level trigger check reads `note` and the obligation-level check reads
`text`, so a scan of obligation text alone returns a clean bill for this file: node-react has four
obligation-level triggers and all four are live. The record was machine-checked and the machine was checking the
other field.

### E-72. SEC-1's four scans share one enumeration, and nothing asserted the enumeration

**Claims:** SEC-1, and TEN-1 which reads the same method. **Found:** 2026-07-27. **Measured at fa65974.**

`EndpointSpineTests` is the strongest guard in this edition. The anonymous register carries a justification floor,
scopes a carve-out to one verb on one URL, and fails a stale entry. The fallback is resolved from the provider the
middleware actually consults and evaluated against both an anonymous and a fully authenticated principal. Every
one of those was earned by a finding.

All of it loops over one private helper, and nothing asserted what that helper returns.

Planted: narrow `RouteEndpoints()` to the routes whose pattern contains `health`. Result, 157 tests:

| test | claim | result |
|------|-------|--------|
| `Every_endpoint_is_permission_gated_or_allowlisted_anonymous` | SEC-1 | green |
| `No_endpoint_exposes_a_tenant_or_pii_parameter` | TEN-1 | green |
| `No_endpoint_binds_a_tenant_or_pii_header` | TEN-1 | green |
| `No_endpoint_binds_a_body_type_carrying_server_controlled_fields` | SEC-2 | **red** |

One test noticed, and it belongs to a third claim. Its message is "The SEC-2 body scan enumerated no body type at
all, so its green result says nothing", which names neither the narrowing nor the two claims that just went blind.
A guard carrying another claim's load with a message naming neither is E-22, and this is its third instance in
this edition after E-48 and E-50.

The stale-carve-out check gets an honourable mention: if the enumeration were emptied entirely rather than
narrowed, it would fail, because `/health` would stop matching its allowlist entry. That is a real accidental
guard and it is why the plant had to leave one route standing to find the hole.

**Repaired in the same round.** `The_endpoint_enumeration_is_every_route_the_host_maps` compares the scanned count
against the framework's own unfiltered table, then checks a named floor of the three routes this edition ships.
Both halves are needed: the count catches a filter inside the helper, and the floor catches a filter applied to
both expressions. Control: the same plant with the assertion in place turns it red naming SEC-1, alongside SEC-2's.

SEC-1's row was flat, a single `proven` with no obligations, which is how four separate things came to be carried
by one status. It now carries all four.

## Acceptance test, first execution (2026-07-27)

The instantiation acceptance test had never been executed. It ran for the dotnet-react edition, into a scratch
directory outside this repo, product name Ledgerly, source tree read-only throughout and verified unmodified
afterwards.

**Result: instantiation costs 27 human turns before slice one exists, and none of them is a product decision.**
8 stop the seed until the owner answers (create the remote and choose the default branch; the owner's forge
handle; arm protection by hand; verify arming with a test PR and a second identity; rule on a dirty kernel
checkout's pin; rule that seeding proceeds with no design export; choose the CLAUDE.md house-style set; rule on
carrying the four SEC-5 allowlist justifications into the product). 19 the builder can rule on alone but must log
as manifest gaps. Three of the eight exist solely because arming has no mechanism.

The manifest's own opening sentence says the instantiation layer is where the acceptance test found the kernel
weakest, a quarter of the pilot's turns being bootstrap the handover failed to ship, and that the manifest exists
to fix it. It converted an unwritten bootstrap into a written one that is incomplete in the file set (E-25),
incomplete in the rename list (six further occurrences the list does not name, including the `Kernel.sln` literal
in `TestPaths.cs`, which costs ten architecture tests if missed), self-contradictory in part A (E-25),
unsatisfiable at step 6 (E-27), wrong about the ports (E-26), and still pure prose at the one step it itself
labels "the step that gets skipped" (E-24).

**Verify-as-a-set, measured.** `dotnet restore --locked-mode`, `dotnet build -warnaserror`, the architecture tier
(100 passed) and the unit tier (19 passed) all pass after the rename. `npm ci` and `npm run verify` pass (16
tests). docs-lint passes, printing four `note:` lines where the manifest documents two. Both dash greps pass. The
integration tier and `scripts/e2e.sh` are environment-blocked on Docker, and both fail loudly with actionable
messages rather than vacuously, which is worth recording as a positive. `secret-scan --self-test` passes;
`secret-scan` itself fails, exit 1, per E-25. Branch protection was not performable, per E-24.

**Two positives worth keeping.** DEP-1's kernel-provenance mechanism is armed and red-green proven in the seeded
shape: blanking the Remote field back to its placeholder fails docs-lint by name, restoring it passes. It checks
the shape and is blind to the content, so a pin written against a dirty checkout is accepted silently.
`scripts/dev-setup.sh` is idempotent, verified by running it twice, with one conditional non-idempotent path in
the source that this run did not trigger: a swallowed failure of `dotnet user-secrets list` would regenerate
`Jwt:Key` on every run and silently invalidate every previously minted token.

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

**Repaired, 2026-07-27, with the pre-repair control.** `HostSecurityTests` gained
`One_tenant_cannot_delete_another_tenants_note` and `Another_tenants_note_is_absent_from_the_list`, so the read,
mutating and list verbs now each assert the same absent answer. Re-planting the tenant filter removal in
`EfNoteStore.DeleteAsync` turns the delete probe red and nothing else, where before it left all 113 tests green.

The probe reads a status code rather than asserting which layer refused, so it holds whether the store filter or
the `SaveChanges` guard does the work. What it will not accept is the two answers differing.
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
