---
name: implement
description: Use when the slice portion is locked and its derived tests exist, to build all of the locked portion to green autonomously. Triggers at implement start and on every re-entry after a human turn. Do not use to declare green (slice-exit does that), and do not use it for an unexplained runtime defect (problem-solve).
---

# X2 Implement

Build the slice: generate, verify, correct, re-verify, running to green without human turns
wherever you honestly can. The kernel enforces the invariants; this skill exists to capture the
decisions the kernel cannot make and to keep the drive honest.

## The contract you are building to

**All of the locked portion.** Fidelity to the whole approved contract, no silently dropped pieces
(this is what gate 3 ratifies, through the exit report). The pilot's dark-only theme flip is the canonical violation: a visible
piece of the locked contract quietly dropped while everything read as done. "All of it" means all
of the locked portion; the rest of the prototype is the design spine awaiting its slices.

## The human-turn contract (stop only for these)

- **Record-gap**: a decision no record answers (not in D-000, the deltas, or the locked prototype)
  that is novel and not cheaply reversible. File a one-line question; the answer becomes a D-0xx.
  Commodity decisions you make yourself from priors with a one-line note. A real example of a
  record-gap: a reuse-versus-build call on an existing component; the kernel is provenance-blind by
  design and the economics are local to the slice.
- **Green-but-wrong**: tests green, result wrong against the story or the locked prototype. Surface
  it; the fix goes in the decision file, never patched into source.
- **Unconditional turns**: any persistent-schema migration or published-contract change, every
  time, no exception.
- **Suspected kernel defect**: stop and report it with why it looks like a kernel defect. The
  kernel is fixed canonically, never patched locally without a ruling.

When unsure whether something is a turn, surface it and let intake classify it. Never absorb it
silently, and never manufacture a turn for a commodity choice.

## Standing rules, now held by the gates

These were settled by the record and, since the invariants pass (2026-07-11), are enforced by the
kernel; the notes here say what the gate will do so you work with it, not around it.

- **The client UI is a thin layer over testable client services** (UI-5). The composition root
  constructs the client and delegates; screens receive data and callbacks. The eslint import ban
  rejects transport or data-service imports outside the composition root (type-only imports are
  legal), and the composed-entrypoint smoke proves a real request leaves the app per primary flow.
  Each NEW primary flow owes its smoke line; that is your per-slice obligation, checked in the exit
  report's coverage table.
- **Every external side effect sits behind a provider interface bound at the composition root**
  (delivery, model calls, clock-like effects). This is what let the pilot close a security-sensitive
  e2e gap as a binding-only change instead of a redesign (CONF-02); it is also what the gated
  harness profile needs, so an inline-instantiated effect is unreachable by e2e. Stated in the
  edition README; review each new external effect for it.
- **Operational settings are configuration, not code** (CFG-1). Non-secret settings resolve from
  committed config, secrets from the secret store; the architecture test bans a literal registry
  (model ids, provider endpoints) in host source and scripts. When the product gains a new
  operational-setting shape, extend the registry at D-000 rather than letting it pass.
- **Harness completeness is self-auditing** (TEST-2). Every public method of every client data
  service needs a scenario through the real transport, and the harness fails on an uncovered
  method, so write the scenario with the method, not after the interrogation. Where a scenario
  needs a seam the server does not expose, the ruled shape is the gated non-production harness
  profile: re-bind provider interfaces at the composition root under `Harness:Enabled`, which
  refuses to boot outside Development/Testing; never a weakening of a production path.

## The ledger

Append every human turn to the repo's turn ledger the moment it happens: number, what happened,
why a human was needed, provisional bucket. Feed every turn to intake as it happens, not only
defects; intake's classification governs. A count held in your context is not a count (MET-05).

## Exit

Green is never declared in prose. When every tier passes and the contract is met, invoke
slice-exit and produce the report. If the report cannot be completed honestly, the slice is not
green.

## What this skill must NOT produce

- Nothing before the lock is on record; a phase started without its gate is a methodology
  violation the exit report must surface.
- No hand-authored prototype-fidelity tests (they derive from the lock; claim-driven tests keep
  their test-first shape).
- No invented UI for service methods the locked portion does not surface (CONF-03: record the
  boundary instead).
- No commits without explicit direction. No kernel fixes.
