#!/usr/bin/env bash
# Run the schema tests against a disposable local Postgres.
# Requires: postgresql server binaries (initdb, pg_ctl, psql).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="${BABYNAME_TEST_DIR:-/var/tmp/babyname-pgtest}"
PORT="${BABYNAME_TEST_PORT:-55432}"
PGBIN="${PGBIN:-$(dirname "$(command -v initdb || echo /usr/lib/postgresql/16/bin/initdb)")}"

cleanup() {
  "$PGBIN/pg_ctl" -D "$WORK/data" stop -m immediate >/dev/null 2>&1 || true
}
trap cleanup EXIT

rm -rf "$WORK"
mkdir -p "$WORK/data" "$WORK/run"

"$PGBIN/initdb" -D "$WORK/data" -U postgres --auth=trust >"$WORK/initdb.log" 2>&1
"$PGBIN/pg_ctl" -D "$WORK/data" -l "$WORK/pg.log" \
  -o "-k $WORK/run -p $PORT -c listen_addresses=" -w start >/dev/null

PSQL=("$PGBIN/psql" -h "$WORK/run" -p "$PORT" -U postgres)

failed=0
for test_file in "$ROOT"/supabase/tests/0[1-9]_*.sql; do
  name="$(basename "$test_file")"
  echo "=============================================================="
  echo "  $name"
  echo "=============================================================="

  "${PSQL[@]}" -d postgres -q \
    -c "drop database if exists babyname_test;" \
    -c "create database babyname_test;" >/dev/null

  for setup in "$ROOT/supabase/tests/00_supabase_stub.sql" "$ROOT"/supabase/migrations/*.sql; do
    if [[ "$name" == "06_catalogue_growth.sql" && "$setup" == */20260921202500_expand_name_catalogue.sql ]]; then
      continue
    fi
    "${PSQL[@]}" -d babyname_test -v ON_ERROR_STOP=1 -q -f "$setup" >/dev/null
  done

  if "${PSQL[@]}" -d babyname_test -v ON_ERROR_STOP=1 -q -f "$test_file"; then
    echo "PASS $name"
  else
    echo "FAIL $name"
    failed=1
  fi
  echo
done

exit "$failed"
