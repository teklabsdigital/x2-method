---
id: TEN-4
family: tenancy
locus: centralized (one save pipeline)
provenance: X-1, risk item 3; write-provenance extension, compliance-mapping pass 2026-07-24 (SOC 2 TSC CC7.2 and PI1; E8 privileged-action evidence)
---

# TEN-4: The save pipeline stamps tenancy and write provenance, and refuses cross-tenant writes, fail-closed

**Statement.** The persistence layer's single save pipeline stamps the current tenant onto new rows and refuses any modification or deletion touching a row belonging to another tenant. If tenant scope is unset when a tenant-owned row is saved, the save throws. An unset scope never causes the guard to be skipped.

The same pipeline stamps write provenance on every tenant-owned row: actor and instant on create, actor and instant on every modify. The actor resolves from the ambient authenticated context; non-interactive paths (jobs, startup tasks, seeding) and anonymous write surfaces (SEC-1 allowlist entries) establish a named system actor explicitly at entry, the same discipline as TEN-2's scope. An unset actor at save time throws, the same fail-closed shape as the tenant guard. Stamps are assigned by the pipeline unconditionally: values already present on the object graph are overwritten (SEC-2 keeps these fields off the wire; this keeps hand-set values out of the row). Instants are UTC offset-aware per TIME-1.

**Harm.** Write-side cross-tenant corruption: a service bug or background path writing another tenant's rows. The guard's value and its failure mode appear together in one anti-pattern: a guard that is real but executes only when tenant context is set, so the unset case (the likeliest misconfiguration) bypasses it. For provenance: stamps set by hand per service are inconsistent or absent exactly when someone needs to answer who changed this row and when (an incident, an auditor's sample), and a hand-set stamp can lie. Evidence that exists only where a developer remembered is the aspirational-claim failure applied to data.

**Enforcement.**
- Mechanism class: unit tests on the save pipeline covering stamp-on-create, throw-on-foreign-row, throw-on-unset-scope, stamp-provenance-on-create, stamp-provenance-on-modify, overwrite-caller-supplied-stamp, and throw-on-unset-actor; e2e cross-tenant probes as the outer net.
- Edition: a SaveChanges override/interceptor in the kernel DbContext base, with the tenancy tests shipped in the skeleton; the provenance stamps extend the same interceptor, and the stamped members live on the same marker that declares tenant ownership, so the TEN-3 entity sweep also proves the fields exist. The stamps are owed (trigger: next edition build pass).

**Weakening notes.** This is the write backstop, not the primary mechanism (that is TEN-1/TEN-2/TEN-3 layered together). EF global query filters may be added as read-side defense-in-depth per project, but are never the load-bearing mechanism (X-1 ruling: the context-injection family is explicitly rejected as primary). Provenance stamps are last-writer state, not history: no before/after values, no per-field trail, and a hard delete leaves no stamp behind. A change history or a deletion record is an event-log concern (OBS-2), not a row stamp; claiming audit-trail coverage from stamps alone would overstate the mechanism.
