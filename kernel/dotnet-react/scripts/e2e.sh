#!/usr/bin/env bash
# End-to-end runner (TEST-2 + the UI-5 smoke). Brings the DB up and migrated, boots the server, drives the REAL
# client services via npm (the harness, with its completeness self-audit), then boots the ACTUAL composed
# entrypoint against the same server (npm run smoke), then tears the server down. The harness profile flag is on
# (allowlisted in Development; a product's provider-port re-bindings compose under it; the kernel has none yet).
#
# Usage: scripts/e2e.sh   (from anywhere)
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_PROJECT="$REPO/server/src/Kernel.Api/Kernel.Api.csproj"
API_DLL="$REPO/server/src/Kernel.Api/bin/Debug/net9.0/Kernel.Api.dll"
CLIENT_DIR="$REPO/client-web"
MINT="$CLIENT_DIR/tools/harness/mintToken.mjs"
BASE_URL="${HARN_BASE_URL:-http://localhost:5080}"

# CFG-1: operational values are read from committed config, never duplicated into scripts. The pilot hardcoded
# issuer/audience here and the copies could drift; this reads the same appsettings.json the server loads.
APPSETTINGS="$REPO/server/src/Kernel.Api/appsettings.json"
ISSUER="$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).Jwt.Issuer)" "$APPSETTINGS")"
AUDIENCE="$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).Jwt.Audience)" "$APPSETTINGS")"

SERVER_LOG="$(mktemp "${TMPDIR:-/tmp}/kernel-e2e-server.XXXXXX.log")"
SERVER_PID=""

cleanup() {
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

# 1. Database up and migrated (both idempotent).
"$REPO/scripts/db-up.sh"
"$REPO/scripts/db-migrate.sh"

# 2. Mint the harness bearers with the SAME key the server signs with (Jwt:Key, from user-secrets, SEC-5).
JWT_KEY="$(dotnet user-secrets list --project "$API_PROJECT" 2>/dev/null | sed -n 's/^Jwt:Key = //p')"
if [ -z "$JWT_KEY" ]; then
  echo "Jwt:Key is not set in user-secrets; run scripts/dev-setup.sh first." >&2
  exit 1
fi
TOKEN_A="$(HARN_JWT_KEY="$JWT_KEY" HARN_JWT_ISSUER="$ISSUER" HARN_JWT_AUDIENCE="$AUDIENCE" node "$MINT" "$(uuidgen)" notes.read,notes.write)"
TOKEN_B="$(HARN_JWT_KEY="$JWT_KEY" HARN_JWT_ISSUER="$ISSUER" HARN_JWT_AUDIENCE="$AUDIENCE" node "$MINT" "$(uuidgen)" notes.read,notes.write)"

# 3. Boot the server. Build first so the DLL runs as one killable process (dotnet run would fork a child the trap
#    could miss). Development loads user-secrets; ASPNETCORE_URLS is set explicitly because launchSettings.json
#    only applies under `dotnet run`.
echo "Building the API..."
dotnet build "$API_PROJECT" -clp:NoSummary >/dev/null
echo "Starting the server (log: $SERVER_LOG)..."
ASPNETCORE_ENVIRONMENT=Development \
  ASPNETCORE_URLS="$BASE_URL" \
  Harness__Enabled=true \
  dotnet "$API_DLL" --contentRoot "$(dirname "$API_DLL")" >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!

# 4. Wait for readiness.
printf 'Waiting for the server'
for _ in $(seq 1 60); do
  if curl -fsS "$BASE_URL/health" >/dev/null 2>&1; then
    echo ' ready.'
    break
  fi
  printf '.'
  sleep 1
done
if ! curl -fsS "$BASE_URL/health" >/dev/null 2>&1; then
  echo; echo "Server did not become ready. Log:" >&2; tail -20 "$SERVER_LOG" >&2; exit 1
fi

# 5. The harness (real client services, completeness self-audit), then the composed-entrypoint smoke (UI-5).
cd "$CLIENT_DIR"
set +e
HARN_BASE_URL="$BASE_URL" HARN_TOKEN="$TOKEN_A" HARN_TOKEN_B="$TOKEN_B" node tools/harness/main.ts
HARN=$?
VITE_API_BASE_URL="$BASE_URL" VITE_API_TOKEN="$TOKEN_A" npm run smoke
SMOKE=$?
set -e

if [ $((HARN + SMOKE)) -ne 0 ]; then
  echo "e2e failed (harness=$HARN smoke=$SMOKE). Server log: $SERVER_LOG" >&2
  exit 1
fi
echo "e2e green: harness + composed-entrypoint smoke."
