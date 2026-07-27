---
kind: claims-index
status: authoritative
---

# Kernel Claims Catalog v1

Portable, technology-agnostic invariants extracted from two production systems via the four-bucket adjudication of 2026-07-10 (decisions X-1..X-14). Every claim names its enforcement mechanism. A claim without a mechanism is an aspiration and does not belong here.

**Invariants and defaults.** Not every claim is a universal truth. Some encode a ruled default
where mainstream alternatives exist: tenant-leading composite keys (TEN-3) versus surrogate keys
with row-level security; keyset-only pagination (DATA-2); closed wire enums (CON-1); the 30-day
cooling-off window (DEP-1). Each was ruled during extraction with its rationale, and a project may
re-rule one at adoption by recording the decision and swapping the enforcement. What is not
negotiable is the shape: whatever rule you choose is enforced by a mechanism, or it is not a claim.

The edition realizations (concrete arch tests, lint rules, skeleton) live in `kernel/dotnet-react/`. A future edition for another stack re-realizes these same claims. This file is the catalog: it states each invariant and the *class* of mechanism that enforces it; the edition README holds the concrete test names and the per-claim conformance table, tagged with the same four states defined below.

## File schema

One file per claim: `{ID}-{slug}.md`. Front matter: `id`, `family`, `locus` (exactly `centralized` or `per-seam`, nothing else, enforced by docs-lint), `locus_note` (optional free text, where the claim is a real hybrid and the enum value alone would mislead), `provenance` (register/decision refs; an in-place extension is recorded there with its pass date). Body sections: **Statement** (portable), **Harm** (named, concrete), **Enforcement** (mechanism class only), **Weakening notes** (where enforcement is honest about its limits).

The Enforcement section holds up to three bullets. `- Mechanism class:` is mandatory and is the claim. `- Completeness obligation:` states the three parameters below and is written where a claim has been realized at least once, because an obligation written in advance of a mechanism is an aspiration and the catalog exists to kill those. `- Mechanism relationship:` is written where the claim names two mechanisms and asserts something about the pair.

### What a mechanism class states

Four rules bind the portable layer. All four were ruled by the adjudication pass of 2026-07-26, and every one of them was minted from a measurement taken while a second edition realized the claim, never from a preference; the finding ids are in `record/edition-findings.md`.

**A mechanism class is a surface, a predicate, and a completeness obligation** (S-5, E-10, S-10). The obligation carries three parameters, and each was discovered by a mechanism that stated the earlier ones and was wrong anyway. **When** the enumeration of the surface is taken: a recorder sitting on the registration path was overtaken by a later hook that rewrote a route, so the table read `/decoy` while the server served `/admin/impersonate`, with nothing failing. How deep the **closure** goes: a closure obligation bought at level zero let an open nested object deliver `author.tenantId` to the handler with the scan silent. And the **remedy** for a member the enumeration does not declare: two closed surfaces in one edition have opposite correct behaviours, a silent strip for a caller and a refusal for an operator, so the remedy is a ruling the claim owes and not a framework default nobody wrote down. A claim that names a surface and a predicate and stops has not stated its mechanism; it has stated the part an edition can satisfy while still missing the input the claim exists to catch.

**A mechanism that matches a name against a list states what its comparison resolves** (E-9, E-16). The registry's contents and the comparison over them are different properties, and only the first was ever written down. Measured: two editions realized the same three claims with matchers that are incomparable rather than ordered, so case-insensitive equality let `emailAddress` past a list containing `email` while a tokenized run let `firstname`, `dateofbirth`, `tenantid` and `orgid` past a list containing all of their parts, and a third class (`e_mail`, `EMailAddress`, `mail`, `emails`, `email1`) escaped both. A fourth mechanism was blind to every key in every JSON file in both editions because its pattern required a separator after the term and the next character was a quote. So the rule is general rather than a list of three claims: any mechanism whose predicate matches a name against a list states which morphological classes the comparison resolves (compounds, concatenations, decompositions, plurals) and how the surrounding format spells a name, and the edition owes evidence for the comparison and not only for the list.

**An asserted relationship between two of a claim's mechanisms is part of the claim** (A-3, E-11, E-16, E-17). Where a claim names two mechanisms and says anything about the pair, the edition owes evidence for the relationship, not only for each mechanism. Independence of mechanism is not independence of blind spot: measured, a claim naming two mechanisms had both miss the same injected credential for three unrelated reasons, none visible to the other, and the union of two defensible scopes was assumed to be total by nobody in particular. The rule is scoped inside one claim. A claim whose enforcement rests on another claim being realized is a real case with exactly one witness, and it is queued in `record/candidates.md` rather than built.

