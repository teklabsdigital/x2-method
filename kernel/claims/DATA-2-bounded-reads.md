---
id: DATA-2
family: data
locus: per-seam (skeleton makes the default safe)
provenance: Bucket 3 (AsNoTracking/keyset conventions)
---

# DATA-2: Reads are bounded and untracked by default

**Statement.** List reads are paginated by keyset (not offset) and run without change tracking. An unbounded table read or a tracked read-only query is a defect, not a style choice. Bounds are explicit: every list endpoint has a maximum page size.

**Harm.** The query that returned 50 rows in development returns 5 million in production year two: memory spikes, timeouts, and offset pagination that degrades linearly while silently skipping rows under concurrent writes.

**Enforcement.**
- Mechanism class: the skeleton makes the safe pattern the path of least resistance: store base helpers expose keyset-paginated, no-tracking query shapes, so writing an unbounded tracked read requires deliberately bypassing the provided seam.
- Edition: the v1 store implements the shape directly (`AsNoTracking`, a tiebroken keyset cursor, a page-size clamp shared by service and store); with a single module there is no shared store base yet, so each new store owes the same shape by review; list contracts carry cursor + limit shapes.

**Weakening notes.** This claim's static enforcement is the weakest in the catalog and the file says so: no cheap arch test proves an arbitrary query bounded. The mechanism is structural (the skeleton's defaults) plus review. If a project later wants a hard gate, an analyzer banning raw `ToListAsync` outside store helpers is the named upgrade path; it is not v1.
