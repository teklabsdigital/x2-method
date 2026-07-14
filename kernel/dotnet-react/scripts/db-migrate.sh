#!/usr/bin/env bash
set -euo pipefail

# Apply EF migrations to the dev database (idempotent). Passes --connection built from the .env SA password,
# because `database update` connects and the design-time factory only holds a dummy. The host never migrates at
# startup; this script (or CI's explicit step) is the one migration path.

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -f "$REPO/.env" ]; then set -a; . "$REPO/.env"; set +a; fi

if [ -z "${MSSQL_SA_PASSWORD:-}" ]; then
  echo "MSSQL_SA_PASSWORD is not set. Run scripts/db-up.sh (or scripts/dev-setup.sh) first; it persists the password to the gitignored .env." >&2
  exit 1
fi

CS="Server=localhost,1433;Database=Kernel;User Id=sa;Password=${MSSQL_SA_PASSWORD};TrustServerCertificate=True"

cd "$REPO/server"
dotnet tool restore >/dev/null
dotnet ef database update --connection "$CS" -p src/Kernel.Persistence -s src/Kernel.Api
