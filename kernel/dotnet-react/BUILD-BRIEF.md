---
kind: decision
status: authoritative
---

# BUILD BRIEF: kernel/dotnet-react/ v1 edition

Handover from the Fable extraction session (2026-07-10) to the builder session (Opus 4.8). This brief plus the claims catalog is the complete spec. If this brief and a claim file disagree, the claim file wins. If any document and running code disagree, the code wins and you surface the disagreement.

## Standing constraints (non-negotiable)

- Never use em dashes or en dashes. Anywhere, including code comments and docs.
- No professional disclaimers. Push back with reasons; do not validate by default.
- Never commit unless explicitly directed.
- Least code that solves the problem. YAGNI everything. Standard library over wrappers (example already applied: `TimeProvider`, not a custom IClock).
- Do not relitigate settled decisions; they were adjudicated during extraction (decisions X-1..X-14) and are recorded outside this repo.

## Governing sources (read before building)

1. `../claims/` : the claim files + README index. This is the contract you are realizing.
2. The extraction records that produced the claims (the claims register, the decision adjudications X-1..X-14, verification notes) are working records kept outside this repo; the source systems they were extracted from are not included.

## What v1 is (handover cut line)

Arch tests, module skeleton, tenant scoping types, e2e harness, CI loop. Explicitly OUT: observability wiring, orchestration patterns, Claude Design export pipeline, TraceLint, crypto-shredding, SSRF egress guard, migration tooling beyond the human-turn rule. An identity/auth module (signup, login, user store) is also NOT v1: tests and harness mint their own JWTs with the dev key. Record identity as owed in the conformance table.

Client platform ruling: per-project decision. v1 builds `client-web/` (Vite + React). The Expo/RN variant is NOT built; it is recorded as an already-proven mobile-client pattern, lifted when the first mobile kernel project appears.

## Deliverable layout

```
kernel/dotnet-react/
  BUILD-BRIEF.md            (this file)
  README.md                 (edition doc: how to instantiate, conformance table built-vs-owed)
  .gitignore                (bin, obj, node_modules, dist, *.user)
  .github/workflows/ci.yml  (template; moves to repo root at instantiation)
  docs/                     (DOC-1 tree: claims/ decisions/ contracts/ runbooks/ work/ with front-matter templates)
  tools/docs-lint.mjs       (DOC-1 gate, plain node, no deps)
  server/
    Kernel.sln
    Directory.Build.props   (ALREADY WRITTEN: net9.0, Nullable, ImplicitUsings, TreatWarningsAsErrors, RestorePackagesWithLockFile)
    Directory.Packages.props
    nuget.config
    src/Kernel.Contracts/   src/Kernel.App/   src/Kernel.Persistence/   src/Kernel.Api/
    tests/Kernel.Tests.Architecture/   tests/Kernel.Tests.Unit/   tests/Kernel.Tests.Integration/
  client-web/
    package.json  .npmrc  tsconfig.json  vite.config.ts  eslint.config.js  index.html  VERSIONS.md
    design/colors_and_type.css          (design-system export exemplar, 50+ CSS vars)
    src/theme/tokens.ts                 (sole token source)
    src/components/                     (primitives: Text.tsx, Button.tsx)
    src/api/client.ts                   (fetch wrapper, bearer auth)
    src/data/notesRepo.ts
    src/modules/notes/NotesScreen.tsx + __tests__/ (fidelity exemplar)
    src/theme/__tests__/tokenCoverage.test.ts
    src/__tests__/namingPlacement.test.ts
    tools/harness/          (main.ts scenarios, redact.ts + test, mintToken.mjs)
  server/VERSIONS.md        (DEP-1 ledger; or one ledger at edition root covering both, your call, one place only)
```

Product placeholder name is `Kernel` (`Kernel.Api` etc.). README documents rename-at-instantiation.

## Settled design decisions (do not re-derive)

### Toolchain (verified on this machine)
.NET SDK 9.0.308, Node v24.14.0, npm 11.9.0, Docker 29.1.2 running. Full local verification is possible including Testcontainers.

