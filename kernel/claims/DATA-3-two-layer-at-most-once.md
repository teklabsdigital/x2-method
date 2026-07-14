---
id: DATA-3
family: data
locus: per-seam (named tests per side-effecting seam)
provenance: X-9
---

# DATA-3: Every irreversible side effect carries two independent at-most-once layers

**Statement.** Every externally irreversible or duplicable side effect (send, charge, book, provision) carries two independent protections: a record-side uniqueness constraint on (tenant, idempotency or natural key), and a write-side second layer chosen explicitly for the seam (provider create-or-get marker, send-side status guard, or structurally append-only insert). Record-side-only is a defect.

**Harm.** Double-send, double-charge, double-book. Retries, crashes between write and send, and concurrent workers all produce duplicates that a single UNIQUE constraint alone does not stop once the effect happens outside the transaction.

**Enforcement.**
- Mechanism class: a per-seam obligation, honestly stated: every side-effecting seam a slice introduces names its two layers, reviewable via the entity configuration (the UNIQUE index is visible) plus a named behavior test including the race case.
- Edition: owed, trigger: first idempotent external side effect. A proven practice (multiple UNIQUE-constrained sites with behavior tests including races) is the exemplar lifted then; the claim file is cited in slice review.

**Weakening notes.** A static arch test cannot prove layer two exists; this claim's enforcement is named-test-per-seam, and pretending otherwise would be the aspirational-claim failure this catalog exists to prevent. Clinical batch jobs and external syncs need this discipline as much as billing does; it is domain-agnostic.
