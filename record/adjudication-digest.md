---
kind: record
status: working
---

# Adjudication digest, 2026-07-26

Prepared for the owner's ruling on `record/edition-findings.md`.

**Corrected 2026-07-27, in place, because this file has become the pass's own record rather than only its
proposal.** The line that stood here said nothing in `kernel/claims/` had been edited. That was true when the
digest was written and stopped being true when the owner ruled: all eleven rulings are now applied, ruling 1 in
its own commit and rulings 2 through 11 in the working tree beneath this one. The `Applied?` column below is the
authority on what landed; the ruling sections keep their evidence, options and recommendations exactly as they
were written, because a recommendation rewritten after the fact is no longer evidence of anything.
The register's own discipline binds this file: recording evidence and pre-empting a ruling are different acts,
so every section below states a question, its evidence, its options and their consequences, and a
recommendation. The recommendation is a view, not a decision.

## What was verified before anything was written

- **The inventory.** 35 findings were defined when this digest was written: A-1 to A-6, B-1, B-2, B-3, B-5,
  S-1 to S-10, E-1 to E-15. Counted from the headings, 36 headings resolved to 35 ids because
  `E-5 second instance` re-opens a defined id. B-4 was the only gap and is now written (below).
  **Now 39**, re-counted 2026-07-26 after the flow-back pass: B-4 plus E-16, E-17 and E-18, with zero dangling
  ids, which the new docs-lint check enforces rather than leaving to a sweep. **42 after the application pass**
  (2026-07-27): B-6, S-11 and E-19, each found while applying a ruling and each given a new id in an existing
  class rather than folded into a neighbour to keep the count down.
- **S-2's numbers.** `locus` holds 22 distinct values across 69 claims; 49 are exactly `centralized` or
  `per-seam`; 20 qualify in prose. Re-measured, matches the register.
- **S-3's numbers.** 42 claim files carry a status word inside their `- Edition:` bullet: 35 where the bullet
  opens with `owed`, 5 where a second obligation's status is buried in prose (SEC-5, SEC-6, TEN-2, TEN-4,
  TIME-1), and 2 where the word is descriptive rather than a status (UI-3, UI-4). Matches the audit's 42, and
  the split is new.
- **Both editions' status tallies.** `kernel/dotnet-react/`: 25 `proven`, 6 `patterned`, 2 `latent`, 36 `owed`.
  `kernel/node-react/`: 4 `proven` (SEC-1, SEC-2, SEC-3, CFG-1), 65 `owed`. Read from the status field only;
  the sibling's mechanism column was not opened for any unbuilt claim.
- **B-4's property**, re-measured rather than reconstructed. See the warm-up section.

Two heuristic measurements are used below and are flagged where they appear: the count of stack-specific tokens
in claim files is a keyword scan, so it is a floor and not a proof. Using a name-list heuristic to size a
finding about name-list heuristics is noted rather than hidden.

## RULED, 2026-07-26

All eleven ruled by the owner on the date this digest was prepared. Recorded here first, because a decision is
the scarce artifact and the application is mechanical once it exists. Each ruling section below keeps its
evidence, options and recommendation unchanged; this table is what was chosen.

| # | Decision | Applied? |
|---|---|---|
| 1 | **(b)** Remove edition realizations from claim files entirely | **Applied.** 69 `- Edition:` bullets and 69 index status lines removed; file schema and status-tag section rewritten; recorded as a dated pass in the catalog changelog |
| 2 | **(c)** Schema gains the completeness obligation; written now for the 8 built claims only | **Applied.** Schema section 'What a mechanism class states' added to `kernel/claims/README.md`; a `- Completeness obligation:` bullet with when, closure and remedy written into the 8 built claims (SEC-1, SEC-2, SEC-3, TEN-1, CFG-1, SEC-5, DATA-5, TIME-1) and into none of the other 61 |
| 3 | **(c)** Optional per-obligation statuses in `conformance.json`, **plus a single roll-up where the weakest obligation wins** | **Applied, partly.** `conformance.mjs` gains the optional array, eight validation paths and the renderer, all red-green proven (11 probes); composed into both editions; 13 rows carry obligations (9 + 4). Three of the nine second statuses could not be written without moving a shipped status the ruling does not authorize, recorded as S-11 rather than smoothed. dotnet TIME-1 rolls up to `owed` here |
| 4 | **(b)** An asserted relationship between two mechanisms is part of the claim; within a claim only, cross-claim dependency deferred to `candidates.md` | **Applied.** Schema sentence added; a `- Mechanism relationship:` bullet written into SEC-1 (independence of the fallback from the scan) and SEC-5 (independence of blind spot, not of mechanism). The cross-claim dependency field is queued in `record/candidates.md` under its own heading, not built |
| 5 | **(b)** TEN-1's mechanism class gains a non-scan mechanism for the header surface; the statement is unchanged because it was right | **Applied.** TEN-1's mechanism class now requires a runtime, non-scan mechanism for the header surface (strip or refuse before any handler, plus a test that resolution does not consult a header) and says why a scan cannot reach it. The statement is untouched |
| 6 | **(b)** The comparison is part of the mechanism class, **as a schema rule covering any name-matching mechanism plus a written obligation in the four measured claims: SEC-2, SEC-3, TEN-1 and SEC-5** | **Applied.** Schema sentence covers any mechanism matching a name against a list; a written comparison obligation added to SEC-2, SEC-3, TEN-1 and SEC-5 |
| 7 | **(b)** for HUM-1, TIME-1 and PERF-4, **(c)** for DATA-1 (repaired when it is built, not from an armchair) | **Applied.** Schema sentence added; HUM-1, TIME-1 and PERF-4 repaired. DATA-1 deferred as ruled. HUM-1's weakening note was repaired too (same artifact, same file); the other four weakening-note instances are open and recorded as B-6 |
| 8 | **Yes to all three**: 8a TIME-1's fused properties split, 8b CFG-1's fourth home, 8c CON-2's unstated precondition in the weakening notes | **Applied.** 8a: TIME-1's statement separates unambiguity from offset retention and says what each buys. 8b: CFG-1 names the ambient environment as a fourth home and closes it by declaration rather than by ban. 8c: CON-2's weakening notes name the precondition and the sanctioned alternative |
| 9 | **9a (i)** advisory outranks the window above the 7-day floor; **9b (ii)** the catalog's number is deliberately independent of any standing policy outside the repo; **9c** DEP-2's trigger moves to the next edition build pass; **plus: DEP-1's ledger extends to any pin taken under the advisory rule, direct or transitive** | **Applied and executed.** DEP-1's statement gains the resolution order (advisory outranks the window above the 7-day floor, by explicit decision, with a ledger row for any pin taken under it, direct or transitive); its weakening notes record that the number is independent of any policy outside this repo; DEP-2's trigger moves to the next edition build pass in both editions' rows. `postcss` re-pinned 8.5.15 to 8.5.18 in the shared tier, recomposed, first advisory-rule ledger section written in both `VERSIONS.md` files. `npm audit` over the shared tier and over both editions' composed client trees: **0 vulnerabilities**, from 1 high |
| 10 | **(b)** `locus` becomes two values plus a free-text `locus_note` | **Applied.** 20 claim files split, mechanically on the leading word, giving 55 `centralized` and 14 `per-seam`, which is the tally the catalog already quoted; the schema section and the centralized-versus-per-seam section rewritten; a docs-lint check added, conditional on the catalog and announcing its skip, red-green proven in 8 probes including the seeded shape. One probe found a hole in the shared front-matter parser (a key with an empty value parses as absent) and the check reads the raw block because of it |
| 11 | **Queue both** in `record/candidates.md`; mint neither | **Applied.** Both queued in `record/candidates.md` with their evidence and their why-not-minted, under a new section for claim-shaped items; neither minted. Ruling 4's deferred cross-claim dependency field is queued in the same section |

