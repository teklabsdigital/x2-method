---
kind: record
status: working
---

# Candidates for the next invariants pass

Accepted at the P2 rulings pass (2026-07-21) under the governing filter: an item enters only if it
reduces paperwork, improves efficiency, accuracy, or quality, or reduces work for the X2 user.
Each carries an applies-when condition; nothing is universal unless it says so. Items graduate
into `kernel/claims/` with an enforcement mechanism and a red-green proof, then leave this file.
`kernel/claims/` is never edited during extraction.

## Priority

- **PC-1 Real-runtime boot proof.** Universal. The edition proves the product boots and serves in
  its real runtime: environment selection, secret loading, and the client-to-server network path.
  Test doubles that enforce neither network policy nor environment selection cannot stand in.
  Closes the class where every tier is green about the wrong thing while the real product fails
  live (P2: two instances, one in dev boot, one in a live send).
- **PC-2 Read completeness for action-bearing surfaces.** Universal. A read backing a user action
  returns every field that action's availability depends on, and derived tests cover the
  session-restore path of every action-bearing surface (P2: a restored session had a dead primary
  action because one identity field lived only on another record).

## Accepted, queued

- **PC-3 Built-form assertion.** Universal. Anything substituted at build time is asserted in its
  built form; a source-form assertion cannot catch build-time behaviour.
- **PC-4 Opaque public identifiers.** Applies when any resource is publicly addressable. Public
  resources are addressed by opaque single-purpose tokens, never sequential identifiers, and
  derivation treats this as binding even when the frozen artifact shows otherwise.
- **PC-5 Prompt architecture.** Applies when a feature is model-backed. Every model-facing prompt
  is configuration, versioned beside the content it governs, assembled at one seam; generation and
  evaluation passes feed from the same rubric, generation carrying the whole method, evaluation
  only the unit under review; only the wire format stays in code.
- **PC-6 Seam observability for external effects.** Applies when the product performs external
  side effects. Every such port ships day-one observability: accept/settle latency and the
  provider's traceable operation id; accepted and delivered are distinct facts. A child dependency
  container receives the host's logger factory.
- **PC-7 Ruled bounds.** Universal. Every quantitative bound (caps, lengths, limits) traces to a
  ruling; scaffold defaults are flagged at derivation, not discovered later.
- **PC-8 Provisioning feedback.** Applies when a CLI provisions accounts or credentials. An
  upserting command reports created versus updated; silent upsert turns a typo into a phantom
  account.
- **PC-9 Proposal visibility.** Universal (harness ergonomics). A proposal requesting a ruling is
  visible in the same surface as the question that asks for it.
- **PC-10 Ledger enforcement trigger.** Universal (method mechanism). The turn-ledger rule gets a
  deterministic harness trigger at the moment a turn lands, not only a documentary home.
- **PC-11 Scenario id registry.** Universal. Test and scenario identifiers allocate from one
  project-wide registry, never per-slice ledgers minting from the same namespace.
- **PC-12 Migrate-and-exit.** Universal. Every host ships a migrate-and-exit mode; a web boot
  never migrates as a side effect, and migrate mode needs only the connection string.
- **PC-13 Abuse posture in the spine.** Applies when the product is publicly exposed. Anonymous
  and spend-shaped endpoints are priced (rate limits, including a host-wide ceiling on paid
  calls), request bodies capped, with the spine test pinning the policy attachments.
- **PC-14 One deployable unit.** Applies to web products. The edition serves its client from the
  server host with no cross-origin surface in any environment; dev keeps the client dev server
  behind a proxy; the composed tier pins the serving.
- **PC-15 Configuration-driven UI for template-shaped products.** Applies when the product is an
  instance of a template family. The UI renders configuration; new instances are content, not
  code.
- **PC-16 Deployment-edge hardening set.** Applies to web products. Forwarded-header trust from
  config, standard security headers, transport-security opt-ins, server banner off; pinned by
  tests through the composed host.
- **PC-17 Environment-gated probe surfaces.** Universal. Test-only surfaces register only in the
  harness-sanctioned environments; a production-shaped boot proves the routes absent.
- **PC-18 Green-fields data posture.** Universal. Decompose names the data posture (abandonable
  dev data or preserved); abandonable makes migration regeneration cheap, and the posture should
  be a recorded default, not an assumption.
- **PC-19 The commodity-decision tier.** Universal (turn reducer). The builder takes and records
  mechanism-level calls without stopping, in the decision record or handover; only novel or
  irreversible calls stop for the human.
- **PC-20 Ruled pre-authorization.** Universal (turn reducer). A standing unconditional turn (for
  example, applying migrations to a dev database) can be pre-authorized by an explicit ruling; the
  pre-authorization is itself the recorded turn.
- **PC-21 Secrets cross store to store.** Universal. A secret moves between projects or machines
  store to store; it never enters a transcript.
- **PC-22 Edition manifest must not assume a design export at seed.** Universal. A green-field
  project has no prototype until gate 2a; the manifest defers the design-dependent steps.
- **PC-23 Docs-lint root allowlist carries the method's own root files.** Universal (edition
  defect class): the lint must allow every root file the method itself homes at the root.
- **PC-24 Exception scoping in fidelity ledgers.** Universal. A ledger exception is scoped to
  named elements, never a family; an exception wider than its rationale hides gaps.
