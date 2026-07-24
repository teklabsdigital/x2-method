---
id: PERF-6
family: performance
locus: centralized
provenance: patterns pass 2026-07-24 (performance stream: cloud-microbenchmark variability studies, Laaber and Leitner class; change-point detection over benchmark series, Otava and Conbench class; Tene's coordinated-omission analysis)
---

# PERF-6: Wall time is never asserted raw

**Statement.** No test in any tier asserts an absolute wall-time threshold. Wall time is compared only in two sanctioned forms: pre-merge, through a benchmark harness doing warmup, repetition, and a robust statistical comparison on controlled hardware; or post-merge, through change-point detection over a published series of benchmark results, with a written fix-or-revert norm so a detected regression has an owner and a deadline rather than a dashboard. Latency measurement under load uses open-model generation, because closed-loop load generators stall with the system under test and report the coordinated-omission fiction.

**Harm.** An absolute-milliseconds assertion on a shared CI runner meets 30 to 50 percent run-to-run variance; at a 2 percent regression threshold that is a false alarm nearly every other run. The team either deletes the test or loosens it until it can never fail; both outcomes destroy the discipline, and the second is worse because it looks like coverage. Every other PERF claim exists so that what can be gated deterministically is; this claim exists so that what cannot be is measured honestly instead of pretend-gated.

**Enforcement.**
- Mechanism class: a banned-API lint over test directories rejects raw timing assertions (stopwatch-comparison idioms, elapsed-time asserts); the benchmark harness, the published results series, and the fix-or-revert norm are policy backed by review, and the catalog says so plainly rather than dressing policy as mechanism.
- Edition: owed; trigger: the first wall-time benchmark in an edition project; the lint half can land at the next edition build pass, ahead of any benchmark existing, since its job is to keep the first timing assert out.

**Weakening notes.** The lint is the strong half; the statistical-control half is the weakest mechanism in the family, named as such: review enforces that benchmarks use the harness, and no scan proves a published series is being watched. The claim bans a practice more than it builds one, and that is its value: the banned practice is the one that was going to be written first. Timeout assertions (a test failing because RES-1's deadline fired) are not wall-time assertions and are exempt; they assert behavior at a bound, not speed.
