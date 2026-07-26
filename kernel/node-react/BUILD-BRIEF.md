---
kind: decision
status: authoritative
---

# BUILD BRIEF: kernel/node-react/

The brief this edition is built from. The claims catalog in `../claims/` is the contract; this file records what
this edition is for, what it may and may not assume, and where the cut line sits. If this brief and a claim file
disagree, the claim file wins. If any document and running code disagree, the code wins and the disagreement is
surfaced rather than reconciled quietly.

## Standing constraints (non-negotiable)

- Never use em dashes or en dashes. Anywhere, including code comments and docs. docs-lint enforces it (MET-08).
- No professional disclaimers. Push back with reasons; do not validate by default.
- Never commit unless explicitly directed.
- Least code that solves the problem. YAGNI everything. Standard library over wrappers.

## Why this edition exists

The catalog claims to be portable: 69 invariants stated independently of any stack, with each edition supplying
the mechanisms. That claim had never been tested, because there was one edition, and a claim with one witness is
indistinguishable from a description of that witness.

So the purpose of this edition is not primarily to have a Node kernel. It is to find out which claims are
portable and which only looked portable because the .NET realization was the only one anyone had written. Three
failure classes are being hunted:

- **A. The mechanism class does not survive.** The claim names a mechanism class (a reflection scan, a
  composed-host route scan) that has no counterpart here, so the claim as written cannot be realized.
- **B. Technology specifics sit in the portable layer.** The claim's stack-independent half names a type, an
  attribute, a namespace, or a convention belonging to one stack.
- **C. The declared locus is unreachable.** A claim declaring `centralized` needs a per-seam obligation here (or
  the reverse), which means the locus is a property of the mechanism and not of the invariant.

A working edition with an empty findings register is a failure of this build, not a success: it would mean the
claims were translated rather than realized. The register lives in this repo's working records, outside the
edition tree, because it is about the catalog and not about this stack.

## The build discipline (the delta protocol)

Each claim is built in three steps, in this order, and the order is the method:

1. Read **only** the claim file.
2. Write the Node mechanism you would build from that text alone, before looking at anything else.
3. Then open the .NET realization, and record the delta.

Step 3 is where findings come from. A delta of zero is a real result and is recorded as one. Skipping to step 3
produces a translation, which proves nothing about the catalog.

## The cut line

IN: the enforcement harness. The route-table recorder and its completeness obligation, the contract surface, the
tenancy composite, the deny-by-default host, the bounded-read data layer, the scans that fail the build, the CI
loop, and the conformance record that says honestly where each claim stands.

OUT of this edition entirely: anything the catalog marks as owed on a product trigger that this exemplar does not
have (identity, realtime, brokers, caches, deployed-host concerns). Those stay `owed` here exactly as they are
owed in the sibling edition, and the conformance record names the trigger.

## What the scaffold already settled

The route-surface spike ran before any of this was written, and its result is a structural constraint on
everything built after it, not a preference. Fastify hands out no complete route enumeration: `printRoutes()`
renders a tree for humans and `findRoute()` answers about one URL. So completeness is bought, in two halves that
only work together: `createApp` installs an `onRoute` recorder in the same expression that creates the instance,
and a lint refuses an import of the framework anywhere but that module. A second, unrecorded instance is what the
lint exists to prevent, and without it the recorder proves a property of an app nobody serves.

The residual hole is named and is not closable at the route table: a hook that answers a request itself serves a
URL with no route behind it. `src/platform/__tests__/routeSurface.test.ts` asserts that hole as a passing test,
so that a future mechanism closing it breaks the test rather than passing unnoticed.
