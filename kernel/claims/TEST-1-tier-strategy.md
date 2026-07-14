---
id: TEST-1
family: testing
locus: centralized
provenance: X-12, B2-8 superseded
---

# TEST-1: Three test tiers, each on a real engine, all in the loop

**Statement.** Tests run in three tiers. Unit/service tier: database-free by design (pure decision logic); where a data shape is unavoidable, a real embedded engine, never a fake in-memory database provider. Integration tier: the real target engine in disposable containers, a unique database per run, real migrations applied, exactly one provisioning path. End-to-end tier: a small suite through the real client service layer (TEST-2). All three tiers run in the CI loop.

**Harm.** Fake in-memory providers pass queries the real engine rejects and miss the semantics tenancy depends on (query filters, collations, constraint behavior): the tests go green on behavior production does not have. One system carried this live in several unit files while a comparable one avoided it. Divergent provisioning paths (a container-based path plus a parallel shell-docker path) rot into "which one is true".

**Enforcement.**
- Mechanism class: the skeleton ships the three tiers wired and the CI loop runs them; an arch check bans the fake in-memory provider package from test projects.
- Edition: SQLite (in-memory and temp-file) for the fast tier; Testcontainers with unique database per run and real migrations for integration (the strongest database-test mechanism found during extraction); the EF InMemory package reference is a build failure.

**Weakening notes.** SQLite in the fast tier is a deliberate semantic compromise for speed: anything touching engine-specific behavior (collation, RLS, locking) belongs in the integration tier, and the tier split in the skeleton says so. CI cost governs tier sizing: the expensive engine is confined to the tier that needs referential integrity; e2e stays small because acceptance tests are decisions, not consequences.
