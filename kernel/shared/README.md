# kernel/shared

The one home for kernel material that is not stack-specific. Every edition composes from here; nothing here
knows which server it is talking to.

The surface is deliberately small, and it was small before it had a home: a React client, a design home, five
document templates, and two node tools. Small enough that copying it into a second edition would have felt
harmless, which is exactly why it would have drifted. One home plus a mechanical gate is cheaper than two
copies plus discipline.

```
client-web/      Vite + React 19: tokens, primitives, the notes module, the client-side scans, the TEST-2
                 harness and the UI-5 composed smoke. Talks to the server only through `src/api/client.ts`
                 over REST, in the one wire dialect CON-1 rules, so it is edition-neutral by construction.
design/          the INV-01 design home: prototype/ (the lock record, the imported artifact, the _ds export)
                 and ledger/ (per-slice fidelity ledgers). UI-1 reads the export; UI-4 reads the ledgers.
docs/*/_template.md   the DOC-1 templates, one per registry kind. The documents themselves are per-edition.
tools/docs-lint.mjs   the DOC-1 / TEN-5 / DEP-1 / DEC-1 / HUM-1 / conformance / MET-08 gate. Plain node, no
                 dependencies, runs from anywhere, resolves paths against the edition root it sits in.
tools/conformance.mjs   validates an edition's conformance.json and generates its README table.
```

## Composition

`node kernel/tools/compose.mjs` writes this tree into every edition; `--check` fails if any edition's copy
differs. **Edit here, never in an edition.** Both halves run in the repo's CI loop, so a hand-edit to a
composed copy fails the build rather than drifting quietly.

Editions carry committed copies rather than referencing this directory in place for one reason: an edition
must be a self-contained file set that instantiation copies into a new repo, and every relative path inside it
has to resolve in both the kernel layout and the instantiated layout. The CON-2 fixture link in the .NET
arch-test project, the UI-1 token test reaching `design/prototype/_ds/`, `scripts/e2e.sh`, and the CI workflow
are all such paths. Composing means the committed edition tree IS the instantiated shape, so the loop tests
exactly what seeding produces.

That is a deliberate departure from what the catalog's own CON-2 would rule. CON-2 says a corpus mirrored on
both sides is pinned by "physically the same file", not by two files and an equality test, and it is right
about a fixture inside one tree. It does not reach here: two edition trees that must each be independently
copyable cannot share a physical file without one of them holding a path that breaks the moment it is copied.
The equality gate is the honest substitute, and the substitution is recorded rather than assumed.

## What does not belong here

Anything that names a server technology, and anything that is one project's working record. If a file in this
directory would have to change to serve a second edition, it is not shared: it belongs in the editions, twice,
with the difference visible.

`tools/docs-lint.mjs` is where that rule is hardest to hold, because it enforces claims whose subject IS
stack-specific. The rule it follows: the tool holds what is portable, and each edition declares the rest as data
in its own `edition.json`. Today that is the dependency manifests (DEP-1: which files declare direct
dependencies, and in what format) and the irreversible surfaces (HUM-1: where migrations, wire contracts, and
contract docs live in this stack's layout). The portable half stays in the tool and an edition cannot opt out of
it: the three irreversible categories are fixed there, with the reason each is irreversible written beside it,
and only their homes are declared.

Building the second edition found three places where that rule had been silently broken, each discovered by a
Node tree tripping over it (finding S-7 in the working records). **Nothing here detects a stack-specific
assumption in this tier.** Until something does, the discovery cost is one new edition per instance, and the
number of remaining instances is unknown.
