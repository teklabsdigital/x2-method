---
id: DEP-1
family: dependencies
locus: centralized
provenance: X-5 ruling, B1-1, B2-5, B2-6
---

# DEP-1: Dependencies are quarantined, pinned exactly, and restored in locked mode

**Statement.** Never install a freshly published package. Default cooling-off window: 90 days from publish, and the number lives in exactly one place, the `VERSIONS.md` ledger header, which this claim points at (invariants pass R12, 2026-07-11: the former 30-day default contradicted the owner's standing 90-day policy and lost); hard floor: 7 days for a new package or a new major or minor version, below which no ordinary waiver exists; above the floor, a waiver requires an explicit owner decision conditioned on a recorded supply-chain audit (advisory-database sweep over the exact dependency set). The one carve-out below the floor is a patch release of an already-ledgered dependency, from the same maintainer, that addresses a published advisory: it may bypass the cooling-off window with an explicit owner decision and a ledger row, because remaining on a known-exploited version is the larger risk. The cooling-off reasoning targets new code from new maintainers, not a security patch to a vetted dependency; a floor with no CVE carve-out would, at worst, mandate staying exploited. All versions are pinned exactly (no ranges); lockfiles are committed and CI restores in locked mode so drift fails the build; internal packages resolve only from the internal feed. Container images are dependencies too: every image reference is pinned tag-plus-digest, one value across every surface that names it, and ledgered like a package (INV-05). Every project carries a ledger recording versions, publish dates, and waivers. A vendored component's own internal window governs that component's development, never what the host project consumes.

**Harm.** Supply-chain compromise is loudest in a package's first days; the window buys the ecosystem time to catch it. Range pins and unlocked restores mean the build you tested is not the build you shipped. Dependency confusion substitutes a public package for an internal name.

**Enforcement.**
- Mechanism class: exact pins + committed lockfiles + locked-mode restore in the CI loop + source mapping + the ledger file + the docs-lint image check (a floating or unledgered container-image reference fails the build); a CI publish-date check against the window is the named upgrade path (decided at kernel build whether it makes v1; the ledger, pins, and locked restore are unconditionally v1).
- Edition: central package management with exact and transitive pinning, `RestorePackagesWithLockFile`, and, closing a verified gap (B2-6), `RestoreLockedMode` in CI so a drifted lockfile fails instead of silently regenerating; npm side: no range specifiers, `save-exact`, `npm ci` only in CI; `nuget.config` packageSourceMapping; `VERSIONS.md` ledger per project.

**Weakening notes.** A prior ledger omitted several shipped packages (pinned but unledgered), showing the ledger needs its own check: the kernel's ledger lint compares ledger rows against the lockfile's direct dependencies. Vendored assets record their hash in the ledger (a vendored-asset sha256 idiom, promoted from Bucket 4).
