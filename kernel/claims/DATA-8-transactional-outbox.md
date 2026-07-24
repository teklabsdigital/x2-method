---
id: DATA-8
family: data
locus: centralized restriction, per-seam crash proof
provenance: patterns pass 2026-07-24 (architecture stream: microservices.io transactional outbox; AWS Prescriptive Guidance, outbox pattern)
---

# DATA-8: A state change and its event commit together or not at all

**Statement.** When a state change must be announced (an event published, a follow-on triggered), the announcement is written as an outbox row in the same transaction as the state change; one relay module owns reading the outbox and publishing to the broker, with at-least-once delivery and DATA-3's consumer-side discipline absorbing the duplicates. No service-layer type references the producer client: the relay is the only publisher in the codebase.

**Harm.** The dual write. Commit the state then crash before publishing, and downstream never learns: the order exists and nothing ships. Publish then fail the commit, and downstream acts on a phantom: something ships for an order that does not exist. Both are silent, both are found by customers, and no amount of retry logic at the call site fixes a fault that lives between two systems' commit points. This is the producer-side complement of DATA-3 and the prevention for the exact crash window DATA-4's reconciler mops up.

**Enforcement.**
- Mechanism class: an architecture test restricts producer-client types to the relay namespace, so a service publishing directly cannot merge; the outbox write is part of the save pipeline's tested surface; the seam owes a crash-window test in DATA-4's style: kill the process between commit and relay, restart, assert the event is delivered exactly as the row promised.
- Edition: owed; trigger: the first event publish in an edition project (arrives with the first broker, alongside RES-5).

**Weakening notes.** The outbox is an append-only operational table and therefore DATA-10's first customer: relayed rows are swept on a ruled clock or the outbox becomes the unbounded growth it was built to prevent. At-least-once is the honest guarantee; exactly-once is the composition of this claim with DATA-3 on the consuming side, and the claim says so rather than promising it alone.
