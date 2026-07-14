---
kind: claim
status: authoritative
---

# Tenant bypass ledger (TEN-5)

Every sanctioned cross-tenant read is enumerated here with its justification and the named sole-reader test that
is its only caller. A row without a named sole-reader test is a docs-lint failure (tools/docs-lint.mjs). v1 has no
sanctioned bypass, so the table is empty by design: a deliberate cross-tenant sweep is added here, with its test,
before the code that performs it.

| Path | Justification | Sole-reader test |
|------|---------------|------------------|
