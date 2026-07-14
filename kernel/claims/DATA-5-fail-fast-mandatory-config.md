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
- Edition: `ValidateOnStart` on all option types in the skeleton; fail-closed secret checks outside Development (JWT/vault/webhook) as host-startup assertions with tests; the kernel's `ToolExecutor` timezone-refusal idiom (it refuses an empty timezone) as the runtime exemplar.

**Weakening notes.** Development environments may relax specific checks (dev signing key from user-secrets), but each relaxation is conditional on the environment name and visible in one place, never a silent default value in committed config (SEC-5).
