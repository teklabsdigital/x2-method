---
name: x2-stories
description: Use when starting an X2 project, when the problem domain has no approved epic story set, or when new scope needs stories added to an existing set. Runs problem discovery and produces epic-level stories, then requests gate 1 (stories approved). Do not use to author acceptance criteria or a requirements document, and do not use for anything downstream of gate 1.
---

# X2 Stories

Define the problem domain with the human and produce the epic-level story set. This is the first of the
three gates: nothing is designed, seeded, or built until the stories are approved.

## What you produce

- A handful of epic-level stories, one line each. Thin by design. Roles are human stakeholders
  (developer, operator, end user), never "the system" or "an AI agent".
- Where the product's core is a novel domain behaviour (a method, a protocol, a way of working that
  makes the product not a commodity), capture it as a behaviour spec. It is a domain source of
  truth for the designer, not acceptance criteria and not screen design. It lands in the repo's
  `design/` directory once x2-seed runs.
- A turn note for every human turn ideation costs (number, what, why a human was needed). These are
  carried into the ledger the moment x2-seed creates it.

## How to work the discovery

- Spend time on the problem before any solution talk. Challenge, reframe, think laterally; be a
  thinking partner, not a yes-machine. Do not converge early.
- Aim for the minimal story set that captures the full problem. Prefer a shape with more than one
  module, so the build exercises real seams.
- Propose candidate framings and let the human pick. They drive the choice.

## Human-turn contract

- Requests **gate 1: stories approved** (the first MET-07 gate), taken when the story set is tight
  and both sides agree. The gate blocks x2-seed and everything after it.
- Ideation turns are part of the measured flow and are logged.

## What this skill must NOT produce

- No acceptance criteria and no behaviour lists for the UI. Those derive from the locked prototype
  later; authoring them here was the pilot's turn 8 defect.
- No requirements document. The story set is recorded in D-000 by x2-decompose; a second
  requirements doc duplicating it was the pilot's turn 8b defect.
- No screens, no architecture, no code investigation, no file paths.

## Next

Gate 1 on record, then x2-seed.
