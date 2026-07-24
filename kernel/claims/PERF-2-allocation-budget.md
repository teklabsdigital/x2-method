---
id: PERF-2
family: performance
locus: per-seam
provenance: patterns pass 2026-07-24 (performance stream: allocation gating; BenchmarkDotNet GcStats and JMH gc.alloc.rate.norm lineage; JfrUnit)
---

# PERF-2: A designated hot path's allocations are budgeted per operation

**Statement.** Each designated hot path carries a test asserting bytes allocated per operation within a ruled budget, zero where the ruling says zero. Designation is a D-000 act naming the path and its budget; the mechanism is the platform's allocation accounting asserted in a test, which is deterministic per operation in the way wall time is not. An undesignated path owes nothing; a designated one cannot regress silently.

**Harm.** Per-operation garbage converts throughput into collector pause time, and the regression is functionally invisible: every test passes, every result is correct, and the service spends a growing fraction of its life paused. It compounds monotonically (each convenience allocation stays), and by the time it shows in production latency the cause is spread across fifty commits nobody can bisect by eye.

**Enforcement.**
- Mechanism class: allocation diagnostics asserted per operation in the test tier (GC-statistics bytes-per-op, normalized allocation rate, tracing allocators, counting allocators, depending on runtime); the budget is a reviewed constant, like PERF-1's.
- Edition: owed; trigger: the first designated hot path in an edition project; designation before need fails the YAGNI gate, so the family expects most projects to hold zero designations for a long time, honestly.

**Weakening notes.** Allocation accounting quality is runtime-dependent, and the claim is honest about the floor: managed runtimes with per-operation GC statistics support the assertion well; native code uses a counting allocator; JavaScript under V8 has no reliable per-operation allocation assertion, so a Node edition realizes this claim as leak-class scenario diffing (heap growth over k iterations of the path) and says so in its conformance row rather than claiming the per-op budget it cannot measure. Bytes allocated is a proxy for collector pressure, not a latency promise; PERF-6 governs any wall-time verification of the improvement.
