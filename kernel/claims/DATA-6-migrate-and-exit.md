---
id: DATA-6
family: data
locus: centralized
provenance: PC-12 (P2 extraction, 2026-07-21; owner-flagged in the source ledger)
---

# DATA-6: Migrate and exit

**Statement.** Every host ships an explicit migrate mode that applies migrations and exits without ever starting the serving process, and a serving boot never migrates as a side effect. Migrate mode needs only the connection string, never runtime secrets, so it runs in contexts (pipelines, init containers) that hold no serving configuration. Scripts and CI delegate to the mode; design-time tooling is not the production migration path. Throwaway test databases may auto-apply migrations at provisioning; that is the provisioning path, not a serving boot.

**Harm.** Boot-time migration couples schema change to process start: a crash-looping deploy holds schema locks, horizontally scaled instances race the same migration, a rollback boots old code against new schema mid-flight, and a serving boot silently performs the schema mutation HUM-1 says cannot happen without a named human approval.

**Enforcement.**
- Mechanism class: host tests assert the mode applies-and-exits without binding the serving surface, and that a serving boot performs no migration against a pending model; the composed tier boots only against an already-migrated database.
- Edition: owed; trigger: the next edition build pass (a small host change; the mechanism is two facts on the composed host).

**Weakening notes.** None material. The claim constrains hosts, not tooling; the ordering (migrate, then author assets if any, then serve) is the runbook's to state.
