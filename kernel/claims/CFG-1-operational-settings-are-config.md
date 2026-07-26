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

The ambient process environment is a fourth home, and unlike the third it is not banned. Overriding a setting at
deploy time is legitimate, a ban would be routed around, and the environment is where every platform expects the
override to arrive. It is closed by bringing it inside the config system instead: an environment read resolves
only through the declared configuration surface, under a name derived from a declared key, so the value has a
declared key, a declared type, the same fail-fast treatment as any other mandatory setting (DATA-5), and a place
in the config-review surface. An ad hoc read of the environment anywhere else is the same defect as a literal in
code and one worse: it is not a literal, so a literal registry cannot see it; it is not committed configuration,
so it escapes config review and per-environment variation; and the fallback it is almost always written with is
the silent default DATA-5 forbids one claim over.

**Harm.** The path of least resistance puts the model id in the composition root as a string, and the product's
operating characteristics silently become build artifacts. The pilot hit it twice: a model id hardcoded in
`Program.cs` (changing models meant recompiling), then a script duplicating committed issuer and audience values
so the two copies could drift.

**Enforcement.**
- Mechanism class: a cheap architecture test over host source and shipped scripts banning a small registry of
  operational-setting literal shapes and any read of the ambient environment outside the declared configuration
  surface, plus the SEC-5 and DATA-5 mechanisms already covering the two right homes.
- Completeness obligation: **when**, over the shipped source and script set at build time, which is every file
  that travels with the artifact and not only the application's own modules. **Closure**, over all three wrong
  routes a value can take, each with its own enumeration rule: a literal in code, a value duplicated into a
  script, and a read of the ambient environment outside the declared surface. A file that ships and is in none
  of the three enumerations is a hole, so the enumeration is stated as a rule the test can check rather than as
  a list of directories somebody maintains. **Remedy**, a match fails the build; a novel operational-setting
  shape the registry does not carry is the stated residue of this mechanism and is named in the weakening notes
  rather than absorbed into the closure.

**Weakening notes.** The registry is heuristic, the cheap net, exactly like UI-2's named-color list: a novel
operational-setting shape escapes it until it is added, and the registry is extended per project at D-000. The
claim's real defense is the pair of right homes being the path of least resistance (a `Required(...)` read is one
line); the scan exists because "one more literal" slipped in exactly once already.
