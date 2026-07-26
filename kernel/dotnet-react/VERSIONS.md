# Dependency ledger (DEP-1)

One ledger for the whole edition. Every direct dependency is pinned exactly, restored in locked mode
(`dotnet restore --locked-mode`, `npm ci`), and listed here with its publish date. **The cooling-off window is 30
days**; this header is the one place the number lives (DEP-1 points here), and every entry below is well past it.
A vendored component may carry its own internal window (the teklabs engine uses 15 for its own development); that
governs the component's development, not what a host project consumes, and the host applies this window to what
it pins. tools/docs-lint.mjs fails the build if a direct dependency in server/Directory.Packages.props,
client-web/package.json, or server/.config/dotnet-tools.json is missing a row here, and if any container image
reference floats or is missing its row below.

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
| Edition | dotnet-react |

## Container images (runbook, CI, Testcontainers fixture: one pin, three tiers)

The pinned form is tag@digest: the tag documents, the digest pins (a re-pushed tag cannot drift in silently).
The row key is `repo:tag`; the digest below is the value every surface carries.

| Image (repo:tag) | Digest | Published | Source |
|------------------|--------|-----------|--------|
| mcr.microsoft.com/mssql/server:2022-CU14-ubuntu-22.04 | sha256:c1aa8afe9b06eab64c9774a4802dcd032205d1be785b1fd51e1c0151e7586b74 | 2024-07-23 (SQL Server 2022 CU14, KB5038325) | mcr.microsoft.com |

## Server (.NET, central package management)

| Package | Version | Published | Source |
|---------|---------|-----------|--------|
| Microsoft.AspNetCore.Authentication.JwtBearer | 9.0.6 | 2025-06-10 | nuget.org |
| Microsoft.AspNetCore.Mvc.Testing | 9.0.6 | 2025-06-10 | nuget.org |
| Microsoft.EntityFrameworkCore | 9.0.6 | 2025-06-10 | nuget.org |
| Microsoft.EntityFrameworkCore.Design | 9.0.6 | 2025-06-10 | nuget.org |
| Microsoft.EntityFrameworkCore.Sqlite | 9.0.6 | 2025-06-10 | nuget.org |
| Microsoft.EntityFrameworkCore.SqlServer | 9.0.6 | 2025-06-10 | nuget.org |
| Microsoft.NET.Test.Sdk | 17.13.0 | 2025-02-10 | nuget.org |
| NetArchTest.Rules | 1.3.2 | 2021-05-23 | nuget.org |
| System.IdentityModel.Tokens.Jwt | 8.6.1 | 2025-03-07 | nuget.org |
| Testcontainers.MsSql | 4.1.0 | 2024-12-09 | nuget.org |
| xunit | 2.9.3 | 2025-01-08 | nuget.org |
| xunit.runner.visualstudio | 2.8.2 | 2024-07-08 | nuget.org |

## Server tooling (server/.config/dotnet-tools.json)

| Package | Version | Published | Source |
|---------|---------|-----------|--------|
| dotnet-ef | 9.0.6 | 2025-06-10 | nuget.org |

## Client (client-web, npm, save-exact)

| Package | Version | Published | Source |
|---------|---------|-----------|--------|
| react | 19.1.0 | 2025-03-28 | npmjs.com |
| react-dom | 19.1.0 | 2025-03-28 | npmjs.com |
| @testing-library/react | 16.3.0 | 2025-04-02 | npmjs.com |
| @types/node | 22.15.30 | 2025-06-05 | npmjs.com |
| @types/react | 19.1.8 | 2025-06-11 | npmjs.com |
| @types/react-dom | 19.1.6 | 2025-06-04 | npmjs.com |
| @vitejs/plugin-react | 4.5.0 | 2025-05-23 | npmjs.com |
| eslint | 10.4.1 | 2026-05-29 | npmjs.com |
| eslint-plugin-react-hooks | 7.1.1 | 2026-04-17 | npmjs.com |
| jsdom | 26.1.0 | 2025-04-13 | npmjs.com |
| typescript | 5.8.3 | 2025-04-05 | npmjs.com |
| typescript-eslint | 8.60.1 | 2026-06-01 | npmjs.com |
| vite | 6.4.3 | 2026-06-01 | npmjs.com |
| vitest | 3.2.6 | 2026-06-01 | npmjs.com |

**One transitive pin is overridden, and the reason is a conflict DEP-1 does not resolve.** `postcss` is pulled in
by `vite` and is pinned to 8.5.15 through an `overrides` entry in the shared tier's `package.json`. It carries
GHSA-r28c-9q8g-f849 (path traversal in source-map auto-loading), which is fixed in 8.5.18 and later. **No postcss
release satisfies both rules at once**: 8.5.15 (2026-05-19) clears the window and carries the advisory, and the
first release clearing the advisory is 8.5.18 (2026-07-12), which is inside the window. Left to itself npm
resolved 8.5.16 (2026-06-28), which is the worst of the three, inside the window AND still vulnerable, which is
why this is pinned rather than left to resolution.

The pin honours the rule DEP-1 actually states, the window, and leaves the advisory open and named rather than
breaking a stated rule silently. This is the same window-versus-advisory conflict E-3 recorded against `vite` at
the 90-day window, recurring in a different package at 30, which is the evidence for E-3's insistence that
shortening the window made the conflict rarer without supplying the missing rule. Revisit when 8.5.18 clears the
window (2026-08-11) or when DEP-1 gains a resolution order.
