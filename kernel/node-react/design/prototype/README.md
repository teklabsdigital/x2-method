---
kind: provenance
status: working
---

# Prototype provenance and lock record (template)

This directory is the canonical in-repo home of the locked Claude Design artifact (INV-01): the acceptance
contract the fidelity tests hang off (UI-4) and the design system that is the single token source (UI-1). At
instantiation, the complete Claude Design export is imported here via the design MCP (the import is an owned
step: the FULL `_ds` export, both themes, more than fifty variables; never values scraped from the `.dc.html`),
and this file is filled in and kept current. It is the lock record, which is why docs-lint governs it while the
imported artifacts beside it are exempt.

## Lock

- **Portion locked (slice NNN):** <which screens and behaviours of the prototype this slice's lock covers>
- **Locked by:** <name>, <date>. A change to the locked portion is a contract change: it takes a re-approval
  (the UI-4 chargeable turn), never a silent edit.

## Source

- Claude Design project: <name>
- Project id / URL: <https://claude.ai/design/p/...>
- Imported: <date>, via the claude.ai design MCP

## Layout

    design/
      prototype/
        README.md        this file: provenance + lock record (DOC-1 governed)
        <name>.dc.html   the prototype source (imported artifact, exempt)
        _ds/             the complete design-system export = the UI-1 token source (imported, exempt)
      ledger/            per-slice fidelity ledgers, one added at each lock (DOC-1 governed, slice-stamped)

The locked artifact is the DC source alone. A static render, if ever produced, is viewing convenience and never
authoritative: the DC source is what is diffed at a re-lock. The `.dc.html` renders only inside the Claude Design
runtime; approval happens at Claude Design (gate 2a) and the lock (gate 2b) is the copy-down recorded here.
