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
- Mechanism class: a runtime scan over the composed route table rejecting parameters whose names match a PII name list. The comparison is part of the mechanism and not only the list: it resolves compounds, concatenations, decompositions, and plurals of a listed word, so an entry `email` covers `emailAddress`, `user_email`, `e_mail`, `EMailAddress`, `mail`, `emails`, and `email1`, and the edition owes evidence for the comparison beside the list. Enumerating the spellings by hand is a list standing in for a comparison and does not discharge this.
- Completeness obligation: **when**, the enumeration is taken from the composed route table at the point the host is ready to serve, so a route pattern or parameter written by a later hook is inside it. **Closure**, over the route pattern and the query surface together, including a parameter that binds from a wrapper type, a collection, or a value type the enumeration does not naturally walk into, and a parameter that binds without being declared is inside the surface rather than beyond it. **Remedy**, a match fails the build; a query parameter the surface does not declare is refused or removed before the handler by a ruled decision, never bound silently.

**Weakening notes.** A name list is a heuristic: a novel parameter name carrying PII escapes it. The list is extended per project at D-000 when the domain introduces new identifier kinds (medical record numbers, license plates). Opaque surrogate ids in URLs are the sanctioned pattern.
