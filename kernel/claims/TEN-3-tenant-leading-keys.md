---
id: TEN-3
family: tenancy
locus: centralized (model-level assertion)
provenance: X-1
---

# TEN-3: Tenant-owned tables carry tenant-leading composite keys

**Statement.** Every tenant-owned table's primary key is a composite key led by the tenant identifier. Row identity includes tenancy, so cross-tenant lookups are structurally awkward, joins compose tenancy by construction, and index locality follows the tenant.

**Harm.** With single-column surrogate keys, one forgotten filter is a silent cross-tenant read that returns plausible data. Tenant-leading keys convert that class of bug from "wrong data" to "no data or compile friction".

**Enforcement.**
- Mechanism class: an architecture test over the persistence model asserting every tenant-owned entity's primary key leads with the tenant id; a sanctioned exception carries a named justification and its own guard at the key assertion. A key-shape exemption is not a cross-tenant access path, so it does not belong in the TEN-5 access-ledger schema and has no meaningful sole-reader test; the two exception kinds are recorded in different places.
- Edition: reflection over the built EF model (`IModel`) in the arch-test project. A prior system had many conforming key sites with one documented exception (a status-leading key for a global poller) but no arch test asserting the rule; the kernel adds the model-level assertion so the convention cannot erode silently.

**Weakening notes.** "Tenant-owned" needs a definition the test can read: the edition marks tenant-owned entities via a marker interface or base type, and the test asserts the key rule over that set plus flags unmarked entities carrying a TenantId property.
