#!/usr/bin/env bash
set -euo pipefail

# Dev SQL Server for the kernel. Idempotent: starts the container if absent, no-ops if it is already running.
#
# Data persists in the named docker volume kernel-mssql-data (INV-02): it survives `docker rm` and container
# recreates, lives on disk under Docker's data root (outside the repo and outside git), and is only wiped by an
# explicit `docker volume rm kernel-mssql-data`. The Integration and e2e tiers stay disposable (their containers
# are removed on teardown). The in-project bind-mount alternative is documented in the runbook; if used, its
# directory (.localdb/) is gitignored so dev data is never committable.

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Optional local secrets file (gitignored). MSSQL_SA_PASSWORD may live here or in the shell env; never committed (SEC-5).
if [ -f "$REPO/.env" ]; then set -a; . "$REPO/.env"; set +a; fi

# Resolve the dev SA password without ever committing one. Precedence: shell env / .env (sourced above), then an
# interactive prompt whose value is persisted to the gitignored .env so it is stable across runs. Only fail when
# there is no value and no terminal to ask on (e.g. CI, where the password comes from the environment).
if [ -z "${MSSQL_SA_PASSWORD:-}" ]; then
  if [ -t 0 ]; then
    printf 'No MSSQL_SA_PASSWORD set. Enter a dev SA password (blank = generate a strong one): ' >&2
    read -rs MSSQL_SA_PASSWORD || true
    echo >&2
    if [ -z "$MSSQL_SA_PASSWORD" ]; then
      # 'Kernel-dev-' guarantees upper + lower + symbol, so SQL Server's 3-of-4 complexity rule is met regardless.
      # `|| true` keeps the tr|head SIGPIPE from tripping `set -o pipefail` when head closes the pipe early.
      MSSQL_SA_PASSWORD="Kernel-dev-$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom 2>/dev/null | head -c 16 || true)"
      echo "Generated a dev SA password." >&2
    fi
    if ! grep -q '^MSSQL_SA_PASSWORD=' "$REPO/.env" 2>/dev/null; then
      printf 'MSSQL_SA_PASSWORD=%s\n' "$MSSQL_SA_PASSWORD" >> "$REPO/.env"
      echo "Saved MSSQL_SA_PASSWORD to $REPO/.env (gitignored). Use the SAME value in the ConnectionStrings:Kernel user-secret." >&2
    fi
  else
    echo "MSSQL_SA_PASSWORD is not set and there is no terminal to prompt on. Set it in your shell env or $REPO/.env (never commit it)." >&2
    exit 1
  fi
fi

# DB2 / CFG-1: the engine choice is declared once, in edition.json, and read here. This script used to restate
# the pinned tag@digest, which made it the fourth of five independent copies of a value that has to be identical
# in all of them (E-64). The pin is still exactly as pinned (DEP-1 / INV-05, never :latest); it is just no longer
# asserted here. docs-lint compares the declaration against every other surface naming the image, so a drift
# between this script and the ledger is now a failed build rather than a container running the wrong engine.
EDITION="$REPO/edition.json"
READ="const e=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).engine; process.stdout.write(String(e[process.argv[2]]))"
IMAGE="$(node -e "$READ" "$EDITION" image)"
NAME="$(node -e "$READ" "$EDITION" container)"
VOLUME="$(node -e "$READ" "$EDITION" volume)"
PORT="$(node -e "$READ" "$EDITION" port)"

# Apple Silicon precheck (INV-04): SQL Server is amd64-only, and colima's default qemu backend is too slow and
# memory-light for its readiness probe, which fails in a way that reads as a broken Integration tier. Require the
# Virtualization.framework + Rosetta backend with >=8GB.
if [ "$(uname -m)" = "arm64" ] && command -v colima >/dev/null 2>&1; then
  if ! colima status >/dev/null 2>&1; then
    echo "colima is not running. On Apple Silicon start it with the amd64-capable backend:"
    echo "  colima start --vm-type vz --vz-rosetta --cpu 4 --memory 8"
    exit 1
  fi
fi

if [ -z "$(docker ps -q -f "name=^${NAME}$")" ]; then
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  docker run -d --name "$NAME" \
    -e ACCEPT_EULA=Y -e "MSSQL_SA_PASSWORD=${MSSQL_SA_PASSWORD}" \
    -p "${PORT}:${PORT}" \
    -v "${VOLUME}:/var/opt/mssql" \
    "$IMAGE" >/dev/null
  echo "Started ${NAME} on :${PORT} (persistent volume ${VOLUME}, pinned image)."
else
  echo "SQL Server (${NAME}) already running on :${PORT}."
fi

# Wait for SQL Server to actually accept connections before returning, so a sequenced migrate (db: up -> db:
# migrate, or Kernel: Start All) does not race the engine's boot. amd64 SQL Server under emulation can take
# 10-30s cold.
printf 'Waiting for SQL Server to accept connections'
for _ in $(seq 1 60); do
  if docker exec "$NAME" /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT 1" >/dev/null 2>&1; then
    echo ' ready.'
    exit 0
  fi
  printf '.'
  sleep 1
done
echo
echo "SQL Server did not become ready within 60s. Inspect: docker logs ${NAME}" >&2
exit 1
