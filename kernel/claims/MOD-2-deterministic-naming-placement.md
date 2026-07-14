---
id: MOD-2
family: modules
locus: centralized
provenance: X-13 (user-raised)
---

# MOD-2: A file's path and name are a pure function of kind, module, and subject

**Statement.** There is exactly one legal location and name for any artifact, derivable from what it contains: artifact kind + module + subject. A generator or reader jumps, never searches. Artifact kinds form a closed registry; introducing a new kind is a deliberate kernel edit, not an ad hoc naming choice.

**Harm.** Three named harms from the ad hoc history: duplication (a parallel file created because the existing one was not found), working-set waste (searching instead of jumping), and dirty diffs (regenerated consequences landing in new files instead of overwriting their predecessors). Regeneration is only idempotent if placement is deterministic, so this claim directly serves the X2 loop.

**Enforcement.**
- Mechanism class: an architecture test asserting file name equals declared type name, registry-suffixed types live in their kind's legal location, and routes originate only from endpoint files; lint filename-case and placement rules on the client; the skeleton itself instantiates the names so the loop never invents them.
- Edition (.NET): closed suffix registry: `{Resource}Endpoints.cs`, `{Subject}Service.cs`, `I{Subject}Store.cs`/`Ef{Subject}Store.cs`, `{Entity}Configuration.cs`, `{Subject}Options.cs`/`Middleware.cs`/`Policy.cs`, `{ExternalSystem}Client.cs`, `{Subject}Tests.cs`. Edition (TS): file name equals primary export; `use{Subject}.ts` hooks, `{domain}Repo.ts` data access, PascalCase components, kebab-case folders, tests mirror the SUT in the nearest `__tests__/`.

**Weakening notes.** Deliberately excluded: aesthetic naming, abbreviation policy, domain word choice. Those are review matters; mandating them fails the YAGNI gate (X-13).
