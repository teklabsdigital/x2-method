#!/usr/bin/env bash
# End-to-end runner (TEST-2 + the UI-5 smoke). Brings the DB up and migrated, boots the server, drives the REAL
# client services via npm (the harness, with its completeness self-audit), then boots the ACTUAL composed
# entrypoint against the same server (npm run smoke), then tears the server down.
#
# **This is the only procedure.** CI runs this file; a developer runs this file. It used to be a developer command
# that CI re-implemented inline, and E-104 recorded the cost before it arrived: the first change to this script
# after the finding (the build step below) reached the script and not the copy, and was caught by a person reading
# the job. What made the copy necessary was this script depending on a developer's machine, so that is what
# changed. The two things the callers differ about, the database and the signing key, are resolved to ONE value
# each in the block below; everything after it is identical for both.
#
# Usage: scripts/e2e.sh   (from anywhere)
#
#   ConnectionStrings__Kernel   a database the caller has already provisioned. Absent, a local engine container
#                               is started and the connection string comes from user-secrets.
#   Jwt__Key                    the signing key. Absent, it comes from user-secrets.
#   ASPNETCORE_ENVIRONMENT      defaults to Development. The harness seam follows it (see below).
#   HARN_BASE_URL               defaults to http://localhost:5080.
#
# Client dependencies are the caller's to install, the same division the sibling edition's e2e job makes: this
# runs `npm run build` and `npm run smoke`, it does not decide how the tree got its node_modules.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_PROJECT="$REPO/server/src/Kernel.Api/Kernel.Api.csproj"
API_DLL="$REPO/server/src/Kernel.Api/bin/Debug/net9.0/Kernel.Api.dll"
CLIENT_DIR="$REPO/client-web"
MINT="$CLIENT_DIR/tools/harness/mintToken.mjs"
BASE_URL="${HARN_BASE_URL:-http://localhost:5080}"

# CFG-1: operational values are read from committed config, never duplicated into scripts. The pilot hardcoded
# issuer/audience here and the copies could drift; this reads the same appsettings.json the server loads. The
# inline job read them the same way, which is the one thing about it that did not need repairing.
APPSETTINGS="$REPO/server/src/Kernel.Api/appsettings.json"
ISSUER="$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).Jwt.Issuer)" "$APPSETTINGS")"
AUDIENCE="$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).Jwt.Audience)" "$APPSETTINGS")"

# The template ENDS in the X's, and E-110 is why. BSD mktemp only substitutes a trailing run of X's, so
# `kernel-e2e-server.XXXXXX.log` created a file of that literal name on the first run and then failed every later
# run with "File exists" under `set -e`, before the database, the server or the harness. Two runs at once shared
# one log file for the same reason. GNU mktemp needs --suffix for this and BSD has no equivalent, so the suffix
# is dropped rather than made conditional: the path is printed, and nothing reads it by extension.
SERVER_LOG="$(mktemp "${TMPDIR:-/tmp}/kernel-e2e-server.XXXXXX")"
SERVER_PID=""

