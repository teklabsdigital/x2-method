---
id: DATA-11
family: data
locus: centralized
provenance: patterns pass 2026-07-24 (architecture stream: Fowler, parallel change; expand/contract practice; squawk-class migration linting)
---

# DATA-11: A migration never breaks the release running beside it

**Statement.** Schema change is expand/contract: a migration deployed with release N must be survivable by release N-1, because during a rolling deploy, and after a rollback, N-1 is still running against it. Destructive operations (drop, rename, type narrowing, adding NOT NULL without a default) are forbidden except in a migration tagged as the contract phase of a named earlier expand release. CI proves the property directly: the previous release's persistence tests run against the newly migrated schema and must pass.

**Harm.** A rename shipped with the code that uses the new name crashes every still-running N-1 replica the moment the migration lands, an outage placed precisely in the deploy window, the highest-risk moment available; and it forecloses rollback, because the old code cannot boot against the new schema. The failure needs two releases and a rolling deploy to manifest, so no single-version test tier can see it.

**Enforcement.**
- Mechanism class: a migration lint (squawk class) rejects destructive operations outside a tagged contract phase, and the tag must name the expand release it completes; an N-1 compatibility job in the CI loop checks out the previous release's persistence tier and runs it against the migrated schema; both gates sit alongside HUM-1's unconditional human turn on the same files.
- Edition: owed; trigger: the first production deployment with rolling replacement; the lint half can land at the next edition build pass, ahead of the compatibility job.

**Weakening notes.** DATA-6 rules how migrations run (an explicit mode, never a serving boot); this claim rules what they may contain; the two compose and neither substitutes for the other. The N-1 job proves persistence-tier compatibility, not full behavioral compatibility of mixed-version fleets; contract compatibility between releases is CON-4's half of the same rollout story. Single-instance deployments with downtime windows may re-rule the compatibility job at adoption, recording the decision; the lint keeps its value regardless, because rollback needs the same property the rollout does.
