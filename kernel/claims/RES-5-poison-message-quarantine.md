---
id: RES-5
family: resilience
locus: centralized declaration, per-queue test
provenance: patterns pass 2026-07-24 (resilience stream: Enterprise Integration Patterns, dead-letter channel; SQS redrive policy; Azure Service Bus dead-lettering)
---

# RES-5: A poison message is quarantined at a counted limit, never retried forever, never dropped

**Statement.** Every queue or subscription the system consumes declares a maximum delivery count and a dead-letter route. A message that fails processing lands in quarantine after exactly that many attempts while the queue keeps draining behind it, and quarantine emits a security/ops event through OBS-2's emitter so the failure is a recorded fact, not a disappearance. Consuming a queue with no declared limit and no dead-letter route is a defect.

**Harm.** One malformed message retried forever blocks the queue head and stalls the whole subsystem behind a single bad payload; the opposite default, discard on failure, loses work silently and permanently. Both failure modes are invisible in functional tests because both need a message that cannot succeed, which no happy-path suite sends.

**Enforcement.**
- Mechanism class: a configuration assertion test enumerates every declared queue and subscription and asserts the delivery limit and dead-letter route exist; each queue owes a named test that feeds a poison message and asserts quarantine at exactly N attempts with the queue still draining and the OBS-2 event emitted.
- Edition: owed; trigger: the first message broker in an edition project (the transactional outbox relay, DATA-8, is the likely first consumer).

**Weakening notes.** Quarantine is containment, not resolution: what drains the dead-letter queue (replay tooling, an alert, a runbook) is operational design the claim names but does not mandate, and an unwatched quarantine is retention by accident, which puts it under DATA-10's sweep registry like any other append-only artifact. The per-queue test is honestly per-seam; no scan proves a future consumer declared its limits, so each new queue owes its test at its slice.
