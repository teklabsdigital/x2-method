---
id: PERF-5
family: performance
locus: centralized
provenance: patterns pass 2026-07-24 (performance stream: bounded-cache practice; cache-stampede literature)
---

# PERF-5: Every cache is bounded and every entry expires

**Statement.** Every in-process cache declares a size bound (entries or bytes) and every entry carries a finite TTL. The codebase has one sanctioned cache-set surface, a wrapper whose signature requires both, so an unbounded or immortal entry cannot be written without bypassing the seam; unbounded cache and memoization constructors are lint errors. RES-2 bounds queues because unbounded queues eat memory under load; this claim is the same rule for the other unbounded-growth idiom that hides in plain sight.

**Harm.** An unbounded cache is a memory leak with a respectable name: it grows with key cardinality forever and presents as gradual production OOM, unreproducible in dev where cardinality is small. A TTL-less entry is staleness forever: the config change or permission revocation that "didn't take" because some instance cached the old value at boot and will serve it until the next deploy.

**Enforcement.**
- Mechanism class: lint bans unbounded cache and memoization constructors in server code; the cache wrapper is the one sanctioned set surface and its signature makes bound and TTL required; a configuration assertion enumerates declared caches and their bounds, the RES-2 idiom applied to caches.
- Edition: owed; trigger: the first cache in an edition project; the claim deliberately does not mandate caching anywhere, it prices caching where chosen.

**Weakening notes.** Bounds and TTLs are ruled per cache (CFG-1); the claim rules existence, not magnitude. TTL is the staleness bound for SEC-4's session-version cache too; where a cached value gates security decisions, the TTL ruling is a security ruling, and the claim defers to the stricter owner. Cache-stampede coalescing (a miss under concurrency computes once, not N times) is the named companion proof that rides the first real cache as a per-seam test; it is recorded here so the first cache's slice owes it, not as a mandate on caches that do not exist.
