---
id: SEC-11
family: security
locus: centralized
provenance: patterns pass 2026-07-24 (resilience stream: least-privilege database roles; SQL injection blast-radius practice)
---

# SEC-11: The runtime credential cannot touch the schema

**Statement.** The credential the serving process connects with is DML-only: it can read and write rows in the application's tables and nothing else. DDL capability (create, alter, drop, grant) exists only in the credential DATA-6's migrate mode uses, which the serving process never holds. The split is proven, not configured and assumed: a test connects as the runtime role, attempts DDL, and asserts refusal by the engine.

**Harm.** With one almighty credential, any SQL injection, ORM bug, or compromised dependency that reaches the database can alter or drop schema: the blast radius of an application-layer fault is the entire database rather than the data surface the application legitimately touches. The split also makes DATA-6's boundary structural: a serving boot cannot migrate as a side effect (the harm DATA-6 names) when the engine itself refuses the serving role DDL.

**Enforcement.**
- Mechanism class: a named integration test connects as the runtime role, attempts CREATE, ALTER, and DROP, and asserts each is refused by the engine; the role grants live in provisioning code under review, beside DATA-6's migrate-mode wiring, never hand-applied to production.
- Edition: owed; trigger: the next edition build pass (rides DATA-6: the migrate mode and the role split are one provisioning story; the integration tier's provisioning path is where both roles are created).

**Weakening notes.** DML-only is still powerful: it reads and writes every row the schema exposes, so this claim bounds the schema, not the data; row-level damage is what TEN-3, TEN-4, and DATA-9 bound. Engines differ in grant vocabulary, so the mechanism is the refusal test, which is engine-portable, rather than an assertion over grant syntax, which is not. Dev-tier conveniences (a single sa credential in throwaway containers) are the provisioning path's business, but the integration tier that proves this claim must provision both roles or the proof never runs.
