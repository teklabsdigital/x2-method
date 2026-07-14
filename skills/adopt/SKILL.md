---
name: adopt
description: Use when an existing project that was not built with X2 must be migrated to run under it, with documentation sprawl to dissolve, stories to harvest at epic altitude, an as-built design to baseline, and existing enforcement to map and arm. Runs the migration on a dedicated branch with three human gates. Do not use for a new project (that is seed), and do not use it to redesign the product or refactor code beyond what arming the enforcement requires.
---

# X2 adopt: migrate an existing project onto X2

You are migrating a project that was built under another method onto X2. The end state:
no stray documentation artifacts in the project tree, the epic story set identified and approved,
`docs/` initialised and baselined with the X2 decision layer, the as-built UI replicated into
`design/prototype/` and locked, the existing enforcement mapped onto the claims and armed in CI, and
the project resuming under the normal X2 skills.

## The philosophy guard (read first, and hold it)

The existing documentation will distract and confuse you. It is documentation-heavy: detailed
acceptance criteria, plans, test plans, briefs, traceability prose. That style documents what must be
true and checks code against the documents. X2 makes what must be true unbreakable or derivable, and reserves prose
for decisions a machine cannot witness:

- Cross-cutting properties become invariants, stated once, enforced by the build.
- User-visible behaviour becomes the locked prototype; tests derive from it, never authored ahead.
- Interaction contracts that are not UI-visible live in one behaviour spec.
- Stories stay at epic altitude. Their job is to drive decomposition and slicing, not to fan out
  into criteria. Elaborating a story toward ACs is over-production, not thoroughness.

So: keep the epochs and the stories, not the ACs. Detailed acceptance criteria are dissolution
input, never story material. When you feel the pull to preserve a detailed document because it is
good, ask which of the three destinations its content belongs to (invariant, locked design,
behaviour spec) and send it there or record it as owed. Do not adopt the old corpus's style.

Only these survive as prose: decision records, the behaviour spec, runbooks for humans operating
the system, and the claims' human-readable statements. Everything descriptive of code dies once
code or a test says it; code wins over descriptive docs.

## Three sources of truth, one reconciliation

Adoption inherits three independently produced accounts of the product, and they will not agree:

1. **The code: what is actually built.** The authority on what exists. It cannot describe intent,
   but it cannot lie about behaviour.
2. **The epics and stories: what was intended.** Scattered through the old .md corpus. In X2 the
   approved story set (Gate A) becomes the authority on intent, but during adoption the old docs
   only NOMINATE story candidates; the code and the running app CONFIRM them. An .md story the
   code does not witness is dead intent until the human rules otherwise; a code capability no doc
   mentions is a missing story. Never let a document win a conflict with the code by default:
   that is how a legacy documentation corpus suffocates the adoption.
3. **The UI design: how it should look and behave on screen.** The current design export becomes
   the authority from Gate C forward.

The triangle is reconciled edge by edge, each at its gate, divergences always surfaced and ruled,
never silently resolved:

- **stories vs code** in phase 1: the harvest reads primarily from the code and the app, lists
  doc-vs-code divergences (dead intent, missing story), and the human rules at Gate A.
- **stories vs design** in phase 4: the congruence map, ruled at Gate C.
- **design vs code** in phase 4: the theme drift and fidelity check, ruled at Gate C.

After the three gates, the triangle is closed: the story set matches what is built, the locked
design matches the stories, and the client's divergence from the locked design is named and
scheduled. That closed triangle is the adoption baseline.

## Measurement

The adoption run is measured like an acceptance test. Keep an append-only turn ledger from the
first message (number, what, why the human was needed, bucket), feed every human turn to it as it
happens, and produce the exit report at the end. A compactible context is not durable storage:
write the ledger to a file immediately, and re-read this skill after any compaction.

## Phase 0: safety net

