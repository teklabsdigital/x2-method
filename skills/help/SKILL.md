---
name: help
description: Use when someone asks what an X2 skill does, which skill to run next, how the gates work, or where an artifact lives. A quick in-flight reference; for the method's rationale, read X2.md at the x2-method repo root.
---

# X2 Help

X2 in one paragraph: the kernel enforces the invariants in the build, so the skills only exist to
capture human decisions at the right moments. The flow runs through three gates, each a prompted
human turn that blocks the next phase: stories approved; the prototype approved at Claude Design
and then approved again after copy-down (the lock); then ratified green, the audited exit report
read and accepted.
Green is declared by the slice-exit report and audited, never by prose. The sole metric is human
turns per shipped slice, kept in a ledger file in the repo.

## The skills, in flow order

| Skill | One line | Gate it requests |
|-------|----------|------------------|
| stories | Problem discovery to epic-level stories, one line each | Gate 1: stories approved |
| seed | Create the repo from the edition, arm the CI gate, write CLAUDE.md constraints, start the ledger | none (setup) |
| decompose | D-000 five-lens decomposition, persistent schema, slice one, deltas file | none (stays-ahead turns) |
| design | Whole-product prototype and design system, in its own context | Gate 2a: prototype approved |
| lock | Copy the prototype and full design system into the repo, verify, stamp provenance | Gate 2b: the lock |
| derive-tests | Fidelity ledger and acceptance scenarios derived from the locked portion | none |
| implement | Build all of the locked portion to green autonomously | none (the exit report checks the contract) |
| slice-exit | The exit report: the definition of green, audited by intake | Gate 3: ratified green |

On demand: **problem-solve** (runtime defect, cause unknown, fewest observation turns),
**extract** (after a project completes: the quality feedback loop that folds the ledger's
evidence back into the method), and this skill.

## Where the durable artifacts live

| Artifact | Home |
|----------|------|
| Standing constraints, turn-report shape | the repo's CLAUDE.md (written by seed) |
| Turn ledger (append-only, one row per human turn) | `docs/work/` |
| D-000 decomposition, story set, schema decisions | `docs/decisions/D-000-decomposition.md` |
| D-0xx decisions from record-gaps | `docs/decisions/` |
| Deltas from the kernel edition | `deltas.md` |
| Behaviour spec (if the product has one) | `design/` |
| Prototype, design system, provenance README | `design/prototype/` |
| Per-slice fidelity ledgers | `design/ledger/` |
| Slice-exit reports | `docs/work/` |

## The turn buckets

Every human turn is one of: decision or green-but-wrong (sanctioned), edition-defect,
invariant-gap, or methodology-defect (defects, each recorded as a candidate for the invariants
pass), or admin (uncounted). Intake's classification governs.

## Deeper reading

- `X2.md` at the x2-method repo root: the methodology and its rationale.
- `GLOSSARY.md` at the x2-method repo root: every record code the skills cite (MET-n, INV-n,
  CONF-n, X-n, B-codes, and the record-layer codes NS-n, CF-n, PC-n), defined in one line each.
- `kernel/claims/README.md`: what the build enforces, which is what the skills no longer say.
- `record/` at the x2-method repo root: the sanitized cross-project record (negative-space
  register and churn table, queued candidates, confirmations, metric history).
