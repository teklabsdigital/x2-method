---
id: TEN-1
family: tenancy
locus: centralized
provenance: X-1, B1-2
---

# TEN-1: Tenant identity comes only from the authenticated credential

**Statement.** The tenant a request operates in is resolved solely from the validated authentication credential (the tenant claim in the token). Tenant identity never travels as a route, query, header, or body parameter, and no request contract carries a tenant identifier field.

**Harm.** Horizontal privilege escalation by parameter tampering: if any endpoint accepts a caller-supplied tenant id, one forged value yields full cross-tenant read or write. The attack costs nothing and evades per-entity guards.

**Enforcement.**
- Mechanism class: an architecture test scans the application's real route table for tenant-shaped route/query parameters, and a reflection scan over all request contract types rejects tenant identifier fields.
- Edition: runtime EndpointDataSource scan over the composed host plus Contracts-assembly reflection, both in the single arch-test project, run by the CI loop (TEST-3).

**Weakening notes.** The contract scan covers only the contracts assembly; request types declared elsewhere escape it. MOD-2 placement rules make "all request contracts live in Contracts" itself testable, closing the gap.
