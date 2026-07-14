---
id: TEN-5
family: tenancy
locus: centralized ledger, per-entry named tests
provenance: X-1, B2-7
---

# TEN-5: Every sanctioned cross-tenant access is ledgered with a sole-reader test

**Statement.** Some system paths legitimately read across tenants (global schedulers, platform administration, billing sweeps). Every such path is enumerated in one ledger, and each entry names its justification and a sole-reader test: a test that fails if any code path other than the sanctioned one performs that access.

**Harm.** Bypasses accrete. The first undocumented "just this once" cross-tenant query becomes the precedent for the second, and within a year nobody can state the isolation boundary. The ledger keeps the exception list finite, named, and reviewed; the sole-reader test keeps it true.

**Enforcement.**
- Mechanism class: a committed ledger document (one row per sanctioned access: path, justification, test name) plus one named architecture or behavior test per entry proving exclusivity.
- Edition: `docs/claims/tenant-bypass-ledger.md` in the project tree; sole-reader tests in the arch-test project (dependency scan or call-site inventory). The kernel skeleton ships the ledger file with zero entries and the test harness for adding one.

**Weakening notes.** A prior system documented this idiom but its own scheduler sole-reader test was owed, not built (B2-7): the ledger without the tests is a promise. The kernel treats a ledger entry without its named test as a docs-lint failure.

The ledger schema is scoped to cross-tenant *access* paths (path, justification, sole-reader test). A tenant-leading-key exemption (TEN-3) is a different kind of exception: it is a schema-shape choice, not an access path, so it has no sole-reader test and is recorded at the key assertion, not here. The empty v1 ledger means this mechanism has never executed against a real entry; the first sanctioned bypass is its first run, and its sole-reader test is written then.
