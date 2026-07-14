---
id: SEC-5
family: security
locus: centralized
provenance: X-4, B2-9
---

# SEC-5: No secret in committed configuration; dev secrets local; runtime secrets rotatable

**Statement.** No credential, key, or token appears in any committed configuration file. Development secrets live in the developer-local secret store, outside the repository tree. Deployed integration credentials live in database configuration entities manageable through the application, or behind a vault port where the stored row holds only an opaque handle: the secret itself is never modelled as a domain property and never logged.

**Harm.** Committed secrets outlive their commit: they persist in history, forks, and backups, and rotate only when someone remembers. A prior system carried committed dev seed logins and zero user-secrets configuration (B2-9), the recorded legacy exception this claim exists to prevent.

**Enforcement.**
- Mechanism class: a CI secret-scan gate over the repository plus a config-shape test failing the build when secret-shaped keys hold non-placeholder values in committed configuration files.
- Edition: user-secrets wired in every service csproj (`UserSecretsId` present, asserted by arch test); secret scan in the CI loop; the vault-port interface for runtime credentials is owed, trigger: first runtime credential.

**Weakening notes.** Secret scanners are heuristic; the structural fix is the vault-port idiom, under which there is no secret-shaped value to commit in the first place. appsettings values used transitorily during local testing are tolerated only until the work ships; the scan makes forgetting expensive.
