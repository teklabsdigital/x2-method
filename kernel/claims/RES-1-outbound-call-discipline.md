---
id: RES-1
family: resilience
locus: centralized chokepoint, per-seam fault proof
provenance: patterns pass 2026-07-24 (resilience stream: Nygard, Release It!; AWS Builders' Library, timeouts, retries and backoff with jitter; Well-Architected REL05-BP03)
---

# RES-1: Every outbound call is bounded, and retries are earned, not assumed

**Statement.** Every outbound call (HTTP, database, cache, queue, model API) is constructed through one resilience chokepoint and carries a finite deadline; no outbound path can wait forever. Retries are capped, jittered with backoff, and attach only to operations that are idempotent or carry an idempotency key (DATA-3's discipline decides which); a non-idempotent call is never retried by policy. Cross-service seams carry a circuit breaker so a dead dependency is failed fast, not re-dialed per request. Cancellation propagates: when the caller's deadline expires or the client disconnects, the outbound work is cancelled, not orphaned. The chokepoint also installs the trace-context propagator, so every outbound seam carries OBS-1's trace context by construction rather than by each seam remembering.

**Harm.** One hung dependency pins a thread or connection per request until the pool drains and the whole site is down serving errors about a feature most requests never touched; this is the classic stability failure. Unjittered, uncapped retries turn a partner's brownout into a self-inflicted outage: every client retries in lockstep and the recovering service is beaten back down. A retry on a non-idempotent call is a double charge wearing a resilience costume.

**Enforcement.**
- Mechanism class: an architecture test bans raw client construction outside the chokepoint factory, so a call that skips the discipline cannot exist; a registry-enumeration test walks every registered resilience pipeline and asserts a finite timeout, a capped jittered retry policy, a breaker where the seam declares one, and the trace propagator installed; each cross-service seam owes a fault-injection test (a latency toxic held past the deadline) asserting fail-fast at the deadline, the ruled retry count, and the breaker opening.
- Edition: owed; trigger: the first external service dependency in an edition project. Database session bounds are RES-6's, carved out so this claim stays about the chokepoint shape.

**Weakening notes.** The chokepoint proves construction discipline, not that the ruled deadline is right for a given seam; deadline values are D-000 rulings recorded as CFG-1 operational settings. Hedged requests are a permitted technique inside the chokepoint for read-only seams that have earned it, never a mandate; misapplied hedging doubles load exactly when the dependency is least able to bear it. The breaker obligation is per cross-service seam by declaration; the registry test proves declared breakers exist, review keeps the declarations honest.