**Application order, and it is not the numbering.** Ruling 3 goes first: rulings 2, 5 and 6 falsify four
`proven` rows in `kernel/dotnet-react/` (SEC-2, SEC-3, TEN-1, TIME-1), and ruling 3 is what gives those rows
somewhere honest to land. Applied after, they collapse to a single word that understates them the way node's
TEN-1 currently does.

**The consequence of 9a to execute, not to decide.** The tree currently pins `postcss` 8.5.15, which clears the
window and carries GHSA-r28c-9q8g-f849. Under the ruling the advisory outranks the window, so the pin moves to
8.5.18 and gets the first ledger row written under the extended rule.

**A standing constraint on applying any of this.** Every claim-file edit must be made from the claim files alone
and never reconciled against either edition's mechanism column. 61 claims still owe a step 2, and that
reconciliation would destroy it for all of them. Ruling 1 was applied under that constraint.

**Corrected 2026-07-27, at the point of use.** The sentence above is kept because ruling 1 really was applied
under it, and the constraint itself still holds. Its stated REASON does not: this document retracts it 673 lines
below, under `Sixty-one claims owed a step 2, and no longer do`, and `record/delta-log.md` carries the owner's
closure of the delta protocol's research phase. No claim owes a step 2. The constraint survives on a different
and better reason, which ruling 1's own argument already gives: a claim file states what is true of the claim,
so reading an edition's mechanism column while editing one is how a realization's limits get written back into
the normative text as if they were the claim's. Anyone executing the go-forward plan below inherits the
constraint and should not inherit the dead premise.

## RULED, 2026-07-27: the three points the raise pass left with the owner

Not part of the eleven. These are the questions the raise pass handed back rather than deciding, worked one at a
time.

| Point | Decision | Applied? |
|---|---|---|
| 1. `ContractShapeTests` versus MOD-2's step 2 | **No decision existed.** The premise was measured false | **Applied.** MOD-2's row names `NamingPlacementTests`; the file names MOD-2 zero times and its own summary names SEC-2. The repair the premise had blocked for three rounds was made: one shared `BodyMemberWalk`, the registry comparison through `NameComparison`, and E-22, a tenant registry that had never been applied to a body member on any surface. SEC-2 and TEN-1 back to `proven`, tally 21/6/2/40 to 23/6/2/38 |
| 2. S-12's structural half: is the quarantine maintainable, given the register cannot be quarantined? | **Yes. Detect and report, do not prevent, and do not label.** The report never fails and nothing is redone | **Applied.** `docs-lint` gains the register leak report, composed into both editions, control-proven by plant (12 claims to 14, reverted). Measured: 12 of 69 in .NET, 7 already burned, so five of the 61 owing claims are informed. Ruling and snapshot written into `record/delta-log.md`; S-12 re-graded a second time |
| 3. E-21: is `BUILD-BRIEF.md` an archive or a spec? | **Archive, for the .NET brief. Spec, for the Node one.** Neither is deleted | **Applied.** `kernel/dotnet-react/BUILD-BRIEF.md` moves to `status: archived` with a dated paragraph naming the four mechanisms that moved and pointing at the conformance record as what the edition enforces today. `kernel/node-react/BUILD-BRIEF.md` stays `authoritative`: it is the only definition of the delta protocol and of the A/B/C failure classes that type this register's findings |

**Why point 3 deletes nothing.** The question arrived as a deletion, on the grounds that documentation drifts and
that this file being about .NET rather than Node proved it already had. Both halves measured false. There are two
briefs, one per edition, and the Node one is not documentation: it is the only place the delta protocol and the
A/B/C failure classes are defined, so deleting it deletes the specification of the method that produced this
digest. And neither is deletable as a documentation act, because `docs-lint` detects the kernel context by the
presence of `BUILD-BRIEF.md` and `VERIFICATION.md`; moving the .NET brief aside produces three DEP-1 failures.
The rule that survives: prose describing a mechanism drifts and should be archived, prose defining the method
cannot drift and must not be.

**Why point 2 rules out the label.** Contamination has never been measured to cost a finding. All eight step 2s
in the delta log were written informed, through the `Edition:` bullet ruling 1 removed, and DATA-5's was informed
by a sentence naming a facility the edition does not have. The report dated into a round's ledger does the work a
per-claim `[informed]` label would, and does it better: the register only grows, so a snapshot is the only honest
answer to what a step 2 could have seen when it was written, and a snapshot cannot drift.

## Decision sheet

| # | Ruling | One-line question | Recommended | Falsifies a shipped `proven`? |
|---|---|---|---|---|
| 1 | The `Edition:` bullet | Does a claim file carry edition realizations at all? | Remove them | No |
| 2 | The completeness obligation | Does a mechanism class gain a third part, with when, depth and remedy? | Yes, written now only for the 8 built claims | **Yes: SEC-2 and TIME-1 in .NET** |
| 3 | The status vocabulary | Does a conformance row hold one status or one per obligation? | Per obligation | No, it refines 9 rows |
| 4 | Mechanism relationships | Is an asserted relationship between two mechanisms part of the claim? | Yes, and scoped within a claim only | No |
| 5 | TEN-1's fourth surface | Does TEN-1's mechanism class gain the header surface? | Yes | **Yes: TEN-1 in .NET** |
| 6 | The predicate's comparison (E-9) | Weakening note, or mechanism class? | Mechanism class | **Yes: SEC-2, SEC-3, TEN-1 in .NET** |
| 7 | Portable-layer vocabulary | May a `Mechanism class:` bullet name one stack's artifact? | No, 4 files to edit | No |
| 8 | Three claim-text repairs | A-5, A-6, S-4: rule each yes or no | Yes, yes, yes | No |
| 9 | DEP-1's unclosed gap | What happens when the window and a live advisory do not overlap? | Advisory wins above the 7-day floor | No |
| 10 | The `locus` enum | Two values plus a note, or a three-value enum? | Two plus a note | No |
| 11 | Two candidate claims | Mint, queue, or decline? | Queue in `candidates.md` | No |

**Read rulings 1, 2 and 3 first.** They are the ones that change what a claim file and a conformance row ARE;
everything below them is content inside whatever shape those three settle.

**Taken as recommended, four shipped `proven` rows in `kernel/dotnet-react/` become false**: SEC-2, SEC-3,
TEN-1, TIME-1. Each is named at its ruling with the measurement behind it. None of the four is a newly
discovered vulnerability; each is a guard that is narrower than the row says, and in every case the register
measured it with a control against the running sibling suite.

**Evidence added after this sheet was first written (2026-07-26, from the flow-back pass).** Three findings
landed after the rulings below were drafted and are folded into the sections they bear on, without changing any
recommendation: E-16 into rulings 4 and 6, E-17 into ruling 4, E-18 into ruling 9. Two of those change how a
ruling should be read rather than merely supporting it, and both are called out where they sit:

- **Ruling 9 now contradicts the tree.** The flow-back pass, applying DEP-1 exactly as written, pinned `postcss`
  to a version that clears the window and carries a live advisory. Ruling 9's recommendation is the opposite
  resolution order, so taking it obliges an immediate re-pin. That is a consequence to accept knowingly, not a
  defect in either the pass or the recommendation.
- **Ruling 6's scope is now a live question rather than a settled one.** E-9 named three claims. E-16 is the
  same failure in a fourth, SEC-5, which is not a name-registry claim at all. The recommendation is unchanged;
  what it applies to may be wider than the three claims it names.

Repairs from the same pass have also been carried into the flow-back table below, so that table reflects what is
open today rather than what was open when it was written.

## The warm-up, done: B-4 and the gate that missed it

Not a ruling. Reported because it was a live record defect and it is now closed.

