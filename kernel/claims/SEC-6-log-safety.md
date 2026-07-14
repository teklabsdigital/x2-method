---
id: SEC-6
family: security
locus: per-seam (named tests at each logging surface)
provenance: Bucket 3
---

# SEC-6: Logs carry no secrets, no tokens, no message content

**Statement.** Logs and diagnostics never contain credentials, bearer tokens, or user message content/PII. Identifiers and shapes are logged; payloads are not. Redaction is tested, not promised: each logging surface that could see sensitive material carries a named test asserting known secret shapes and content fields never reach the sink.

**Harm.** Logs are the least-protected copy of production data: shipped to third-party aggregators, retained for years, readable by the widest audience. One interpolated request object undoes every access control upstream of it.

**Enforcement.**
- Mechanism class: named log-safety tests per surface (hub/realtime logging, harness output, error handlers) asserting redaction of secret-shaped values (key patterns, JWT shape) and absence of content fields.
- Edition: the harness redaction surface (key redaction plus JWT-shape scrub) is unit-tested and wired into the CI loop; the hub log-safety surface is owed with RT-1 (trigger: realtime).

**Weakening notes.** This is a per-seam obligation, honestly stated: no global scan proves an arbitrary future log statement safe. Each slice that adds a logging surface near sensitive data owes its named test. Debug logging of key state transitions remains mandatory (fail-fast observability); the claim governs what the entries contain, not whether they exist. The metrics-plane content allowlist (MeterListener tag-key pattern) is the v2 extension of this claim.
