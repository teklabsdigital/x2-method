---
name: kernel
description: Use to change the claims catalog (add, amend, retire a claim, cut a catalog pass), to manage editions (add, retire, recompose), to measure an edition's conformance honestly (plant, prove, audit, lower a row), to clear accumulated decisions with the owner, or to check that the whole kernel is still coherent. Also use when a claim or edition change may have left counts, scope or statements in the documentation stale. Do not use it to seed a project from an edition; that is seed's job.
---

# X2 Kernel

Maintain the three artifacts the method is built from, and keep them honest about each other.
Run this whenever the answer to "what must be true", "what exists to be measured", or "what do we
actually enforce" is about to change.

Start by showing the verb table below and asking which one the request is. Most requests name a
verb without knowing it; route them rather than making them choose from a menu.

## The model, and it is small

| artifact | job | authority |
|---|---|---|
| the claims catalog, `kernel/claims/` | what MUST be true | **NORMATIVE**. Source of truth |
| the conformance record, `kernel/<edition>/conformance.json` | what IS enforced today, one row per claim per edition, pinned to a named catalog pass | **DESCRIPTIVE** |
| the editions, `kernel/<edition>/` | the machinery in copyable form. Current state, not aspiration | what new projects seed from |

Call it the **claims catalog**, or **claims**. Never "the catalogue of rules", never "invariants
catalog". The vocabulary is load-bearing: a record whose name drifts stops being findable.

**Precedence.** If a document and running code disagree, the code is the FACT and the disagreement is
surfaced, never reconciled quietly. Code is evidence of what is true. It is never the authority on
what SHOULD be true; that is the catalog's job. Three consequences to hold at once:

- Code violating a claim is wrong code. Fix the code.
- A conformance row that OVERSTATES is a worse defect than the code it hides, because someone can
  seed from it. Never leave one standing while deciding what to do.
- Code violating a claim whose row reads `proven` is TWO defects: the code, and the guard that failed
  to stop it. **The guard is the more serious one.**

**Congruent with the catalog** means every claim has an HONEST row. It does NOT mean every claim is
`proven`. A claim the exemplar has no surface for is correctly `owed`, and an `owed` row with a named
trigger is the record being right.

**Never reconcile two editions against each other.** Each record is measured against the catalog
independently. Where one edition has a persistence layer and another does not, the same claim is
honestly `proven` in one and `owed` in the other. Forcing them to match makes one of them lie.

## The verbs

| verb | changes | use when |
|---|---|---|
| **`claim`** | the catalog | a claim is added, amended or retired, or a catalog pass is cut |
| **`edition`** | the editions | an edition joins, leaves, or the shared tier is recomposed |
| **`measure`** | the conformance record | a row is planted, proven, audited or lowered |
| **`rule`** | a decision | open questions have accumulated and the owner will decide them |
| **`verify`** | nothing | check every gate and re-derive every derived fact |
| **`status`** | nothing | report where everything stands and what is open |

`verify` and `status` change nothing and are always safe. Prefer them when unsure what state the tree
is in. **Never run a mutating verb without knowing the current state**, because a measurement taken
from the wrong baseline is worse than no measurement.

---

## `status`

Report, in this order, every number DERIVED at runtime and none of it quoted from a document:

1. Claim count, and the catalog pass date.
2. Per edition: the status tally, the non-`owed` count, and which claims those are.
3. Which claims are `owed` in every edition (nothing in any exemplar to enforce) versus enforced
   somewhere.
4. Open decisions awaiting a ruling, and open findings with a live trigger.
5. Anything `verify` would fail on.

**Never quote a count from prose.** Derive it. The most expensive error this method has recorded was
a false premise propagated through a commit message into a handover, honoured by three passes before
anyone measured it.

Report differences between editions as facts, never as a gap to be closed.

## `verify`

Every gate, then every derived fact. Changes nothing, fails loudly.

1. **The shared tier composes** and no edition's copy has been hand-edited.
2. **Every edition's record is complete**: one row per claim, catalog pass date current.
3. **Every edition's docs-lint passes**, self-test first. The self-test comes first for a reason that
   has now been found twice: a lint over a clean tree reports ok whether its predicates reach
   everything or nothing, so what it CATCHES is asserted before it is trusted.
4. **Every suite green**, at its exact expected count.
5. **Every mechanism the editions ship is run by something.** A file that exists, is named in a row,
   and that nothing executes is a guard nobody is protected by.