B-4 was cited **seven times across four files** and defined nowhere. The brief's count of two citations in
`kernel/node-react/conformance.json` measures as one, plus one in the README table generated from that row, so
the shipped-artifact exposure is as described and the arithmetic is one row rendered twice.

B-4's substance is a behaviour of running code, so it was re-measured on the edition's pinned `fastify` 5.8.5
under Node 24.13.1, eleven probes in a spike with no edition machinery in it. A body schema closed with
`additionalProperties: false` removes every field it does not name before the handler runs, **at the level that
closes itself and at no other**. Closure at depth 0 and depth 1 bought nothing at depth 2, which rules out
reading the property as covering an object and its children. The entry is written from that measurement and
carries E-10's correction inside it rather than only in the flow-back row.

**One measurement the entry adds.** The strip is a framework default. The same closed schema on an instance
built with `ajv: { customOptions: { removeAdditional: false } }` answers 400 `FST_ERR_VALIDATION` instead of
stripping, and `createApp` spreads caller-supplied server options into the instance. Nothing in the edition
sets, asserts or tests it. The security consequence is nil, since refusal is at least as safe as removal here.
The consequence for ruling 2 is not: S-10 records this edition's remedy on a caller surface as a silent strip,
with an argument for why refusal would be wrong there, and that remedy is a validator default nobody wrote
down.

**The gate.** `tools/docs-lint.mjs` in the shared tier now fails on a finding id that is cited and not defined.
Conditional on the register file and announcing the skip when absent, on the same rule as the catalog check,
because a seeded tree carries the citations without the register. The register is scanned as a citing surface
too, because the dangling id lived there first. The tool names no finding id literally, so it needs no
exemption from its own check. Five proofs: red on an undefined id in edition source, red on one in a
conformance note with the table regenerated, red on one in the register, green with the tree restored in both
editions, and the seeded shape green with `note: the findings register is not present`. Recorded in
`kernel/node-react/VERIFICATION.md` under round 6.

---

# The rulings

## 1. Does a claim file carry edition realizations at all?

**Findings:** S-1, S-9, S-3's accepted drift. **This is one decision, and S-9 is not a separate ruling.** The
brief lists a "quarantine decision" separately; measured against the options, S-9 has no independent content.
It is the discriminator that decides between this ruling's two live options, which is why it is folded in here
and why this ruling is first.

**The question.** Does the catalog's Enforcement section keep a realization field, gain one per edition, or
lose realizations entirely?

**Evidence.**

- S-1, read from source and re-verified: all 69 claim files carry a singular `- Edition:` bullet. MOD-2 is the
  one that broke under the pressure, and it broke worse than S-1 records: it did not gain two bullets, it has
  one `- Edition (.NET):` bullet with `Edition (TS):` written mid-sentence inside it. The schema did not bend,
  it was written around in prose.
- S-3, measured: status lives in three places for 69 claims (the catalog index's `- **Edition (v1):**` lines,
  each edition's `conformance.json`, and 42 claim files' Edition prose), and only one of the three is
  machine-checked.
- S-9, and this is the load-bearing evidence: step 1 of the delta protocol says read the claim file, and the
  claim file hands over the sibling's answer. Measured once as wrong, in E-14: DATA-5's Edition bullet names
  `ValidateOnStart` and the sibling has no options binding of any kind. A step 2 can be pre-misinformed, and
  the writer cannot tell without breaking the quarantine that makes step 2 worth anything.
- **New measurement, and it decides how completable this ruling is.** After the Edition bullet, the residual
  leak is small: a keyword scan over all 69 files finds a stack artifact named in **4** `Mechanism class:`
  bullets (DATA-1, HUM-1, PERF-4, TIME-1) and **5** Weakening-notes sections (AI-3, DATA-2, HUM-1, TEN-1,
  TIME-1). Heuristic, therefore a floor. But it means removing the Edition bullet does not leave a claim file
  still soaked in one stack's vocabulary; it leaves a short, nameable list, and rulings 7 and 8 finish it.

**Options.**

| | What changes | Consequence |
|---|---|---|
| (a) Status quo | nothing | S-9 keeps contaminating every remaining step 2, at 61 unbuilt claims. The bullet stays unchecked by anything, and has been false once already |
| (b) `- Edition (<name>):` per edition | 69 claim files gain a bullet per edition, forever | Fixes S-1's "nowhere to write". Makes S-9 **strictly worse**: a step-2 writer is handed every edition's answer instead of one. Scales as claims times editions |
| (c) Remove realizations from the catalog | 69 claim files lose the bullet; the catalog index loses its 69 `- **Edition (v1):**` lines; `conformance.json` per edition becomes the only realization home | Fixes S-1, S-9 and S-3's residual in one move. No status changes. The realization is then in the one home that a machine already checks |

**Recommendation: (c).** Three reasons, in order of weight. S-9 rules out (b) outright, and (b) is the only
other option that fixes S-1. The realization content is very largely duplicated into `conformance.json`
already, since docs-lint requires a mechanism string on every non-`owed` row and a trigger on every `owed` one,
so (c) mostly removes a copy rather than information. **That second reason is an inference from the lint rule
and not a measurement, and it is marked as one deliberately**: confirming it would mean reading the sibling's
mechanism column for 61 unbuilt claims, which the quarantine forbids and which is a worse trade than the
sentence at risk. The register has been corrected five times for asserting a property of a mechanism it had not
read, so this one is labelled rather than asserted. The third reason is not an inference: the copy (c) removes
is the one nothing checks, and E-14 is a measured case of the catalog describing a mechanism that does not
exist. No lint could have caught it, because a prose sentence in the catalog about another tree is not
checkable from either side.

**How it must be applied, and this is a sequencing constraint that is invisible unless you hold the quarantine
in mind.** Do not reconcile the Edition bullets against the sibling's conformance rows. Reading the sibling's
mechanism column for 61 unbuilt claims to check that nothing is lost would destroy step 2 for every one of
them, which is a far larger loss than any sentence at risk. Apply from the claim file alone: for each bullet,
decide whether its content is claim-level truth (a verified gap, a limitation, a provenance fact) or
edition-level description. Claim-level content moves into Weakening notes or `provenance`, which is where it
belonged. Edition-level content is deleted, and the small risk that a true sentence exists only there is
accepted deliberately, because that sentence is self-reported, unchecked, and has been false at least once.

**Blast radius.** 69 claim files edited. `kernel/claims/README.md` loses 69 index lines and gains a changelog
paragraph. No conformance row in either edition changes status or mechanism. Nothing re-verifies except
docs-lint and the dash scan. The delta protocol's step 1 becomes clean for the 61 unbuilt claims, which is the
whole return.

**Not resolved by this ruling, and named so it is not assumed:** the 5 Weakening-notes leaks and the 4
Mechanism-class leaks. Rulings 7 and 8 take them.

## 2. Does a portable mechanism class have a third part?

**Findings:** S-5, its Phase 2 sharpening (**when**), E-10 (**depth**), S-10 (**remedy**), and B-1 folds in
here rather than into ruling 7. **This is one decision, and A-3 is not part of it**; A-3 is ruling 4.

**The question.** Does the catalog's file schema state that a mechanism class is surface, predicate, **and a
completeness obligation** with three parameters: when the enumeration is taken, how deep the closure goes, and
what happens to an undeclared member?

**Evidence, and this is the best-evidenced finding in the register.** Each parameter was discovered by a
mechanism that stated the obligation, was red-green proven, and was wrong anyway.