### Packages (.NET, exact pins, all satisfy the 30-day window as of 2026-07-10)
JwtBearer 9.0.6, Mvc.Testing 9.0.6, EFCore/Design/Sqlite/SqlServer 9.0.6, NET.Test.Sdk 17.13.0, NetArchTest.Rules 1.3.2, System.IdentityModel.Tokens.Jwt 8.6.1, Testcontainers.MsSql 4.1.0, xunit 2.9.3, xunit.runner.visualstudio 2.8.2. CPM with `CentralPackageTransitivePinningEnabled=true`; if transitive pinning raises NU1109/downgrade errors, add explicit PackageVersion pins rather than disabling pinning. nuget.config: clear sources, nuget.org only, packageSourceMapping `*` to nuget.org.

### Project graph and dependency direction (DATA-1)
Contracts references nothing. App references Contracts. Persistence references App (implements store interfaces). Api references App + Persistence (composition root only). Tests.Architecture references Api (+ Sqlite + Mvc.Testing + NetArchTest + Jwt). Tests.Unit references App + Persistence + Sqlite. Tests.Integration references App + Persistence + Testcontainers.MsSql.

### Tenancy composite (X-1, TEN-1..5)
- `Kernel.App/Platform/Tenancy/ITenantScope.cs`: `Guid Current { get; }` (throws when unset, message cites TEN-2), `bool IsEstablished`, `IDisposable Begin(Guid tenantId)` (rejects Guid.Empty, restores previous on dispose).
- `AmbientTenantScope`: static `AsyncLocal<Guid?>`, registered singleton.
- `ITenantOwned`: `Guid TenantId { get; set; }` marker.
- `Kernel.Api/Platform/TenantScopeMiddleware.cs`: after UseAuthentication. Unauthenticated: pass through (fallback policy rejects non-allowlisted). Authenticated without parseable `tenant_id` claim: 403. Otherwise `using scope.Begin(tenantId)` around `next`.
- `Kernel.Persistence/KernelDbContext.cs`: ctor `(DbContextOptions<KernelDbContext>, ITenantScope)`. Override both SaveChanges variants calling one `GuardTenancy()`: for each Added/Modified/Deleted `ITenantOwned` entry, read `scope.Current` (this THROWS when scope unset, which is exactly the fail-closed behavior TEN-4 demands); Added with empty TenantId: stamp; otherwise TenantId != Current: throw with TEN-4 message.
- Store queries filter explicitly: `Where(n => n.TenantId == scope.Current)`. No EF global query filters in the skeleton (X-1: filters are optional per-project defense-in-depth, never primary).

### Host (Kernel.Api/Program.cs)
- Mandatory config, fail-fast at startup with named errors (DATA-5): `Jwt:Key`, `Jwt:Issuer`, `Jwt:Audience`, `ConnectionStrings:Kernel`. Key comes from user-secrets in dev (SEC-5); `UserSecretsId` in the Api csproj; appsettings.json holds only Issuer/Audience/Logging; appsettings.Development.json holds only a passwordless LocalDB connection string.
- JWT: `MapInboundClaims = false`, `NameClaimType = "sub"`, `RequireSignedTokens = true`, `ValidAlgorithms = [HmacSha256]`, symmetric key, validate issuer + audience (SEC-4).
- Authorization: `AddAuthorizationBuilder().SetFallbackPolicy(RequireAuthenticatedUser)` (SEC-1 deny-by-default), then register `PermissionPolicyProvider : IAuthorizationPolicyProvider` that builds `RequireAuthenticatedUser + RequireClaim("perm", suffix)` for any policy named `perm:*` and delegates everything else to `DefaultAuthorizationPolicyProvider`.
- Session revocation (SEC-4): `Kernel.App/Platform/Sessions/ISessionVersionStore.cs` (`GetCurrentAsync(string userId)`, `BumpAsync`), `InMemorySessionVersionStore` (ConcurrentDictionary, default version 1) registered singleton; `SessionVersionMiddleware` after UseAuthentication: authenticated requests need an `sv` claim equal to the store's current version, else 401. EF-backed store is owed at the first identity slice; record in conformance table.
- Wire (CON-1): `AddProblemDetails()` + `UseExceptionHandler()` + `UseStatusCodePages()` (converts bodyless status codes to problem details); `ConfigureHttpJsonOptions` adds `JsonStringEnumConverter` (camelCase is the web default).
- Pipeline order: ExceptionHandler, StatusCodePages, Authentication, SessionVersionMiddleware, TenantScopeMiddleware, Authorization, endpoints.
- Endpoints registered ONLY via `Map{X}Endpoints` extensions from `Endpoints/*.cs`: `HealthEndpoints.cs` (`GET /health`, AllowAnonymous, the single allowlisted anonymous endpoint) and `NotesEndpoints.cs`. End with `public partial class Program;` for WAF.
- No migrate/EnsureCreated at startup; schema is applied by tests/deploy (README runbook).

