---
id: SEC-9
family: security
locus: centralized
provenance: PC-16 (P2 extraction, 2026-07-21)
---

# SEC-9: Deployment-edge hardening

**Statement.** The host ships its deployment-edge posture rather than deferring it to the proxy: forwarded-header handling with explicitly configured proxy trust (additive to the loopback default, fail-safe when unconfigured, first in the pipeline); the standard security headers on every response including re-executed error paths (content-type sniffing off, framing denied, referrer suppressed, transport security over TLS with a ruled max age); and no server product banner.

**Harm.** Behind a TLS-terminating proxy, unhandled forwarded headers collapse every per-source rate limit (SEC-8) into one proxy-address bucket and make scheme checks lie; missing response headers leave clickjacking, sniffing, and referrer leakage open on every public page, error pages included, which are exactly the pages nobody styles or reviews.

**Enforcement.**
- Mechanism class: host tests pin the header set (asserted on a re-executed error response, not only the happy path) and the forwarded-header trust options; a configuration test fails a boot that names no trust while claiming proxy deployment.
- Edition: owed; trigger: the first deployed edition host (arrives with the launch pre-flight).

**Weakening notes.** A content-security policy is deliberately not in this claim: an SPA shipping an inline bootstrap needs its own design pass, and framing denial already covers clickjacking. Transport-security subdomain and preload flags are owner opt-ins, never defaults.
