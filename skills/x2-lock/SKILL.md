---
name: x2-lock
description: Use when the prototype is approved at Claude Design (gate 2a) and a slice's portion must be copied down into the repo and locked. Also use when a spine revision touches an already-locked portion and it must be re-locked. Requests gate 2b (the lock). Do not use before gate 2a, and do not derive tests here; that is x2-derive-tests, after the lock.
---

# X2 Lock

Copy the approved design artifact down into the repo, verify it is complete, stamp its provenance,
and request the lock. The lock is the acceptance contract for the slice; everything the builder
ships is held to it. The pilot ran without this step and paid twice: the design system was never
imported so the client's tokens were scraped from what happened to be readable inline (MET-04), and
the prototype was treated as locked for days before anyone asked for the approval (turn 25).

## The import

Pull the complete artifact set from the design project into `design/prototype/` (the canonical
home, INV-01):

- the prototype source (`<name>.dc.html`),
- the **complete** design-system export under `_ds/` (the token css, component css, fonts),
- the supporting scripts.

Never derive tokens from values readable inline in the prototype source. The pilot did, and
silently produced a partial, light-only, placeholder token set with the coverage floor skipped.
The client's token source derives from the export on disk, nothing else.

## Done-checks (all must pass before requesting the lock)

- The token file on disk defines the full variable set: the more-than-fifty floor is met, not
  skipped.
- Both themes are present: the dark root and the light override.
- Fonts resolve by a named path: binaries checked in, or a self-hosted font package pinned under
  the dependency ledger (the pilot's answer; the design MCP cannot carry binaries through context).
- `design/prototype/README.md` records provenance: source design-project URL, import date, the
  portion being locked. On approval, it gains the lock stamp.
- `design/ledger/` exists for the per-slice fidelity ledgers that derivation will add.
- Where a design brief exists for the portion: the copied-down screens and their navigation map
  onto the brief's screen inventory and action edges, both directions. An orphan on either side
  (a brief surface the prototype lacks, a prototype surface the brief never named) is surfaced at
  the lock for a ruling, never silently absorbed.

## Human-turn contract

- Requests **gate 2b: the lock** (MET-07): the copied-down artifact is approved, explicitly, now.
  This is UI-4's chargeable turn. A portion is not locked because work moved on; it is locked
  because approval is on record. Request it at this moment, not retroactively.
- A re-lock after a spine revision is the same turn again for the affected portions.

## Questions this skill used to carry, now ruled (invariants pass, 2026-07-11)

- **The locked artifact is the DC source alone.** No static render is checked in; a render, if ever
  produced, is viewing convenience and never authoritative. Approval happens where the prototype
  renders (gate 2a, Claude Design); the lock is the copy-down diff (INV-01, ruled).
- **The design system lives under `design/prototype/_ds/`**, provenance-true where the import
  lands. A shared house-system home is deferred with a trigger: the second product reusing the same
  system makes it a pinned, hash-ledgered vendored asset under DEP-1, not a shared directory.
- **The import is the COMPLETE export** (the `.dc.html` plus the full `_ds/`, both themes, more
  than fifty variables), per the manifest; never values scraped from the `.dc.html` (MET-04, ruled).

## What this skill must NOT produce

- No tests, no fidelity ledgers, no code. Derivation starts only after the lock is on record.
- No edits to the prototype; a change goes back through x2-design and re-approval.

## Next

Gate 2b on record, then x2-derive-tests.