1. Verify the working tree is clean; commit anything pending under direction.
2. Tag the pre-migration state (for example `pre-x2`). Git history is the real archive: after this
   tag, removed files remain retrievable forever, so removal later is safe.
3. Create the migration branch (for example `x2-migration`). All adoption work happens on it.
4. **Arm the existing gates in CI now**, before anything moves: one workflow running the project's
   real verification commands as they stand (test suites, architecture tests, lint chains,
   in-process claim linters). Prove it runs green on the branch. Every later phase then works
   under a net: a relocation that breaks load-bearing machinery goes red on push, not at the end.
   Branch protection waits for phase 5; the workflow does not.
5. Submodules are out of scope entirely: they are their own repos. Record each submodule pin in
   VERSIONS.md during phase 2 and never touch their contents or their doc corpora.

## Phase 1: survey and story harvest, then Gate A

Survey the repo and produce two artifacts:

1. **The documentation census**, every doc sorted into exactly one of four buckets:
   - absorbed by enforcement: a rule a test or lint already enforces, or cheaply could; the prose
     dies once the enforcement exists (note the claim or test that absorbs it).
   - survives as a decision: distills into D-000-as-found or a D-0xx; the source is superseded.
   - commodity byproduct: plans, briefs, handovers, generated dumps; archived wholesale.
   - no home: raise it for the human's ruling; never silently drop it.
2. **The epic story set**, harvested at epic altitude only: the level where one or two sentences
   describe a whole capability. Read the story from the module surface, the deployed app's actual
   screens and flows, and any story-level specs. Do NOT reconstruct stories from acceptance
   criteria; the AC universe is dissolution input for phase 3. A right-sized set for a real
   product is roughly 6 to 12 stories.
3. **The stories-vs-code divergence list** (the first edge of the triangle): stories the old docs
   claim but the code does not witness (dead intent, or unbuilt scope worth keeping as a future
   story), and code capabilities no document mentions (missing stories). Your read on each, the
   human's ruling at the gate.

**Gate A: the human approves the story set and rules on the divergence list.** Stop and ask. Do
not proceed on an unapproved set.

## Phase 2: baseline the X2 documentation, then Gate B

Create the X2 layout (`docs/decisions/`, `docs/runbooks/`, `docs/work/`, `design/`, root
`VERSIONS.md`, root `README.md`, root `CLAUDE.md` carrying the standing constraints) and write the
baseline decisions:

1. **D-000-as-found**: the five-lens session run over the existing system. The shape is already
   chosen; the lenses record why it holds (or where it is wrong, as owed items). Promote existing
   decision prose (spines, principles docs) by distillation; never rewrite the system to match a
   lens.
2. **The schema decision**: how schema is governed today, stated honestly (migrations, or its
   absence recorded as owed with a named trigger). Every future migration is a human turn.
3. **`deltas.md`** started: where this project deviates from the kernel edition and why.
4. **`VERSIONS.md`** consolidated: every dependency surface in one ledger (packages, submodule
   pins, container images by digest), exact pins, cooling-off policy stated once.
5. **The claims conformance table**: every kernel claim mapped onto the project's existing
   mechanisms, marked proven, patterned, latent, or owed with a named trigger. The kernel is
   provenance-blind: existing enforcement that holds is mapped and kept, never renamed or rebuilt
   to match kernel naming. Existing mechanisms with no kernel counterpart are candidate claims.
6. **The fate of legacy trace machinery** (code-cites-AC linters and similar) is an explicit D-0xx:
   its claims dimension is X2-native and stays; its AC dimension retires as the ACs dissolve,
   deliberately and gated, never by silently breaking the build.

**Gate B: the human approves the baseline decisions.** From here forward, going is work.

## Phase 3: dissolve and archive the old documentation

Order matters: sort and relocate before you archive, because some documentation is load-bearing in
the build (specs wired into lint gates, invariant docs referenced by lint configs, ledgers). Moving
those blind breaks the build.

