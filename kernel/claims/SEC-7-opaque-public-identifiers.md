---
id: SEC-7
family: security
locus: centralized
provenance: PC-4 (P2 extraction, 2026-07-21)
---

# SEC-7: Opaque public identifiers

**Statement.** Any resource reachable without authentication is addressed by an opaque, single-purpose token: unguessable, minted once at creation, unique-indexed, never reused across surfaces. Sequential or dense identifiers (serials, auto-increment ids) never address a public surface, and derivation treats this as binding even when a frozen design artifact shows a sequential id on a public page. The sequential id may still appear as display content and as the operator key; it just never routes.

**Harm.** A public surface addressed by a dense id is enumerable: walking the id space harvests every resource, and with it names and other personal data, without ever authenticating. The reference project shipped exactly this from a faithful derivation and the owner caught it at review.

**Enforcement.**
- Mechanism class: a scan over the anonymous-route allowlist (SEC-1's) asserting each anonymous route's identifying parameter binds to the token-typed parameter, plus a persistence check that public tokens are unique-indexed and minted from a CSPRNG, not derived from the row identity.
- Edition: owed; trigger: the first anonymous resource surface in an edition project (the kernel exemplar has none).

**Weakening notes.** Opaqueness is a property of the minting, not the parameter name; the scan is heuristic on parameter binding, and the real defense is the minting idiom (a short random token column beside the serial). Composes with SEC-3: the token is also the sanctioned opaque-surrogate pattern for URLs.
