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
- Edition: the kernel's `EndpointSpineTests` scans the composed host's EndpointDataSource asserting every endpoint carries a policy, plus a deny-by-default fallback policy registered in `Program.cs` as the belt to the scan's braces. Both live in the single arch-test project that cannot be filtered out of a test run (X-8: splitting flagship guards across the e2e project means filtering e2e silently drops them; the kernel forbids that split).

**Weakening notes.** Per-slice source-text regex guards over endpoint files are brittle and are not the mechanism; the composed-host runtime scan is canonical. Carve-outs (streaming heads, platform-admin policies) must be named in the scan itself with a justification comment, mirroring TEN-5 discipline.
