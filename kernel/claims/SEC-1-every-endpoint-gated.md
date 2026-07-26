---
id: SEC-1
family: security
locus: centralized
provenance: X-8, risk items 1-2-4
---

# SEC-1: Every endpoint is permission-gated; anonymity is allowlisted; the default is deny

**Statement.** Every endpoint requires an explicit permission policy. Bare "authenticated is enough" registrations are rejected. Anonymous endpoints exist only on an enumerated allowlist reviewed as a security surface. The host registers a deny-by-default fallback authorization policy, so an endpoint that forgot its attribute is unreachable, not public.

**Harm.** Three failure shapes seen live in a system without this mechanism: no fallback policy, so an attribute-less action is publicly reachable; an anonymous POST accepting audit events (audit-poisoning vector); and an anonymous controller injecting the security database context directly. Each is one forgotten or missing attribute away from an incident.

**Enforcement.**
- Mechanism class: a runtime scan over the application's composed route table asserting every endpoint carries a permission policy, rejecting bare authenticated-only registrations and any anonymous endpoint not on the allowlist; plus a host test asserting the fallback policy actually denies anonymous callers, not merely that it is registered.
- Completeness obligation: **when**, the enumeration is taken from the composed route table at the point the host is ready to serve, after every registration and every hook that can rewrite a route, never from a registration-time snapshot and never from source text. **Closure**, over every endpoint the host will actually dispatch to, however it was registered, and keyed on the method and the path together, since an anonymous entry for one method is not an entry for another on the same URL; a URL matching no endpoint is inside the surface, not outside it. **Remedy**, an endpoint the enumeration cannot resolve a policy for fails the build, and at run time the unmatched and the unresolved both deny, so the failure mode of the enumeration is refusal rather than admission.
- Mechanism relationship: the fallback and the scan are asserted to be belt and braces, and the edition owes evidence for the independence, not only for each mechanism. Independence here means the two fail on different inputs: the scan reads the enumeration, and the fallback answers a request the enumeration never contained. An edition that derives both from the same enumeration has one mechanism wearing two names, and the claim's demand for a test that the fallback actually denies anonymous callers becomes unsatisfiable by construction. Splitting on what each mechanism consults, rather than on when it runs, is what buys the independence back.

**Weakening notes.** Per-slice source-text regex guards over endpoint files are brittle and are not the mechanism; the composed-host runtime scan is canonical. Carve-outs (streaming heads, platform-admin policies) must be named in the scan itself with a justification comment, mirroring TEN-5 discipline.