**The portable layer names no artifact, type, tool, or convention belonging to one stack** (B-3, B-5). Not a style rule: a `Mechanism class:` bullet naming one runtime's packaging unit is a claim that a second edition cannot satisfy as written, and it reads as though the first edition's realization were the claim. The portable content is always available, because it is what the claim meant: a named human owner on the irreversible paths rather than a particular hosting product's review feature, the layers where a value is declared rather than that runtime's word for them.

**A claim file carries no edition realization, and no status.** Ruled by the adjudication pass of 2026-07-26. Both live in each edition's `conformance.json`, which is machine-checked, generates that edition's table, and can hold as many editions as exist. A realization inside a claim file had three defects and all three were measured: the schema has one slot and there are now two editions (S-1); the delta protocol says read only the claim file, so a realization inside it contaminated every step 2 in the second edition's build before it started (S-9); and it went stale without anything noticing, which DATA-5's bullet did by naming a mechanism the edition does not have (E-14). What a claim owes an edition is an **obligation**, which is portable and belongs here; what an edition did about it is that edition's fact and belongs there.

### Centralized versus per-seam enforcement

The catalog's honesty rests on one distinction, and every file declares which side it is on:

- **Centralized** claims are provable by a single scan or one configuration point: a route-table scan, a reflection sweep over a type set, one serializer config. One test covers the whole surface, and a violation cannot merge (e.g. TEN-1, SEC-1, TIME-1, MOD-2).
- **Per-seam** claims cannot be proved globally; each seam that could violate them owes a named test plus a review obligation. There is no single scan that proves an arbitrary future side effect is idempotent or an arbitrary future log line is redacted (e.g. DATA-3, DATA-4, SEC-6, UI-4, AI-2). These files say so plainly rather than claim a coverage they do not have; asserting a global proof where only a per-seam obligation exists is the exact aspirational-claim failure the extraction set out to kill.

The field was documented as this two-value enum and realized as prose: measured at the adjudication pass, 22 distinct free-text values across 69 claims, 49 of them exactly one of the two words and 20 qualifying in prose (S-2). It was being read as an enum by eye, by splitting on the leading word, and the reading had held; what it could not do is carry a mechanical comparison, and "this claim declares centralized and the second stack reaches only per-seam" is exactly the comparison a second edition needs to make. Since the ruling of 2026-07-26 the enum is the two words and nothing else, checked by docs-lint wherever the catalog is present, and the qualification moves to `locus_note`. The 20 hybrids are real and none was flattened: `locus_note` is where DATA-8's centralized restriction meets its per-seam crash proof, and where UI-5's centralized import ban meets its per-flow smoke line. The split is 55 centralized, 14 per-seam, which is the tally this file already quoted, so nothing moved when the prose became a field.

### The status tag, and why it is not just "built"

The four status words below are the catalog's vocabulary and each edition applies them in its own `conformance.json`; since the adjudication pass of 2026-07-26 no claim file and no entry in this index carries a status of its own, because a status is an edition's fact about a claim and not a property of the claim. A single `built` was doing too much work: it meant "a scan covers the whole surface" for a centralized claim and "the pattern exists and the v1 seams are tested" for a per-seam one, two very different assurances under one word, so a conformance count that summed them lied by summation. The catalog splits it into four states:

- `proven` - a single scan or configuration point covers the whole surface; a violation cannot merge (subject to the arming note below).
- `patterned` - a per-seam claim whose mechanism and v1 seam(s) are tested; every new seam owes its own test. The set of `patterned` claims *is* the standing review debt, and naming it is the point.
- `latent` - the mechanism is built but has never executed against a real surface (an empty ledger, a single module); the first real instance is its first run, and nothing else in the tag marks it as such.
- `owed` - not built; recorded with the trigger that promotes it. Out of the v1 cut line, not lost.

**A tally of these statuses is an edition's fact and this index states none.** Each edition counts its own in its
`conformance.json`, which generates that edition's table, so the count is derived where the statuses live. This
line held a live tally until 2026-07-28, and it had gone stale in the way only an unguarded number can: it read
"Total 37" for a catalog of 69 claims, and it counted statuses twenty lines after the paragraph above ruled that
nothing here carries one (S-13). The dated pass paragraphs below quote the tally each pass produced, and those
are history rather than a current count.

