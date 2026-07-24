---
id: TEN-6
family: tenancy
locus: centralized (the mint path)
provenance: compliance-mapping pass 2026-07-24 (closes the mint-time door TEN-1 cannot; SOC 2 TSC CC6.1)
---

# TEN-6: The credential's tenant is minted from membership, never asserted

**Statement.** A principal's tenant memberships are server-side data; the credential carries exactly one active tenant (the premise TEN-1 reads from). Entering or switching tenants mints a new credential through the real sign-in surface: single login, a tenant selector when memberships exceed one, and the mint validates the selected tenant against current membership at mint time, not against a value cached at login. A tenant switch never travels as a header, a parameter on a product endpoint, or mutable session state. Membership revocation composes with SEC-4: revoking a membership bumps the session version, so credentials scoped to the revoked tenant die immediately.

**Harm.** TEN-1 closes every request-time door for a caller-supplied tenant; the mint path is the one door it cannot close, and an unguarded selector reopens the whole family: a forged selection at mint yields a validly signed cross-tenant credential that every downstream guard then honors as truth. Session-mutation switching adds a second failure: two concurrent tabs silently corrupt each other's scope.

**Enforcement.**
- Mechanism class: unit tests on the mint path (foreign-tenant selection refused; membership read at mint time; revoked membership plus version bump kills the scoped credential), an architecture assertion that no endpoint outside the mint surface accepts a tenant-selection parameter (the TEN-1 scan already rejects tenant-shaped parameters; the mint surface is its one named, justified carve-out), and a harness scenario through the real sign-in path (TEST-2's gated profile).
- Edition: owed; trigger: first identity slice (shared with SEC-4's version store and SEC-10).

**Weakening notes.** The claim rules the flow shape, not the membership model: roles per membership, invitation lifecycles, and the selector UX are the identity slice's D-000 design. A minted credential stays valid for its tenant until expiry or version bump, so SEC-4's cache-TTL note is the revocation-delay bound here too.
