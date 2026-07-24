---
id: DEP-2
family: dependencies
locus: centralized
provenance: compliance-mapping pass 2026-07-24 (vulnerability-remediation clocks: E8 patch-applications; SOC 2 TSC CC7.1)
---

# DEP-2: A standing advisory sweep with a ruled remediation clock

**Statement.** A CI job runs the ecosystem advisory audit over the exact set DEP-1 ledgers: the committed lockfiles and the pinned container-image digests. It runs on every push and on a schedule, so a quiet repo still hears an advisory published between pushes. An advisory against a ledgered dependency opens DEP-1's patch carve-out with a ruled remediation clock, and the job stays red until a patched version or an explicit owner waiver lands as a ledger row (advisory id, date, reason). The clock values live beside DEP-1's cooling-off window in the ledger header: one home for ruled numbers.

**Harm.** DEP-1 vets what enters and then never looks again: yesterday's vetted dependency is today's advisory, and without a standing sweep the project learns of it from an incident instead of a feed. Remediation without a clock decays into a backlog column, and DEP-1's below-floor patch carve-out, which exists precisely for this moment, sits inert with nothing to trigger it.

**Enforcement.**
- Mechanism class: a CI audit job in locked mode over lockfiles and image digests (push plus schedule); ledger rows record remediation or waiver; the docs-lint ledger check extends to waiver rows.
- Edition: owed; trigger: the first armed CI loop (TEST-3 at instantiation); the publish-date check DEP-1 names as its upgrade path rides the same job.

**Weakening notes.** Advisory databases lag and miss, so the sweep is a floor, not a proof of absence. A transitive advisory with no exploitable path in this product is waived as a ledger row with a reason, never a suppressed feed; a suppression that outlives its reason is exactly the decay the ledger check exists to catch.