The P2 extraction pass (2026-07-21, `record/candidates.md`) minted nine further claims, every one proven in the reference project and honestly tagged `owed` in the edition with a named promotion trigger: SEC-7, SEC-8, SEC-9, DATA-6, CON-3, AI-3, OBS-1, TEST-4, SRV-1. The same pass extended five existing claims in place (TEST-2 probe-surface gating, UI-4 exception scoping, DEC-1 ruled bounds, SEC-5 store-to-store transfer, UI-5 built-form assertion). Tally after that pass: 25 `proven`, 6 `patterned`, 2 `latent`, 13 `owed`. Total 46.

The compliance-mapping pass (2026-07-24) checked the catalog against two external regimes, the ASD Essential Eight and the SOC 2 Trust Services Criteria, and minted five claims where an application-layer invariant with a nameable mechanism was missing: DEP-2, SEC-10, TEN-6, DATA-7, OBS-2. Unlike the P2 nine, these are minted from the mapping, not extracted from a reference system; each records the control requirement it answers in its provenance, and all five enter `owed` with named triggers. The same pass extended TEN-4 in place with write-provenance stamps (owed, trigger: next edition build pass). Tally in the v1 edition after that pass: 25 `proven`, 6 `patterned`, 2 `latent`, 18 `owed`. Total 51.

The versioning pass (2026-07-24) closed the version-skew gap between the kernel and the projects seeded from it: a seeded project is a copy, and nothing recorded which kernel it was a copy of. The pass named the catalog's versioning scheme and claim-identity rule (the section below) and extended DEP-1 in place: the kernel a project is seeded from is itself a pinned, ledgered dependency, recorded in the project's VERSIONS.md at instantiation and enforced by the edition's docs-lint kernel-provenance check. The edition gained the upgrade procedure for seeded projects. No claims were minted; the tally is unchanged.

The window pass (2026-07-26) is a single-parameter ruling, recorded as a pass because it changes a claim's
content and therefore the version every edition's conformance statement refers to. DEP-1's default cooling-off
window returns to 30 days from 90. The 90-day value was set by invariants pass R12 (2026-07-11) on the grounds
that the extracted 30 contradicted the owner's standing policy; the owner has now ruled 90 excessive in
practice. The evidence that prompted it came from the node-react edition build: at 90 days, `vite` had no
release that satisfied both the window and two live advisories, so DEP-1 and DEP-2 could not both be honoured
by any available version, and DEP-1 gives no rule for that case. At 30 days the conflict does not arise. Nothing
else in the claim changes: the 7-day hard floor, the advisory-patch carve-out, exact pinning, committed
lockfiles, locked-mode restore, and the ledger are untouched. No pins are obligated to move: a shorter window is
strictly more permissive, so every existing pin still clears it. The tally is unchanged.

The adjudication pass (2026-07-26) is the first pass driven by a second edition rather than by a reading of the
catalog, and it is the largest change to the file schema since the catalog was extracted. `record/edition-findings.md`
recorded 39 findings from building `kernel/node-react/` against these 69 claims under a delta protocol; eleven
rulings were prepared in `record/adjudication-digest.md` and all eleven were ruled by the owner on this date.
Each ruling names the findings it answers. Applying them produced three more findings, taking the register to 42:
one about the roll-up the pass had just built (S-11), one about the portable-vocabulary rule the pass had just
stated (B-6), and one row that was understating its own edition (E-19). A pass that produces no findings while
rewriting the schema has not been looking.

