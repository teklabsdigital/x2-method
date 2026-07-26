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
- Mechanism class: an architecture test scans the application's real route table for tenant-shaped route/query parameters, and a reflection scan over all request contract types rejects tenant identifier fields. The statement names four surfaces and a scan reaches three of them, because a caller may send a header nobody declared and there is no enumeration of the headers a request can carry. The fourth surface therefore takes a mechanism of a different kind, and the claim requires one rather than dropping the surface: at run time, before any handler, tenant-shaped headers are removed or the request is refused, and tenant resolution is proven by test not to consult a header even when one arrives. A declared header binding stays inside the scan's reach and is a violation there; the undeclared arrival is what the runtime mechanism exists for, and neither half substitutes for the other. The comparison is part of both mechanisms and not only the registry: it resolves compounds, concatenations, decompositions, and plurals of a listed word, so an entry `tenant` covers `tenantId` and `tenantid`, and an entry `org` covers `orgId`, `orgid`, and `organisationid`; a stack that lowercases header names before any hook runs has no case boundary to tokenize on, so the concatenated spellings are part of what the comparison must resolve rather than an optional extension of the list.
- Completeness obligation: **when**, the route and contract enumerations are taken from the composed route table once the host is ready to serve, and the header mechanism runs on every request rather than on an enumeration at all. **Closure**, all four surfaces, and for the body contract to every depth, since a tenant id nested two levels inside a posted object is the same forged value as one at the top. The set of types the contract scan reaches is enumerated by a rule the enumeration can itself check, never by a naming convention or a single package that types are expected to live in. **Remedy**, a match on any scanned surface fails the build; a tenant-shaped header arriving at run time is removed or refused before the handler; and the identity mint surface (TEN-6) is the one carve-out, named in the mechanism with its justification.

**Weakening notes.** The contract scan covers only the contracts assembly; request types declared elsewhere escape it. MOD-2 placement rules make "all request contracts live in Contracts" itself testable, closing the gap. The identity mint surface (TEN-6) is the scans' one sanctioned carve-out, named and justified in the scan itself in the SEC-1 discipline: it accepts a tenant selection in order to mint the credential, validated against membership at mint time; it never scopes a product request.
