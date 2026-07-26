---
id: SEC-5
family: security
locus: centralized
provenance: X-4, B2-9
---

# SEC-5: No secret in committed configuration; dev secrets local; runtime secrets rotatable

**Statement.** No credential, key, or token appears in any committed configuration file. Development secrets live in the developer-local secret store, outside the repository tree. Deployed integration credentials live in database configuration entities manageable through the application, or behind a vault port where the stored row holds only an opaque handle: the secret itself is never modelled as a domain property and never logged. A secret moves between machines or projects store to store; it never transits a chat transcript, a work log, or any committed file (PC-21, P2 extraction).

**Harm.** Committed secrets outlive their commit: they persist in history, forks, and backups, and rotate only when someone remembers. A prior system carried committed dev seed logins and zero user-secrets configuration (B2-9), the recorded legacy exception this claim exists to prevent.

**Enforcement.**
- Mechanism class: a CI secret-scan gate over the repository plus a config-shape test failing the build when secret-shaped keys hold non-placeholder values in committed configuration files. Both predicates match a name against a list, so the comparison is part of the mechanism: it resolves compounds, concatenations, decompositions, and plurals of a listed term in either direction, so a leaf named `Key` is covered by a list containing `signingKey` and not only the reverse, and it resolves the way the surrounding format spells a name, since a key written as `"password":` in one format and `Password=` in another is the same key and a pattern anchored on one separator sees neither. The edition owes evidence for the comparison's extent, asserted in the same artifact as the scan, because a scan whose pattern matches nothing is green in exactly the way a scan that finds nothing is.
- Completeness obligation: **when**, over the tracked file set of the commit under test rather than the working tree, so a file that is present and unstaged is not mistaken for coverage, and before the build rather than after it. **Closure**, every tracked text surface and not only the configuration documents, at every key depth of a nested document, on both the key side and the value side; a secret-shaped value under a name the list does not carry is the stated residue of the name predicate and belongs in the weakening notes, not in the closure. **Remedy**, a match fails the build; an exception is a declared pair of file and key carrying a written reason and a staleness check, never a suppressed line or a silenced rule.
- Mechanism relationship: the two mechanisms are asserted to be independent, and the edition owes evidence for the independence rather than for each mechanism alone. Independence of mechanism is not independence of blind spot: measured, both halves missed the same injected credential for three unrelated one-character reasons, and each half's scope was defensible while the union of the scopes was assumed to be total by nobody. The evidence the claim asks for is an assertion that the union of the two scopes covers the tracked set, and a control that a credential planted in each half's territory is caught by that half.

**Weakening notes.** Secret scanners are heuristic; the structural fix is the vault-port idiom, under which there is no secret-shaped value to commit in the first place. appsettings values used transitorily during local testing are tolerated only until the work ships; the scan makes forgetting expensive.
