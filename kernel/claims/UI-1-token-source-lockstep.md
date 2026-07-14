---
id: UI-1
family: client-ui
locus: centralized
provenance: X-7, B2-3
---

# UI-1: One token source, tested in lockstep with the design system

**Statement.** The client has exactly one theme token source, transcribed from the design system artifact, and a lockstep test asserts token equality against that artifact: if either side moves, the test fails. No parallel palette or second token file exists.

**Harm.** The failure end-state: a clean central theme coexisting with hundreds of color literals and a full parallel hex palette that bypasses it. Without the lockstep test, the design system and the shipped product diverge one hex at a time and reconvergence becomes a project.

**Enforcement.**
- Mechanism class: a test that reads the design-system artifact directly and asserts the client token set matches it, with a minimum-token-count floor so an emptied artifact cannot vacuously pass.
- Edition: the skeleton's `tokenCoverage.test.ts` reads the design-system CSS, asserts token equality, and requires more than 50 variables; it ships wired to the project's design export location.

**Weakening notes.** Deliberate divergences from the design system (for example a single-token override) are structurally permitted by design: they live inside the token source itself, visibly, never scattered in components. Hand-authored derived values (alpha ramps) sit outside the coverage test; keep them in the token file where review sees them.

The lockstep is only real if the artifact the test reads is the machine-readable design-system export committed to the repo. If what is committed is a hand transcription of the design tool's output, the test compares a copy against a copy and the lockstep pins the wrong thing; the export itself must be the artifact under test, or generated from it in the build.
