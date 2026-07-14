---
id: RT-1
family: realtime
locus: centralized
provenance: X-11, B1-5
---

# RT-1: One client connection; references not bytes; durable mutations over REST

**Statement.** A client maintains exactly one realtime connection, logically partitioned by module through a dispatcher; never one connection per feature. No file or binary payload ever crosses the socket: bytes travel over REST (multipart), and an identifier or reference rides the socket. Durable state mutations go over REST; the socket carries conversation, events, and streams. Server-side hub count is a design choice, not an invariant (two hubs can be legitimate partitioning).

**Harm.** Per-feature connections multiply per-user server cost and reconnect storms until scale kills the product. Binaries over the socket bloat message buffers, defeat caching and resumability, and turn one large upload into head-of-line blocking for every other event on the connection.

**Enforcement.**
- Mechanism class: server-side, a hub-surface architecture test rejecting binary-typed hub method parameters and asserting a bounded maximum receive size; client-side, structural review that exactly one connection factory exists and all modules register through its dispatcher.
- Edition: owed, trigger: first realtime slice (the v1 edition is REST-only). The promotion set: an arch test scanning hub methods for `byte[]`/`Stream`/file types, `MaximumReceiveMessageSize` asserted, the single `createHub` client seam with dispatcher and one pure reducer (the proven shape: settled/transient events folding through one reducer, writes as invokes, takeover via REST), and the socket harness scenario (TEST-2).

**Weakening notes.** The client-side single-connection rule has no cheap static proof in TS; the skeleton's structure (one factory module, deep-path import bans keeping modules off the raw transport) is the mechanism, plus the e2e harness exercising the socket path end to end (TEST-2).
