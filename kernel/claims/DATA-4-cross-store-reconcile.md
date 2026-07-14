---
id: DATA-4
family: data
locus: per-seam
provenance: X-9
---

# DATA-4: Cross-store sequences are durable-first, idempotently kicked, and reconciled

**Statement.** Any sequence spanning two stores, or a store plus an external system, follows one shape: write the durable row first, kick the follow-on step idempotently, and run a reconcile sweep that converges the system after a crash between steps. A cross-store sequence with no reconciler is a defect.

**Harm.** Partial completion: the payment row exists but the provider was never called, or the provider succeeded and the crash ate the row. Without a reconciler these states are permanent and discovered by customers.

**Enforcement.**
- Mechanism class: per-seam obligation composing with DATA-3: each cross-store seam names its reconciler and carries a crash-window test (kill between step one and step two, assert the sweep converges).
- Edition: owed, trigger: first cross-store sequence; a proven reconciler practice is the exemplar lifted then. The pattern rule stands: status is a projection of durable rows, not a separately mutated field.

**Weakening notes.** Same honesty as DATA-3: enforcement is named-test-per-seam. The reconciler must itself be idempotent and tenant-scoped via TEN-5 if it sweeps across tenants (global pollers are ledger entries).
