---
id: RES-2
family: resilience
locus: centralized
provenance: patterns pass 2026-07-24 (resilience stream: Nygard, Release It!; AWS Builders' Library, avoiding insurmountable queue backlogs and load shedding)
---

# RES-2: No unbounded queue, pool, or backlog anywhere in the process

**Statement.** Every in-process queue, channel, buffer, and executor backlog declares a capacity, and every declared queue names its full-queue policy (reject, shed oldest, or backpressure); the policy is never block-forever. Connection pools and worker pools are bounded with finite acquisition timeouts. Unbounded constructors for any of these are banned; queue and pool construction flows through one factory surface where the bound is a required argument.

**Harm.** An unbounded queue is Little's law with the safety off: when the producer outruns the consumer the backlog grows without limit until memory does, and every request served from deep in the backlog was abandoned by its client long ago, so the process does full work for zero goodput all the way to the OOM kill. The failure arrives only under load, which is exactly when nobody can afford it.

**Enforcement.**
- Mechanism class: a banned-API lint rejects unbounded queue, channel, and executor constructors in server code; an architecture test restricts queue and pool construction to the factory surface; a configuration assertion test enumerates the declared queues and pools and asserts every one carries a bound, a full-queue policy, and a finite acquisition timeout.
- Edition: owed; trigger: the first background worker or in-process queue in an edition project.

**Weakening notes.** The right bound is contextual and the claim does not pretend otherwise: bound values are D-000 rulings held as CFG-1 operational settings, and load testing is how they are trued. The claim rules the shape (a bound must exist and a policy must be named), not the number. The claim ends at the process boundary: a broker queue's depth is the broker's configuration, a deployment concern the catalog does not claim; what the catalog rules about broker queues is poison handling, which is RES-5's.
