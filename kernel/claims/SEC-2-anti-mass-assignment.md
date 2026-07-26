---
id: SEC-2
family: security
locus: centralized
provenance: X-8
---

# SEC-2: Request contracts never carry server-controlled fields

**Statement.** No request contract exposes a field the server owns: entity ids on create, tenant id, timestamps, audit fields (created/updated by), status/state, concurrency tokens, or role/permission grants. The server assigns those values; model binding cannot.

**Harm.** Mass assignment: a caller posts `"status": "Approved"` or `"createdBy": "admin"` and the binder obliges. The vulnerability is invisible in code review because each individual DTO looks innocent.

**Enforcement.**
- Mechanism class: a reflection scan over every body-bound request type asserting no member (writable property, or constructor parameter of an immutable DTO) matches the forbidden-field registry; the registry is a single named list in the test, extended deliberately. The comparison is part of the mechanism and not only the list: it resolves compounds, concatenations, decompositions, and plurals of a listed word, so a registry entry `status` covers `noteStatus` and `notestatus`, and the edition owes evidence for the comparison in the same test that holds the list.
- Completeness obligation: **when**, the set of body-bound types is enumerated from the composed route table once the host is ready to serve, never from a naming convention, a source directory, or a package the types are expected to live in. **Closure**, to every depth of the contract and with no depth cap: a nested object, an array or collection element, a generic argument, and every branch of a polymorphic or composed schema are all part of the body a caller can post, with cycle protection so a self-referential contract terminates. A closure bought at the top level buys nothing one level down, which is measured and not predicted. **Remedy**, a member matching the registry fails the build; a member the contract does not declare must not reach the handler, and whether it is refused or removed is a ruling recorded per surface, because the two are opposite behaviours and both are correct somewhere.

**Weakening notes.** The body-bound scan means a request type declared outside Contracts cannot escape; MOD-2 placement (request/response records live only in Contracts) is the structural backstop. Name-based matching is heuristic: a field named `newState` slips past a registry listing `status`. The registry grows via review; the claim keeps the registry in one place so growth is cheap.
