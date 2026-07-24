---
id: PERF-4
family: performance
locus: centralized
provenance: patterns pass 2026-07-24 (performance stream: sync-IO bans, eslint no-sync and BlockHound lineages; streaming over buffering practice)
---

# PERF-4: No synchronous IO and no whole-payload buffering on the serving path

**Statement.** Synchronous IO (blocking file reads, blocking network calls, sync-over-async bridges) is banned in server modules, enforced as lint over the serving code with a named allowlist for startup-time reads, which legitimately block a process that is not yet serving. Whole-payload buffering idioms (read-to-end into memory, then process) are banned on paths whose payload size the caller controls; those paths stream. Where the platform ships a runtime throw for sync IO on the serving path, that default is preserved and asserted, never relaxed.

**Harm.** One blocking read starves the event loop or pins a pool thread per request, and the service's concurrency ceiling quietly becomes the blocking call's latency times the pool size; one read-to-end makes memory proportional to input size, which SEC-8's body cap bounds at ingress but nothing bounds when the payload comes from storage or a partner response. Both failures pass every functional test and appear only under load, the defining property of this family's harms.

**Enforcement.**
- Mechanism class: banned-API lint scoped to server assemblies or modules (sync file and network APIs, sync-over-async idioms, read-to-end idioms), with the startup allowlist named in the lint configuration; a configuration test asserts the platform's sync-IO runtime throw is intact where the platform has one.
- Edition: owed; trigger: the next edition build pass (a BannedApiAnalyzers configuration plus one host assertion; the client side already carries the idiom under UI-2's lint discipline).

**Weakening notes.** The banned-API list is a registry, heuristic like SEC-2's and CFG-1's, extended per project as new blocking idioms appear; a blocking call hidden inside a dependency escapes the lint and belongs to DEP-1's review at adoption. The streaming ban is scoped to caller-controlled sizes: reading a bounded config file whole is fine, and pretending otherwise would make the lint a nuisance rather than a net.
