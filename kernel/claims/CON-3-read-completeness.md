---
id: CON-3
family: contracts
locus: per-seam
provenance: PC-2 (P2 extraction, 2026-07-21)
---

# CON-3: Read completeness for action-bearing surfaces

**Statement.** A read that backs a user-facing surface returns every field the availability of that surface's actions depends on. No action's enabled state may derive from data that only a different flow populates (a form the user typed into on a path they did not take this time). Derived tests cover each action-bearing surface's cold-entry paths, fresh load and session restore, not only the flow that first populates the surface.

**Harm.** Every tier green while a restored session shows a dead primary action: the enabling field lived only in flow-local state, the read never carried it, and the one path the tests exercised happened to populate it. The reference instance shipped exactly this (an identity field living on a sibling record, a restore path with a disabled send), caught only by the owner using the product.

**Enforcement.**
- Mechanism class: per-seam derivation discipline: each action-bearing surface owes a cold-entry scenario in the derived acceptance suite asserting its actions are live from the read alone, with the session-restore path enumerated wherever the product has one.
- Edition: owed; trigger: the first edition project with a restorable session (the kernel exemplar has none).

**Weakening notes.** Honestly per-seam: no static scan can know which fields an action's availability depends on. The mechanism is the derivation rule plus the exit report's coverage table naming each action-bearing surface's cold-entry scenario; asserting more would be the aspirational-claim failure.
