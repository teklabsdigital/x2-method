---
id: DATA-10
family: data
locus: centralized inventory, per-class sweep
provenance: patterns pass 2026-07-24 (resilience stream: Nygard, Release It!, steady state)
---

# DATA-10: Everything that grows has a registered sweep

**Statement.** Every append-only artifact the system produces (a log sink, the outbox, an audit table, a quarantine queue, a temp directory) is registered with the purge or rotation mechanism that bounds it, and each mechanism is a tested seam. An append-only artifact with no registered sweep is a defect, found at the merge that introduces the artifact, not at the disk-full incident.

**Harm.** Retention by accident. Disk-full kills the node at an hour chosen by arithmetic, not by anyone; the ever-growing table degrades every query and backup that touches it; and the eventual remedy is an emergency hand-run purge against production, the exact unledgered access TEN-5 exists to kill. DATA-7 rules how long PII may live; nothing before this claim ruled that operational growth ends at all.

**Enforcement.**
- Mechanism class: an inventory architecture test over marked append-only entities and declared sinks asserts each is registered with a sweep (the TEN-3 marker idiom on the entity side); each sweep is a named, tested seam, idempotent, and ledgered under TEN-5 where it crosses tenants; sweep clocks are CFG-1 operational settings.
- Edition: owed; trigger: the first append-only operational table in an edition project (DATA-8's outbox is the likely first, with RES-5's dead-letter quarantine close behind).

**Weakening notes.** Distinct from DATA-7 by subject and clock: DATA-7's bound is a legal ruling about personal data; this claim's bound is an operational ruling about disk and query health, and one table can owe both (an audit table with PII has a DATA-7 class and a DATA-10 sweep, and the sweep must not outrun the legal bound). The marker sweep proves registration, not sufficiency; a sweep that cannot keep up with the growth rate is a load question the claim surfaces at review, not one the scan can answer.
