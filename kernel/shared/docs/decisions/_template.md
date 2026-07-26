---
kind: decision
status: working
provenance: <the story, epic, or claim this decision serves>
---

# Decision template

Copy this file when recording an edition-specific decision (a D-number). Front matter must carry `kind: decision`,
a valid `status` (DOC-1), and a `provenance` field naming the story, epic, or claim the decision serves (DEC-1):
the chain reads code to decision to story, and docs-lint fails a decision that breaks it.
