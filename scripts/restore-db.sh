#!/usr/bin/env bash
set -euo pipefail

input="${1:-}"
if [[ -z "$input" || ! -f "$input" ]]; then echo "Usage: CONFIRM_RESTORE=YES bash scripts/restore-db.sh /absolute/path/backup.sql[.gz]"; exit 2; fi
if [[ "${CONFIRM_RESTORE:-}" != "YES" ]]; then echo "Restore replaces database contents. Re-run with CONFIRM_RESTORE=YES."; exit 3; fi
: "${DB_HOST:?Set DB_HOST}"; : "${DB_PORT:=3306}"; : "${DB_NAME:?Set DB_NAME}"; : "${DB_USER:?Set DB_USER}"; : "${DB_PASSWORD:?Set DB_PASSWORD}"

bash scripts/backup-db.sh
if [[ "$input" == *.gz ]]; then gzip -cd -- "$input" | MYSQL_PWD="$DB_PASSWORD" mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" "$DB_NAME"; else MYSQL_PWD="$DB_PASSWORD" mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" "$DB_NAME" < "$input"; fi
echo "Restore completed. Open /data-health and verify all checks."
