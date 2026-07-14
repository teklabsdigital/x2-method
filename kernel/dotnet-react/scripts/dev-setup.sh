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

if ! printf '%s' "$secrets" | grep -q '^ConnectionStrings:Kernel = '; then
  (cd "$API_PROJECT" && dotnet user-secrets set "ConnectionStrings:Kernel" \
    "Server=localhost,1433;Database=Kernel;User Id=sa;Password=${MSSQL_SA_PASSWORD};TrustServerCertificate=True" >/dev/null)
  echo "Set ConnectionStrings:Kernel user-secret."
fi

echo "Dev secrets ready. Next: scripts/db-up.sh && scripts/db-migrate.sh, then dotnet run --project server/src/Kernel.Api."
