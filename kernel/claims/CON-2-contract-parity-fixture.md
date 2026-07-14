---
id: CON-2
family: contracts
locus: per-seam (one fixture per mirrored contract)
provenance: X-10
---

# CON-2: Hand-mirrored contracts are pinned by a shared fixture both sides test against

**Statement.** Every cross-boundary contract maintained by hand on both sides (an enum, a DTO shape, a parser grammar) is pinned by one shared fixture corpus, physically the same file, exercised by tests on both sides of the boundary. Drift on either side fails that side's build. If a slice generates client types from the server schema instead, the obligation collapses to the generator running in the build; never double-mandate.

**Harm.** Mirrored contracts drift silently: the server renames a union member, the client keeps parsing the old one, and the failure surfaces as a runtime blank screen weeks later. A catalog can name this the norm it wants while the system still carries live casing and union drift wherever the pattern was not actually applied.

**Enforcement.**
- Mechanism class: a single fixture file consumed by the client test natively and physically linked into the server test project, so there is exactly one corpus and no copy to rot.
- Edition: the C# test csproj links the client's JSON fixture (`None Include` with `Link`), TypeScript and C# tests assert the identical corpus, and the fixture embeds a comment naming the invariant and both consumers. The skeleton ships one linked fixture as the copyable pattern.

**Weakening notes.** The claim is scoped to hand-mirrored contracts only. Composes with CON-1: the single enum converter keeps the set of things needing fixtures small.
