---
id: HUM-1
family: human-approval
locus: centralized
provenance: catalog named-gap promotion (invariants pass R6, 2026-07-11), X2 unconditional-turn rule
---

# HUM-1: Irreversible surfaces get a human turn, unconditionally

**Statement.** A change to a persistent schema (a migration) or a published external contract cannot merge without
a named human approval, every time, no exception. Everything else in the method treats code as a disposable
projection; these two surfaces are the ones a regeneration cannot cheaply reverse, which is why they sit with
D-000 and the design spine in the stays-ahead tier and why the approval is unconditional rather than judgment-based.

**Harm.** This is the one rule standing between disposable code and destroying production: a regenerated migration
that drops a column, or a silently changed wire contract, ships damage that no revert repairs (the data is gone;
the external consumers already broke). Before promotion this rule lived in an out-of-v1 footnote with no id and no
mechanism, which is exactly the aspirational-claim failure the catalog exists to kill.

**Enforcement.**
- Mechanism class: CODEOWNERS entries on the migrations path and the published-contract paths, plus branch
  protection requiring code-owner review, so a diff touching either surface cannot merge without the named owner.
  Armed at instantiation, sharing TEST-3's arming step.
- Edition: `.github/CODEOWNERS` covers `server/src/Kernel.Persistence/Migrations/`, `server/src/Kernel.Contracts/`,
  and `docs/contracts/` with an `@OWNER` placeholder renamed at instantiation; docs-lint verifies the file exists
  and covers all three surfaces (the locally testable half); the instantiation manifest arms branch protection
  with code-owner review required.

**Weakening notes.** Like TEST-3, the gate blocks nothing until branch protection is armed at instantiation; the
manifest carries the arming step and the kernel acceptance test verifies instantiation arms it. The local lint
proves the CODEOWNERS file and its path entries exist, not that the remote enforces them; that residue is the
same honest asterisk TEST-3 carries, and the two arm together.
