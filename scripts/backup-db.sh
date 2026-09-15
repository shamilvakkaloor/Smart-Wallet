#!/usr/bin/env bash
set -euo pipefail

: "${DB_HOST:?Set DB_HOST}"
: "${DB_PORT:=3306}"
: "${DB_NAME:?Set DB_NAME}"
: "${DB_USER:?Set DB_USER}"
: "${DB_PASSWORD:?Set DB_PASSWORD}"

backup_dir="${BACKUP_DIR:-./backups}"
mkdir -p "$backup_dir"
output="$backup_dir/smart-wallet-$(date -u +%Y%m%d-%H%M%S).sql"

MYSQL_PWD="$DB_PASSWORD" mysqldump --single-transaction --routines --triggers \
  --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" "$DB_NAME" > "$output"
gzip "$output"
echo "Backup created: $output.gz"
