---
id: PERF-1
family: performance
locus: per-seam
provenance: patterns pass 2026-07-24 (performance stream: counted-work gating; Django assertNumQueries lineage; N+1 detection practice, Prosopite class)
---

# PERF-1: A hot operation's IO is counted, budgeted, and gated

**Statement.** Every designated hot operation carries a named test asserting the maximum count of SQL statements and outbound roundtrips it performs for a defined workload. The budget is a constant in the test, changed only by a reviewed diff, so an efficiency regression arrives as a red test and a visible number, not as a latency graph months later. A count that grows with collection size is a defect regardless of budget: six queries for one row that become one hundred six for one hundred rows is the N+1 shape, and the test's workload is sized to expose it.

**Harm.** The N+1 endpoint works in dev, demos beautifully, and melts in production, because its cost scales with data the tests never had; by then the fix is a rewrite under incident pressure. Wall-time tests cannot gate this (see PERF-6), but the statement count is deterministic: the same code and workload produce the same count on any machine, which is what makes it a merge gate instead of an aspiration.

**Enforcement.**
- Mechanism class: test-time counters at the driver or transport seam (a command interceptor, a query-event hook, a recording transport with call-count assertion) wrapped around the designated operation at a defined workload; the budget constant lives in the test.
- Edition: owed; trigger: the next edition build pass (the v1 exemplar's list endpoint is the first designated seam; the interceptor rides the same seam TEN-4's stamps use).

**Weakening notes.** Per-seam by design: "hot" is a D-000 designation, not a property a scan can discover, so undesignated operations are ungated and the designation list is a review item at each slice. The count gates statements and roundtrips, not their cost; a budget of three obscene queries passes where one lean query would not, so DATA-2's bounded-read shape is the companion, not a substitute. Payload-size budgets (bytes per response for a defined workload) are the same mechanism pointed at a different counter and join the seam's test when a seam's risk is size rather than chattiness.
