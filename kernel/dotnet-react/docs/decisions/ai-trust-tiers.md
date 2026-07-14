---
kind: decision
status: authoritative
provenance: AI-2 (untrusted content, no authority)
---

# AI trust tiers (AI-2)

Content is classified by trust tier. Side-effecting capability derives only from the trusted tier; untrusted
content never widens what an actor may do.

- Trusted: server configuration and the authenticated principal (identity, tenant, permissions). This is the only
  source of capability. The ToolExecutor injects it (AI-1), and it originates from the fail-closed ambient tenant
  scope (TEN-2).
- Untrusted: model output, user-supplied messages, uploaded documents, fetched web content, and results returned
  by external systems. An instruction embedded in untrusted content has nothing to escalate into, because no tool
  reads identity or scope from it.

Rules:

1. Actor-supplied identity, tenant, and scope are rejected at the ToolExecutor chokepoint before any merge, and
   the server injects them unconditionally from the ambient scope.
2. Every tool states its tier at review. A read-only tool ships a guard test proving its execution path performs
   no writes; ListNotesTool with ListNotesToolReadOnlyTests is the exemplar.
3. Owed at v1 (recorded, not built): full taint tracking, and the SSRF egress guard. The egress guard is promoted
   to v1 the moment the first kernel project makes outbound agentic requests.
