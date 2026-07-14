---
id: SEC-3
family: security
locus: centralized
provenance: X-8
---

# SEC-3: No PII in routes or query strings

**Statement.** No route or query parameter carries personally identifying information (email, phone, name, national identifier, date of birth). PII travels in request bodies over TLS. URLs are not private: they persist in server logs, proxies, browser history, and referrer headers.

**Harm.** PII leakage through every log aggregator and intermediary that ever sees a URL, converting routine observability into a privacy incident.

**Enforcement.**
- Mechanism class: a runtime scan over the composed route table rejecting parameters whose names match a PII name list.
- Edition: a runtime route-table scan rejecting PII-named parameters (list: email, phone, name, ssn, dob), arch-test project, CI loop.

**Weakening notes.** A name list is a heuristic: a novel parameter name carrying PII escapes it. The list is extended per project at D-000 when the domain introduces new identifier kinds (medical record numbers, license plates). Opaque surrogate ids in URLs are the sanctioned pattern.
