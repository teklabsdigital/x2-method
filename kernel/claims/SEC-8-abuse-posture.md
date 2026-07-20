---
id: SEC-8
family: security
locus: centralized
provenance: PC-13 (P2 extraction, 2026-07-21; owner-flagged in the source ledger)
---

# SEC-8: Abuse posture

**Statement.** Every anonymous endpoint and every spend-shaped endpoint (credential mints, outbound sends, paid model calls) carries a named rate-limit policy: keyed per source address when anonymous, per principal when authenticated, and paid-call endpoints additionally carry a host-wide ceiling that holds even when an attacker mints fresh principals. Request bodies are capped host-wide to a deliberate, ruled figure, never the framework default. Refusals reply with the standard retry semantics. The limit values are operational settings (CFG-1) awaiting the owner's ratification.

**Harm.** The security spine can be sound (deny-by-default, tenancy, hardening) while the product is still trivially degradable and financially attackable: unpriced anonymous doors invite resource exhaustion, unpriced model calls invite spend attacks, and a default multi-megabyte body cap is a free amplification lever. Discovered as a kernel gap in the reference project's first adversarial audit.

**Enforcement.**
- Mechanism class: a spine test over the composed route table asserting policy attachment on every anonymous and spend-shaped endpoint plus the presence of the global limiter and the body cap; composed-host facts observe the refusal behaviour; the e2e boot opens the windows wide so tiers do not flake.
- Edition: owed; trigger: the first publicly exposed edition host (the launch pre-flight names it).

**Weakening notes.** In-process limiter state is per-instance; a multi-instance deployment needs a shared store, the named upgrade. Classifying an endpoint as spend-shaped is a review act at D-000, not statically derivable.
