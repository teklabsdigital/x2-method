---
id: PERF-3
family: performance
locus: per-seam
provenance: patterns pass 2026-07-24 (performance stream: counted-cost scaling ratios; the accidentally-quadratic failure literature)
---

# PERF-3: A designated algorithmic seam proves its scaling with a counted ratio

**Statement.** Each designated algorithmic seam (a hand-written loop, join, or aggregation over input that production will grow) carries a scaling test: run the seam at size N and at size kN, count a deterministic cost (iterations, comparisons, queries, bytes), and assert the ratio of costs stays under a generous ruled bound. Linear work at k=10 shows a ratio near 10; quadratic work shows near 100; the bound sits far from both so the test flakes on neither.

**Harm.** Accidentally quadratic code passes every functional test, because functional tests run at toy N, and dies at production N, where "dies" means a request that took 40 milliseconds takes 40 seconds the week the customer's data crosses the threshold. The failure class is famous precisely because it recurs: nothing in a correct-output assertion resists it.

**Enforcement.**
- Mechanism class: a two-size ratio property test on a counted quantity, instrumented at the seam (a counter threaded through the algorithm, a query counter, a byte counter); counted cost only, never wall time, so the test is deterministic on any runner.
- Edition: owed; trigger: the first hand-written algorithm over unbounded input in an edition project; library calls and database queries are not designations (the library's complexity is its documentation's promise, and query shape is PERF-1's and DATA-2's).

**Weakening notes.** The ratio gate catches complexity-class regressions, linear versus quadratic, which is the class that kills; it honestly cannot distinguish n from n log n, and fitted big-O assertion over timings is excluded from the catalog as unmechanizable (curve fitting on noise). Choice of N matters: too small and constant factors dominate the ratio; the test's N is part of the seam's designation and sized so the asymptotic term dominates.