| Parameter | How it was found | Measured? |
|---|---|---|
| the obligation itself | Fastify has no free route enumeration; .NET's `EndpointDataSource` gives one, and no claim says so | measured, Phase 1 spike, both directions probed |
| **when** | the recorder sat on the registration path and a later `onRoute` hook rewrote a route after the snapshot: the table read `/decoy` while the server served `/admin/impersonate`, no test failing | measured, Phase 2 audit, 13 evasions |
| **depth** | the closure obligation was bought at level zero; an open nested object delivered `author.tenantId` to the handler with the scan silent | measured, round 4 audit, 8 evasions |
| **remedy** | two closed surfaces in one edition have opposite correct behaviours on an undeclared member: strip for a caller, refuse for an operator | measured, round 2, and see B-4 above for the new evidence that the remedy is a default nobody asserts |

**Options.**

| | What changes | Consequence |
|---|---|---|
| (a) Status quo | nothing | Every future edition rediscovers three parameters one at a time, each by shipping a guard that is wrong. That is now the measured history of four rounds |
| (b) Schema only | `kernel/claims/README.md`'s file schema gains the third part; no claim file changes yet | Cheap. Nothing in the catalog states an obligation, so nothing re-verifies and no status changes. The obligation binds the next builder rather than the current record |
| (c) Schema plus the 8 built claims | the schema, plus a written obligation in SEC-1, SEC-2, SEC-3, TEN-1, CFG-1, SEC-5, DATA-5, TIME-1 | Honest where evidence exists. **Falsifies two shipped rows** (below) |
| (d) Schema plus all 69 | every claim gains an obligation | Writing a completeness obligation for a claim nobody has built is guessing, and guessing is exactly what put a false mechanism in DATA-5's Edition bullet. Not recommended at any price |

**Recommendation: (c).** The schema addition is free and the eight built claims are where the evidence is. The
remaining 61 gain their obligation at the pass that builds them, which is also when the edition can actually
show its enumeration cannot miss a member: an obligation written in advance of a mechanism is an aspiration,
and the catalog exists to kill those.

**Blast radius, and this is the sharp one.**

- **`kernel/dotnet-react/` SEC-2 `proven` becomes false.** E-6 measured, from source and by lifting the
  reflection code into a throwaway host: `BindableMemberNames` yields a type's own properties and constructor
  parameters and descends into nothing, and `ContractShapeTests` enumerates only `*Request`-suffixed types.
  Under a depth parameter, both guards state the obligation at one level and neither meets it. The row was
  already rewritten in the flow-back pass to say both guards are flat, and the status was left at `proven`
  deliberately, with the note that lowering it "belongs to the owner". This ruling is where that lands.
- **`kernel/dotnet-react/` TIME-1 `proven` becomes false.** E-15 measured with a control: `TimeTypeTests` scans
  Contracts, App and Persistence and not `Kernel.Api`; a naive `DateTime` on a public type in `Kernel.Api`
  leaves 49 of 49 green and the identical type in `Kernel.Contracts` turns the suite red. A stated surface with
  a completeness obligation cannot omit an assembly silently.
- `kernel/node-react/`: SEC-1, SEC-2, SEC-3 and CFG-1 already carry the obligation with all three parameters
  mechanized and red-green proven, so all four rows survive. That asymmetry is uncomfortable and it is what the
  evidence says.
- Re-verification owed: both editions' `conformance.json` and generated tables, and the .NET suite re-run to
  confirm nothing else moves. The .NET suite runs here (49 of 49, SQLite substituted, no Docker), which the
  register spent three passes wrongly believing it could not.

## 3. Does a conformance row hold one status, or one per obligation?

**Finding:** S-8. **Separate from ruling 1, and the brief's hypothesis collapses them.** Ruling 1 is about the
catalog's claim files; S-8 is about the edition's conformance record, which is edition property. They are
answered in different files by different mechanisms. One of S-8's candidate repairs (splitting a claim) is a
catalog decision, which is why it appears as an option here rather than as a separate ruling.

**The question.** Does a claim with separable obligations get one status word, a fifth word, a per-obligation
list, or a split into separate claim ids?

**Evidence.**

- Measured at 4 of 5 in the node edition: SEC-5, DATA-5, TIME-1 and TEN-1 all sit at `owed` with a built,
  red-green-proven half. P-2 pre-registered this before the round and named the halves from the claim text.
- **New measurement, and it is the strongest evidence for this ruling because it predates the second edition
  entirely.** In `kernel/claims/README.md`'s own index, **9 of the 33 non-`owed` rows already escape the
  four-word vocabulary in prose**, writing a second status inside a parenthetical: TEN-2, TEN-4, SEC-4, SEC-5,
  SEC-6, TIME-1, UI-4, DEP-1, AI-2. The same workaround appears in 5 claim files' Edition bullets. The catalog
  has been working around this defect for 27 percent of its realized claims since before anyone named it.
- The register's own argument against raising TEN-1 from `owed` is sound and survives: `patterned` is defined
  as per-seam and TEN-1 declares `centralized`, so taking it would misreport the locus to fix the status.

**Options.**

| | What changes | Consequence |
|---|---|---|
| (a) Status quo | nothing | 66 of 69 node rows read `owed` and a reader cannot tell which are nothing and which are most of the way. `owed` has a definition and is being overloaded, which makes every other `owed` row ambiguous |
| (b) A fifth word | `conformance.mjs`, both records | Adds a word that means "some of it", which is the ambiguity being complained about, wearing a name |
| (c) Per-obligation rows | `conformance.json` schema gains an optional obligations array with a status each; `conformance.mjs` validates and renders it; both README tables regenerate | The tally becomes honest. 9 .NET rows and 4 node rows gain structure they already carry in prose. Nothing is falsified; prose becomes machine-readable |
| (d) Split the claims | new claim ids; old ids deprecated in place | Collides head-on with the catalog's append-only claim-identity rule: splitting TEN-1 mints new ids and deprecates TEN-1, and every provenance chain in every seeded project that cites TEN-1 now cites a deprecated id. The rule exists precisely so a decision citing a claim cites a meaning that cannot shift |

**Recommendation: (c).** (d) is ruled out by the catalog's own identity rule rather than by preference, and (b)
does not solve the problem it is aimed at. (c) is the only option under which the tally at the top of a
generated table stops lying by summation, which is the same failure the four-state split was minted to fix at
the previous level.

**Blast radius.** `kernel/shared/tools/conformance.mjs` (schema, validation, renderer) plus a compose run; both
editions' `conformance.json`; both generated tables. Red-green proofs owed on the new validation paths, in the
discipline the existing eight docs-lint failure modes already follow. No claim file changes. No status becomes
false; 13 rows become more precise than the word they currently carry.

**One thing to decide inside this ruling.** Does an obligation-bearing row still carry a single roll-up status
for the tally, and if so, is the roll-up the weakest obligation? Recommendation: yes, and yes, weakest wins,
because the conservative direction is the one a security claim should read in and it preserves every existing
row's meaning unchanged.

## 4. Is a relationship between two mechanisms part of the claim?

**Findings:** A-3, sharpened by E-11. **Split out of the brief's "mechanism-class decision" deliberately.** It
is a different field from ruling 2: ruling 2 adds a part to one mechanism's description, this adds an
obligation about the join between two.

**The question.** Where a claim names two mechanisms and asserts a relationship between them, does the
relationship become a stated part of the claim, with the edition owing evidence for it?

**Evidence.**

- A-3, reasoned then built: SEC-1 calls its fallback "the belt to the scan's braces", and in .NET the
  independence is free from the build-time/runtime split. In Node the naive realization produces one mechanism
  wearing two names, and the claim's explicit demand for a test that the fallback "actually denies anonymous
  callers" becomes unsatisfiable by construction. Independence had to be re-bought, by splitting on what each
  mechanism consults rather than when it runs.
- **E-11, measured with a control, and it is the sharper half.** SEC-5 names two mechanisms and asserts nothing
  about their independence. `Jwt:Key` committed in plaintext to `appsettings.json` leaves all 49 sibling tests
  green and the CI secret scan silent. Both mechanisms miss the same input for two unrelated reasons: a
  containment predicate running the wrong way, and a case-sensitive grep against a PascalCase convention.
  **Independence of mechanism is not independence of blind spot**, and no claim in the catalog says so.
