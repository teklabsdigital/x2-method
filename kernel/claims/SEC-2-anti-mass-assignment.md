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
- Mechanism class: a reflection scan over every body-bound request type asserting no member (writable property, or constructor parameter of an immutable DTO) matches the forbidden-field registry; the registry is a single named list in the test, extended deliberately.
- Edition: a reflection scan over the Contracts assembly plus a composed-host scan of every endpoint's body-bound DTO (injected services excluded structurally), in the arch-test project, in the CI loop.

**Weakening notes.** The body-bound scan means a request type declared outside Contracts cannot escape; MOD-2 placement (request/response records live only in Contracts) is the structural backstop. Name-based matching is heuristic: a field named `newState` slips past a registry listing `status`. The registry grows via review; the claim keeps the registry in one place so growth is cheap.
