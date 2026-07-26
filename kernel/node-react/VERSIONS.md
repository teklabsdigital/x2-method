# Dependency ledger (DEP-1)

One ledger for the whole edition. Every direct dependency is pinned exactly, restored in locked mode (`npm ci`),
and listed here with its publish date. **The cooling-off window is 90 days**; this header is the one place the
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

The eslint and vitest pins are ahead of the client's deliberately, not by drift. This tree was first installed at
the client's pins (eslint 9.27.0, vitest 3.1.4) and `npm audit` reported one critical and eleven high advisories:
GHSA-5xrq-8626-4rwp against vitest below 3.2.6, and the brace-expansion chain GHSA-mh99-v99m-4gvg reaching eslint
below 10. The versions above are the oldest ones that clear both the 90-day window and those advisories, and at
them this tree installs with zero advisories reported. Both advisory ranges also cover the client's pins, so both
apply there; the client's own total was not measured, because the registry audit endpoint was failing when it was
attempted. The client's pins are carried below as the shared tier ships them. The gap between the two sections is
a recorded finding, not a decision this ledger settles.

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
| eslint-plugin-react-hooks | 5.2.0 | 2025-02-28 | npmjs.com |
| jsdom | 26.1.0 | 2025-04-13 | npmjs.com |
| vite | 6.3.5 | 2025-05-05 | npmjs.com |
| eslint | 9.27.0 | 2025-05-16 | npmjs.com |
| typescript-eslint | 8.32.0 | 2025-05-05 | npmjs.com |
| vitest | 3.1.4 | 2025-05-19 | npmjs.com |

The last three rows are the client's pins for packages the server pins differently, and they are here because a
ledger row is a statement about a VERSION, not about a name. An earlier draft of this file left them out and
said so in prose, on the reasoning that "the DEP-1 check is per package name". That reasoning was a description
of a defect in the checker rather than a rule: it meant three versions were installed in this edition whose
publish dates nobody had recorded or checked. The checker now keys on name and version together, and it fails
the build for a pin with no dated row, which is what caught this.

`@types/node` (22.15.30) and `typescript` (5.8.3) are direct dependencies of both surfaces at the same pin, so
one row each covers both.
