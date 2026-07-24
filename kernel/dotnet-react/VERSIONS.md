# Dependency ledger (DEP-1)

One ledger for the whole edition. Every direct dependency is pinned exactly, restored in locked mode
(`dotnet restore --locked-mode`, `npm ci`), and listed here with its publish date. **The cooling-off window is 90
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
| eslint | 9.27.0 | 2025-05-16 | npmjs.com |
| eslint-plugin-react-hooks | 5.2.0 | 2025-02-28 | npmjs.com |
| jsdom | 26.1.0 | 2025-04-13 | npmjs.com |
| typescript | 5.8.3 | 2025-04-05 | npmjs.com |
| typescript-eslint | 8.32.0 | 2025-05-05 | npmjs.com |
| vite | 6.3.5 | 2025-05-05 | npmjs.com |
| vitest | 3.1.4 | 2025-05-19 | npmjs.com |
