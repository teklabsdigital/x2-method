---
id: TEN-4
family: tenancy
locus: centralized (one save pipeline)
provenance: X-1, risk item 3
---

# TEN-4: The save pipeline stamps tenancy and refuses cross-tenant writes, fail-closed

**Statement.** The persistence layer's single save pipeline stamps the current tenant onto new rows and refuses any modification or deletion touching a row belonging to another tenant. If tenant scope is unset when a tenant-owned row is saved, the save throws. An unset scope never causes the guard to be skipped.

**Harm.** Write-side cross-tenant corruption: a service bug or background path writing another tenant's rows. The guard's value and its failure mode appear together in one anti-pattern: a guard that is real but executes only when tenant context is set, so the unset case (the likeliest misconfiguration) bypasses it.

**Enforcement.**
- Mechanism class: unit tests on the save pipeline covering stamp-on-create, throw-on-foreign-row, and, critically, throw-on-unset-scope for tenant-owned entities; e2e cross-tenant probes as the outer net.
- Edition: a SaveChanges override/interceptor in the kernel DbContext base, with the three named tests shipped in the skeleton.

**Weakening notes.** This is the write backstop, not the primary mechanism (that is TEN-1/TEN-2/TEN-3 layered together). EF global query filters may be added as read-side defense-in-depth per project, but are never the load-bearing mechanism (X-1 ruling: the context-injection family is explicitly rejected as primary).