- **E-16, and it makes E-11's count three rather than two.** Repairing the grep found a third blindness
  independent of the other two: the pattern required the key term to be followed by a separator, and in JSON the
  next character is a quote, so the match never started. The CI half of SEC-5 could not see a secret in any JSON
  file in either edition, under any spelling, in any case, which is the format `appsettings.json` is written in.
  Three independent defects in one pair of mechanisms, all missing the same input, none of them visible to the
  other. Whatever "independence" a claim asserts between two mechanisms, this is the measured floor of what it
  is worth without evidence.
- **E-17, and this is the only in-tree instance rather than an injected one.** The repaired scan's first run
  found `public const string JwtKey = "kernel-architecture-tests-symmetric-signing-key-0123456789"` committed in
  `KernelApiFactory.cs`, a real credential-shaped literal in a tracked file that four rounds of reading had
  walked past. **Three** mechanisms should have had an opinion and none did: `SecretConfigShapeTests` scans only
  JSON under `src/`, and the CI grep was blind for the three reasons above. It is not a vulnerability, it is a
  test-harness constant that must be committed, and it is now allowlisted with that reasoning written out. What
  it demonstrates for this ruling is the joint gap: each mechanism's scope is defensible alone, and the union of
  the scopes was assumed to be total by nobody in particular.
- The cross-claim case, from round 2: CFG-1's mechanism class ends by delegating its two right homes to SEC-5
  and DATA-5, so CFG-1's enforcement is complete only if two other claims are realized, and a conformance
  record that is one row per claim has nowhere to say it. Measured as unremarked in the sibling, where all
  three read `proven` and the composition holds by accident of scheduling.

**Options.**

| | What changes | Consequence |
|---|---|---|
| (a) Status quo | nothing | An edition can satisfy both named mechanisms and have one blind spot, which is the measured E-11 outcome |
| (b) Within a claim only | the file schema states that an asserted relationship is part of the claim; the edition owes evidence for the relationship, not only for each mechanism | Applies today to SEC-1 and SEC-5. Cheap and bounded |
| (c) Within and across claims | plus a dependency field, so CFG-1's row can say it rests on SEC-5 and DATA-5 | Needs a new field in `conformance.json` and a check that a claim is not `proven` while a claim it depends on is `owed`. Real value and real build cost, and it interacts with ruling 3's schema change |

**Recommendation: (b) now, (c) deferred to `candidates.md`.** (b) is a schema sentence plus two claim edits and
it lands the measured finding. (c) is a good idea with one witness and a build behind it; the register's own
standard is that one instance is not a pattern, and the cross-claim case has exactly one.

**Blast radius.** SEC-1 and SEC-5 gain a sentence each. No status changes: E-11's actual defects are flow-back
to the sibling (a `key` whole-word entry and an `-i` on a grep), not catalog defects.

## 5. Does TEN-1's mechanism class gain the header surface?

**Finding:** A-2. Its own ruling because of what it does to a shipped row.

**The question.** TEN-1's statement names four surfaces and every mechanism in the catalog reaches three. Does
the mechanism class gain a mechanism for the fourth, or does the statement drop it?

**Evidence, measured on both sides.** The Node edition covers headers with a strip in the composition root,
red-green proven, and the round 4 audit then found the strip itself was overstated: `X-TenantId` and `X-OrgId`
walked past it over real HTTP until the concatenated spellings were added. The sibling was measured against a
real ASP.NET host: `EndpointSpineTests.ParameterNames` reads route-pattern parameters and handler parameters
and consults no binding-source attribute, so `[FromHeader] string tenantId` is caught incidentally by TYPE,
`[FromHeader] TenantKey tenantId` where `TenantKey : IParsable<TenantKey>` is not, and a header read ad hoc off
`HttpContext` is not caught at all. The same audit found the query surface is holed by the same type
predicate, so the honest tally is route total, query type-dependent, header type-dependent and only when
declared, body separate.

**Options.** (a) status quo; (b) the mechanism class gains a non-scan mechanism for the header surface, and the
statement is unchanged because it was right; (c) the statement drops the header surface to match the
mechanisms.

**Recommendation: (b).** (c) is the wrong direction on the catalog's own terms: TEN-1's harm paragraph is
horizontal privilege escalation by parameter tampering, and a header is a parameter. A claim that narrows its
statement to match a mechanism that was never built is the aspirational-claim failure run backwards.

**Blast radius, stated plainly.** **`kernel/dotnet-react/` TEN-1 `proven` becomes false.** The sibling has no
header mechanism; the incidental type-based catch is not one, and the query hole is in the same predicate. The
flow-back pass already rewrote TEN-1's .NET row note to say the query half is type-dependent and the header
surface is checked by nothing, and left the status at `proven` on the argument that no endpoint currently
exposes a tenant parameter. That argument is about the current tree, not about the mechanism, which is
precisely the distinction E-4 names. `kernel/node-react/` TEN-1 is `owed` and unaffected until ruling 3 gives
it somewhere honest to sit.

## 6. Is the predicate's comparison part of the mechanism, or a weakening note?

**Finding:** E-9. Its own ruling because the two answers have very different blast radii.

**The question.** Three claims (SEC-2, SEC-3, TEN-1) describe their shared mechanism's weakness in terms of the
registry's CONTENTS and none says anything about the COMPARISON. Does the comparison become part of the
mechanism class, or a sentence in the weakening notes?

**Evidence, measured, and the register has corrected itself on this twice.** The sibling matches by
case-insensitive equality, so `emailAddress` walks past `email` and `noteStatus` walks past `status`. The Node
edition matches by tokenized run, and the round 4 audit measured that the two matchers are **incomparable, not
ordered**: tokenizing loses to equality on every all-lowercase concatenation, and `firstname`, `lastname`,
`dateofbirth`, `tenantid`, `orgid` and `organisationid` all walked past the Node matcher while being
hand-enumerated in the sibling's list. A third class was then found by running inputs rather than reasoning
about them: `e_mail`, `e-mail`, `EMailAddress`, `mail`, `emails` and `email1` escape both. Six inputs, all
carrying an email address, all past a list whose first entry is `email`.

**E-16, added after this ruling was drafted, and it is the same failure in a claim this ruling does not name.**
SEC-5's CI secret scan matched `(password|secret|...)` followed by optional whitespace and a separator. In JSON
the character after the key term is a quote, so the match never started, and the scan was blind to
`{ "password": "..." }` in every JSON file in both editions, under any spelling and any case. That is not a
registry-contents failure and it is not novelty; it is the comparison failing on the way the surrounding format
spells a name, which is precisely this ruling's subject. It arrived from a fourth claim, and SEC-5 is not a
name-registry claim in the sense SEC-2, SEC-3 and TEN-1 are.

**What that does to the ruling, stated and not decided.** The recommendation below is unchanged. Its SCOPE is
now an open question the sheet did not previously have to answer: option (b) as written amends three mechanism
classes, and the evidence now says the property belongs to any mechanism that matches a name against a list,
which is a larger and less enumerable set. Ruling it for three claims lands the measured findings and leaves
SEC-5 carrying the same defect with no stated obligation. Ruling it generally is a sentence in the schema rather
than in three claims, and it interacts with ruling 1. Neither is proposed here; the choice is flagged because
E-16 is what made it a choice.

**Options.**

| | What changes | Consequence |
|---|---|---|
| (a) Weakening notes | three claims gain a sentence naming morphology as the failure that occurs | Costs nothing. Changes no status. Also enforces nothing, and a weakening note is by definition not a mechanism |
| (b) Mechanism class | the three mechanism classes state that the comparison resolves compounds, concatenations and decompositions of a listed word, and the edition owes evidence | **Falsifies three shipped `proven` rows** (below). It is also the only option under which an edition cannot satisfy all three claims with equality matching |