6. **The catalog against its own index.** These are the checks nothing else runs, and they are listed
   individually because "check the index" is the instruction that gets skipped:
   - every claim file has an index entry, and every index entry has a claim file, both directions
   - the index heading's count equals the number of claim files
   - each family intro names every claim in that family
   - each index entry's restated statement and harm match the claim file's, normalized for whitespace
   - the stated locus split equals the frontmatter tally
   - every claim id cited anywhere in the catalog resolves to a claim file
   - every pass date in any `provenance` appears in the index changelog
7. **Every derived fact re-derived** (see Derived facts below), including any count, tally or scope
   statement in a live document, and any list that enumerates a set the tree defines.
8. **The skills themselves**: every skill directory has its instruction file, its front matter parses,
   its declared name matches its directory, it appears in every index that exists to list it, and it
   contains no product or project name and no machine-local path. That last is a standing constraint,
   and a standing constraint with no check is a rule addressed to whoever remembers.
9. **The standing constraints** across the tree: no banned punctuation, no machine-local path in any
   repo file. Check punctuation with literal bytes built by `printf`, because bracket expressions
   false-negative on these characters in some greps, and prove the check works by scoring a
   known-positive control.

**A check over these documents fails toward false alarms, so give it controls before believing it.**
Three scans written while auditing this surface were themselves the bug rather than the tree: one
matched case-sensitively where the tool it was checking matches case-insensitively, one relied on
shell word splitting that the shell in use does not perform, and one assumed a single date format
where the changelog uses three. Each reported a defect that did not exist. **A scan's first output is
a claim about the scan.**

A gate that cannot reach what it checks must FAIL, never pass quietly. A check that reports ok
because it found nothing to look at is the failure mode this whole method exists to refuse.

## `claim`

Changing what must be true. The highest-blast-radius verb, and the one with the strictest protocol.

**The catalog is not edited casually, and never from a findings register.** A claim that looks wrong
gets RECORDED as a finding and surfaced. The catalog is rewritten at an adjudication pass, by a human
ruling, and the edit is recorded as a dated pass in the catalog's own changelog. Recording the
evidence and pre-empting the ruling are different acts. If the request is "this claim is wrong",
the verb is `rule`, not `claim`.

**Adding a claim.** Ask what harm it prevents, concretely and with an instance. A claim with no named
harm is a preference. Then:

1. Write the claim file in the catalog's schema: the portable statement, the named harm, the
   mechanism CLASS only, and the weakening notes where enforcement is honestly limited.
2. **The mechanism class names a class, never one stack's artifact.** If it names a specific type,
   tool or library, it has technology specifics in the portable layer and will not survive a second
   edition.
3. **State the completeness obligation**: when the enumeration is taken, how deep the closure goes,
   and the remedy for an undeclared member. A claim that says what to check but not how completely
   cannot be planted against.
4. **State the comparison obligation** where the claim matches names against a list. The registry's
   contents and the comparison over them are different properties. A list of forbidden names says
   nothing about whether the matcher resolves compounds, concatenations, decompositions or plurals,
   and a matcher that resolves none of them passes every review while catching nothing.
5. **Every edition gains a row in the same change**, at `owed` with a trigger, unless it is measured
   otherwise in that change. A catalog with a claim no record answers is incomplete by construction.

**Amending a claim.** Say what the amendment makes newly false. If it tightens an obligation, every
row that read `proven` on the old text is now unproven until re-planted, and saying so is the work.
Do not let a status survive a change to the thing it was a claim about.

**Retiring a claim.** Retire, do not delete. Something was learned. Its rows go with it in the same
change, and its findings stay in the register as history.

**Cutting a catalog pass.** The pass date is what every record pins to. Move it only when the catalog
actually changed, and re-pin every edition's record in the same change.

### What a claim change touches, and which of it is guarded

Audited surface. **The tooling enumerates the catalog by reading the claim FILES**, so every check that exists
reaches the files and none reaches the index. Work this table top to bottom on any `claim` run and report each
line, because the unguarded rows are unguarded in both directions: nothing tells you they moved, and nothing
tells you they did not.

| surface | what changes | guarded by |
|---|---|---|
| the claim file | the claim itself | the locus enum only |
| the index heading `## Claims (N)` | the count | **nothing** |
| the family section | a new entry, in the right family | **nothing** |
| the family intro sentence | it names every claim in that family | **nothing** |
| the index entry | it RESTATES the statement, harm, enforcement and weakening | **nothing** |
| the locus split sentence | the centralized versus per-seam tally | **nothing** |
| the dated pass paragraph | the changelog, and the catalog's VERSION is its latest pass date | **nothing** |
| `provenance` | the minting refs, and each in-place extension with its pass date | **nothing** |
| claims citing this claim | a retired or renamed id leaves them dangling | **nothing** |
| every edition's record | one row per claim, `owed` with a trigger until measured | the completeness check |
| every edition's pinned pass date | the version the record's statements refer to | partially |
| every edition's generated table | regenerated from the record | regenerate it |
| prose stating the claim count | goes stale on the next mint | **nothing** |

