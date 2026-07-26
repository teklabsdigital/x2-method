---
kind: record
status: working
---

# Candidates for the invariants pass

Accepted at the P2 rulings pass (2026-07-21) under the governing filter: an item enters only if it
reduces paperwork, improves efficiency, accuracy, or quality, or reduces work for the X2 user.
Each carries an applies-when condition; nothing is universal unless it says so. Items graduate
into `kernel/claims/` and leave the queue; `kernel/claims/` is never edited during extraction.

## Graduated (minted or applied, invariants pass 2026-07-21)

Fourteen of the original twenty-four crossed into the catalog:

- PC-1 real-runtime boot proof and PC-3 built-form assertion: minted as **TEST-4** (PC-3 also
  extends UI-5's smoke).
- PC-2 read completeness plus session-restore coverage: minted as **CON-3**.
- PC-4 opaque public identifiers: minted as **SEC-7**.
- PC-5 prompt architecture: minted as **AI-3**.
- PC-6 seam observability for external effects: minted as **OBS-1** (opens the observability
  family).
- PC-12 migrate-and-exit: minted as **DATA-6**.
- PC-13 abuse posture: minted as **SEC-8**.
- PC-14 one deployable unit: minted as **SRV-1**.
- PC-16 deployment-edge hardening: minted as **SEC-9**.
- PC-7 ruled bounds: extended into **DEC-1**.
- PC-17 environment-gated probe surfaces: extended into **TEST-2**.
- PC-21 secrets store to store: extended into **SEC-5**.
- PC-24 exception scoping: extended into **UI-4**.

All nine mints are tagged `owed` in the edition with named promotion triggers (proven in the
reference project, not yet realized in the kernel edition); the edition build pass that realizes
the next-build-pass triggers (DATA-6, TEST-4, SRV-1) is the standing owed work.

## Queued by the adjudication pass, 2026-07-26 (claim-shaped, evidence attached, deliberately not minted)

Three items, all ruled by the owner on that date: two candidate claims queued rather than minted (ruling 11),
and one field deferred out of ruling 4. The bar they fail is this catalog's own, and it is the same bar in each
case: a claim whose enforcement does not exist is the aspirational-claim failure, and one instance is not a
pattern. Queueing costs nothing and keeps the evidence attached to the item rather than in a register nobody
reads at mint time. The next edition build is the event that settles all three.

- **11a. The shared tier has no mechanism that detects a stack-specific assumption inside itself.** From S-7.
  Three instances found, each by a second edition tripping over it: the DEP-1 manifest paths hardcoded to one
  stack's two files, HUM-1's PascalCase path fragments, and the MET-08 lockfile paths. The count of remaining
  instances is unknown and the discovery cost is one edition each, which is the expensive part. The candidate
  mechanism is named and unbuilt: run the shared tools against a synthetic minimal edition fixture in the loop,
  so a newly hardcoded path fails on the fixture rather than on the next real stack. **Why not minted:** the
  mechanism does not exist, and the catalog applies "a mechanism must be enforced, not intended" to product code
  while the kernel's own shared tier is the one place it has never been applied to itself. That asymmetry is the
  argument for the claim and it is also why minting it today would be the failure it describes. **What settles
  it:** building the fixture, at the next pass that touches the shared tier.

- **11b. A scan cannot be run over the file that declares its own predicate.** From E-5 and its second instance.
  Two instances now, in mechanisms sharing nothing but their shape: the conformance generator broke on the
  README sentence documenting its own markers, splicing a table into the middle of a sentence and then guarding
  the wrong sixty lines, and the configuration scan reported its own exemption list and its own registry file.
  The general form is that a registry of forbidden values contains the forbidden values, so the scan's own
  declaration site is inside its own surface. **Why not minted:** two instances, both inside this repository's
  own tooling rather than in a product, so the generality is asserted and not measured; the register's own
  closing standard was "one instance is not a pattern yet" and two in the same tree is barely more. **What
  settles it:** a third instance in product code, or a second edition hitting it in a mechanism nobody here
  wrote. Note the workaround is already known and cheap (declare no literal, as the finding-id check does), which
  lowers the value of minting and not the value of recording.

- **A cross-claim dependency field in the conformance record.** Deferred out of ruling 4, which ruled the
  within-a-claim half and stopped there. The evidence is one witness: CFG-1's mechanism class ends by delegating
  its two right homes to SEC-5 and DATA-5, so CFG-1's enforcement is complete only if two other claims are
  realized, and a record that is one row per claim has nowhere to say it. Measured as unremarked in the first
  edition, where all three read `proven` and the composition held by accident of scheduling. The candidate is a
  dependency field plus a check that a claim is not `proven` while a claim it depends on is `owed`. **Why not
  built:** one witness, a real build cost, and it interacts with the per-obligation structure ruling 3 has just
  added, so building both in one pass would mean neither had been used before it was extended. **What settles
  it:** a second claim whose enforcement rests on another claim being realized, which the next build pass will
  either produce or fail to.

## Still queued (methodology and edition items, not claim-shaped)

- **PC-8 Provisioning feedback.** Applies when a CLI provisions accounts or credentials. An
  upserting command reports created versus updated; silent upsert turns a typo into a phantom
  account. Home: the edition's CLI idiom when the first provisioning command ships.
- **PC-9 Proposal visibility.** Universal (harness ergonomics). A proposal requesting a ruling is
  visible in the same surface as the question that asks for it. Home: skill guidance.
- **PC-11 Scenario id registry.** Universal. Test and scenario identifiers allocate from one
  project-wide registry, never per-slice ledgers minting from the same namespace. Home: the
  derive-tests skill and the ledger template.
- **PC-15 Configuration-driven UI for template-shaped products.** Applies when the product is an
  instance of a template family. The UI renders configuration; new instances are content, not
  code. Claim-shaped only for that product class; held here so the vertical does not leak into
  the universal catalog.
- **PC-18 Green-fields data posture.** Universal. Decompose names the data posture (abandonable
  dev data or preserved); recorded as a decompose step, not a claim.
- **PC-19 The commodity-decision tier.** Universal (turn reducer). The builder takes and records
  mechanism-level calls without stopping; only novel or irreversible calls stop for the human.
  Home: the implement skill.
- **PC-20 Ruled pre-authorization.** Universal (turn reducer). A standing unconditional turn can
  be pre-authorized by an explicit ruling; the pre-authorization is itself the recorded turn.
  Home: the implement skill and HUM-1's weakening notes.
- **PC-22 Seed manifest must not assume a design export.** Universal. A green-field project has
  no prototype until gate 2a; the manifest defers the design-dependent steps. Home: edition
  manifest fix.
- **PC-23 Docs-lint root allowlist carries the method's own root files.** Universal. Home:
  edition lint fix.
