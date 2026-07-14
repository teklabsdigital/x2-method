---
name: x2-decompose
description: Use after the repo is seeded to run the D-000 five-lens decomposition, record persistent schema decisions, define slice one, and start the deltas file. Also use when a stays-ahead decision (decomposition, schema) must be revisited. Do not use for per-slice implementation decisions; those are D-0xx record-gaps raised during implement.
---

# X2 Decompose (D-000)

The one place where the model's whole-solution-space view beats the human's slice-by-slice view,
and the decisions a slice cannot cheaply reverse. Everything else stays reversible and waits.

## The five-lens session

Decompose the story set under five imposed lenses, one pass each, no code: data flow, failure
domain, change frequency, team boundary, trust boundary. Look at what disagrees between the five
decompositions; the disagreements are where the real shape decision lives. Choose a shape. Record
the choice and the four rejected shapes with reasons as `D-000-decomposition.md` in
`docs/decisions/`.

D-000 also records:

- The story set from gate 1. D-000 is the source of truth for it; there is no separate
  requirements document (the pilot's turn 8b defect was creating one).
- The recorded product decisions from ideation.
- The persistent schema decisions. Schema is the second stays-ahead asset; approving it is a human
  turn, and every later migration is an unconditional human turn, every time.
- The slice-one definition: the smallest slice that ships real user-visible value end to end.
  Build scope and design scope are separate rulings: the build is slice-first, the design is
  whole-product (MET-03); record both.

## The deltas file

Start `deltas.md`: how this project differs from the kernel edition. It grows as the build
surfaces differences; it never restates what the edition already says.

## Human-turn contract

- Human turns here: the shape choice, schema approval, slice-scope ruling. These are stays-ahead
  decisions and are not counted in the per-slice metric.
- No MET-07 gate of its own; gate 2 belongs to the design step that follows.

## What this skill must NOT produce

- No screens, no prototype, no acceptance criteria, no tests, no code.
- No detailed per-module design; a single-service module is legal and the shape decision is the
  module boundary, not the internals.

## Next

x2-design, carrying D-000 and the behaviour spec.
