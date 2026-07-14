---
id: TEST-3
family: testing
locus: centralized
provenance: B2-1, the headline extraction finding
---

# TEST-3: Every enforcement mechanism in this catalog runs on every push, and the loop gates merges

**Statement.** A claim whose mechanism runs only when a developer remembers to run it is aspirational, not enforced. Every mechanism this catalog names executes automatically in CI on every push and pull request, and the loop gates merges: build with warnings as errors, locked-mode dependency restore, architecture tests, unit tier, integration tier (containers), e2e deterministic tier, client typecheck plus lint plus tests, docs-lint.

**Harm.** The headline finding of the extraction: both source systems carried strong, verified enforcement mechanisms and zero CI. Every guarantee in both catalogs was one forgotten command away from false, and one system's own documentation claimed "every build" for tests that no build ran. The gap between claimed and actual enforcement is exactly where incidents live.

**Enforcement.**
- Mechanism class: the pipeline itself, plus branch protection requiring the pipeline. This claim is self-referential by design: it is the mechanism that makes every other claim's "enforced" tag true.
- Edition: a GitHub Actions workflow in the kernel skeleton running the full gate set; the arch-test project is a single, unfilterable job (X-8: never split flagship guards into a skippable suite); branch protection on the default branch.

**Weakening notes.** CI cost is managed by tier design (TEST-1), not by dropping gates. If a gate must be temporarily bypassed, the bypass is a visible, dated waiver in the ledger, never a deleted job: an invisible bypass recreates B2-1 one convenience at a time.

The loop gates only once branch protection *requires* it, and arming branch protection is an instantiation step separate from the workflow file. Until it is armed, the pipeline runs but blocks nothing, and every other claim's enforced tag is conditional on that step: a strong mechanism that enforces nothing is B2-1 exactly, now one instantiation step away rather than one forgotten command. "Set at instantiation" is the kind of step that gets skipped, so the kernel acceptance test must verify that instantiation actually arms the gate, not merely that the workflow file exists.
