---
id: AI-1
family: ai-trust
locus: centralized
provenance: B1-3
---

# AI-1: The server injects identity and scope into tool calls; the actor never supplies them

**Statement.** When an AI actor invokes tools, identity, tenant, and scope parameters are injected unconditionally by the server from the authenticated context. Actor-supplied values for those parameters are rejected before any merge with server context, matching case-insensitively and recursing through nested containers. If the authenticated context is unset, the tool call throws; it never proceeds unscoped.

**Harm.** A model is an untrusted parameter source: prompt injection or plain hallucination can supply another resident's id, another tenant's scope, or an elevated role. If the executor merges actor parameters over server context, every tool becomes a confused deputy.

**Enforcement.**
- Mechanism class: the tool-execution seam is a single chokepoint owning the reject-then-inject sequence, covered by unit tests for rejection, unconditional injection, and throw-on-unset.
- Edition: the kernel's `ToolExecutor` is the chokepoint (reject before merge; ordinal-ignore-case matching, recursing nested objects and lists; throw if context unset; unconditional injection), composed with the kernel's ambient tenant scope (TEN-2) so the injected values come from the same fail-closed source as everything else.

**Weakening notes.** Rejection recurses nested dictionaries and lists, but a raw JSON subtree the executor does not walk (a `JsonElement`-typed value) still escapes it; per-tool schema review checks for identity-shaped fields inside such payloads, and a per-tool allowlist of accepted parameter names is the named upgrade that closes it. Composes with DATA-5's refusal idiom: missing user context (timezone) refuses rather than defaults.
