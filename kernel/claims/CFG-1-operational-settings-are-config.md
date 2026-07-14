---
id: CFG-1
family: config
locus: centralized
provenance: INV-06 (acceptance-test record, turn "bad bad bad" and the exit-interview script recurrence)
---

# CFG-1: Operational settings are configuration, not code

**Statement.** Non-secret operational settings (a model id, a provider endpoint, a feature flag, a timeout, a
persona path) resolve from configuration and live in committed appsettings; secret settings live in the
developer-local secret store or vault (SEC-5); mandatory settings fail fast at startup (DATA-5). A literal in
code is the third, wrong home and is banned: changing it needs a recompile and redeploy, the value escapes the
config-review and per-environment surface, and tests cannot vary it. Scripts are part of the code surface: a
script never duplicates a committed configuration value, it reads it.

**Harm.** The path of least resistance puts the model id in the composition root as a string, and the product's
operating characteristics silently become build artifacts. The pilot hit it twice: a model id hardcoded in
`Program.cs` (changing models meant recompiling), then a script duplicating committed issuer and audience values
so the two copies could drift.

**Enforcement.**
- Mechanism class: a cheap architecture test over host source and shipped scripts banning a small registry of
  operational-setting literal shapes, plus the SEC-5 and DATA-5 mechanisms already covering the two right homes.
- Edition: `OperationalSettingsTests` scans `server/src` and `scripts/` for model-id shapes and known provider
  endpoints; the shipped e2e script reads Jwt:Issuer and Jwt:Audience from committed appsettings rather than
  duplicating them.

**Weakening notes.** The registry is heuristic, the cheap net, exactly like UI-2's named-color list: a novel
operational-setting shape escapes it until it is added, and the registry is extended per project at D-000. The
claim's real defense is the pair of right homes being the path of least resistance (a `Required(...)` read is one
line); the scan exists because "one more literal" slipped in exactly once already.
