---
id: DATA-9
family: data
locus: centralized
provenance: patterns pass 2026-07-24 (architecture stream: Fowler, PoEAA optimistic offline lock; HTTP conditional requests, RFC 9110 preconditions)
---

# DATA-9: A stale write is refused, never silently applied

**Statement.** Every concurrently mutable entity carries a concurrency token mapped in the persistence model, and the save pipeline refuses a write whose token is stale. The refusal crosses the wire in the dialect's precondition vocabulary: a stale conditional write returns precondition-failed, and a mutable resource's update surface requires the condition rather than accepting an unconditional overwrite. The client's job on refusal (reload, merge, re-present) is flow design; the server's job is to make the conflict impossible to miss.

**Harm.** The lost update: two users open the same record, both edit, the second save silently destroys the first with no error to either. Nobody reports it because nobody saw it; the first user's work is simply gone, discovered at the audit or the complaint. Nothing else in the catalog covers this: tenancy isolates tenants from each other, not a tenant's own users from each other.

**Enforcement.**
- Mechanism class: a reflection sweep over the persistence model asserts every mutable entity maps a concurrency token (the TEN-3 marker idiom decides "mutable"); save-pipeline unit tests, in TEN-4's home, assert the stale write throws; contract tests assert the wire behavior (stale condition returns precondition-failed; unconditional update of a guarded resource is refused).
- Edition: owed; trigger: the next edition build pass (rides TEN-4's interceptor work; the token and the refusal live in the same save pipeline the tenancy guard already owns).

**Weakening notes.** Create-only and append-only entities have no lost update to lose and are exempt by the same marker that scopes the sweep. The token proves the row did not change; it cannot arbitrate which of two changes was right, so flows whose edits must merge rather than exclude (collaborative text) are a different design the claim does not cover. SEC-2 already keeps the token itself off the writable contract surface: the caller presents it as a condition, never sets it as a field.
