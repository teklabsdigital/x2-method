---
id: OBS-2
family: observability
locus: per-seam (one central emitter)
provenance: compliance-mapping pass 2026-07-24 (security-event logging: E8 maturity level 2 event logs; SOC 2 TSC CC7.2)
---

# OBS-2: Refusals and privileged actions are security events

**Statement.** Every refusal the catalog mandates and every privileged execution emits a structured security event through one emitter seam: authorization denials (SEC-1), token rejections (SEC-4, SEC-10), tenancy refusals (TEN-2 unset scope, TEN-4 cross-tenant, TEN-6 foreign mint), rate-limit refusals (SEC-8), and each run of a TEN-5 ledgered bypass or an administrative mutation. An event carries kind, principal and tenant identifiers, and outcome; content is governed by SEC-6 (identifiers and shapes, never payloads or credentials); events carry a stable marker distinguishing them from diagnostic logging so a collector can route them.

**Harm.** The catalog builds every interesting refusal and then discards the fact that it fired. OBS-1 answers "how will we know this is broken"; without this claim nothing answers "how will we know this is under attack": a credential-stuffing run, a tenant-probing sweep, or an abused bypass reads as normal 4xx noise, and the first anyone learns of it is a customer or an auditor's sample.

**Enforcement.**
- Mechanism class: per-seam: each refusal path owes a named test asserting its event reaches the emitter with identifiers and without payload; the emitter itself is one centralized seam with its own SEC-6 redaction test.
- Edition: owed; trigger: the first deployed edition host (alongside SEC-9; the refusal seams it instruments are already built and tested, so the events attach to existing tested paths).

**Weakening notes.** Per-seam by nature: no scan proves an arbitrary future refusal emits. Emission is not detection: alerting, aggregation, retention, and log protection live outside the application layer; the claim puts the facts on the wire and no further. The emitter must never become a payload channel; SEC-6 governs it like any other logging surface.
