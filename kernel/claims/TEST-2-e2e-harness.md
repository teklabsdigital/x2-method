---
id: TEST-2
family: testing
locus: centralized
provenance: X-12, B2-4
---

# TEST-2: An out-of-process harness drives the real client services against the running system

**Statement.** The end-to-end assurance floor is an out-of-process console harness that drives the real, unmodified client service layer (not a browser puppet, not a parallel HTTP client) against the running server with real authentication over the real protocols the system exposes: REST always, and the realtime connection where the system has one (added with RT-1, never claimed before it). The floor is complete: every public method of every client data service has at least one harness scenario through the real transport, and the harness self-audits (it enumerates the service methods, diffs them against what actually ran, and fails on an uncovered method), so completeness is declared, never interrogated. When the product owns identity, the harness exercises the real sign-in path at least once through a gated harness profile (a non-production server profile that re-binds provider ports only, refuses to boot outside Development/Testing, and changes no production code path); minting tokens around sign-in remains legitimate as setup for other scenarios, never as a substitute for testing the auth flow itself. The deterministic tier always runs in CI with external AI stubbed or replayed; a live-model smoke is separately gated to where the key exists; nondeterministic scenarios skip with a stated reason rather than flaking. Harness output redacts secrets (SEC-6).

**Harm.** Without this tier, "the system works" means "the pieces pass their own tests". The counterexample: an aspirational Playwright suite (one active spec, server startup commented out, UI-driven). An e2e harness that depends on manual setup is not an assurance floor, it is a hope.

**Enforcement.**
- Mechanism class: the harness is a first-class tool in the repo, versioned with the client, executing the client's own service modules; its deterministic tier is a CI job.
- Edition: a console harness that drives the real client service layer (hub factory, fetch, reducer, write transport) against a live backend over REST and SignalR; bearer-token auth for CI (the `HARN_TOKEN` env var); wire tier (no LLM, CI-able) versus agent tier (real LLM, skips with reason); NDJSON output; key redaction and JWT-shape scrub unit-tested.

**Weakening notes.** The harness exercises the service layer, not rendered UI; visual correctness is UI-4's job and the composed entrypoint is UI-5's. The two nets are complementary, and neither substitutes for the other. The v1 edition is REST-only (RT-1 owed), so its harness drives REST; the realtime scenario belongs to RT-1's promotion set, and v1 claims no realtime coverage. The harness template carries identity premises that an identity module INVALIDATES ("tokens are minted, not earned"; "sub is an opaque string"), marked in the template itself so an instantiating project revisits them deliberately rather than inheriting them silently; the acceptance-test pilot hit both (a sign-in flow exempted from e2e by mint-around; a label sub that 500'd against a real user key). The kernel's gated harness profile ships as the gate plus its refusal tests with no re-bindings (no product-owned external effect exists yet); the first product provider port is its first re-binding, with the pilot's realization as the reference.