**Ruling 1, applied first and in its own commit.** A claim file carries no edition realization and no status. The `- Edition:`
bullet is removed from all 69 files and the per-claim `- **Edition (v1):**` status line from this index; the file
schema and the status-tag section are rewritten above. Answers S-1 (one slot, two editions), S-9 (the bullet
contaminated every step 2 in the second edition's build, because the protocol requires reading the claim file
and the claim file contained one stack's answer) and S-3's residual (three homes for one fact). The removal was
made from the claim files alone and was deliberately NOT reconciled against either edition's mechanism column,
because that reconciliation would have destroyed step 2 for the 61 claims that still owe one.

**Rulings 2 through 11, applied 2026-07-26 and 2026-07-27**, in the order the evidence required rather than the
order they are numbered: ruling 3 first, because three of the others falsify shipped rows and ruling 3 is what
gives those rows somewhere honest to land.

A mechanism class is now a surface, a predicate, and a **completeness obligation** with three parameters, and the
schema states all three with the measurement that found each; a `- Completeness obligation:` bullet is written
into the eight built claims and into none of the other 61, because an obligation written ahead of a mechanism is
an aspiration (2, from S-5, E-10, S-10, B-1). A conformance row may carry **per-obligation statuses** with a
weakest-wins roll-up the tool checks against the row's declared status; 13 rows now carry them, 9 in
`kernel/dotnet-react/` and 4 in `kernel/node-react/`, and every one of those rows was already writing a second
status in prose (3, from S-8). An **asserted relationship** between two of a claim's mechanisms is part of the
claim and the edition owes evidence for the pair, not only for each half; SEC-1 and SEC-5 carry the first two
`- Mechanism relationship:` bullets (4, from A-3, E-11, E-16, E-17). TEN-1's mechanism class gains a **non-scan
mechanism for the header surface**, because a caller may send a header nobody declared and there is no
enumeration to scan; the statement is untouched, since it was right (5, from A-2). Any mechanism matching a name
against a list now states **what its comparison resolves**, as a schema rule rather than a list of claims, plus a
written obligation in SEC-2, SEC-3, TEN-1 and SEC-5 (6, from E-9 and E-16). The **portable layer names no stack
artifact**: HUM-1, TIME-1 and PERF-4 repaired, DATA-1 deferred to the pass that builds it (7, from B-3, B-5).
Three claim-text repairs land: TIME-1 separates unambiguity from offset retention and says what each buys, CFG-1
names the ambient process environment as a fourth home and closes it by declaration rather than by ban, and
CON-2's weakening notes name the precondition its mechanism was assuming and the sanctioned alternative where it
does not hold (8, from A-5, A-6, S-4). DEP-1 gains a **resolution order**, a live advisory outranks the
cooling-off window above the 7-day floor by explicit decision, with a ledger row for any pin taken under it
whether direct or transitive, and records that the window's number is independent of any policy outside this
repository; DEP-2's trigger moves to the next edition build pass (9, from E-3 and E-18). `locus` becomes the
two-value enum it was always documented as, with a free-text `locus_note` for the 20 real hybrids, checked by
docs-lint (10, from S-2). Two candidate claims are queued in `record/candidates.md` and neither is minted (11,
from S-7 and E-5).

**What it did to the shipped record.** Four rows in `kernel/dotnet-react/` stop reading `proven`: SEC-2 and
TIME-1 under ruling 2, SEC-3 under ruling 6, TEN-1 under rulings 5 and 6. None is a newly discovered
vulnerability and no mechanism changed; each is a guard measurably narrower than its row claimed, and each now
carries per-obligation statuses so the row says which half it meets rather than collapsing to one word. That
edition's tally moves from 25 `proven`, 6 `patterned`, 2 `latent`, 36 `owed` to **21, 6, 2, 40**;
`kernel/node-react/` is unchanged at **4 `proven`, 65 `owed`**, its four measured rows now stating a `proven`
half inside an `owed` row. A tally quoted in this file is a quotation from an edition's record and never a
property of the catalog, which is what ruling 1 settled.

**One thing the pass did not close, recorded so it is not assumed.** Ruling 3's weakest-wins roll-up cannot
express a row whose weakest obligation is a deferred extension rather than an unbuilt half, because the weakest
word in the vocabulary also means "not built": three sibling rows (TEN-4, UI-4, DEP-1) therefore keep a second
status in prose that no ruling authorizes moving. It is recorded as S-11 rather than smoothed. The window-versus-
advisory conflict the window pass left open IS now closed, by ruling 9 above.

The patterns pass (2026-07-24) mapped the catalog against three published bodies of practice: architectural pattern catalogs, resilience and operability practice, and performance measurement science. Like the compliance five, its mints come from a mapping, not an extraction; each claim's provenance names its source literature, and all enter `owed` with named triggers. The pass found the catalog complete in its founding territories (tenancy, security, AI trust, UI, docs) and thin in what happens over time and under failure, so it opened two families. Resilience (RES-1 to RES-6) rules what happens when a dependency hangs, a queue poisons, or an instance dies. Performance (PERF-1 to PERF-6) is chartered on counted work: merges gate on deterministic per-operation counts (statements, roundtrips, allocations, scaling ratios), never on raw wall time. The pass also minted DATA-8 to DATA-11 (producer atomicity, lost updates, bounded growth, expand/contract migrations), SEC-11 (split database credentials), and CON-4 (the breaking-change gate that mechanizes HUM-1's detection), and extended four claims in place: TIME-1 (monotonic durations), OBS-1 (trace-context propagation), DATA-6 (migration lock timeout), and DATA-4 (compensation named as a per-seam limit). Tally in the v1 edition after that pass: 25 `proven`, 6 `patterned`, 2 `latent`, 36 `owed`. Total 69.

