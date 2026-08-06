---
name: stories
description: Use when starting an X2 project, when the problem domain has no approved epic story set, or when new scope needs stories added to an existing set. Runs problem discovery and produces epic-level stories, then requests gate 1 (stories approved). Do not use to author acceptance criteria or a requirements document, and do not use for anything downstream of gate 1.
---

# X2 Stories

Define the problem domain with the human and produce the epic-level story set. This is the first of the
three gates: nothing is designed, seeded, or built until the stories are approved.

## What you produce

- **The owner's motivation, verbatim, first.** Before any analysis, capture the owner's own
  statement of why this product should exist, in their words, as a durable artifact. The problem
  statement derives from that motivation and is evidenced by any reference material, never the
  reverse: the third project's problem statement missed the centre twice because two sessions
  worked from reference material alone while the motivation lived only in the owner's head.
- A handful of epic-level stories, one line each. Thin by design. Roles are human stakeholders
  (developer, operator, end user), never "the system" or "an AI agent".
- Where the product's core is a novel domain behaviour (a method, a protocol, a way of working that
  makes the product not a commodity), capture it as a behaviour spec. It is a domain source of
  truth for the designer, not acceptance criteria and not screen design. It lands in the repo's
  `design/` directory once seed runs.
- A turn note for every human turn ideation costs (number, what, why a human was needed). These are
  carried into the ledger the moment seed creates it.

Everything this skill produces has a named home once seed runs: the story set, the motivation
statement, the behaviour spec and any prior reference material land under `design/`; turn notes go
to the ledger under `docs/work/`. Nothing lands at the repo root: the kernel's docs-lint allowlists
that surface, and the third project had to relocate two governed files it had put there (record:
the placement finding, P3).

## How to work the discovery

- Spend time on the problem before any solution talk. Challenge, reframe, think laterally; be a
  thinking partner, not a yes-machine. Do not converge early.
- Aim for the minimal story set that captures the full problem. Prefer a shape with more than one
  module, so the build exercises real seams.
- Propose candidate framings and let the human pick. They drive the choice.
- When the owner rejects the same framing twice, stop iterating in place: the context is anchored.
  Restart the analysis in a fresh context from the primary sources (the motivation statement
  first), carried across by a written handover, and apply nothing until the owner cuts. The third
  project's centre was found exactly this way after two anchored sessions missed it.

## Stress-testing the set

When the set looks settled and before gate 1 is requested, offer an adversarial stress test:
bounded, grounded in the story set, any reference material, and knowledge of comparable products;
hunting gaps and overlooked needs inside the current scope, never gold plating or new directions.
Before it runs, enumerate every role the story set names and confirm each role has its own lens
walking its journey end to end. The third project's stress test looked complete while omitting the
product's largest constituency, and only the owner caught it.

## The story-prototype loop

Stories are dynamic. Owners iterate them heavily, and there is an entire loop from stories to UI
prototype and back that refines the set until acceptance: seeing the product's shape changes what
the owner knows they want. Gate 1 is therefore provisional until that loop settles. Re-approving a
revised set is a normal gate turn, not a breach; expect it, request it explicitly, and revise
D-000 before design reads it. The evidence: the second project's story set was its highest-churn
decision (14 post-approval revisits before settling through the prototype), and the churn was the
work, not a defect (record: NS-1).

## Human-turn contract

- Requests **gate 1: stories approved** (the first MET-07 gate), taken when the story set is tight
  and both sides agree. The gate blocks seed and everything after it. Each later revision requests
  the gate again.
- The gate request is put in plain language, the owner's own words; method vocabulary rides
  alongside, never instead (P3).
- Ideation turns are part of the measured flow and are logged.

## What this skill must NOT produce

- No acceptance criteria and no behaviour lists for the UI. Those derive from the locked prototype
  later; authoring them here was the pilot's turn 8 defect.
- No requirements document. The story set is recorded in D-000 by decompose; a second
  requirements doc duplicating it was the pilot's turn 8b defect.
- No screens, no architecture, no code investigation, no file paths.

## Next

Gate 1 on record, then seed.