**Recommendation: (b).** The finding's whole point is that an edition can satisfy every word of all three claims
with a matcher that fails on the most common naming convention in its language, and that the second edition
then did exactly that in the opposite direction while its own comment claimed otherwise. Answering that with a
weakening note leaves the property unenforced in both editions and records the failure as if it were an
accepted limit, which it is not: both editions repaired it once it was measured.

**Blast radius.** **`kernel/dotnet-react/` SEC-2, SEC-3 and TEN-1 `proven` all become false**, because
`hashSet.Contains(name.ToLowerInvariant())` is equality and does not resolve any of the three morphological
classes. The flow-back pass widened `ForbiddenTenantParams` with `workspace` and `account` and their compounds,
which is enumeration standing in for a comparison and does not meet a stated comparison obligation.
`kernel/node-react/` SEC-2 and SEC-3 hold, with their false positives asserted as passing tests. Note the
overlap with rulings 2 and 5: rulings 2, 5 and 6 name six falsified rows between them and they are four
distinct rows, SEC-2, SEC-3, TEN-1 and TIME-1.

## 7. May a `Mechanism class:` bullet name one stack's artifact?

**Findings:** B-3 (HUM-1 names CODEOWNERS and branch protection), B-5 (TIME-1 names assemblies and reflection
over them). B-1 is deliberately NOT here: its leak is free enumeration, which ruling 2 answers.

**The question.** Does the file schema state that the portable layer names no artifact, type, tool or
convention belonging to a particular stack, and are the current instances repaired?

**Evidence.** A keyword scan over all 69 claim files finds a stack artifact named in exactly **4**
`Mechanism class:` bullets. Heuristic, so a floor:

| Claim | What it names | Status |
|---|---|---|
| HUM-1 | `CODEOWNERS` entries plus branch protection | B-3, recorded, not yet biting because both editions target GitHub |
| TIME-1 | "reflecting over domain, contracts, application, and persistence **assemblies**" | B-5, and the register calls it more blatant than B-1 because it names the packaging unit of one runtime outright |
| DATA-1 | "no endpoint or host type references a store implementation or **DbContext**" | The register's seeded hypothesis, listed as "expected trivially neutral" and never tested, because DATA-1 is unbuilt in Node |
| PERF-4 | "banned-API lint scoped to server **assemblies or modules**" | New here. Already hedged with "or modules", which is the repair half-done by someone who noticed |

**Options.** (a) status quo; (b) the schema states the rule and all four are repaired now; (c) the schema states
the rule and each claim is repaired when next built.

**Recommendation: (b) for HUM-1, TIME-1 and PERF-4, (c) for DATA-1.** The first three have a portable content
that is already known and stateable: irreversible surfaces have named human owners and a change cannot merge
without them; the ban covers every layer where a time value is declared or persisted; the lint is scoped to the
server's own code. DATA-1's portable content is dependency direction and the substitution for `DbContext` is
"a persistence context or store implementation", which sounds easy and is precisely the kind of translation the
register has been wrong about four times when it was done from an armchair rather than from a build.

**Blast radius.** Three claim files edited, one deferred. No status changes anywhere: this is vocabulary, and
both editions' mechanisms are unaffected by how the bullet is worded. It does interact with ruling 5, since
TIME-1's bullet is being rewritten there too; do them in one edit.

## 8. Three claim-text repairs, each yes or no

Individual, as the brief suspected, and each is small enough to rule in a line. None changes a status in either
edition.