### Exemplar module: Notes
- Contracts `Notes/NoteContracts.cs` (the X-13 shared-file exception): `CreateNoteRequest(string Title, string Body)`, `NoteResponse(Guid Id, string Title, string Body, DateTimeOffset CreatedAtUtc)`, `NoteListResponse(IReadOnlyList<NoteResponse> Items, string? NextCursor)`.
- App `Notes/Note.cs` (pure data, `ITenantOwned`), `Notes/INoteStore.cs`, `Notes/NoteService.cs` (takes `INoteStore` + `TimeProvider`; endpoints call exactly one service method each, DATA-1).
- Persistence `Notes/NoteConfiguration.cs`: `HasKey(TenantId, Id)` (TEN-3), Title max 200, Body max 8000, UNIQUE index (TenantId, CreatedAtUtc).
- Persistence `Notes/EfNoteStore.cs`: AsNoTracking, explicit tenant Where, keyset list (DATA-2).
- Endpoints: GET list + GET by id under `perm:notes.read`; POST + DELETE under `perm:notes.write`; ids as `{id:guid}`; 404 via TypedResults.NotFound (StatusCodePages makes it a problem document); request-shape validation (empty Title) returns ValidationProblem from the endpoint.
- KEYSET DECISION (pothole, already fought through, do not redo): cursor is CreatedAtUtc only (base64url of UtcTicks), order by CreatedAtUtc desc, boundary is strict `<`. Uniqueness per tenant is guaranteed by the UNIQUE (TenantId, CreatedAtUtc) index and sub-microsecond UtcNow precision; production seams with hotter write rates add an engine-appropriate tiebreaker at D-000. Page size: `Math.Clamp(limit ?? 20, 1, 100)` (DATA-2 explicit bound). Rejected alternatives, for the record: Guid v7 cursors (SQL Server orders uniqueidentifier by trailing bytes, so v7 does NOT sort by time there), Guid.CompareTo in EF predicates (unreliable translation), identity Seq column (SQLite EnsureCreated cannot autoincrement a non-PK column).
- DATA-3/DATA-4 exemplar seams (idempotency key + cross-store reconciler): NOT built in v1 skeleton; the claim files describe them and proven exemplars exist. Record as owed in the conformance table.

### Test tiers (TEST-1, X-12)
- Unit (SQLite, never EF InMemory): `AmbientTenantScopeTests` (unset throws, Begin/dispose restores, nesting), `TenantGuardTests` (stamp on add; foreign-row modify throws; foreign delete throws; UNSET SCOPE SAVE THROWS: this is the fail-closed test), `NoteServiceTests` (create/list/page bounds; clock via a private `TestClock : TimeProvider` subclass in the test file, no package).
- Integration (Testcontainers): collection fixture with `MsSqlBuilder`, connection string pointing at `Kernel_{Guid:N}` (unique DB per run), `Database.MigrateAsync()` applies the REAL migration. Tests: same Note Id under two tenants coexists (composite PK proof), cross-tenant modify throws on the real engine, keyset paging order/boundary on the real engine.
- Architecture project is the single un-filterable home for ALL host-wide scans AND host security behavior tests (X-8 rule 3). `KernelApiFactory : WebApplicationFactory<Program>`: UseSetting for Jwt:Key/Issuer/Audience and a dummy connection string, then swap the DbContext registration to a temp-file SQLite database, EnsureCreated in CreateHost, delete file on dispose (a WebApplicationFactory idiom). `TestTokens` helper mints HS256 JWTs (sub, tenant_id, sv=1, perm claims).
- EF migration: `dotnet new tool-manifest` + `dotnet tool install dotnet-ef` (pin 9.0.6) at server/, design-time factory `KernelDbContextFactory` in Persistence using SqlServer with a dummy connection string, then `dotnet ef migrations add InitialCreate -p src/Kernel.Persistence -s src/Kernel.Api`.

