# X2 method: repo instructions

Standing constraints for any session working in this repo. These are anchored here because pasted
or remembered constraints decay; this file re-enters every session.

- **Never write a machine-local path** (a home directory, an absolute clone path) into any file in
  this repo: skills, docs, records. Refer to this repo's files by repo-relative path; refer to other
  repositories by their identity (remote URL or name), never by where a clone happens to live.
- **Skills are project-agnostic.** No product or project name appears in any `skills/*/SKILL.md`; a
  skill must work unchanged for any project. Per-project material (surveys, handovers, ledgers,
  findings) stays out of the skills, in each project's own working records.
- **Never use em dashes or en dashes**, anywhere, including code and docs. Self-check with a literal
  grep for the characters; BSD grep bracket expressions false-negative on them.
- **Never commit unless explicitly directed.**
- **Never use git as undo.** `git checkout -- <path>`, `git restore`, `git clean` and `git reset --hard`
  restore from the index, not from before your last edit, so they delete uncommitted work that happens to
  live in the same file. Committed work survives in the reflog; work that was never committed does not
  survive at all. To undo a temporary edit, copy the file first and restore from the copy. Start any
  plant-and-revert cycle from a clean tree, and then `git checkout` is the right tool and is safe.
- **Name the commit you measured.** Any measurement, a plant, a baseline count, a red-green result, records
  the `git rev-parse HEAD` it was taken at. A result from the wrong commit is worse than no result, and a
  subagent cannot be assumed to be at the commit it was told it was at.
- No professional disclaimers; push back with reasons rather than validating by default.

Orientation: `README.md` (what the method is and why), `X2.md` (the full narrative), `skills/` (the
twelve skills), `kernel/` (the claims and the dotnet-react edition).
