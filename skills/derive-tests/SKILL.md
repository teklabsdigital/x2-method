---
name: derive-tests
description: Use only after the lock (gate 2b) is on record for the slice portion, to derive the fidelity ledger and acceptance scenarios from the locked prototype. Triggers when a portion is newly locked or re-locked. Never use before the lock, and never use it to hand-author prototype-fidelity test cases from prose.
---

# X2 Derive Tests

Turn the locked portion into its tests. Nothing here is authored from imagination: the locked
prototype is the acceptance contract, and the tests are projections of it.

## What derives from the lock

- **The per-slice fidelity record**, derived mechanically: a deterministic exporter reads the
  locked artifact on disk into a computed record, and the built screens are compared against that
  record computationally, in both directions (everything in the record renders; nothing renders
  beyond it). Never hand-derive fidelity: a hand-typed summary standing in for the artifact
  produces drift as its designed output, because the artifact is never read again after the lock.
  The third project exited two slices with drifted screens that way, then built the mechanical
  route mid-project and drift stopped (record: PC-30). The ledger file
  (`design/ledger/slice-NNN.md`) keeps only what cannot be computed: acceptance scenarios and
  owner rulings, including licensed divergences.
- **The portion is declared, never assumed.** A locked portion smaller than a whole screen is
  declared as excluded subtrees, each citing its ruling, held in the same extent guard as the
  comparison. And coverage is per drawn state, not per screen: a built state that ships
  never-compared is the gap an extent guard that only sees screens cannot see.
- **Chrome is contract; sample content is illustration.** The locked artifact says which parts of
  a screen are specification and which are sample data; compare the specification. Fixtures for
  comparisons come from the wire types, values the product can actually emit, and an
  artifact-versus-product disagreement is a finding for the record, never smoothed over locally.
- **A rule the storage engine happens to enforce proves nothing.** Where a product rule is also
  enforced by the engine as a side effect (a collation, a constraint), the falsifying test must
  run on a tier the engine does not cover, or the test can never fail.
- **The acceptance scenarios** on the e2e floor: the flows the locked portion shows, driven through
  the real client services against a running server.

## The scoping of "no hand-authored test cases"

The ban is precise, per the record's wording fix:

- **Banned**: authoring prototype-fidelity tests ahead of the lock. They derive from it.
- **Not banned**: claim-driven tests: harness scenarios, gate tests, guard tests. These keep the
  write-it-first, watch-it-fail shape, and they did the most catching in the pilot.

## Coverage expectations the exit report will check

Derivation should leave these satisfiable, because slice-exit reports them:

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

implement.
