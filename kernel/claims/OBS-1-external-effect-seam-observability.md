---
id: OBS-1
family: observability
locus: per-seam
provenance: PC-6 (P2 extraction, 2026-07-21); trace-context extension, patterns pass 2026-07-24 (W3C Trace Context)
---

# OBS-1: External-effect seam observability

**Statement.** Every port performing an external side effect (send, charge, generate, provision) ships observability at the seam from day one: accept and settle are logged with elapsed time, the provider's traceable operation id is captured on accept, and a timeout logs the duration waited. Acceptance by a provider and delivery to the destination are distinct facts, and the seam records which one it observed. Where a port builds a child dependency container, that container receives the host's logger factory, so no seam can go dark by construction. Secrets and user content never cross into the seam log (SEC-6). The standard trace context (a traceparent) is stamped at ingress, propagated through every outbound seam including message metadata, and present in the seam's accept and settle lines, so the per-seam facts join into one causal chain across services.

**Harm.** A live incident becomes archaeology: the app cannot say whether the fault is its own, the provider's, or downstream of the provider, and the diagnosis burns human turns the seam log would have answered. In the reference run, an external-delivery fault cost several dark turns before the seam existed and was isolated in two turns once it did; a silent child container had been swallowing an entire engine's logs.

**Enforcement.**
- Mechanism class: per-seam: each external port owes a named test asserting its accept/settle logging shape, redaction, and the trace context in its log lines; the logger-factory handover is a composition-root review item pinned by the port's test. The RES-1 chokepoint installs the trace propagator, so an outbound seam carries context by construction rather than by each seam remembering.
- Edition: owed; trigger: the first external side-effect port in an edition project. This claim opens the observability family the v1 cut deliberately deferred.

**Weakening notes.** Per-seam by nature: no scan proves a future port logs. Deep awaiting of terminal provider status is gated to diagnostic configurations where it would widen a timing side-channel or slow a hot path; the operation id is the always-on part.
