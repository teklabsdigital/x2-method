---
name: x2-derive-tests
description: Use only after the lock (gate 2b) is on record for the slice portion, to derive the fidelity ledger and acceptance scenarios from the locked prototype. Triggers when a portion is newly locked or re-locked. Never use before the lock, and never use it to hand-author prototype-fidelity test cases from prose.
---

# X2 Derive Tests

Turn the locked portion into its tests. Nothing here is authored from imagination: the locked
prototype is the acceptance contract, and the tests are projections of it.

## What derives from the lock

- **The per-slice fidelity ledger** (`design/ledger/slice-NNN.md`): the locked portion's visual
  atoms, enumerated. The kernel tests it in both directions: every ledger atom renders
  (exhaustiveness) and nothing renders beyond the ledger (de-fabrication). Until the
  prototype-to-ledger exporter exists (owed on the claim), the hand-derived ledger is a known
  second-source risk: derive it at lock time only, from the artifact on disk, never maintain it by
  hand alongside a moving prototype.
- **The acceptance scenarios** on the e2e floor: the flows the locked portion shows, driven through
  the real client services against a running server.

## The scoping of "no hand-authored test cases"

The ban is precise, per the record's wording fix:

- **Banned**: authoring prototype-fidelity tests ahead of the lock. They derive from it.
- **Not banned**: claim-driven tests: harness scenarios, gate tests, guard tests. These keep the
  write-it-first, watch-it-fail shape, and they did the most catching in the pilot.

## Coverage expectations the exit report will check

Derivation should leave these satisfiable, because x2-slice-exit reports them:

- Every public method of every client data service has at least one harness scenario through the
  real transport, and when the product owns identity, the harness exercises the real sign-in path
  at least once; minting around auth is setup for other scenarios, never a substitute (INV-10,
  ruled: the gated harness profile makes this achievable).
- A composed-app smoke exists per primary flow: the actual entrypoint, at least one real request
  (INV-07).
- A service method with no surface in the locked portion is a sanctioned UI-unsurfaced state when
  it is e2e-covered and its boundary is documented (CONF-03). It is never resolved by inventing UI
  the prototype does not contain; the fidelity tests would fail that fabrication, and they should.

## One discipline line

Prove a derived suite can fail: write one assertion wrong, watch it fail, fix it. A suite that
cannot fail is not evidence.

## Human-turn contract

- No gate of its own. A gap between the locked portion and what is derivable is a record-gap
  question for the human, never an invented criterion.

## What this skill must NOT produce

- Nothing before the lock is on record.
- No criteria the prototype does not show, no edits to the prototype or ledger direction, no
  implementation code.

## Next

x2-implement.
