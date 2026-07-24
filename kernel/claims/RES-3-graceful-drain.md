---
id: RES-3
family: resilience
locus: centralized
provenance: patterns pass 2026-07-24 (resilience stream: 12-factor IX disposability; Kubernetes pod-termination lifecycle)
---

# RES-3: The host dies cleanly, and there is a test that kills it

**Statement.** On the termination signal the host flips readiness to failing so the balancer stops routing to it, stops accepting new work, completes in-flight requests within a drain budget shorter than the platform's grace period, and exits zero. Background workers register their drain handlers on the same single shutdown seam, so nothing learns about termination by being killed. A host that needs the grace period's SIGKILL to die is a defect.

**Harm.** Without a drain, every deploy and every scale-down kills requests mid-flight: users see errors on every release, which trains the team to fear deploying, and a write killed between steps creates exactly the cross-store partial completion DATA-4 exists to reconcile. Prevention on the common path (a routine deploy) is strictly cheaper than reconciliation after it.

**Enforcement.**
- Mechanism class: a harness scenario sends the real termination signal to the composed host under in-flight load and asserts the ordering (readiness fails first, accept stops, in-flight completes), the drain budget, and the zero exit code. This is TEST-4's mirror: TEST-4 proves the product boots in its real shape; this proves it dies in its real shape.
- Edition: owed; trigger: the first deployed edition host (rides SEC-9's deployment-edge work; the drain budget is a CFG-1 operational setting ruled against the platform's grace period).

**Weakening notes.** The scenario proves the host's drain seam, not that every future background worker registered on it; each new worker owes a line in the drain test the same way each new flow owes UI-5 a smoke line. In-flight work longer than any sane drain budget (a long export) does not get a longer budget; it gets moved off the request path onto a resumable worker, which is the design pressure this claim is meant to apply.
