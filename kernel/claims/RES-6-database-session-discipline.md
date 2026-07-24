---
id: RES-6
family: resilience
locus: centralized
provenance: patterns pass 2026-07-24 (resilience stream: connection-pool exhaustion and transient-failure practice across engine and driver documentation; owner-raised concern at the pass)
---

# RES-6: Every database session carries four finite bounds, proven against the real engine

**Statement.** Every database session the application opens carries four finite bounds: a connect timeout, a pool acquisition timeout, a statement timeout, and a lock timeout. The bounds are asserted against the real engine as the application role's session defaults, not read back from client configuration. Leak detection is armed in the integration tier and a leaked connection fails the run. No connection is held across an await of an external call: the pool's scarcest resource never waits on RES-1's slowest dependency.

**Harm.** A single runaway query, or one un-timeboxed lock queued behind DDL, holds its connection while every arriving request queues behind it for another; a default-sized pool drains in well under two minutes and the outage presents as total while the root cause is one statement. Leaked connections produce the same exhaustion in slow motion, invisibly, until the day traffic finds the reduced ceiling. These are the transient failures that convert to permanent ones precisely because no bound was set.

**Enforcement.**
- Mechanism class: an integration-tier test opens a session as the application role and asserts all four bounds are live on the engine session (a statement that sleeps past the statement timeout is killed; a lock held past the lock timeout is refused); the pool's leak-detection threshold is armed in the integration tier and fails CI on an unreturned connection; a lint rule flags a connection or transaction scope that spans an await of a non-database external call.
- Edition: owed; trigger: the next edition build pass. Everything here runs on the existing integration tier against the real engine, so proven is reachable immediately; nothing waits on a new dependency.

**Weakening notes.** Bound values are ruled per project (CFG-1); the claim rules that all four exist and are proven live, not their magnitudes. The connection-across-await lint is heuristic: it catches the declared-scope idiom, and a handle smuggled through a field escapes it, so the pattern remains a review item at seams that mix database and external work. Migration sessions are governed by DATA-6 (whose migrate mode sets its own aggressive lock timeout) and are exempt from the application role's statement timeout by design; a migration is not an application session.
