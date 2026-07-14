---
kind: runbook
status: authoritative
---

# Local development

The `.vscode/tasks.json` tasks orchestrate everything below; each one just calls a script or CLI, so the commands
stay editor-agnostic and CI can reuse them. Ports: server 5080, client 5173, SQL Server 1433. The harness and
smoke entries need Node 24+ (they run TypeScript directly via type stripping).

## Host prerequisites

- Docker running (X-6: containerized engines only, none installed into the OS).
- Apple Silicon (INV-04): SQL Server is amd64-only, and colima's default qemu backend fails its readiness probe
  in a way that reads as a broken Integration tier. Run the Virtualization.framework backend with Rosetta and at
  least 8 GB: `colima start --vm-type vz --vz-rosetta --cpu 4 --memory 8`. `scripts/db-up.sh` prechecks this and
  fails fast with that exact line.

## Server

1. `scripts/dev-setup.sh` (or the `dev: init secrets` task), once: generates the dev SA password into the
   gitignored `.env` and sets the `Jwt:Key` and `ConnectionStrings:Kernel` user-secrets (SEC-5: no secret is ever
   committed).
2. `scripts/db-up.sh` (or `db: up`): starts the dev SQL Server, idempotently.
   - Pinned image, one value across this runbook, CI, and the Testcontainers fixture (DEP-1 / INV-05, ledgered in
     `VERSIONS.md`):
     `mcr.microsoft.com/mssql/server:2022-CU14-ubuntu-22.04@sha256:c1aa8afe9b06eab64c9774a4802dcd032205d1be785b1fd51e1c0151e7586b74`
   - Data persists in the `kernel-mssql-data` named volume (INV-02): it survives `docker rm`, lives outside the
     repo and outside git, and is wiped only by `docker volume rm kernel-mssql-data`. Alternative shape if you
     want the files physically in the project: a bind mount to `.localdb/` (gitignored, so dev data is never
     committable), at the cost of macOS bind-mount performance and container-user permission setup.
   - The Integration and e2e tiers stay disposable: their containers are removed on teardown.
3. `scripts/db-migrate.sh` (or `db: migrate`): applies EF migrations (the host never migrates at startup).
4. Run: `dotnet run --project src/Kernel.Api` (or the `server` task; `Kernel: Start All` sequences db, migrate,
   server, and client).
5. Test all three tiers (Docker running for the integration tier): `dotnet test` (or `test: all`).

## Client

1. `cd client-web && npm ci`
2. `npm run verify` (tsc, vitest, eslint)
3. Dev browsing against the local server: mint a dev token and put it in the gitignored `client-web/.env.local`:
   `VITE_API_TOKEN=$(HARN_JWT_KEY=<Jwt:Key from user-secrets> node tools/harness/mintToken.mjs <tenant-guid> notes.read,notes.write)`
   (the composition root reads `VITE_API_BASE_URL`, default `http://localhost:5080`, and `VITE_API_TOKEN`).

## End to end

`scripts/e2e.sh` (or the `e2e: harness + smoke` task): brings the DB up and migrated, boots the server, runs the
harness through the real client services (TEST-2, with the completeness self-audit), then boots the ACTUAL
composed entrypoint and asserts a real request per primary flow (UI-5 smoke), then tears the server down. Issuer
and audience are read from `appsettings.json`, never duplicated into the script (CFG-1).
