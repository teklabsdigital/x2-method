---
id: DOC-1
family: documentation
locus: centralized
provenance: X-14 (user-raised)
---

# DOC-1: Documentation has one home per kind, explicit authority, and a death date

**Statement.** Every committed document belongs to one kind from a closed registry, lives in that kind's single legal root, and carries front matter declaring its kind and status (authoritative, working, archived). Only claims, decisions, and contracts are authority, and authority runs one way. Where a descriptive or working document disagrees with code, the code wins. Where code disagrees with a decision or a claim, the code is the defect (a projection that drifted, or an unrecorded decision hiding in source), reconciled by regeneration or a human ruling, never by deferring to the code: in X2 the decision is the asset and the code is a disposable projection, so silent deference to source is the exact inversion the method exists to prevent. Either way the disagreement is surfaced, never silently reconciled. Process byproducts die at slice completion: durable rulings are promoted into decisions or claims, then the slice's working folder is archived; an archived document is never cited as authority. Descriptive documentation is not a stored kind: the code is the documentation, and narrative snapshots are generated on demand and discarded, never committed.

**Harm.** The observed pathology in both repos: docs/, specs/, docs/specs/, parallel archives, dozens of handover and status files, no marker of authority. A tidier tree without a lifecycle rule is a tidier landfill; worse, an AI or human citing a stale plan as truth acts on fiction.

**Enforcement.**
- Mechanism class: a docs-lint gate in the CI loop: every markdown file under docs/ has valid front matter with a registry kind; no markdown outside the legal roots; working documents carry a slice id; status transitions move only forward.
- Edition: registry roots `docs/{claims,decisions,contracts,runbooks,work/{slice}}`; repo root holds README.md and CLAUDE.md only; the skeleton ships the tree and templates so each kind lands deterministically (MOD-2 applied to prose).

**Weakening notes.** The docs-lint proves placement and shape, not the authority direction; code disagreeing with a decision is caught by the human-turn discipline, not by this scan. The structural fix matters more than the lint: X2 itself shrinks byproduct volume (the locked prototype is the acceptance contract; plans are consequences), so the registry stays small. No per-document ownership metadata, no elaborate taxonomy (YAGNI).