One dependency sits under every `proven` and `patterned` tag: a mechanism gates a merge only once **TEST-3's loop is armed by branch protection**, which is an instantiation step, not the workflow file. Until then the pipeline runs but blocks nothing, so every gating tag reads "enforced once armed". The kernel acceptance test must verify instantiation actually arms it; see TEST-3.

## Catalog versioning and claim identity

The catalog's version is the date of its latest pass; the dated pass paragraphs above are the changelog. A claim
file carries its own history in `provenance` (its minting refs, and each in-place extension with its pass date),
so a reader of one claim sees when it last moved without the changelog. A project pins the catalog version it
builds against (DEP-1's kernel-provenance row, written at instantiation), so a project's conformance statement is
always "conformant to the catalog as of the pin", never an unversioned "conformant to X2"; moving the pin is the
deliberate act described in the edition's upgrade section.

Claim identity is append-only. An ID's statement may strengthen additively (TEN-4's write-provenance extension is
the model), but its meaning never changes: a change of meaning mints a new ID, and the old ID is deprecated in
place with a pointer to its successor, never reused or silently repurposed. This is what keeps provenance chains
in seeded projects valid across upgrades: a decision citing a claim cites a meaning that cannot shift under it.

Stated honestly, in this catalog's own register: this section is governance for catalog editors, enforced by
review at each pass, and this repository carries no lint to back it. A minimal check (every pass date cited in a
claim's `provenance` appears in a pass paragraph here) is the named upgrade if editing hands multiply.

## Claims (69)

### Tenancy

Six claims, layered so no single one is load-bearing: the tenant is read only from the credential (TEN-1), a scope is always open and fails closed (TEN-2), the key shape makes tenancy part of identity (TEN-3), the save pipeline is the write backstop and the provenance stamp (TEN-4), any deliberate exception is ledgered and tested (TEN-5), and the credential's tenant is minted from membership, never asserted (TEN-6).

<!-- catalog:tenancy:begin -->

Generated from the claim files by `kernel/tools/catalog-check.mjs`; edit the claim, not the table.

| Claim | Title | Locus |
|-------|-------|-------|
| [TEN-1](TEN-1-tenant-from-claim-only.md) | Tenant identity comes only from the authenticated credential | centralized |
| [TEN-2](TEN-2-ambient-scope-fail-closed.md) | Tenant scope is established at every entry and fails closed | per-seam |
| [TEN-3](TEN-3-tenant-leading-keys.md) | Tenant-owned tables carry tenant-leading composite keys | centralized |
| [TEN-4](TEN-4-save-time-cross-tenant-guard.md) | The save pipeline stamps tenancy and write provenance, and refuses cross-tenant writes, fail-closed | centralized |
| [TEN-5](TEN-5-sanctioned-bypass-ledger.md) | Every sanctioned cross-tenant access is ledgered with a sole-reader test | centralized |
| [TEN-6](TEN-6-tenant-minted-from-membership.md) | The credential's tenant is minted from membership, never asserted | centralized |

<!-- catalog:tenancy:end -->

### Security

Deny by default (SEC-1), keep server fields off the wire (SEC-2), keep PII out of URLs (SEC-3), harden and revoke tokens (SEC-4), keep secrets out of the repo (SEC-5), keep them out of the logs (SEC-6), keep public surfaces un-walkable (SEC-7), price the abuse-shaped doors (SEC-8), ship the deployment edge (SEC-9), prove the second factor before privilege (SEC-10), and deny the runtime credential the schema (SEC-11).

<!-- catalog:security:begin -->

Generated from the claim files by `kernel/tools/catalog-check.mjs`; edit the claim, not the table.

| Claim | Title | Locus |
|-------|-------|-------|
| [SEC-1](SEC-1-every-endpoint-gated.md) | Every endpoint is permission-gated; anonymity is allowlisted; the default is deny | centralized |
| [SEC-2](SEC-2-anti-mass-assignment.md) | Request contracts never carry server-controlled fields | centralized |
| [SEC-3](SEC-3-no-pii-in-urls.md) | No PII in routes or query strings | centralized |
| [SEC-4](SEC-4-jwt-hardening-and-revocation.md) | Token validation pins its algorithm; sessions are revocable by version | centralized |
| [SEC-5](SEC-5-no-secrets-in-config.md) | No secret in committed configuration; dev secrets local; runtime secrets rotatable | centralized |
| [SEC-6](SEC-6-log-safety.md) | Logs carry no secrets, no tokens, no message content | per-seam |
| [SEC-7](SEC-7-opaque-public-identifiers.md) | Opaque public identifiers | centralized |
| [SEC-8](SEC-8-abuse-posture.md) | Abuse posture | centralized |
| [SEC-9](SEC-9-deployment-edge-hardening.md) | Deployment-edge hardening | centralized |
| [SEC-10](SEC-10-authentication-strength.md) | Authentication strength is asserted at mint and verified at the gate | centralized |
| [SEC-11](SEC-11-split-database-credentials.md) | The runtime credential cannot touch the schema | centralized |

<!-- catalog:security:end -->

### Time

<!-- catalog:time:begin -->

Generated from the claim files by `kernel/tools/catalog-check.mjs`; edit the claim, not the table.

| Claim | Title | Locus |
|-------|-------|-------|
| [TIME-1](TIME-1-utc-offset-only.md) | Persisted and domain time is UTC-anchored, offset-aware, and nothing else | centralized |

<!-- catalog:time:end -->

### Data

Layering that flows downward (DATA-1), reads that stay bounded (DATA-2), side effects made at-most-once (DATA-3), cross-store sequences that reconcile (DATA-4), config that fails fast (DATA-5), schema change that never rides a serving boot (DATA-6), data whose retention ends on a ruled clock (DATA-7), events that commit with their state change (DATA-8), stale writes refused (DATA-9), growth that ends on a registered sweep (DATA-10), and migrations the previous release survives (DATA-11).

<!-- catalog:data:begin -->

Generated from the claim files by `kernel/tools/catalog-check.mjs`; edit the claim, not the table.

| Claim | Title | Locus |
|-------|-------|-------|
| [DATA-1](DATA-1-stores-records-downward-deps.md) | Stores, pure records, downward-only dependencies | centralized |
| [DATA-2](DATA-2-bounded-reads.md) | Reads are bounded and untracked by default | per-seam |
| [DATA-3](DATA-3-two-layer-at-most-once.md) | Every irreversible side effect carries two independent at-most-once layers | per-seam |
| [DATA-4](DATA-4-cross-store-reconcile.md) | Cross-store sequences are durable-first, idempotently kicked, and reconciled | per-seam |
| [DATA-5](DATA-5-fail-fast-mandatory-config.md) | Mandatory configuration fails fast; nothing limps on defaults | centralized |
| [DATA-6](DATA-6-migrate-and-exit.md) | Migrate and exit | centralized |
| [DATA-7](DATA-7-retention-and-disposal.md) | Retention is ruled and disposal is a tested mechanism | centralized |
| [DATA-8](DATA-8-transactional-outbox.md) | A state change and its event commit together or not at all | centralized |
| [DATA-9](DATA-9-optimistic-concurrency.md) | A stale write is refused, never silently applied | centralized |
| [DATA-10](DATA-10-steady-state-bounded-growth.md) | Everything that grows has a registered sweep | centralized |
| [DATA-11](DATA-11-expand-contract-migrations.md) | A migration never breaks the release running beside it | centralized |

<!-- catalog:data:end -->

### Configuration

<!-- catalog:config:begin -->

Generated from the claim files by `kernel/tools/catalog-check.mjs`; edit the claim, not the table.

| Claim | Title | Locus |
|-------|-------|-------|
| [CFG-1](CFG-1-operational-settings-are-config.md) | Operational settings are configuration, not code | centralized |

<!-- catalog:config:end -->

### Contracts and wire

One dialect for the whole API (CON-1), a shared fixture wherever a contract is mirrored by hand (CON-2), reads that carry everything their surface's actions depend on (CON-3), and no breaking change reaching a published contract unclassified (CON-4).

<!-- catalog:contracts:begin -->

Generated from the claim files by `kernel/tools/catalog-check.mjs`; edit the claim, not the table.

| Claim | Title | Locus |
|-------|-------|-------|
| [CON-1](CON-1-wire-conventions.md) | One wire dialect | centralized |
| [CON-2](CON-2-contract-parity-fixture.md) | Hand-mirrored contracts are pinned by a shared fixture both sides test against | per-seam |
| [CON-3](CON-3-read-completeness.md) | Read completeness for action-bearing surfaces | per-seam |
| [CON-4](CON-4-breaking-change-gate.md) | A breaking change to a published contract is detected by machine, approved by human | centralized |

<!-- catalog:contracts:end -->

### Realtime

<!-- catalog:realtime:begin -->

Generated from the claim files by `kernel/tools/catalog-check.mjs`; edit the claim, not the table.

| Claim | Title | Locus |
|-------|-------|-------|
| [RT-1](RT-1-realtime-discipline.md) | One client connection; references not bytes; durable mutations over REST | centralized |

<!-- catalog:realtime:end -->

### Serving

<!-- catalog:serving:begin -->

Generated from the claim files by `kernel/tools/catalog-check.mjs`; edit the claim, not the table.

| Claim | Title | Locus |
|-------|-------|-------|
| [SRV-1](SRV-1-one-deployable-unit.md) | One deployable unit | centralized |

<!-- catalog:serving:end -->

### Resilience

The catalog to here proves the system correct and secure; this family rules what happens when a dependency hangs, a queue poisons, or an instance dies. Outbound calls bounded and breakered (RES-1), work-in-progress bounded (RES-2), a host that dies cleanly (RES-3), probes that mean what they say (RES-4), poison quarantined at a counted limit (RES-5), and database sessions that carry finite bounds (RES-6). The family's per-seam proof mechanism is fault injection: network-level toxics in the integration tier, so "fails fast at the deadline" is an asserted fact, not a hope.

<!-- catalog:resilience:begin -->

Generated from the claim files by `kernel/tools/catalog-check.mjs`; edit the claim, not the table.

| Claim | Title | Locus |
|-------|-------|-------|
| [RES-1](RES-1-outbound-call-discipline.md) | Every outbound call is bounded, and retries are earned, not assumed | centralized |
| [RES-2](RES-2-bounded-work-in-progress.md) | No unbounded queue, pool, or backlog anywhere in the process | centralized |
| [RES-3](RES-3-graceful-drain.md) | The host dies cleanly, and there is a test that kills it | centralized |
| [RES-4](RES-4-probe-semantics.md) | Liveness answers alone; readiness answers for its dependencies | centralized |
| [RES-5](RES-5-poison-message-quarantine.md) | A poison message is quarantined at a counted limit, never retried forever, never dropped | centralized |
| [RES-6](RES-6-database-session-discipline.md) | Every database session carries four finite bounds, each proven where it lives | centralized |

<!-- catalog:resilience:end -->

### Performance

Efficiency gates on counted work per operation, which is deterministic: the same code and workload produce the same count on any machine, which is what makes a merge gate possible. Statements and roundtrips budgeted per hot seam (PERF-1), bytes allocated budgeted on designated paths (PERF-2), scaling proven by counted ratio (PERF-3), sync IO and whole-payload buffering banned from the serving path (PERF-4), caches bounded with expiring entries (PERF-5), and wall time never asserted raw (PERF-6): an absolute-milliseconds threshold on a shared CI runner meets 30 to 50 percent run-to-run variance and false-alarms nearly every other run at a 2 percent threshold, an aspiration wearing a gate's clothes. DATA-2 remains the bounded-rows claim; this family bounds roundtrips, allocations, scaling, and bytes.

<!-- catalog:performance:begin -->

Generated from the claim files by `kernel/tools/catalog-check.mjs`; edit the claim, not the table.

| Claim | Title | Locus |
|-------|-------|-------|
| [PERF-1](PERF-1-counted-io-budget.md) | A hot operation's IO is counted, budgeted, and gated | per-seam |
| [PERF-2](PERF-2-allocation-budget.md) | A designated hot path's allocations are budgeted per operation | per-seam |
| [PERF-3](PERF-3-anti-quadratic-scaling.md) | A designated algorithmic seam proves its scaling with a counted ratio | per-seam |
| [PERF-4](PERF-4-request-path-io-discipline.md) | No synchronous IO and no whole-payload buffering on the serving path | centralized |
| [PERF-5](PERF-5-bounded-caches.md) | Every cache is bounded and every entry expires | centralized |
| [PERF-6](PERF-6-time-under-statistical-control.md) | Wall time is never asserted raw | centralized |

<!-- catalog:performance:end -->

### Modules and documentation

Code for a feature lives together (MOD-1), its files sit where their kind dictates (MOD-2), documents have a home, an authority, and a death date (DOC-1), and behaviour traces to a decision (DEC-1).

<!-- catalog:modules,documentation,decisions:begin -->

Generated from the claim files by `kernel/tools/catalog-check.mjs`; edit the claim, not the table.

| Claim | Title | Locus |
|-------|-------|-------|
| [MOD-1](MOD-1-module-co-location.md) | A module's code lives together; modules meet only at the composition root | centralized |
| [MOD-2](MOD-2-deterministic-naming-placement.md) | A file's path and name are a pure function of kind, module, and subject | centralized |
| [DOC-1](DOC-1-documentation-lifecycle.md) | Documentation has one home per kind, explicit authority, and a death date | centralized |
| [DEC-1](DEC-1-behaviour-traces-to-decision.md) | A module's behaviour traces to a decision | centralized |

<!-- catalog:modules,documentation,decisions:end -->

### Client UI

One token source kept honest against the design system (UI-1), literal visuals banned outside it (UI-2), screens that only compose primitives (UI-3), a fidelity ledger that pins the shipped screen to the locked prototype (UI-4), and a thin UI whose composed entrypoint is proven live (UI-5).

<!-- catalog:client-ui:begin -->

Generated from the claim files by `kernel/tools/catalog-check.mjs`; edit the claim, not the table.

| Claim | Title | Locus |
|-------|-------|-------|
| [UI-1](UI-1-token-source-lockstep.md) | One token source, tested in lockstep with the design system | centralized |
| [UI-2](UI-2-lint-error-visual-literals.md) | Literal visual values are lint errors outside the token source | centralized |
| [UI-3](UI-3-primitives-only-screens.md) | Screens compose primitives; only the primitive layer touches tokens | centralized |
| [UI-4](UI-4-fidelity-ledger.md) | Every shipped screen carries a fidelity ledger derived from the locked prototype | per-seam |
| [UI-5](UI-5-thin-ui-over-tested-services.md) | The UI is a thin layer over tested services, and the composed entrypoint is exercised | centralized |

<!-- catalog:client-ui:end -->

### Dependencies

Quarantine at the door (DEP-1), and a standing sweep over what already got in (DEP-2).

<!-- catalog:dependencies:begin -->

Generated from the claim files by `kernel/tools/catalog-check.mjs`; edit the claim, not the table.

| Claim | Title | Locus |
|-------|-------|-------|
| [DEP-1](DEP-1-dependency-quarantine.md) | Dependencies are quarantined, pinned exactly, and restored in locked mode | centralized |
| [DEP-2](DEP-2-standing-advisory-sweep.md) | A standing advisory sweep with a ruled remediation clock | centralized |

<!-- catalog:dependencies:end -->

### Testing

Three tiers on real engines (TEST-1), an out-of-process e2e harness through the real client (TEST-2), a CI loop that runs all of it on every push (TEST-3), and a proof the product boots and serves in its real runtime shape (TEST-4). TEST-3 is the claim that makes every other claim's tag true, and until it is armed, it makes none of them true.

<!-- catalog:testing:begin -->

Generated from the claim files by `kernel/tools/catalog-check.mjs`; edit the claim, not the table.

| Claim | Title | Locus |
|-------|-------|-------|
| [TEST-1](TEST-1-tier-strategy.md) | Three test tiers, each on a real engine, all in the loop | centralized |
| [TEST-2](TEST-2-e2e-harness.md) | An out-of-process harness drives the real client services against the running system | centralized |
| [TEST-3](TEST-3-ci-loop.md) | Every enforcement mechanism in this catalog runs on every push, and the loop gates merges | centralized |
| [TEST-4](TEST-4-real-runtime-boot-proof.md) | Real-runtime boot proof | centralized |

<!-- catalog:testing:end -->

### Human approval

<!-- catalog:human-approval:begin -->

Generated from the claim files by `kernel/tools/catalog-check.mjs`; edit the claim, not the table.

| Claim | Title | Locus |
|-------|-------|-------|
| [HUM-1](HUM-1-irreversible-surfaces-human-turn.md) | Irreversible surfaces get a human turn, unconditionally | centralized |

<!-- catalog:human-approval:end -->

### AI trust boundary

The server owns identity on every tool call (AI-1), untrusted content never widens what a tool may do (AI-2), and every prompt lives in configuration, assembled at one seam (AI-3).

<!-- catalog:ai-trust,ai:begin -->

Generated from the claim files by `kernel/tools/catalog-check.mjs`; edit the claim, not the table.

| Claim | Title | Locus |
|-------|-------|-------|
| [AI-1](AI-1-server-injected-identity.md) | The server injects identity and scope into tool calls; the actor never supplies them | centralized |
| [AI-2](AI-2-untrusted-content-no-authority.md) | Untrusted content never authorizes a side effect | per-seam |
| [AI-3](AI-3-prompt-architecture.md) | Prompt architecture | centralized |

<!-- catalog:ai-trust,ai:end -->

### Observability

The seam says when it is broken (OBS-1); the refusals say when it is under attack (OBS-2).

<!-- catalog:observability:begin -->

Generated from the claim files by `kernel/tools/catalog-check.mjs`; edit the claim, not the table.

| Claim | Title | Locus |
|-------|-------|-------|
| [OBS-1](OBS-1-external-effect-seam-observability.md) | External-effect seam observability | per-seam |
| [OBS-2](OBS-2-security-event-log.md) | Refusals and privileged actions are security events | per-seam |

<!-- catalog:observability:end -->
