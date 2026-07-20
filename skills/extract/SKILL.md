---
name: extract
description: Use when an X2 project completes (or reaches a major milestone) to run the extraction loop, the quality feedback that folds the project's evidence back into the method. Reads the turn ledger and decision records, computes the metric and the per-decision churn table, distils sanitized candidates, confirmations, and negative-space nominations, and holds everything for a rulings pass. Do not use mid-slice (that is the normal intake flow), and never let raw project material cross into the public method.
---

# X2 Extract

The turn ledger is not just a cost record. It is a map of negative space: every human turn marks a
place the method or the edition was not yet good enough. Defect turns are the loud half of that
map. The quiet half is churn: a wrong-but-green decision leaves no defect behind it, it gets
reworked across many small, individually-green turns that cluster on the same decision. This skill
mines both halves and feeds the method, so each project makes the next one cheaper. It exists so
the loop runs the same way every time, without anyone having to think about how.

Run in its own context (the intake seat), never the builder's. The builder is the measured
subject and does not grade its own record.

## 1. Intake

- Reconcile the ledger. Classify every human turn; intake's bucketing governs over the builder's
  provisional bucket (MET-05). Buckets: decision or green-but-wrong (sanctioned); edition-defect,
  invariant-gap, methodology-defect (defects); ideation, admin (uncounted).
- Compute the figure: counted turns per shipped slice, where shipped means the exit report exists.
  Counted excludes admin, ideation, and the stays-ahead investment. Report per-slice mid-build
  cost and the defect share of counted turns; those travel across projects better than the total.
- Compute the churn table: turn-count per decision. The true signal is post-ruling revisits,
  turns that touch a decision after it was supposedly settled; pre-ruling iteration is just
  deciding. Rank relatively (this project's top quartile), not by absolute count, so the lens
  works at any project size.

## 2. Distil

Four outputs, all in method-level language:

- **Candidates**, from the defect turns: what bit, and the general rule it argues for.
- **Confirmations**: claims and gates that held under real load, recorded so no later pass
  reopens them without new evidence.
- **Generalizable decisions**: project decisions that are method discoveries in disguise. A
  decision any project would make the same way is a candidate; a product-local one stays home.
- **Negative-space nominations**: high-churn, zero-defect decisions from the churn table, each
  carrying its revisit count and a one-line "suspected wrong because" or "suspected missing
  because". Churn nominates; it never judges. A high-churn decision may be legitimately evolving,
  and only the human can tell. Every ruling lands in one of two classes: **iteration-inherent**
  (the churn is the work: model selection, content voice, story refinement) or **pre-decidable**
  (the churn was avoidable and the method should pre-flight it next time).

Every item that could cross carries an **applies-when condition** (public web surface,
model-backed feature, template-shaped product, and so on). The method serves many verticals;
nothing is worded as universal unless it is.

## 3. Sanitization gate

Assume every word that crosses will be read by a stranger with no knowledge of the source project.
Strip, without exception: product, brand, person, company, and team names; repository names and
project-local identifiers (decision numbers, slice numbers, tickets); file names and paths;
endpoint, route, config, host, and domain details; third-party vendor, service, model, and library
names; URLs and addresses; anything that fingerprints the project or a person, even in aggregate.

Do not redact; **generalize**. Each item becomes the pattern and the rule it argues for, with zero
residue of its origin. If an item cannot be generalized without losing its meaning, flag it for
the human to reword or drop; never ship a half-scrubbed version. Default: auto-generalize and
present only the doubtful crossings side by side.

## 4. Rulings pass (human gate)

Present: the figure, the churn table with nominations called out, the distillate, and the
un-sanitizable flags. Put the open dispositions as options; do not pick for the human. Nothing
crosses into the method without a ruling. Rejected items are recorded as ruled so they never
resurface; accepted confirmations close their claims to reopening.

## 5. Apply and deploy

Accepted items apply in lockstep, each to its tier:

- **Methodology items** (named phases, loops, gate content): the affected skills and X2.md.
- **Claim-shaped items**: queued in the method's `record/candidates.md` for the next invariants
  pass; `kernel/claims/` is never edited during extraction.
- **Negative space**: the register and the cross-project churn table in `record/negative-space.md`.
  This table is the anticipation payoff: decompose reads it to pre-decide the decisions history
  says will churn. An entry earns its place by having bitten once or by cross-project frequency,
  and it must graduate to a mechanized rule as soon as it can; a list a human must re-read is the
  documentation weight the method exists to avoid.
- **Metrics**: `record/metrics.md`, under the one counting rule.
- **Falsifiers**: for chronic churn types only (the register marks them), decisions start
  recording a confidence and a "wrong-if" line so reality can trip the dormant-wrong later.
  Never universal; that is documentation weight returning through the side door.

The sanitized distillate lives in the method's public `record/` layer. The raw intake record,
with real names and turn pointers, lives in the project's own private repo (`docs/work/`) and
never leaves it. Commit and push the method repo only on the human's word.

## What this skill must NOT produce

- No raw project material in the public tree, ever; the distillate crosses, the case file stays.
- No edits to `kernel/claims/` (that is the invariants pass), and no rulings taken for the human.
- No judgement from churn alone; nominations without a human ruling apply nothing.
- No counting of admin, ideation, or stays-ahead turns in the figure.

## Next

Rulings applied, method deployed; the project's ledger stands as the audited source. The next
project's decompose reads the churn table.