1. Relocate the survivors (contract tier, decision distillates, runbooks, ledgers) into the X2
   layout, repointing any build machinery that referenced their old paths in the same change.
2. Archive everything else away from the project tree, to be deleted when the migration is
   ratified. The tag from phase 0 preserves history, so deletion is safe.
3. Write the **dissolution manifest**: every removed file, its bucket, and where its load-bearing
   content went, if anywhere. Delete nothing unlisted. The manifest is the audit trail and part of
   the exit report.

End state of this phase: no stray documentation artifacts anywhere in the project tree.

## Phase 4: baseline the design, then Gate C

1. **Source the baseline from the live design project, not from what happens to be on disk.**
   Request the current handover link from Claude Design (a human turn: the link comes from the
   design app, or the claude_design MCP after /design-login) and bring down the complete current
   export: the design system (the theme and token source, the full `_ds`) and the screen designs.
   An on-disk mirror is a candidate, never the source: diff the fresh export against it, and any
   drift is a finding to surface (the mirror was stale; whatever consumed it inherited the
   staleness).
2. Land the current export in `design/prototype/` with a provenance README: source project URL,
   export date, how currency was established (the link request and diff), and what it covers.
   Only if no live design source exists at all does the on-disk artifact or an as-built screen
   capture become the baseline, recorded as exactly that.
3. Note the fidelity mechanisms that hold the client to the token source (token-lockstep tests,
   visual-literal lint), repoint them at the relocated source in the same change, and record gaps
   as owed. If the fresh export moved the theme, the lockstep test tells you exactly where the
   client now diverges from current design; that delta goes to the human at Gate C, not silently
   absorbed.
4. **Validate story and UI congruence.** The stories (Gate A) and the design export were derived
   independently, so cross-check them both ways in a congruence map: every story names the design
   surfaces that carry it, every major design surface traces to a story. Orphans on either side
   are findings, not fixes: a story with no surface may be backend-only (sanctioned, say so) or
   missing design; a surface with no story may be aspirational, obsolete, or evidence the story
   harvest missed an epic. Do not add stories or design yourself; list the orphans with your read
   on each.

**Gate C: the human locks the current as-built export as the acceptance contract** (the UI-4
chargeable turn), ruling in the same turn on the client-vs-design drift from step 3 and every
congruence orphan from step 4: each is accepted as sanctioned, scheduled, or excluded from the
lock. A story-set change coming out of this gate re-touches Gate A (the story set is re-approved
with the delta).

From the lock forward, divergence from the design baseline is either a defect or a deliberate,
ruled re-lock. Do not redesign anything in this skill; the current design export is the contract.

## Phase 5: arm protection and resume

1. **Arm branch protection** so the phase-0 workflow actually gates the merge. A pipeline that
   runs but blocks nothing enforces nothing, and "set at instantiation" is exactly the step that
   gets skipped. Confirm the required checks are the workflow's jobs by name.
2. **Resume under seed's re-entry mode**: standing constraints in CLAUDE.md, the turn ledger.
3. Produce the **adoption exit report**: tiers run this session with counts, the CI run id proving
   the workflow executed the real gate commands green on the branch, branch protection armed, the
   conformance table, the dissolution manifest, gates on record with dates, unsurfaced decisions
   (must be none), and the adoption turn count. The report is the done declaration; green is
   ratified after audit, never declared in prose.
4. On ratification: merge the migration branch, delete the archived pile under direction, and
   resume the normal X2 flow (stories for new scope, decompose for revisits, slices).

## Do not

- Do not harvest acceptance criteria into stories, or preserve AC detail as new prose.
- Do not rewrite working enforcement to match kernel naming; map it in the conformance table.
- Do not touch submodule contents or their documentation.
- Do not archive or delete anything unlisted in the manifest, or anything load-bearing without
  repointing the machinery that depends on it in the same change.
- Do not redesign the UI; the as-built is the baseline contract.
- Do not declare done without the exit report, and do not skip a report section because it is
  inconvenient.
