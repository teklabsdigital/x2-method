---
id: DATA-5
family: data
locus: centralized
provenance: Bucket 4 promotion
---

# DATA-5: Mandatory configuration fails fast; nothing limps on defaults

**Statement.** Missing or invalid mandatory configuration halts startup immediately with an error naming the missing key. At runtime, an operation requiring context the system does not have (a user's timezone, a tenant setting) refuses with a named error rather than guessing a default. Fallbacks hide failures; refusal surfaces them.

**Harm.** A service that starts without its signing key, connection string, or webhook secret appears healthy until the first request that needs it, which may be an attacker's. A guessed timezone corrupts every schedule it touches while looking plausible.

**Enforcement.**
- Mechanism class: options validation executed at startup (not first-use), with tests asserting startup fails on each mandatory key's absence; runtime refusal idioms unit-tested at the seams that need context.
- Completeness obligation: **when**, validation runs at startup before the process accepts work, and the ordering is structural rather than conventional wherever the platform allows it (the serving surface cannot be constructed without the validated result), because a validation that merely runs early is one refactor away from running late. **Closure**, over every key the application declares mandatory AND over every key a committed configuration document declares that the application does not, which is the direction that is easy to miss: an undeclared key is a typo, a stale key, or a key the application stopped reading, and all three look identical to a validator that only walks its own list. **Remedy**, startup halts naming the key, and it names every failing key rather than the first, because a validator that stops at the first turns a three-key misconfiguration into three failed deploys. An undeclared key is refused rather than ignored, which is deliberately the opposite remedy to the silent removal a caller-facing request surface is entitled to (SEC-2): an operator's typo must be loud, and a stranger's extra field must not be.

**Weakening notes.** Development environments may relax specific checks (dev signing key from user-secrets), but each relaxation is conditional on the environment name and visible in one place, never a silent default value in committed config (SEC-5).
