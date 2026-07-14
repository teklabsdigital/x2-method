#!/usr/bin/env bash
set -euo pipefail

# Stop and remove the dev SQL Server container. The data volume (kernel-mssql-data) is KEPT (INV-02: dev data has
# a persistent home); wipe it only with an explicit `docker volume rm kernel-mssql-data`.
docker rm -f kernel-mssql >/dev/null 2>&1 && echo "Removed kernel-mssql (volume kernel-mssql-data kept)." || echo "kernel-mssql was not running."
