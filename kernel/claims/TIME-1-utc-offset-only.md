---
id: TIME-1
family: time
locus: centralized
provenance: B1-7; monotonic-durations extension, patterns pass 2026-07-24
---

# TIME-1: Persisted and domain time is UTC-anchored, offset-aware, and nothing else

**Statement.** All time values in domain types, contracts, and persistence are UTC-anchored offset-aware types. Local wall-clock types (naive datetimes) never appear in those layers. Conversion to a user's local time happens at the display edge, using the timezone stored on the authenticated principal; an operation that requires a timezone refuses when it is absent rather than guessing (DATA-5). Elapsed time is measured, never computed from wall clocks: a duration comes from the monotonic source through one clock seam, not by subtracting two wall-clock readings, because the wall clock steps under NTP correction and the difference across a step is not a duration.

**Harm.** Naive datetimes are ambiguous at every DST transition and every cross-region deployment: double bookings, off-by-hours scheduling, unorderable audit trails. Both source systems converged on this independently, which is what "kernel" means.

**Enforcement.**
- Mechanism class: an architecture test reflecting over domain, contracts, application, and persistence assemblies rejecting properties/parameters of forbidden time types. The monotonic-durations extension adds a lint banning wall-clock-delta idioms (subtracting two now-readings) outside the clock seam, which exposes the monotonic source.
- Edition: `DateTimeOffset` only; `DateTime` banned by the arch scan. A prior scan covered Core/App/Contracts but not the persistence assembly (a verified gap); the kernel scan includes persistence; UTC values are set by the service, not by database column defaults. The wall-clock-delta lint is owed; trigger: the next edition build pass (OBS-1's elapsed-time logging is its first customer).

**Weakening notes.** Date-only and time-only domain concepts (a birth date, a clinic opening hour) are legitimately zoneless; the edition uses `DateOnly`/`TimeOnly` for those, which the scan permits, so the ban stays crisp: what is forbidden is ambiguous instants, not calendar concepts.

The permitted shape is still insufficient for a category the claim does not yet name. `DateTimeOffset` records a fixed offset, not a zone. For a past instant that is enough; for a scheduled *future* local event (an appointment, a medication time) it is not, because the zone's DST rules can change between now and the event (Australian jurisdictions have changed them within living memory) and a stored offset silently becomes wrong. A future local event stores wall time plus the IANA zone id and resolves to an instant at read. The v1 exemplar has no future-dated scheduling, so this is recorded as the rule the first scheduling slice adopts, not something the current scan enforces.