**The index restates every claim in full.** That is two copies of the catalog's own content, one per claim, kept
in agreement by hand. An amendment that edits the file and not the index leaves the index describing a claim in
words the file no longer uses, and every gate stays green. **Amending a claim is therefore two edits, always,
and confirming the second one is part of the verb.**

**Claim identity is append-only.** A statement may strengthen additively, but its meaning never changes: a change
of meaning MINTS A NEW ID, and the old one is deprecated in place with a pointer to its successor, never reused
and never silently repurposed. Seeded projects cite claims in their own decision records, so an id whose meaning
shifts invalidates provenance chains in repositories this one cannot see. If an amendment changes what the claim
MEANS rather than how strongly it says it, the answer is a new id.

## `edition`

Changing what exists to be measured.

**Adding an edition.** The point of a second edition is to test whether the claims are really
portable, so the test is wasted if it is run with the answers open. Expect the build to surface
claims whose portable layer encodes one stack's specifics; those are findings, and they are the
return on the exercise.

1. Register it wherever the set of editions is declared. Keep those lists EXPLICIT rather than
   discovered from a directory: a new edition joining the gates should be a visible diff someone
   reviews, not a side effect of a folder appearing.
2. **A complete record on day one**: one row per claim, every one `owed` with a trigger until
   measured. Never seed a new edition's record by copying a sibling's. That is reconciling the
   editions against each other, and it starts the new record as fiction.
3. Add it to every gate and every register that enumerates editions. Then run `verify`: the loop
   check is what reports a mechanism the new edition ships that nothing runs.
4. Add its tiers to the repository's own workflow. A tier that runs only when a developer remembers
   is aspirational, not enforced, and this has now been found four separate times.

**Never edit an edition's composed copy of a shared file.** Edit the shared tier and recompose. The
composed copies exist so the committed edition tree IS the shape a project seeds into; a hand-edited
copy fails the build rather than drifting quietly, and that is the whole point of the check.

**Retiring an edition.** Its record and findings are history and stay. Remove it from the enumerating
lists in the same change, or the gates keep asking about a tree that is gone.

## `measure`

Changing what the record SAYS, never what must be true. This is the bulk of the work and it has one
protocol, per claim, per obligation.

**Only non-`owed` rows can lie.** An `owed` row claims nothing. That bounds the work.

1. **Read the claim file and nothing else first.** Enumerate the obligations before looking at any
   edition: the mechanism class, the completeness obligation, and the comparison obligation where
   there is one. Reading the edition first tells you what the mechanism does, which is the answer you
   are supposed to be testing.
2. **Locate the mechanism** in that edition.
3. **Plant a violation the obligation should catch.** The plant must be the MINIMAL edit that
   violates only the property under test, and it must remove EVERY cause of that property. A plant
   that leaves a second cause standing produces a green scan that reads exactly like a clean tree.
4. **Score three outcomes, not two:**

   | outcome | meaning |
   |---|---|
   | red, and the message names the right claim or registry | the obligation holds |
   | green | the guard does not bind. **Finding** |
   | red, but a different test caught it, or the message names the wrong thing | this guard still does not bind. **Finding** |

   The third is not pedantry. A field was once caught, so the surface looked covered, but only
   because a different claim's registry happened to list it while the claim's own guard reached
   nothing.
5. **Revert byte for byte** and confirm the suite returns to the EXACT baseline count. Restore from a
   copy made before the plant. **Never use version control as undo**: restoring from the index
   deletes uncommitted work living in the same file. Start any plant cycle from a clean tree.
6. **Remedy is a TWO-WAY decision, never automatic.** Build the guard if the claim is inside this
   exemplar's cut line; lower the row to `owed` with a named trigger if the exemplar cannot reach it.
   **Do not invent a guard for a surface the exemplar does not have**, and do not leave the row
   overstating while deciding.
7. **If anything was repaired**, restore the pre-repair mechanism with the plant STILL IN PLACE and
   confirm it goes green. That reproduces the hole and proves the repair was necessary. This control
   is what caught the two most-cited findings in the register. Do not skip it.
