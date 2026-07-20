---
kind: record
status: authoritative
---

# Metric history

The sole metric is human turns per shipped slice. One counting rule governs the history (ruled at
the P2 extraction, 2026-07-21):

**Counted** turns are those the method forced during the slices: sanctioned (decisions,
green-but-wrong adjudications) and defect-shaped (edition defects, invariant gaps, method
defects). **Not counted**: admin turns (commits, resumes, status checks, compaction pacing),
ideation turns, and the stays-ahead investment (decomposition, schema, the design spine).
A slice is shipped when its exit report exists.

Whole-project totals are not comparable across projects (scope differs); per-slice mid-build cost
and defect share are the travelling numbers.

## P1 (pilot, one slice, 2026-07-11)

- Original acceptance-test count: 25 (that count included ideation and stays-ahead decisions).
- Under the ruled rule: about 18 for slice 001.
- Defect share of counted turns: about a third.
- Character: roughly a quarter of all turns were dev-environment bootstrap; "all green" was
  declared twice before it was true.

## P2 (six slices, 2026-07-21)

- Five slices exited by report; a sixth built green with its exit report owed (the denominator is
  5 until it exists).
- Mid-build cost per slice: between 1 and 7 counted turns, one slice at zero mid-build turns
  after its gate.
- Defect share of counted turns: about a tenth (10 of 104 counted across the whole project).
- The invariants-pass watch classes from P1 near zero: bootstrap-class turns 1, green-but-not-
  running turns 0, completeness interrogations 0.
- Character: the turn mass moved out of the slices into phases the method had no names for
  (owner acceptance refinement, launch and exposure work, the story-prototype loop). Naming and
  pre-flighting those phases is what this extraction added; see `negative-space.md`.

## Reading

The first slice is where the method charges its fixed cost, and it held roughly flat like for
like (P1 about 18; P2's first slice about 6 mid-build plus a story loop that is now named
structure). The marginal slice is where the method pays out: P2's subsequent slices cost 1 to 7
turns each. The old headline ("the figure is 25") is retired; it mixed counting rules and scopes.
