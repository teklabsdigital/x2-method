---
id: TEST-4
family: testing
locus: centralized
provenance: PC-1, PC-3 (P2 extraction, 2026-07-21; the pilot close-out's bootstrap watch class)
---

# TEST-4: Real-runtime boot proof

**Statement.** The verification set proves the product in its real runtime shape, not only in-process: the dev boot proves environment selection and secret loading (the shipped profile, run to readiness); the client-to-server path is proven from a context where network policy applies (a real browser or the served origin), because an in-process DOM shim enforces neither cross-origin policy nor real networking; and anything substituted at build time is asserted in its BUILT form, since a source-form assertion cannot catch build-time behaviour.

**Harm.** Every tier green about the wrong thing, the method's scariest failure class: a host booting as the wrong environment with no secrets loaded, a browser with no route to the API because nothing shipped a proxy or origin, a built shell shipping an unsubstituted placeholder that fires junk requests on every page load. All three shipped green through in-process tiers in the reference runs and failed on the owner's first real use.

**Enforcement.**
- Mechanism class: the boot proof is scripted in the verify set (the manifest's start task run to readiness against the real profile), the e2e path exercises the served origin, and the smoke's assertions target the built artifact, not the source.
- Edition: owed; trigger: the next edition build pass. UI-5's composed smoke already proves entrypoint wiring in-process; the real-boot script assertion and built-form pinning are the promotion set that completes it.

**Weakening notes.** The boot proof is a liveness check, not a behaviour suite; behaviour stays with the tiers. The line it holds is narrow and load-bearing: no verification set is complete while the product has only ever run inside its own test process.