cleanup() {
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

# The developer secret store, read on demand rather than up front: a caller that supplies both values below never
# needs it, and a runner does not have one. Never fails the script by itself; the absence of a VALUE is what is
# reported, with the command that writes it.
secrets() {
  dotnet user-secrets list --project "$API_PROJECT" 2>/dev/null || true
}

# 1. The database, resolved to ONE connection string. E-111 was one secret in two registers, each filled only if
#    absent, and the schema is the same shape one layer out: a migration applied to one database while the host
#    reads another is a green migrate and a server that answers nothing. There is nothing to reconcile if there is
#    one value, so this string is computed here and handed to both. `db-migrate.sh` stays the developer's one-step
#    wrapper and derives the same string from .env.
CONNECTION="${ConnectionStrings__Kernel:-}"
if [ -z "$CONNECTION" ]; then
  "$REPO/scripts/db-up.sh"
  CONNECTION="$(secrets | sed -n 's/^ConnectionStrings:Kernel = //p')"
  if [ -z "$CONNECTION" ]; then
    echo "No database. Set ConnectionStrings__Kernel in the environment, or run scripts/dev-setup.sh to write the ConnectionStrings:Kernel user-secret." >&2
    exit 1
  fi
fi
#    Nothing here is silenced, and E-115 is why: these tools write their failures to stdout, so a `>/dev/null`
#    that tidies the happy path deletes the reason for the unhappy one. Planted with an unreachable database, the
#    silenced form printed "Applying the schema..." and stopped, in CI a red job with no message in it.
echo "Applying the schema..."
(cd "$REPO/server" && dotnet tool restore && dotnet ef database update --connection "$CONNECTION" -p src/Kernel.Persistence -s src/Kernel.Api)

# 2. The signing key, resolved the same way and for the same reason: the harness mints bearers with it and the
#    host validates them with it, so the two cannot be read from different places (SEC-5 keeps it out of the tree
#    either way). No default, ever: a default equal to the configured value cannot be distinguished from
#    configuration arriving (E-96).
JWT_KEY="${Jwt__Key:-}"
if [ -z "$JWT_KEY" ]; then
  JWT_KEY="$(secrets | sed -n 's/^Jwt:Key = //p')"
  if [ -z "$JWT_KEY" ]; then
    echo "No signing key. Set Jwt__Key in the environment, or run scripts/dev-setup.sh to write the Jwt:Key user-secret." >&2
    exit 1
  fi
fi

# 3. Two tenants. `uuidgen` is util-linux and is not on every runner; node is already required by this script two
#    lines above, so this removes a dependency rather than adding one.
NEW_ID="process.stdout.write(require('crypto').randomUUID())"
TOKEN_A="$(HARN_JWT_KEY="$JWT_KEY" HARN_JWT_ISSUER="$ISSUER" HARN_JWT_AUDIENCE="$AUDIENCE" node "$MINT" "$(node -e "$NEW_ID")" notes.read,notes.write)"
TOKEN_B="$(HARN_JWT_KEY="$JWT_KEY" HARN_JWT_ISSUER="$ISSUER" HARN_JWT_AUDIENCE="$AUDIENCE" node "$MINT" "$(node -e "$NEW_ID")" notes.read,notes.write)"

# 4. Build. Locked mode, because a build that restores unlocked can rewrite the lockfile it was supposed to obey
#    (DEP-1), and -warnaserror because the repository's own dotnet job already holds this tree to it; the weaker
#    of two settings is not the one to keep when the two become one.
#    Unsilenced for E-115's reason, and the build step carried that defect before today: a compile error under
#    `>/dev/null` left "Building the API..." as the last thing anyone saw. A locked-mode violation is exactly the
#    failure DEP-1 wants loud.
echo "Building the API..."
(cd "$REPO/server" && dotnet restore --locked-mode)
dotnet build "$API_PROJECT" -warnaserror --no-restore -clp:NoSummary

# 5. Boot the server. The built DLL runs as one killable process (dotnet run would fork a child the trap could
#    miss), and ASPNETCORE_URLS is set explicitly because launchSettings.json does not apply to this path. That
#    profile now exists and binds the documented 5080 for `dotnet run` and the .vscode task; until it did, this
#    comment named a file that was not in the tree, which is plausibly why the gap survived (E-26).
#
#    The harness seam FOLLOWS the environment rather than being forced on. The host refuses to boot with
#    Harness:Enabled outside Development or Testing and names itself when it does (Program.cs, TEST-2 / INV-10),
#    so forcing the flag would turn a caller's choice of environment into a crash. Development is the default
#    because that is the configuration the harness is built for: a product's provider-port re-bindings compose
#    under the flag, and a run with the flag off drives a different system than the one the tier is about. The
#    inline job booted Production with no flag and passed, which was only true while the kernel shipped no
#    re-bindings (E-114).
BOOT=(
  ASPNETCORE_ENVIRONMENT="${ASPNETCORE_ENVIRONMENT:-Development}"
  ASPNETCORE_URLS="$BASE_URL"
  ConnectionStrings__Kernel="$CONNECTION"
  Jwt__Key="$JWT_KEY"
)
case "${ASPNETCORE_ENVIRONMENT:-Development}" in
  Development | Testing) BOOT+=(Harness__Enabled=true) ;;
esac
echo "Starting the server (log: $SERVER_LOG)..."
env "${BOOT[@]}" dotnet "$API_DLL" --contentRoot "$(dirname "$API_DLL")" >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!

# 6. Wait for readiness.
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

# 7. The harness (real client services, completeness self-audit), then the composed-entrypoint smoke (UI-5).
cd "$CLIENT_DIR"
set +e
HARN_BASE_URL="$BASE_URL" HARN_TOKEN="$TOKEN_A" HARN_TOKEN_B="$TOKEN_B" node tools/harness/main.ts
HARN=$?
# E-107: the smoke asserts the BUILT client, so the build runs here and with the SAME values. Two separate
# substitutions of one variable is the defect the finding names; handing both steps one environment is what makes
# the smoke's green say something about the artifact that ships. Built inside the run rather than beforehand,
# because a stale dist/ is otherwise indistinguishable from a fresh one.
VITE_API_BASE_URL="$BASE_URL" VITE_API_TOKEN="$TOKEN_A" npm run build
BUILD=$?
VITE_API_BASE_URL="$BASE_URL" VITE_API_TOKEN="$TOKEN_A" npm run smoke
SMOKE=$?
set -e

if [ $((HARN + BUILD + SMOKE)) -ne 0 ]; then
  echo "e2e failed (harness=$HARN build=$BUILD smoke=$SMOKE). Server log: $SERVER_LOG" >&2
  exit 1
fi
echo "e2e green: harness + composed-entrypoint smoke."
