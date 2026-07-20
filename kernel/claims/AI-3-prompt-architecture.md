---
id: AI-3
family: ai
locus: centralized
provenance: PC-5 (P2 extraction, 2026-07-21)
---

# AI-3: Prompt architecture

**Statement.** Every model-facing prompt (personas, task instructions, rubrics) is configuration, versioned beside the content it governs, validated at load (a missing prompt block fails the boot), and assembled at one seam in the application layer; the transport port carries only the wire-format contract the parser depends on. Where one rubric governs both a generation pass and an evaluation pass, both assemble from the same configuration: generation carries the whole rubric, evaluation carries only the unit under review.

**Harm.** Prompts split across code and configuration cannot be read, compared, or evolved together, and a generation pass fed a thinner rubric than the evaluation pass drifts until the system rejects its own generated examples, which is a product-breaking coherence failure no deterministic tier can catch. The reference instance did exactly this: a hard-coded persona beside configured lesson rubrics, examples the reviewer then refused.

**Enforcement.**
- Mechanism class: configuration validation at load (fail-fast, DATA-5) plus an architecture test banning prompt-shaped literals outside the wire-contract seam, a heuristic registry in the CFG-1 pattern; the client mirror of the config type rides CON-2.
- Edition: owed; trigger: the first model-backed feature in an edition project.

**Weakening notes.** Prompt-shaped literal detection is heuristic; the structural defense is the single assembly seam, which makes the wrong home harder than the right one. Applies when a product is model-backed; an edition project without model features records nothing.
