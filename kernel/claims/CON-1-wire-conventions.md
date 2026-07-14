---
id: CON-1
family: contracts
locus: centralized
provenance: Bucket 3
---

# CON-1: One wire dialect

**Statement.** The API speaks one dialect everywhere: errors are RFC 9457 problem details; JSON property names are camelCase; enums cross the wire as closed string sets registered through a single converter configuration; identifiers are opaque strings. No endpoint invents its own error shape, casing, or enum encoding.

**Harm.** Per-endpoint dialects multiply client-side special cases, and every special case is a place where generated or hand-written client code silently disagrees with the server. Recorded casing and union drift is this harm realized.

**Enforcement.**
- Mechanism class: one host-level serialization and error-handling configuration point, plus contract tests asserting the dialect (a probe endpoint's error shape, enum round-trip through the single converter).
- Edition: single `JsonStringEnumConverter` + camelCase policy registered once in the host; problem-details middleware; a wire-conventions test in the arch project asserting no second serializer configuration exists.

**Weakening notes.** Closed enum sets on the wire mean adding a member is a contract change: it gets the unconditional human turn that all external contracts get. That is a feature of the claim, not a cost.
