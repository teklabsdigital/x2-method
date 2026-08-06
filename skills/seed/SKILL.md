---
name: seed
description: Use immediately after gate 1 (stories approved) to settle which kernel edition the project is built on, create the project repo from it, and make the method durable inside it. Also use when an existing X2 project is missing its CLAUDE.md standing constraints or its turn ledger. Do not use before stories are approved, and never use it to modify the kernel itself.
---

# X2 Seed

Copy the kernel down, initialise it to the product, and anchor the method in the repo. Seeding runs
right after gate 1 so the repo exists before any decision work: D-000, the behaviour spec, and the
prototype import all need a home, and the standing constraints and ledger must be repo-anchored
from the first turn. The pilot instantiated late and the missing scaffolding cost roughly a quarter
of all measured turns (INV-03); its pasted-prompt constraints decayed under compaction into 55
violations (MET-08). Seed exists so neither happens again.

## Steps

1. **Create the repo.** A new sibling repo named for the product, decided at ideation.
2. **Settle which edition.** The kernel ships more than one, and they are not interchangeable: an edition
   is a stack, a store and a test tier set, and the choice binds every slice after it. It is the
   owner's, so ASK rather than infer, and ask before the manifest is opened, because the manifest that
   answers "what does a seeded project receive" is the chosen edition's and no other. Do not read a
   preference out of the product idea, and do not default to whichever edition the kernel lists first.
   Record the answer where the record already has a home for it: the kernel-provenance row carries the
   edition beside the pin, so a project can always say which mechanism set its conformance statement
   refers to. If the request already names a stack, that IS the answer and no turn is owed.
3. **Instantiate that edition per its manifest.** The edition README's "Instantiation manifest"
   section is the definition: the file set (A), the ordered setup steps (B), and the verify-as-a-set
   list (C). Run all three parts and verify part C as a set, not one by one from memory. The
   manifest's contents are the kernel's to define; this skill runs it and does not restate it. Two
   points the record proved sharp:
   - Renaming Kernel to the product includes config values, not only code identifiers (the pilot
     shipped an issuer still named "kernel").
   - The CI workflow moving to the repo root is not the gate. Branch protection requiring it is,
     and it must be verified armed, not assumed (TEST-3's one honest asterisk). The same arming
     step covers HUM-1: code-owner review required, with `@OWNER` in CODEOWNERS renamed to the
     product owner; the manifest's verify list includes proving it with a test PR.
4. **Write the repo CLAUDE.md.** Standing constraints live here because repo files re-enter every
   session and survive any compaction; a pasted handover may restate them but the repo copy is
   authoritative (MET-08). Method constraints, always present:
   - Never commit unless explicitly directed.
   - Least code that solves the problem. YAGNI. Standard library over wrappers.
   - Pin exact versions, no floating, per the standing version policy. The cooling-off window is
     ruled (window pass, 2026-07-26): 30 days, and the number lives in ONE place, the project's
     `VERSIONS.md` header, copied down from the edition; cite it from there, never restate it.
     Container images pin tag@digest and get a ledger row like any package.
   - The turn-report shape and the rule that intake's classification governs (both decayed under
     compaction in the pilot; see the ledger section).
   - Anything presented to the owner for a ruling is put in plain language, their own words;
     method vocabulary rides alongside, never instead. A ruling made on a summary the owner
     cannot parse on first read is no ruling at all (P3: five turns were spent re-asking before
     it became a standing rule).

   House style, owner's preference: keep, replace or drop these, and record whichever set the
   owner chooses. What the method requires is only that the chosen set lives here and that any
   mechanically checkable rule ships its check:
   - Never use em dashes or en dashes, anywhere, including code and docs. Self-check with literal
     bytes, because BSD grep silently misses a BRE class:
     `grep -rn "$(printf '\342\200\224')" .` (em) and `grep -rn "$(printf '\342\200\223')" .` (en).
   - No professional disclaimers. Push back with reasons.
5. **Create the turn ledger.** Append-only, per author: `docs/work/<author>/turn-ledger.md`, one
   file per human whose turns it records, so parallel sessions, branches and collaborators cannot
   collide. The builder appends every human turn the moment it happens: number, what happened, why
   a human was needed, provisional bucket. The next turn number is read from the file at append
   time, never carried in a context's memory: the third project minted duplicate numbers three
   times the moment two contexts ran at once. The bucket vocabulary is closed: decision,
   green-but-wrong, edition-defect, invariant-gap, methodology-defect, ideation, admin; a turn
   that fits none is admin with a note, and intake reclassifies (the third project improvised ten
   extra labels, which the extraction then had to map). Every turn is fed to intake as it happens,
   not only defects; intake classifies, and its bucketing governs (MET-05). Backfill the gate-1
   ideation turns from stories now, so nothing lives only in a compactible context.
   The rule is enforced, not remembered: the edition ships a prompt-submit hook in
   `.claude/settings.json` that injects the ledger reminder on every human prompt, so it re-enters
   with every turn and cannot decay with a long chat (PC-10; the second project proved the
   CLAUDE.md rule alone drifts under long-context sessions). Verify the hook file survived
   instantiation; it is part of the manifest's file set.
6. **Land the behaviour spec.** If stories produced one, write it into `design/` beside where
   D-000 will live, so the design step has its behaviour source before it runs (MET-02's gap).

## Human-turn contract

- No gate of its own. Seeding is sanctioned stays-ahead setup; per the measurement rule it is not
  counted in turns per shipped slice. Any real decision it forces (which edition, an environment
  choice, a manifest gap) is logged as a turn like any other.
- A manifest gap discovered while seeding is a finding for the invariants pass, reported to intake,
  never patched into the kernel from here.

## What this skill must NOT produce

- No product decisions, no code, no schema, no design artifacts.
- No edits to any kernel edition or to the claims; report defects, do not fix them.

## Next

decompose.
