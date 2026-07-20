---
id: DEC-1
family: decisions
locus: centralized (upward provenance lint); the downward link is owed
provenance: catalog named-gap promotion (invariants pass R7, 2026-07-11), X2 authority model
---

# DEC-1: A module's behaviour traces to a decision

**Statement.** The X2 thesis is that decision files are the primary asset and code is a disposable projection
(DOC-1's authority direction). This claim enforces the decision tier's integrity in both directions. Upward,
built now: every decision carries a `provenance` field naming the story, epic, or claim it serves, so the chain
reads code to decision to story as a linted chain. Downward, owed: no decision lives only in code; a module's
behaviour traces to a governing decision, and a regeneration from the decisions must not lose behaviour.
Quantitative bounds are decisions too: every cap, length, and limit in schema or contracts traces to a ruling,
and a scaffold default is flagged at derivation, never discovered in production (PC-7, P2 extraction: a silent
scaffold cap eight times the ruled figure shipped through three slices).

**Harm.** Thirty-plus claims enforce the invariant tier with rigor and, before this claim, zero enforced the
decision tier. Every nondeterministic-regeneration surprise is an unrecorded-decision-in-code case, and nothing
looked for them: the system could prove it obeyed its invariants while saying nothing about whether it obeyed its
decisions.

**Enforcement.**
- Mechanism class: docs-lint on decision front matter (upward, centralized); the downward link has no clean
  mechanism yet and is recorded as owed rather than claimed.
- Edition: docs-lint fails any `docs/decisions/*.md` without a `provenance` field; the decision template models
  the field.
- Owed piece 1, the downward link (trigger: the first regeneration of a module from its decisions). Two candidate
  mechanisms, both honestly weak: a regeneration-idempotence check on one module per slice (regenerate from the
  decisions, diff against the committed code; a non-empty diff means a decision hid in the code), or a per-module
  manifest of governing decision files with a lint that fails a module shipping without one.
- Owed piece 2, the artifact-order check, absorbed from MET-01 (trigger: the next kernel acceptance test, where a
  lock timestamp and derived-test artifacts exist to compare): a cheap check that no prototype-fidelity artifact
  predates the lock it derives from. Until then the skills' gate discipline holds the order.

**Weakening notes.** The upward lint closes the chain without pretending a build gate can read intent. The
downward weakness is the honest state; naming the gap as a claim-with-a-weakening beats leaving a hole. Scope
ruling (2026-07-10, preserved from the catalog): a broader "all aspects of the solution derive from the
requirements" invariant was considered and rejected; requirements are decision-tier by definition and "driven
from requirements" names no mechanism a build can run. X2 enforces requirements by conversion (locked prototype,
derived tests, D-0xx decisions), not by traceability over prose; this claim's provenance lint is the enforceable
residue of that question.
