---
kind: record
status: authoritative
---

# Confirmations

Claims and disciplines that held under real load, recorded so no later pass reopens them without
new evidence. Confirmations matter as much as defects: they are the parts of the method that no
longer need attention.

From P2 (ruled 2026-07-21):

- **CF-1 Gate discipline.** A resume directive is never a gate. Held across many compactions and
  session breaks; the gate question was always put explicitly and never assumed (MET-07).
- **CF-2 Green is the report.** The exit report defined green every time; completeness
  interrogations went to zero (P1 needed them repeatedly), and one slice shipped with zero
  mid-build human turns.
- **CF-3 The verbatim-fidelity pipeline.** Import, byte-level transform, re-lock, fidelity
  ledger, and de-fabrication tests survived repeated spine revisions and governed every
  locked-surface delta; fabrication and drift were caught, not shipped.
- **CF-4 Deterministic naming and placement tests** caught real misplacements three times during
  normal work, at the moment of writing, not at review.
- **CF-5 The deny-by-default endpoint spine** held under two adversarial audits, and the abuse
  layer proved live in the field when a stale server rate-limited a test run.
- **CF-6 No-PII and no-enumeration discipline** actively steered three separate designs before
  any defect fired (opaque public addressing, hashed cache keys, identity never in URLs).
- **CF-7 Operational settings as configuration** absorbed many owner turns at one-value cost
  (model flips, sender addresses, analytics identifiers).
- **CF-8 The dependency cooling-off policy** held under pressure: new packages pinned past the
  window, release dates verified before adoption.
- **CF-9 Migrations as unconditional human turns** held every time, and a ruled pre-authorization
  released the standing turn without loss of control.
- **CF-10 The append-only ledger** survived 157 turns and multiple compactions with recording
  current when audited mid-flight.

From P3 (ruled 2026-08-06):

- **CF-11 The extension seam, proven by measurement.** A standing decomposition constraint (a new
  object kind joins by declaration; selection, locking, sync, undo, permissions and storage
  untouched) was measured, not asserted: the server took zero changes for an entire new-kind
  round. Caveat on the same record: the seam went unexercised for eight slices first; a seam is
  proven when measured.
- **CF-12 The pre-flight registers pay.** NS-2 and NS-3, mechanized after P2, pre-decided the
  public surface, serving identity and identifier shape at decompose, and the lock's exposure
  review caught what transcription would have shipped. The churn class P2 paid for did not
  arrive in P3.
- Re-confirmed under new load: CF-1 (every gate explicit, including three gate-1 re-approvals),
  CF-9 (every schema migration an unconditional human turn, held every time), CF-10 (the
  append-only discipline survived 269 turns and many compactions; its one weakness, turn
  numbering under parallel contexts, is repaired in seed's per-author ledger rule).
- **CF-2 annotated (P3):** green is the report held in form and strained in timing: one report
  landed two slices late, self-declared as the violation it was, and four were owed at
  extraction. The exit-debt line now in slice-exit is the repair; the confirmation stands.
- **CF-3 annotated (P3):** the verbatim import and re-lock pipeline held again; the hand-derived
  fidelity half failed by design and is replaced by mechanical derivation (derive-tests, PC-30).
  The confirmation narrows to the import and re-lock discipline it actually evidenced.
