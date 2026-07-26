# Dependency ledger (DEP-1)

One ledger for the whole edition. Every direct dependency is pinned exactly, restored in locked mode (`npm ci`),
and listed here with its publish date. **The cooling-off window is 30 days**; this header is the one place the
number lives (DEP-1 points here), and every entry below is well past it. tools/docs-lint.mjs fails the build if a
direct dependency in any manifest this edition declares in `edition.json` is missing a row here, and if any
container image reference floats or is missing its row below.

Adding or bumping a dependency: confirm the publish date clears the window, add the row here in the same change,
and keep the pin exact.

## Kernel provenance (DEP-1: the kernel is a dependency)

The kernel this project was seeded from, pinned like any other dependency: the remote names the identity, the
commit pins it, the catalog pass date names the claims version this project's conformance statements refer to,
and the edition names the mechanism set. Written mechanically at instantiation (a manifest step); changed only
by a deliberate upgrade (the edition README's "Upgrading a seeded project"). In the kernel repo itself this
section legally holds structural placeholders; docs-lint enforces the filled form in seeded projects, detecting
the kernel context by BUILD-BRIEF.md and VERIFICATION.md, which stay behind at seeding.

| Field | Value |
|-------|-------|
| Remote | `<kernel-remote>` |
| Commit | `<kernel-commit>` |
| Catalog pass date | `<catalog-pass-date>` |
| Edition | node-react |

## Container images

This edition has no container image yet: no persistence engine has been chosen, so nothing pins one. The first
image reference arrives with the store, and it arrives in the pinned tag@digest form with a row in this section,
because docs-lint fails any reference that floats or that has no row here (DEP-1 / INV-05).

## Server (npm, save-exact)

Two npm surfaces, `server/` and `client-web/`, are installed and locked separately, so a package can legally
appear in both sections at different pins. Where the versions differ the reason is recorded in the row.

| Package | Version | Published | Source |
|---------|---------|-----------|--------|
| fastify | 5.8.5 | 2026-04-14 | npmjs.com |
| @types/node | 22.15.30 | 2025-06-05 | npmjs.com |
| eslint | 10.2.1 | 2026-04-17 | npmjs.com |
| typescript | 5.8.3 | 2025-04-05 | npmjs.com |
| typescript-eslint | 8.59.0 | 2026-04-20 | npmjs.com |
| vitest | 4.1.5 | 2026-04-21 | npmjs.com |

These pins diverged from the client's deliberately, not by drift. This tree was first installed at the client's
pins (eslint 9.27.0, vitest 3.1.4) and `npm audit` reported one critical and eleven high advisories:
GHSA-5xrq-8626-4rwp against vitest below 3.2.6, and the brace-expansion chain GHSA-mh99-v99m-4gvg reaching eslint
below 10. The versions above are the oldest ones that cleared both the then-current 90-day window and those
advisories, and at them this tree installs with zero advisories reported.

The window pass (2026-07-26) cut the window to 30 days, which does not obligate any pin here to move: a shorter
window is strictly more permissive and every version above still clears it.

**The client caught up on 2026-07-26 (the flow-back pass, E-3), so "ahead of the client" no longer describes the
gap and the direction is now mixed.** The client is at eslint 10.4.1 and typescript-eslint 8.60.1, both newer than
this section's 10.2.1 and 8.59.0; this section is at vitest 4.1.5 against the client's 3.2.6, which is a major line
apart. Nothing here is wrong: DEP-1 sets a floor on a version's age and does not require two trees to agree, and
the two were bumped by different passes for different reasons. It is recorded because the previous sentence in this
place asserted a direction that has since reversed, and a ledger that explains a gap has to be re-read when the gap
moves. Converging the two is a shared-tier decision, not this edition's to make unilaterally.

## Client (client-web, npm, save-exact)

Composed from the shared tier (`kernel/shared/client-web/`), which both editions carry. The pins are the shared
tier's; changing them is a shared-tier change that re-composes into every edition.

| Package | Version | Published | Source |
|---------|---------|-----------|--------|
| react | 19.1.0 | 2025-03-28 | npmjs.com |
| react-dom | 19.1.0 | 2025-03-28 | npmjs.com |
| @testing-library/react | 16.3.0 | 2025-04-02 | npmjs.com |
| @types/react | 19.1.8 | 2025-06-11 | npmjs.com |
| @types/react-dom | 19.1.6 | 2025-06-04 | npmjs.com |
| @vitejs/plugin-react | 4.5.0 | 2025-05-23 | npmjs.com |
| eslint-plugin-react-hooks | 7.1.1 | 2026-04-17 | npmjs.com |
| jsdom | 26.1.0 | 2025-04-13 | npmjs.com |
| vite | 6.4.3 | 2026-06-01 | npmjs.com |
| eslint | 10.4.1 | 2026-05-29 | npmjs.com |
| typescript-eslint | 8.60.1 | 2026-06-01 | npmjs.com |
| vitest | 3.2.6 | 2026-06-01 | npmjs.com |

The last three rows are the client's pins for packages the server pins differently, and they are here because a
ledger row is a statement about a VERSION, not about a name. An earlier draft of this file left them out and
said so in prose, on the reasoning that "the DEP-1 check is per package name". That reasoning was a description
of a defect in the checker rather than a rule: it meant three versions were installed in this edition whose
publish dates nobody had recorded or checked. The checker now keys on name and version together, and it fails
the build for a pin with no dated row, which is what caught this.

`@types/node` (22.15.30) and `typescript` (5.8.3) are direct dependencies of both surfaces at the same pin, so
one row each covers both.

## Pins taken under DEP-1's advisory rule

DEP-1 rules that where no available version satisfies both the cooling-off window and a live advisory, the
advisory outranks the window above the 7-day hard floor, by explicit owner decision, and that the pin carries a
row here whether the dependency is direct or transitive. This section is that ledger. It is expected to be short
and to empty itself: a row leaves when its pin clears the window, at which point the pin is ordinary.

| Package | Version | Published | Advisory | Decision | Clears the window |
|---------|---------|-----------|----------|----------|-------------------|
| postcss | 8.5.18 | 2026-07-12 | GHSA-r28c-9q8g-f849, path traversal in source-map auto-loading | owner ruling, adjudication pass 2026-07-26 (ruling 9a) | 2026-08-11 |

**The history, kept because the rule was written from it.** `postcss` is reached transitively through `vite` and
is pinned through an `overrides` entry in the shared tier's `package.json`. No release satisfied both rules at
once: 8.5.15 (2026-05-19) cleared the window and carried the advisory, and the first release clearing the
advisory is the 8.5.18 pinned above, which was inside the window when it was taken. The tree carried 8.5.15 by
decision until the adjudication ruling, on the grounds that the window was the rule DEP-1 actually stated. Left
to itself, npm resolved 8.5.16 (2026-06-28), inside the window AND still vulnerable, which is the one outcome
satisfying neither rule and the reason "decide each time" is not a neutral option (E-18). The pin is above the
7-day floor, which does not bend and did not have to here.
