---
id: CON-2
family: contracts
locus: per-seam
locus_note: one fixture per mirrored contract
provenance: X-10
---

# CON-2: Hand-mirrored contracts are pinned by a shared fixture both sides test against

**Statement.** Every cross-boundary contract maintained by hand on both sides (an enum, a DTO shape, a parser grammar) is pinned by one shared fixture corpus, physically the same file, exercised by tests on both sides of the boundary. Drift on either side fails that side's build. If a slice generates client types from the server schema instead, the obligation collapses to the generator running in the build; never double-mandate.

**Harm.** Mirrored contracts drift silently: the server renames a union member, the client keeps parsing the old one, and the failure surfaces as a runtime blank screen weeks later. A catalog can name this the norm it wants while the system still carries live casing and union drift wherever the pattern was not actually applied.

**Enforcement.**
- Mechanism class: a single fixture file consumed by the client test natively and physically linked into the server test project, so there is exactly one corpus and no copy to rot.

**Weakening notes.** The claim is scoped to hand-mirrored contracts only. Composes with CON-1: the single enum converter keeps the set of things needing fixtures small.

The mechanism carries a precondition the statement does not name, and naming it is what keeps the statement from being read as universal: **both consumers must live under one root that travels together.** A physical link is a path, and a path holds only while the two ends move together. Where the two consumers are independently copyable (two trees each of which must stand alone after being copied elsewhere), whichever tree does not own the fixture holds a path that breaks the moment it is copied, so "physically the same file" is not merely inconvenient there, it is unrealizable. Measured on this repository's own shared tier, which is that shape.

Where the precondition does not hold, the sanctioned alternative is **one authoritative source plus a materializer with a drift check**: the corpus has exactly one home, a tool copies it into each consumer, and the tool's check mode fails the build when a copy differs from the source. That is mechanically equivalent to the link for drift purposes and weaker than the ruling in one stated respect, that the copies exist and a reader can edit one. It is the sanctioned alternative and not a general escape: it costs a build step and a check that must run in the loop, so a slice that can share a physical file still owes the file. Two copies plus a test comparing them remains rejected, and the difference is that a materializer has a source and copies, where the rejected shape has two peers and an opinion.
