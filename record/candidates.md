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
