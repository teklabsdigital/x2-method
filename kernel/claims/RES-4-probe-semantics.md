---
id: RES-4
family: resilience
locus: centralized
provenance: patterns pass 2026-07-24 (resilience stream: Kubernetes probe semantics; Azure Architecture Center, health endpoint monitoring)
---

# RES-4: Liveness answers alone; readiness answers for its dependencies

**Statement.** The host exposes two health surfaces with disjoint meanings. Liveness reaches no dependency: it answers from process state alone, because its only question is "should the orchestrator restart this process". Readiness reaches the declared critical dependencies, because its question is "should traffic route here". The orchestrator's probe configuration wires each probe to its matching endpoint, and that wiring is part of the deployed artifact, not tribal knowledge.

**Harm.** A liveness probe that checks the database converts one database blip into a fleet-wide restart storm: every healthy instance is killed for a fault none of them has, turning a degradation into an outage. The inverse failure is quieter: a readiness probe that answers 200 from process state routes traffic to an instance that cannot serve it, and the balancer's health model becomes a lie.

**Enforcement.**
- Mechanism class: an architecture test asserts the liveness handler's dependency graph reaches no store, client, or external port type, and that the readiness handler reaches exactly the declared critical set; an integration test stops the database and asserts liveness stays 200 while readiness goes non-200; the deployment manifest's probe wiring is asserted by the same configuration check that pins SEC-9's edge posture.
- Edition: owed; trigger: the first deployed edition host (lands with RES-3 and SEC-9; the health root SEC-1 already allowlists is the surface this claim splits in two).

**Weakening notes.** "Critical dependency" is a D-000 ruling per project: a cache the code degrades without does not belong in readiness, and putting it there converts cache maintenance into an availability event. The arch test proves reachability, not tuning; probe periods and thresholds are platform configuration reviewed with the deployment, and the claim rules the semantics, not the numbers.
