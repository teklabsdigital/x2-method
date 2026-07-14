# Glossary of record codes

The skills and claim files cite short codes: X-8, B2-1, MET-07, INV-10. They point into the
method's development record: the extraction of the kernel from 2 production systems, and the pilot
acceptance test. That record is not published, so this file defines every cited code.

A code is a provenance pointer, not required reading. The sentence around it always carries the
meaning; the code answers "why does this rule exist".

## The families

| Family | What it is |
|---|---|
| Gate 1, 2a, 2b | The 3 human approval gates: stories; the prototype at design; the lock |
| D-000 | The decomposition decision file, first decision of any project |
| D-0xx | Numbered per-project decisions, created when a build hits a record gap |
| X-1 to X-14 | Adjudication decisions from the extraction: contested rules, ruled with rationale |
| B1-n, B2-n | Findings from the extraction's 4-bucket register (buckets 1 and 2) |
| Bucket 3, 4 | Rules enforced in only one source system (3); habits never stated as policy (4) |
| Risk item n | Entries in the extraction's risk ledger |
| MET-n | Method findings from the pilot acceptance test |
| INV-n | Invariant candidates from the pilot acceptance test |
| CONF-n | Confirmations: mechanisms that held under pressure in the pilot |

## X: extraction adjudications

| Code | Ruling |
|---|---|
| X-1 | Tenancy mechanism |
| X-2 | HTTP surface conventions |
| X-3 | Data layer and layering |
| X-4 | Credentials |
| X-5 | Dependency quarantine |
| X-6 | Test database strategy |
| X-7 | Client theme enforcement |
| X-8 | Endpoint security spine |
| X-9 | Idempotency discipline |
| X-10 | Contract parity fixture |
| X-11 | Realtime discipline |
| X-12 | Test tiers |
| X-13 | File naming and placement |
| X-14 | Documentation placement and lifecycle |

## B1: enforced in both source systems

| Code | Finding |
|---|---|
| B1-1 | Exact dependency pinning with committed lockfiles |
| B1-2 | Tenant isolation with a structural write boundary |
| B1-3 | AI trust boundary: the actor never supplies identity or scope |
| B1-4 | JWT hardening: pinned algorithm, signed tokens required, fail-closed secrets |
| B1-5 | No bytes over the realtime socket |
| B1-6 | Client business logic in separately testable services; thin UI |
| B1-7 | UTC-only persistence |

## B2: claimed but enforced nowhere

| Code | Finding |
|---|---|
| B2-1 | The CI loop: strong mechanisms in both systems, zero CI running them |
| B2-2 | Layering declared non-negotiable, enforced with nothing; live seams found |
| B2-3 | Theme discipline absent: hundreds of colour literals and a parallel palette |
| B2-4 | An aspirational e2e suite that needed manual setup |
| B2-5 | Dependency cooling-off absent |
| B2-6 | Lockfile drift did not fail the restore |
| B2-7 | Named tests owed but never built |
| B2-8 | In-memory database tests masking real engine semantics (superseded by X-12) |
| B2-9 | Committed dev credentials and no local secret store |

## MET: method findings from the pilot

| Code | Finding |
|---|---|
| MET-01 | Keep requirements-for-design, the prototype and the derived tests separate, in that order |
| MET-02 | The design step had no process, and the sequencing had a gap |
| MET-03 | Whole-product design leads the slices: the third stays-ahead item |
| MET-04 | The full design-system import is a method step, or the builder builds asset-blocked |
| MET-05 | The turn ledger must persist in the repo; the pilot lost its early record to compaction |
| MET-06 | Slices need an exit report, so completeness is declared, not interrogated |
| MET-07 | Approval must be requested at the right time: the 3-gate workflow |
| MET-08 | Standing constraints decay under compaction; anchor them in the repo |

## INV: invariant candidates from the pilot

| Code | Finding |
|---|---|
| INV-01 | The locked prototype and design system need a canonical home in the project |
| INV-02 | Dev database persistence must be specified, not ephemeral by default |
| INV-03 | Dev-environment scaffolding must ship with the edition |
| INV-04 | The integration tier had an unstated host prerequisite |
| INV-05 | Container images belong in the dependency ledger, pinned like packages |
| INV-06 | Operational settings are configuration, not code |
| INV-07 | A slice went "all green" while the composed UI never called the server |
| INV-08 | docs-lint must govern authored files only, never vendored or imported ones |
| INV-09 | The lint gated colours and type but not dimensions, and drift lived exactly there |
| INV-10 | The e2e harness must cover the whole service surface, including the product's own sign-in |

## CONF: confirmations

| Code | Finding |
|---|---|
| CONF-01 | Reuse-versus-build has no invariant, correctly: it stays a human call |
| CONF-02 | Provider-interface seams made full e2e closable without redesign |
| CONF-03 | The fidelity ledger held under pressure and blocked scope fabrication |