### Architecture test suite (the heart of v1; one file per concern)
1. `EndpointSpineTests` (SEC-1, TEN-1, SEC-3): from factory services, enumerate `EndpointDataSource` RouteEndpoints. Every endpoint either carries IAllowAnonymous AND its pattern is in the enumerated allowlist `{ "/health" }` (with justification comment), or carries IAuthorizeData whose Policy starts `perm:`. Bare RequireAuthorization without a perm policy FAILS. No route/query parameter named in the tenant list (tenantid, tenant, orgid, organizationid, organisationid) or PII list (email, phone, name, firstname, lastname, ssn, dob, dateofbirth), exact lowercase match. Plus: `IOptions<AuthorizationOptions>` FallbackPolicy is not null.
2. `ContractShapeTests` (SEC-2): reflection over Contracts assembly, types ending `Request` have no property in the forbidden set (Id, TenantId, CreatedAt, CreatedAtUtc, UpdatedAt, UpdatedAtUtc, CreatedBy, UpdatedBy, Status, State, RowVersion, ConcurrencyToken, Version, Role, Roles, Permissions, IsAdmin; case-insensitive). Also: App and Api assemblies declare NO public types ending Request/Response (they belong in Contracts).
3. `TimeTypeTests` (TIME-1): Contracts + App + Persistence assemblies, all non-compiler-generated public types: no DateTime (or Nullable/generic-arg DateTime, recurse) in public properties, fields, method/ctor parameters, return types. DateTimeOffset/DateOnly/TimeOnly allowed. Include Persistence (closes a verified gap).
4. `DependencyDirectionTests` (DATA-1, NetArchTest): App has no dependency on Kernel.Persistence or Kernel.Api; Contracts has none on App/Persistence/Api; Persistence has none on Api; types in namespace Kernel.Api.Endpoints have no dependency on Kernel.Persistence (endpoints go through App services).
5. `TenantKeyTests` (TEN-3): build the EF model (Sqlite options, no connection needed), every entity whose CLR type implements ITenantOwned has PK Properties[0].Name == "TenantId"; every entity with a TenantId property implements ITenantOwned (no unmarked tenant data).
6. `NamingPlacementTests` (MOD-2, source scan): find repo root by walking up from AppContext.BaseDirectory to the dir containing Kernel.sln; scan src/**/*.cs excluding bin/obj/Migrations. Rules: exactly one public type per file and file name == type name (exceptions: `*Contracts.cs` may hold a resource's request/response records; Program.cs). Suffix placement: `*Endpoints.cs` only under Api/Endpoints; `Ef*Store.cs` only under Persistence; `I*Store.cs` and other `*Store.cs` under App; `*Configuration.cs` under Persistence; `*Middleware.cs` under Api. Regex `\.Map(Get|Post|Put|Delete|Patch|Group)\s*\(` appears only in Api/Endpoints/*.cs. Test csprojs contain no `Microsoft.EntityFrameworkCore.InMemory` reference (TEST-1). Api csproj contains `UserSecretsId` (SEC-5).
7. `WireConventionTests` (CON-1): http Json options: naming policy camelCase, converters include JsonStringEnumConverter; unknown route with valid token returns application/problem+json.
8. `HostSecurityTests` (SEC-4, TEN e2e probes, via factory + TestTokens): valid token 200 on /notes; tampered signature 401; sv bumped in store then old token 401; token missing perm claim 403; token without tenant_id 403; cross-tenant GET of another tenant's note 404.

### client-web (UI-1..4, MOD-2, DEP-1, RT-1 note)
- Deps (exact pins, all long past the window; record npm publish dates in VERSIONS.md via `npm view <pkg>@<ver> time`): react 19.1.0, react-dom 19.1.0, typescript 5.8.3, vite 6.3.5, @vitejs/plugin-react 4.5.0, vitest 3.1.4, jsdom 26.1.0, @testing-library/react 16.3.0, @types/react + @types/react-dom (19.1.x), eslint 9.27.0, typescript-eslint 8.32.0, eslint-plugin-react-hooks 5.2.0, @types/node 22.x. `.npmrc`: save-exact, engine-strict. No other deps; the harness runs on Node 24 native type stripping (no tsx).
- `eslint.config.js` (UI-2): error-tier no-restricted-syntax banning hex colors, rgb/rgba/hsl calls, inline fontSize/fontFamily/fontWeight literals, raw borderRadius numbers; ALSO match template literals (close the verified AST-literal-only gap: add TemplateElement selectors); font weights as a closed SET not a bound (close the second verified gap). Token file exempted by path. no-restricted-imports deep-path bans (modules import each other only via module index). react-hooks rules.
- `src/theme/tokens.ts` reads nothing at runtime; it is the transcription. `tokenCoverage.test.ts` (UI-1) parses `design/colors_and_type.css`, asserts every CSS var has a matching token and count > 50.
- Primitives (UI-3): `Text.tsx`, `Button.tsx` are the only files importing tokens; `namingPlacement.test.ts` (MOD-2, zero-dep vitest scan of src/) enforces: PascalCase component files under components/ or modules/*/; hooks named use*.ts; repos as *Repo.ts under data/; tests in nearest __tests__/; token imports only from the primitives layer (UI-3 as a scan rather than a lint plugin, fewer deps).
- `modules/notes/NotesScreen.tsx` + fidelity test exemplar (UI-4): a LEDGER const enumerating the screen's atoms, exhaustiveness assertion (every ledger atom renders) and de-fabrication assertion (no unledgered atoms), a fidelity pattern reduced to one screen.
- `package.json` scripts: `verify` = `tsc --noEmit && vitest run && eslint .`; `harness` = `node tools/harness/main.ts`.
- `src/api/client.ts`: fetch wrapper, bearer from constructor arg, camelCase JSON, no realtime in v1 skeleton (RT-1's hub arch test is owed until the first realtime slice; note in conformance table).

### e2e harness (TEST-2)
`tools/harness/main.ts`: scenarios (health, create-note, list-notes-paged, cross-tenant-404) driving the REAL `src/data/notesRepo.ts` + `src/api/client.ts` against a running server; `HARN_TOKEN` / `HARN_TOKEN_B` env for auth (CI mints via `mintToken.mjs`: HS256 JWT with node:crypto, ~20 lines, no deps); NDJSON to stdout; `redact.ts` scrubs Authorization values and JWT-shaped strings, unit-tested (SEC-6).

### CI (TEST-3, .github/workflows/ci.yml)
Jobs: `server` (setup-dotnet 9, `dotnet restore --locked-mode`, `dotnet build -warnaserror --no-restore`, arch+unit tests, integration tests with docker available on ubuntu-latest); `client` (setup-node, `npm ci`, `npm run verify`); `docs-lint` (`node tools/docs-lint.mjs`); `e2e-wire` (mssql service container or Testcontainers-launched, start API with `dotnet run` + env config incl. minted Jwt key, run harness scenarios, fail on any non-ok NDJSON result). Comment in the yml: at instantiation this file moves to repo root and branch protection requires all four jobs.

### docs tree + docs-lint (DOC-1)
`docs/{claims,decisions,contracts,runbooks,work}/` each with a template file carrying front matter (`kind`, `status`). `tools/docs-lint.mjs` (no deps): every .md under docs/ has front matter with kind from the registry and status in {authoritative, working, archived}; no .md outside the legal roots except README.md/CLAUDE.md/BUILD-BRIEF.md at root; files under work/ carry a slice id in front matter.

## Definition of done

1. `dotnet build` green with warnings as errors; `dotnet test` green on all three server projects locally (Docker running for integration).
2. `npm ci && npm run verify` green in client-web.
3. Harness scenarios green against a locally running server (README runbook documents the two commands).
4. RED-GREEN PROOF, the step that matters most: for EACH architecture guard, deliberately violate it (add an ungated endpoint, a tenant route param, a DateTime property in Contracts, a public Request type in App, a foreign-tenant write, a hex literal in a screen, a misplaced file), confirm the guard goes red, revert. Record the violation-and-result list in `README.md` under "Guard verification". A green suite without this proof is exactly the aspirational-enforcement failure the extraction found everywhere.
5. `README.md` conformance table: every one of the 33 claims, its edition mechanism, status (built / owed with named trigger). Owed at v1: DATA-3/DATA-4 exemplar seams, EF-backed session store, RT-1 hub arch test, identity module, Expo variant, DEP-1 publish-date CI check (ledger is built, the date check is a recorded candidate).
6. Zero em/en dashes in everything you produce (verify: grep for the UTF-8 sequences).
7. Do not modify anything under kernel/claims/. If you believe a claim file is wrong, STOP and surface it; do not silently reconcile.

## After the build (not yours)

Fable review gates: adversarial pass over the arch-test suite (does each mechanism bind), then the kernel acceptance test (instantiate a throwaway project from the edition, reach green producing only a D-000 and deltas), then X2 written up as the methodology. Track human turns per shipped slice as the sole methodology metric.
