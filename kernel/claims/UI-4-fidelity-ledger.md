---
id: UI-4
family: client-ui
locus: per-seam (one ledger per shipped screen)
provenance: X-7
---

# UI-4: Every shipped screen carries a fidelity ledger derived from the locked prototype

**Statement.** The locked design prototype is the acceptance contract for a screen. Each shipped screen carries a fidelity ledger enumerating its visual atoms with their resolved styles, and tests assert two directions: exhaustiveness (every atom in the ledger renders) and de-fabrication (nothing renders beyond the ledger). The AI cannot quietly drop or invent UI. The ledger is not maintained by hand alongside the prototype - that is two copies of one truth, the divergence UI-1 exists to forbid - it is exported from the locked prototype, and a lockstep test asserts the ledger matches the prototype, so a deliberately revised prototype yields a new ledger and the human turn is spent approving the prototype, which is where acceptance actually lives.

**Harm.** Generated UI drifts in both directions: silently omitted states the prototype specified, and fabricated elements the prototype never contained. Both read as "done" in a demo; only a two-directional ledger catches them mechanically.

**Enforcement.**
- Mechanism class: per-screen fidelity test suites asserting rendered-atom-set equality with the ledger and per-atom resolved style checks.
- Edition: the mechanism was proven extensively (multiple suites: ledger, exhaustiveness at the suite level, de-fabrication checks); the skeleton ships one exemplar fidelity suite as the copyable pattern (asserting atom-set equality in both directions; per-atom resolved-style assertions are not in v1). The ledger is derived from the locked prototype at the X2 Contract phase; deriving it is methodology work, enforcing it is this claim.

**Weakening notes.** Fidelity suites are the most maintenance-heavy tests in the catalog; they earn their cost because they are the acceptance contract made executable, which is decision-tier, not consequence-tier. A screen whose prototype is deliberately revised gets a new locked ledger through a human turn, never a test edited to pass. A ledger exception (a theme-invariant panel, a sanctioned divergence) is scoped to named atoms, never to a token family or a surface class; an exception scoped wider than its rationale hides real gaps behind it (PC-24, P2 extraction).

The v1 exemplar ledger is hand-authored: the prototype-to-ledger exporter is owed, and until it exists the ledger is a second hand-maintained copy of the prototype, carrying exactly the UI-1 divergence risk this claim's export mechanism is meant to remove. Building the exporter (a lockstep between prototype and ledger, mirroring UI-1's between design export and tokens) is the promotion that closes it; the trigger is the first slice with a design tool that emits a machine-readable prototype.
