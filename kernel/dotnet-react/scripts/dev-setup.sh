#!/usr/bin/env bash
set -euo pipefail

# Idempotent one-time dev bootstrap (INV-03): ensures the .env SA password and the Jwt:Key +
# ConnectionStrings:Kernel user-secrets so the server boots. Secrets live outside the repo (SEC-5): the SA
# password in the gitignored .env, everything else in dotnet user-secrets. Safe to re-run; it only fills gaps.

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_PROJECT="$REPO/server/src/Kernel.Api"

if [ -f "$REPO/.env" ]; then set -a; . "$REPO/.env"; set +a; fi

if [ -z "${MSSQL_SA_PASSWORD:-}" ]; then
  MSSQL_SA_PASSWORD="Kernel-dev-$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom 2>/dev/null | head -c 16 || true)"
  printf 'MSSQL_SA_PASSWORD=%s\n' "$MSSQL_SA_PASSWORD" >> "$REPO/.env"
  echo "Generated MSSQL_SA_PASSWORD and saved it to .env (gitignored)."
fi

secrets="$(cd "$API_PROJECT" && dotnet user-secrets list 2>/dev/null || true)"

if ! printf '%s' "$secrets" | grep -q '^Jwt:Key = '; then
  (cd "$API_PROJECT" && dotnet user-secrets set "Jwt:Key" "kernel-dev-$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom 2>/dev/null | head -c 48 || true)" >/dev/null)
  echo "Set Jwt:Key user-secret."
fi

# RECONCILED, not filled-if-absent, and E-111 is why. The SA password lives in two places that are written
# independently: `.env`, which `db-up.sh` uses to CREATE the container, and the connection string in user-secrets,
# which the server uses to reach it. Both scripts used to write theirs only when absent, so once the two diverged
# nothing brought them back, every request failed SQL login 18456, and the failure reached a developer as
# `GET /notes 500` three layers from the cause. `.env` is the declared value because it is the one the container
# is built from; this line makes the secret follow it rather than asking a human to notice.
existing_connection="$(printf '%s' "$secrets" | sed -n 's/^ConnectionStrings:Kernel = //p')"
wanted_connection="Server=localhost,1433;Database=Kernel;User Id=sa;Password=${MSSQL_SA_PASSWORD};TrustServerCertificate=True"
if [ "$existing_connection" != "$wanted_connection" ]; then
  (cd "$API_PROJECT" && dotnet user-secrets set "ConnectionStrings:Kernel" "$wanted_connection" >/dev/null)
  if [ -z "$existing_connection" ]; then
    echo "Set ConnectionStrings:Kernel user-secret."
  else
    echo "ConnectionStrings:Kernel disagreed with .env and was rewritten from it (E-111)."
  fi
fi

echo "Dev secrets ready. Next: scripts/db-up.sh && scripts/db-migrate.sh, then dotnet run --project server/src/Kernel.Api."
