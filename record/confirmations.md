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