8. **Record the honest status.** Vocabulary: `proven` (one scan or configuration point covers the
   whole surface), `patterned` (per-seam, mechanism and current seams tested, every new seam owes its
   own test), `latent` (built, never executed against a real surface), `owed` (not built, recorded
   with the trigger that promotes it). Where obligations differ, use the per-obligation array and the
   row's status is the WEAKEST of them.

**Never record `proven` on an obligation you did not plant against.**

**Land every plant as an executable test, as you go.** Not a later phase. A plant that stays prose is
hand-run once and then decays silently while the guard under it gets rewritten, which is exactly how a
row comes to read `proven` on a guard that stopped binding three passes ago. Feed the guard's
predicate a violating input and assert it reports that violation.

**Write the round into that edition's verification record**, dated, with the red-green matrix.

## `rule`

Where the human decides. Use it when open questions have accumulated, when a finding needs a
decision rather than a repair, or when a request would edit the catalog.

1. **Present open decisions ONE AT A TIME.** For each: what it is in plain language, why it matters,
   the most pragmatic option and why. Keep it short enough to hold in one reading.
2. **Recommend, do not merely enumerate.** A menu with no recommendation moves the work to the owner
   without moving the decision.
3. **Record the ruling with its ARGUMENT, not just its outcome.** A decision not to do something
   reads exactly like an omission six months later. This matters most for the rulings that decline
   work: those are the ones a later reader will assume nobody got round to.
4. **Apply the ruling in the same pass**, and say what it made newly false.
5. A ruling that falsifies a shipped status lowers that status. Say so before applying it, not after.

## Derived facts, and why documentation goes stale

Every mutating verb owns a blast radius. Any fact stated in a live document belongs to exactly one
bucket, and the job on every change is to leave the tree either regenerated or loudly failing.

| bucket | rule |
|---|---|
| **generated** | regenerated from source on every change. Cannot drift |
| **checked** | a lint FAILS when the stated fact disagrees with the tree |
| **dated** | a measurement at a point in time. **Never retouched** |
| **deleted** | the fact should not be in prose at all; one home holds it and everything else cites it |

**The fourth bucket is the most under-used and often the right answer.** When two documents asserted
two different values for one policy number, the repair was not to sync them: it was to give the
number one home and have everything else cite it from there. A fact written twice is a fact that
drifts.

**Dated records are never retouched.** A number inside a dated finding, ruling or verification round
is what was measured then. Rewriting it falsifies history. Only LIVE documents, the ones describing
the current state, go stale, and that surface is much smaller than a naive search suggests.

**What goes stale on each verb:**

- `claim` changes the claim count, the per-family counts, any scope statement, and every edition's
  row count.
- `edition` changes the edition count, every "both editions" phrasing, the composed file count, and
  every enumerating list.
- `measure` changes the status tallies and any "N of M" statement.
- `rule` can falsify a stated reason without touching a status.

**A status is a claim about a mechanism and has a guard. A NUMBER in prose is a claim about the tree
and has none**, so any pass can falsify one without touching the file it lives in, or reading it. That
asymmetry is why this section exists, and it has now produced findings inside an edition and inside
the catalog's own governance document.

## Findings

Every verb produces them. A finding is not a backlog item, it is evidence.

- **Record, do not quietly fix.** An unauthorized-looking edit gets RECORDED, not made.
- **A citation is not a definition.** Citing a finding id that has no entry fails the build, and it
  should: a reference to a decision nobody wrote is worse than no reference.
- **Name the commit you measured at.** A result from the wrong commit is worse than no result, and an
  agent cannot be assumed to be at the commit it was told it was at.
- **State whether it was repaired or recorded**, and if recorded, the TRIGGER that would reopen it. A
  finding with no trigger is a worry.
- **An exemption is a pre-authorized hole.** If a check must skip something, the skip names its reason
  and its finding, so that removing it later is a consequence of fixing the thing rather than an
  argument. Written that way, exemptions delete themselves.

## Human-turn contract

- `claim` and `rule` are owner decisions. Never take them unilaterally.
- `edition` needs an owner decision on scope before it starts; the build itself does not.
- `measure` and `verify` need no turn. A guard that does not bind is a finding, not a question.
- Log every human turn as it happens. An unlogged turn is a corrupted measurement.

## What this skill must NOT produce

- No edit to the catalog outside a recorded ruling.
- No conformance status that was not planted against.
- No reconciliation of one edition against another.
- No edit to an edition's composed copy of a shared file.
- No count, tally or scope statement written into prose without deciding which bucket it is in.
- No green report from a check that could not reach what it checks.

## Next

`verify`, then `status`. Every mutating run ends by proving the tree is still coherent, and reports
the numbers it derived rather than the ones it expected.