**8a. A-5: TIME-1 fuses two independent properties.** Measured on the pinned runtime: a JS `Date` is
milliseconds since the epoch, so `new Date('2026-07-26T10:00:00+10:00')` and `new Date('2026-07-26T00:00:00Z')`
are the same value, and the originating offset is discarded at parse with no accessor for it. So it is not the
forbidden type (it carries none of the ambiguity TIME-1's harm paragraph is entirely about) and not the
permitted one (it is not offset-aware). "UTC-anchored offset-aware" is two properties, unambiguity and offset
retention, that `DateTimeOffset` supplies together and that a second stack has one of.
**Recommendation: yes.** The statement names the two properties separately and says what each buys. The
weakening note already gropes toward it by observing that a fixed offset is not a zone; the same sentence one
step earlier is that an instant is not an offset. `kernel/dotnet-react/` TIME-1 satisfies both and is
unaffected by this repair, though it is falsified by ruling 2 for an unrelated reason.

**8b. A-6: CFG-1 names three homes and this stack has four.** Measured on both sides, with the prediction
written before the sibling was opened. `process.env.PORT ?? 5080` is not a literal in code, so the literal
registry cannot see it; it is not committed configuration, so it escapes config review and per-environment
variation; and the `??` is a silent default of the kind DATA-5 forbids one claim over. It shipped in
`kernel/node-react/server/src/main.ts`. The sibling does not have the problem, for the reason predicted before
looking: .NET's default configuration builder includes an environment-variable provider, so an env read arrives
through the config system with a declared key.
**Recommendation: yes.** CFG-1 names the ambient process environment as a fourth home and rules that it is
closed by bringing it inside the config system rather than by banning it, since overriding a setting at deploy
time is legitimate and a ban would be routed around. Both editions' CFG-1 rows stay `proven`.

**8c. S-4: CON-2's mechanism carries an unstated precondition.** CON-2 rules that a mirrored corpus is pinned
by "physically the same file" and explicitly rejects two copies plus a test. The kernel's own shared tier
cannot obey it: two edition trees that must each be independently copyable at instantiation cannot share a
physical file, because whichever tree does not own it holds a path that breaks the moment it is copied. The
mechanism encodes a precondition it never states, that both consumers live under one root that travels
together.
**Recommendation: yes**, in the weakening notes rather than the statement. The statement is right where its
precondition holds; the weakening note names the precondition and names the sanctioned alternative (one
authoritative source plus a materializer with a drift check), which is what `kernel/tools/compose.mjs` already
is. .NET CON-2 stays `proven`.

## 9. What happens when the cooling-off window and a live advisory do not overlap?

**Finding:** E-3's explicitly unclosed half. The window pass ruled the number and recorded that it did not
close the gap.

**9a. The missing rule.** DEP-1 gives no rule for the case where no available version satisfies both the window
and a live advisory. Measured, and no longer hypothetical at the time it was found: at 90 days, the `vite`
advisories GHSA-fx2h-pf6j-xcff and GHSA-p9ff-h696-f583 cover `vite` <= 6.4.2 and the only vite 6 release
clearing them is 6.4.3, published 2026-06-01, inside the window. At 30 days the instance dissolves and the rule
is still absent.

**E-18, measured after this ruling was drafted, and it changes what two of the four options mean.** Executing
the client bump at the shortened window reproduced the conflict immediately, in a different package.
`postcss` is reached transitively through `vite` and carries GHSA-r28c-9q8g-f849: 8.5.15 (2026-05-19) clears the
30-day window and carries the advisory, and the first release clearing the advisory is 8.5.18 (2026-07-12),
inside it. No version satisfies both, at a window that had just been shortened specifically because the previous
conflict was believed to be a function of its length. **It is not.** A window of any length can fail to overlap
the set of releases clearing a live advisory; shortening it changes the odds and not the shape.

Three consequences, each bearing on a different option:

- **Option (iv) is not neutral, and the measurement is the reason.** Left to npm's own resolution the tree
  landed on postcss 8.5.16 (2026-06-28): inside the window AND still vulnerable, the one outcome satisfying
  neither rule. That is structural rather than unlucky. A resolver maximizes version subject to a semver range
  and has never heard of either constraint, so what it picks is uncorrelated with both, and uncorrelated is
  frequently worse than either rule taken alone. "Decide each time" therefore has a default, and the default is
  the worst available answer.
- **Option (ii) is what the tree does today**, and it was chosen deliberately by the flow-back pass on the
  grounds that it is the rule DEP-1 actually states. postcss is pinned to 8.5.15 through an `overrides` entry in
  the shared tier, with the advisory left open and NAMED in both editions' `VERSIONS.md` rather than a stated
  rule being broken silently. **Recommending (i) therefore obliges an immediate re-pin to 8.5.18**, which is
  inside the window, and that is a consequence to accept knowingly rather than a contradiction to resolve later.
  Revisit date if nothing is ruled: 8.5.18 clears the window on 2026-08-11.
- **The conflict has nowhere to be recorded, whichever option wins.** DEP-1's ledger is per DIRECT dependency
  and postcss is transitive, so under the claim as written it is owed no row. Any option that ends "and ledger
  it as an accepted risk" needs somewhere to put the row. E-4 repaired the ledger CHECK to key on name and
  version together; this is the same defect one level out, in the claim rather than the checker, and it is the
  one part of 9a that no option below currently addresses.

Options: (i) the advisory wins, above the 7-day hard floor, by explicit owner decision with a ledger row; (ii)
the window wins and the known-vulnerable pin is ledgered as an accepted risk; (iii) change component; (iv) no
rule, decide each time.
**Recommendation: (i).** DEP-1 already contains this exact shape and reasoning for the neighbouring case: the
carve-out below the floor for a patch release addressing a published advisory, on the stated grounds that
remaining on a known-exploited version is the larger risk. Extending the same reasoning one step is a sentence,
not a new policy, and it keeps the 7-day floor as the thing that never bends. (iv) is what happens today and it
produced an edition improvising in a scaffolding change.

**9b. The R12 tension, which the window ruling reopened.** The 90-day value came from invariants pass R12 with
the reason "the former 30-day default contradicted the owner's standing 90-day policy". That standing policy
lives outside this repo and is unchanged, so reverting to 30 recreates R12's contradiction in the opposite
direction, and a future invariants pass reading only R12's reasoning would flip it back.
Options: (i) the standing policy moves to 30; (ii) DEP-1 records that the catalog's number is deliberately
independent of any standing policy outside the repo.
**Recommendation: (ii)**, and it is the more durable of the two whichever way the number goes, because it stops
the next pass re-deriving the number from a document the catalog cannot see.

**9c. DEP-2's trigger, ruled here because it shares the evidence.** DEP-2 is `owed` with the trigger "the first
armed CI loop (TEST-3 at instantiation)". E-3's argument: that is defensible as scheduling and wrong as risk,
because the advisory exists now, in a shipped kernel, and the trigger defers the only mechanism that would
report it until someone instantiates a project. A trigger is supposed to name the event that makes a claim's
mechanism buildable, not the event that makes its absence noticed.
**Recommendation: change the trigger** to the next edition build pass. The mechanism is an advisory sweep over
the pinned set, which is buildable today in the shared tier with no instantiation and no third-party action;
the register records that both editions independently declined to import a scanner and wrote their own grep,
so the precedent for building rather than importing is already set.

**Blast radius for all of 9.** DEP-1's statement gains one sentence and its weakening notes gain one; DEP-2's
trigger changes in both editions' conformance rows. No status changes: a shorter window is strictly more
permissive and every existing pin still clears it.

**Corrected 2026-07-26: the client bump is no longer queued, it is done.** This paragraph previously read that
the `kernel/shared/client-web/` bump "stays queued" and should be re-planned against the 30-day window. The
flow-back pass re-planned and executed it: 14 advisories with 1 critical are now 1 root advisory with 0
critical, verified in both editions. The single remaining advisory is the postcss instance described above, and
it is open by decision rather than by omission. Ruling 9 is therefore no longer about work that has not started;
it is about whether the resolution order the pass chose was the right one, with the tree already in that state.

## 10. Two values plus a note, or a three-value enum?

**Finding:** S-2.

**The question.** `locus` is documented as an enum and realized as prose. Re-measured: 22 distinct values, 49
exactly `centralized` or `per-seam`, 20 qualifying in prose (for example `centralized restriction, per-seam
crash proof`, `centralized declaration, per-queue test`, `centralized (import ban) + per-seam (one smoke line
per primary flow)`). Splitting on the leading word gives the 55/14 tally the catalog quotes, so the prose is
being read as an enum by eye and has held.

**Why it matters now rather than as tidiness.** A class C finding is the assertion "this claim declares
centralized and the second stack reaches only per-seam", and that comparison cannot be made mechanically
against a prose field. Worth recording alongside: **after eight built claims, class C is empty.** Every class C
hypothesis the build carried has been refuted, several by inversion. That is a real result about the catalog
and it is invisible in the register's structure because a refuted hypothesis has no finding id.

**Options.** (a) status quo; (b) `locus` becomes two values and a free-text `locus_note` carries the
qualification; (c) a three-value enum admitting `hybrid`.

**Recommendation: (b).** The 20 qualified values all lead with the word the catalog already reads as the enum,
so (b) loses nothing and (c) discards that leading word by flattening 20 distinct hybrids into one bucket. (b)
is also the only option that makes a docs-lint check possible, which is what turns class C from an eyeball
judgement into an assertion.

**Blast radius.** 20 claim files' front matter; `kernel/claims/README.md`'s schema section; a new docs-lint
check with a red-green proof, gated on the catalog being present in the same way the completeness check
already is. No status changes.

## 11. Two candidate claims: mint, queue, or decline?

Both are nominated by findings that explicitly ask whether they should become claims. `record/candidates.md`
exists for exactly this and holds new claims queued to graduate.

**11a. From S-7: the shared tier has no mechanism that detects a stack-specific assumption inside itself.**
Three instances were found (the DEP-1 manifest paths, HUM-1's PascalCase fragments, MET-08's lockfile paths),
each by a second edition tripping over it, so the count of remaining instances is unknown and the discovery
cost is one edition each. The candidate mechanism is named and unbuilt: run the shared tools against a
synthetic minimal edition fixture in CI, so a new hardcoded path fails on the fixture rather than on the next
real stack. The catalog applies "a mechanism must be enforced, not intended" to product code and the kernel's
own shared tier is the one place it is not applied to itself.

**11b. From E-5 and its second instance: a scan cannot be run over the file that declares its own predicate.**
Two instances now, in mechanisms with nothing in common except that both are scans with a registry: the
conformance generator broke on the README sentence documenting its own markers, and the configuration scan
reported its own exemption list and its own registry file. The register's own closing standard was "one
instance is not a pattern yet"; there are two.

**Recommendation: queue both in `record/candidates.md`, mint neither today.** Both are real and neither has the
evidence a mint needs under this catalog's own bar: 11a names a mechanism nobody has built, and minting a claim
whose enforcement does not exist is the aspirational-claim failure; 11b has two instances and both are inside
this repository's own tooling rather than in a product, so its generality is asserted and not measured.
Queueing costs nothing, keeps the evidence attached, and the next edition build is the thing that would settle
both.

---

# Not in scope, carried forward

## Flow-back debt: E-class findings against `kernel/dotnet-react/`

Edition defects, not catalog decisions. Listed with a severity read and no ruling asked for.

| Finding | Claim | Severity read |
|---|---|---|
| **E-11** | SEC-5 | **Repaired in the flow-back pass**, both halves, red-green proven with a control. See the escalation below, kept because it records what was true for four rounds |
| E-12 | SEC-5 | High, **deferred with a stated reason**: it touches the secret-provisioning path and the integration tier that needs Docker, which is down, so the repair could only have been made from source and unproven. Still open |
| E-7 | SEC-1 | Repaired in the flow-back pass, both halves, red-green proven. Closed |
| E-15 | TIME-1 | High. **Ruled: the governance hold ends.** TIME-1's completeness obligation now requires the layer set to be derived from a checkable rule, and the .NET row reads `owed` with the omitted layer as its own obligation. The one-line repair is still owed and now carries a trigger instead of a hold |
| E-6 | SEC-2 | **Repaired in part**, red-green proven with a flat-walk control: the composed-host scan now recurses. `ContractShapeTests` is still flat, because repairing it would have burned MOD-2's delta pass. The residual is a contract type carrying no route, which cannot be posted to and is caught by the host scan the moment it gains one. The SEC-2 mechanism string names the narrower basis rather than describing the repair as complete |
| E-2 | SEC-2, SEC-3, TEN-1 | High, **deferred and blocked**. Its own argument is that one predicate cannot serve SEC-2 and SEC-3/TEN-1 at once, so the fix is a split, and SEC-3 awaits ruling 6 |
| E-1 | DEP-1 | Medium-high. The CI toolchain floats on mutable major tags with no ledger row, inside the loop that gates every other claim |
| E-3 | DEP-1, DEP-2 | **Executed.** 14 advisories with 1 critical are now 1 root advisory with 0 critical, verified in both editions. The residual is the postcss instance under ruling 9, open by decision. The catalog gap E-3 named is NOT closed and is sharpened by E-18 |
| E-13 | CFG-1 | Medium, **deferred with a measured reason**: both editions' issuer and audience are the six-character literal `kernel`, below any workable length floor, so the mechanism would ship green with the recurrence it exists to catch still unguarded |
| E-14 | DATA-5 | Medium. The `Edition:` bullet names a mechanism the edition does not have. Ruling 1 deletes the bullet, which closes the record defect without touching the mechanism, which satisfies the class |
| E-8 | SEC-1 | **Repaired**, keyed by method and pattern with a required justification. An anonymous POST on an allowlisted path, a stale entry, and an empty justification are each proven red separately. Closed |
| E-4 | DEP-1 | Repaired in the shared linter, red-green proven, and it immediately caught three unledgered client pins. Closed |
| E-5 | (tooling) | Repaired. Closed |
| E-9 | SEC-2, SEC-3, TEN-1 | Partly repaired in the flow-back pass. **Ruled (6), at the wider scope E-16 argued for:** the comparison is a schema rule over any name-matching mechanism, plus a written obligation in four claims. All three .NET rows now read `owed` with a comparison obligation that reads `owed` beside a predicate obligation that reads `proven` |
| E-10 | (node edition) | Repaired in `kernel/node-react/`, eight evasions refused at boot with permanent tests. Closed |
| E-16 | SEC-5 | **Repaired.** The CI grep could not match a quoted key, so it was blind to every JSON file in both editions. Replaced by `kernel/shared/tools/secret-scan.mjs`, whose `--self-test` asserts eleven positive and thirteen negative controls before the scan runs, so the scan's extent is asserted in the same artifact as the scan. Bears on rulings 4 and 6 |
| E-17 | SEC-5 | **Resolved by allowlisting, with the reasoning written out.** A committed test-harness signing key in `KernelApiFactory.cs`, found by the first run of the repaired scan, not injected. Not a vulnerability: it signs an in-process test host and must be committed for the same tests to mint and verify. Bears on ruling 4 |
| E-18 | DEP-1, DEP-2 | **Ruled and executed (9a).** The advisory outranks the window above the 7-day floor; postcss re-pinned 8.5.15 to 8.5.18, first advisory-rule ledger row written in both editions, `npm audit` 0 vulnerabilities. The general point survives the fix and is now in DEP-1: deciding nothing is not neutral, because a resolver picks a version uncorrelated with both rules |

**Escalation: E-11.** A plaintext signing key committed to `appsettings.json` leaves **all 49 architecture tests
green and the CI secret scan silent**, measured with a control. Both of SEC-5's mechanisms miss it, for two
independent reasons that are each one character wide: `SecretConfigShapeTests` matches
`SecretShapedKeys.Any(k => leafKey.Contains(k, OrdinalIgnoreCase))`, and the leaf key `Key` is shorter than
every entry that would describe it, so the containment runs the wrong way; and the CI grep carries no `-i`
against a platform whose configuration convention is PascalCase, which is also why the workflow's own
`MSSQL_SA_PASSWORD` literal sits in a scanned file and is invisible. SEC-5 reads `proven`.

This is not adjudication and it should not wait for one. The two changes are: add `key` as a whole-word entry
to the sibling's key list, and add `-i` to the grep. Both are one-character-scale edits to mechanisms that
already exist, both are red-green provable against a suite that runs here, and until they land the kernel ships
a secret-detection gate that cannot detect its own principal development secret. It is listed under flow-back
because that is where it belongs procedurally, and it is called out here because a table row is the wrong
weight for it.

**Landed 2026-07-26, and the escalation is kept rather than deleted**, because it records what was true of a
shipped kernel for four rounds and because what the repair then found is the argument for having escalated it.
Both mechanisms are repaired and red-green proven with controls. The two one-character edits named above turned
out to be insufficient on their own: E-16 found a third blindness that neither described, and the containment
predicate was replaced by token matching rather than extended. The grep was replaced outright rather than
patched, on the grounds that a regex inside a YAML `run:` block cannot be executed by the person editing it and
its green is indistinguishable from a pattern matching nothing. The first run of the repaired scan found E-17.
No secret was ever committed to `appsettings.json`: that file carries `Jwt:Issuer` and `Jwt:Audience` only, and
E-11 was demonstrated by injection throughout.

## Also open, and not adjudication

The E-3 client bump, the .NET integration tier, `scripts/e2e.sh`, the UI-5 smoke, and CI never having executed
on GitHub. Named so their absence from the rulings above is deliberate rather than an oversight.

## Sixty-one claims owed a step 2, and no longer do (corrected 2026-07-27)

**The heading above was false in both of its halves and is kept so the correction is legible.**

It was false in arithmetic. 36 of those 61 claims are `owed` in the .NET edition too. A delta is the difference
between two realizations, so where there is no sibling realization there is nothing a step 2 could be measured
against; those 36 could never have owed one.

It was false in kind. The delta protocol's research phase was closed by the owner on 2026-07-27, so the debt it
describes no longer exists for any of the 61. `record/delta-log.md` carries the closure and the reason: step 2
buys falsifiability for FINDINGS, and the remaining work is planting violations against guards, which is
falsifiable on its own terms.

What the paragraph got right is worth keeping, because it is why this pass ran before another build round: 9 of
33 non-`owed` rows in the catalog's own index escaped the status vocabulary in prose, 4 of 5 built claims with
separable obligations could not be honestly statused, and every further round re-injured itself on the same
defect. Rulings 1 and 3 are what make a round's result recordable, and the round that followed proved it twice
over, once by lowering HUM-1 and TEST-3 onto per-obligation arrays whose weakest half is `owed` (E-23, E-24).

# If the rulings land

In this order, and nothing else:

1. Apply the edits to `kernel/claims/`, ruling by ruling, applying ruling 1 from the claim files alone and
   never reconciling against the sibling's mechanism column.
2. Record the pass as a dated paragraph in `kernel/claims/README.md`'s changelog, in the voice of the existing
   entries, naming the evidence.
3. Update every affected conformance row in both editions, and state plainly in the changelog which shipped
   `proven` rows the pass made false. On the recommendations above that is SEC-2, SEC-3, TEN-1 and TIME-1 in
   `kernel/dotnet-react/`.
4. Update `record/edition-findings.md` in place: each ruled finding says what was ruled and what changed, with
   the original kept. The register has corrected itself in place five times and that is the pattern.
5. Re-verify: `compose --check`, both editions' `docs-lint` and `conformance --check`, `npm run verify` in
   `kernel/node-react/server`, the .NET architecture suite, and a literal dash scan.
