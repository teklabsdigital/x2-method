---
name: design
description: Use when D-000 exists and the whole-product prototype does not, to run Claude Design in its own context and produce the prototype and design system. Also use when a later slice exposes a design gap that needs a spine revision. Requests gate 2a (prototype approved at Claude Design). Never run in the builder's context, and never used to author tests, acceptance criteria, or application code.
---

# X2 Design (Claude Design)

Produce one whole-product prototype and its design system from the source of truth. This runs in
its own context, deliberately separate from the builder: the pilot showed that when the builder is
also the designer, the design steps collapse and acceptance criteria get authored backwards
(turn 8). Design is done once for the whole product; each slice locks its portion later.

## Inputs

- D-000: the story set, the recorded product decisions, the module shape, the slice definitions.
- The behaviour spec beside it, if the product has one. The prototype must make that behaviour
  visible; it is the difference between designing the product and designing a generic UI.
- The design brief, where one exists (required for a rich domain, see below). It governs the
  information architecture where it is more specific than the stories.

## The design brief (requirements-for-design in its positive shape)

For a simple domain, the input beyond the stories is a thin note: novel-or-irreversible only. For
a rich domain (many surfaces, typed variants, a domain model the stories do not carry), the
method requires the brief, produced in the product working session with the human and approved by
the human as a decision turn BEFORE this skill runs:

1. **The domain model is frozen as a decision first** (a D-0xx). The brief renders that decision;
   it cites it and never restates it.
2. **The brief carries exactly three kinds of content:**
   - Topology: the user journeys; the screen inventory, each surface stated as the problem it
     solves (a mini story) plus what it does; and the action edges (which action on which screen
     opens which screen, and what stays inline).
   - Shape: what each surface must expose, the editor kind each configured item wants (field,
     toggle, picker, prose document), and the depth rule (a row earns its own screen when its
     content is large, unbounded, or an editor; a few small fields stay inline).
   - Priority: the engagement tiers (what is glanced constantly, what is reached for in the
     moment, what is deliberately configured), because prominence is a product decision, not a
     styling one.
3. **Two disciplines the brief must state, both learned from real failures:**
   - Tables and matrices in the brief are DATA a surface reads, never screens to render; one shell
     reading data beats a view per variant.
   - The brief names every surface exhaustively. The designer builds the named surfaces and only
     those, and asks on a gap; a screen is never inferred from a table and UI is never invented
     around a hole.
4. **What the brief must NOT contain:** layout, visual hierarchy, components, palette, type (this
   skill's job); acceptance criteria or test cases (derived after the lock, MET-01); story
   restatement (the story set remains the authority on intent); fields the domain model does not
   back.

## Work in two steps

1. Propose the information architecture and a design direction (screen map, component set, palette
   and type direction). Where a brief exists, validate the proposal against it: every journey
   walkable through the proposed screens, every named surface present, no surfaces invented. Then
   confirm it with the human. Build nothing yet.
2. After confirmation, build the whole-product prototype and the design system, with behaviour
   annotations: short notes of what each screen and key element shows and does. Annotations are
   design notes, never acceptance criteria.

## What the artifact must be

- **Whole-product, once.** Cover every screen and state across all stories, including the ones
  later slices will build, so the shell holds them without redesign. The design spine is the third
  stays-ahead asset, alongside D-000 and schema (MET-03).
- **The token source in waiting.** The design system becomes the client's single token source, so
  it must be expressed as a clean variable set: more than fifty variables, both themes (the dark
  root and the light override). The kernel will hold the client to it (UI-1), ban literals outside
  it (UI-2), and test shipped screens against the locked prototype in both directions (UI-4). Build
  the prototype as the thing the client is held to.
- **Distinctive.** Commit to a clear direction and execute it with intention; avoid generic
  AI-default aesthetics; distinctive type beats safe type. The project's recorded product decisions
  override style instinct (the pilot's: simple, clear, user-friendly beats feature density).

## Reuse

Reusing a house design system from another product is legitimate and proven in the record. If you
reuse, record where the system came from in the artifact so the lock can carry it (the provenance
README is the home). The invariants pass ruled the home question: the imported system lives under
`design/prototype/_ds/` per project; a shared cross-product home is deferred until a second product
reuses the same system, at which point it becomes a pinned, hash-ledgered vendored asset (DEP-1),
never a shared directory.

## The lock model

The prototype is the spine; each slice locks its portion as that slice's acceptance contract and
derives tests from that portion only. The spine can be revised when later slices expose gaps; a
revision re-locks the affected portions and spends the approving human turn (open cadence question
carried on the record, MET-03).

## Human-turn contract

- The direction confirmation in step 1 is a design decision turn.
- Requests **gate 2a: prototype approved at Claude Design** (MET-07), at the moment the prototype
  is complete. Approval here is not the lock; the lock happens after the copy-down, at lock.

## What this skill must NOT produce

- No acceptance criteria, no test cases, no fidelity ledgers. Deriving those before the lock is the
  exact error the three-artifact separation exists to prevent (MET-01).
- No application code, no kernel instantiation, nothing outside the design tree.
- No restating of the stories into a new requirements document; D-000 is the source of truth.

## Next

Gate 2a on record, then lock in the builder's context.
