---
name: slice-exit
description: Use when the builder believes the slice is green, to produce the slice-exit report that is the definition of green. Triggers before any green declaration and at slice close. Green is declared by the report and ratified only after intake audits it. Never declare a slice green in prose, and never skip a section because it is inconvenient.
---

# X2 Slice Exit

The definition of green. The pilot declared "all green" twice before it was true, and the true
state had to be extracted by interrogation; every "confirm X" the human issued was the same turn shape,
repeated because the method had no artifact in which the builder declares, with evidence, what
green means. This report is that artifact, and it has teeth: a slice without a complete report is
not green (MET-06).

## The report, produced unprompted when green is believed

1. **Tiers, run this session, with counts.** Every tier against the final tree: build, unit,
   architecture, integration, e2e, client verification. A stale last-known-good is marked as
   stale, never presented as run.
2. **Composed-app smoke result.** The actual entrypoint, at least one real request per primary
   flow. The pieces passing their own tests is not the product running (INV-07).
3. **Service-method coverage table.** Method, UI surface, harness scenario; gaps named. A method
   without UI in the locked portion is reported as the sanctioned UI-unsurfaced state with its e2e
   scenario and boundary note (CONF-03), so the skew is visible and deliberate.
4. **Unsurfaced decisions.** Must be none. Anything the build decided that the human never saw is
   listed here now, not discovered later.
5. **Pending rulings owed to the human.**
6. **Prototype-lock status.** The lock on record, provenance stamped, any owed fidelity items
   named (UI-4).
7. **The slice turn count, from the ledger.** The ledger file governs; a count remembered by the
   builder does not (MET-05).

Plus one standing check: any phase that started without its gate on record (stories, prototype
approval, the lock) is a methodology violation and is surfaced here (MET-07).

Scripted where mechanical (tier counts, the coverage diff), authored where judgment is needed
(deviations, pending rulings).

## The audit

Intake audits the report before ratification. The builder does not grade its own green; "sound" is
intake's word to give. The human's turn becomes reading one document, not extracting it.

## Open question this skill carries

Where the report lives: the pilot used the repo's working docs; the alternative is the extraction
record. Carried on the record; the pilot's `docs/work/` is the working default until ruled.

## What this skill must NOT produce

- No green-by-prose, no partial reports, no stale results presented as fresh.
- No new build work; if producing the report surfaces a gap, the slice re-enters implement and
  the report is produced again from the top.
