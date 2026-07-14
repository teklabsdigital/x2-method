---
id: TEN-2
family: tenancy
locus: per-seam (central accessor, per-entry obligation)
provenance: X-1, risk item 3
---

# TEN-2: Tenant scope is established at every entry and fails closed

**Statement.** Every execution path (HTTP request, realtime connection, background job, startup task) establishes tenant scope explicitly at its entry point. Any data access attempted with scope unset fails immediately, before I/O. There is no fail-open default: an unset scope is an error, never "no filter".

**Harm.** Background and system paths silently operating across tenants. The failure shape: a save guard that runs only when tenant context is set, so a null-tenant context skips both the stamp and the throw entirely, and precisely the paths most likely to be misconfigured are the ones unguarded.

**Enforcement.**
- Mechanism class: a fail-fast scope accessor that throws on unset access, stamped by middleware at HTTP ingress and by an explicit `Begin(tenantId)` call on every non-HTTP path; cross-tenant e2e probes assert uniform not-found behavior.
- Edition: AsyncLocal ambient scope with a fail-fast accessor that throws on unset access. The job base class (requiring a tenant id to construct, so the `Begin` call is structural) is owed, trigger: first background job.

**Weakening notes.** No static test can prove every future entry point establishes scope. The honest net is: runtime fail-fast (any miss throws on first access rather than leaking), plus a per-slice obligation that each new non-HTTP entry names its `Begin` site in review. Deliberate cross-tenant sweeps are not exceptions to this claim; they are TEN-5 ledger entries.
