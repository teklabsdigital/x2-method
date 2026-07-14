---
id: SEC-4
family: security
locus: centralized
provenance: B1-4
---

# SEC-4: Token validation pins its algorithm; sessions are revocable by version

**Statement.** Bearer token validation pins the exact expected signing algorithm and requires signed tokens; algorithm negotiation from token headers is rejected. Every principal carries a server-side session version; middleware rejects tokens minted before the current version, so revocation (role change, password change, disable, sign-out-everywhere) takes effect immediately rather than at token expiry.

**Harm.** Algorithm-confusion forgery (the classic alg:none / RS-to-HS downgrade family), and zombie sessions: a disabled or demoted user retaining full access for the remaining token lifetime.

**Enforcement.**
- Mechanism class: host configuration asserted by tests: a tampered-token test (signature manipulation yields 401) and a session-version test (bump version, old token rejected).
- Edition: pinned algorithm + RequireSignedTokens in the host, version-check middleware, and the two named tests. Signing-key configuration is fail-closed outside development (DATA-5, SEC-5).

**Weakening notes.** Version checks cost a lookup per request; a short-TTL cache is acceptable (for example a 5-minute window) provided the TTL is a named, tested bound, because the cache window is exactly the revocation delay.
