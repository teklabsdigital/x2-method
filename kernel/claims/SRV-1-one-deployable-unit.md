---
id: SRV-1
family: serving
locus: centralized
provenance: PC-14 (P2 extraction, 2026-07-21)
---

# SRV-1: One deployable unit

**Statement.** A web product serves its client from the server host as one deployable unit: the server serves the built client with a deliberate header posture (an uncached document, immutable hashed assets), no cross-origin surface is registered in any environment, and a fresh clone deploys from the single publish step. Development keeps the client dev server behind a proxy so the browser stays same-origin and the dev loop (hot reload) is untouched. Product API routes live under a dedicated prefix so client routes and API routes cannot collide; the health probe stays at the root.

**Harm.** A separately served client ships a cross-origin surface that exists only to serve the split, doubles the deploy story, and lets the dev and production network shapes diverge: dev works through its tooling while the production bundle quietly points at a development URL, a defect nothing in-process catches (TEST-4's class).

**Enforcement.**
- Mechanism class: composed-host tests pin the static serving and its headers; an architecture test asserts no cross-origin registration exists; a publish check asserts the artifact contains the client.
- Edition: owed; trigger: the next edition build pass. Applies to web products; an API-only project re-rules it in its deltas file at adoption.

**Weakening notes.** The SPA-fallback hole opens only when a client router exists, and then each fallback route goes through SEC-1's reviewed anonymous allowlist, never a blanket fallback. A stale staged bundle can show an old UI at the server origin in development; the runbook names the dev door and the build script is the integrated-run entry.
