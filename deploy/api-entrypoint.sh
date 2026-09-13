#!/usr/bin/env sh
# Waits for the chain init to publish the escrow address, applies migrations, seeds the
# demo data once, then starts the API. Everything here is idempotent so `docker compose
# up` can be run again without wiping or duplicating anything.
set -eu

STATE=/chain/escrow-address
if [ "${WAIT_FOR_CHAIN:-true}" = "true" ]; then
  echo "waiting for the escrow address …"
  while [ ! -s "$STATE" ]; do sleep 1; done
  ARC_ESCROW_ADDRESS=$(cat "$STATE")
  export ARC_ESCROW_ADDRESS
  echo "escrow: $ARC_ESCROW_ADDRESS"
fi

echo "waiting for postgres …"
until pg_isready -d "$DATABASE_URL" >/dev/null 2>&1; do sleep 1; done

# Hand-written migrations: each file is applied once, in name order, inside its own
# transaction, and recorded so a restart does not re-run it.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -c \
  'CREATE TABLE IF NOT EXISTS "_applied_migration" (name TEXT PRIMARY KEY, at TIMESTAMPTZ DEFAULT now())'
for dir in $(ls -d prisma/migrations/*/ | sort); do
  name=$(basename "$dir")
  applied=$(psql "$DATABASE_URL" -tAc "SELECT 1 FROM \"_applied_migration\" WHERE name = '$name'")
  [ "$applied" = "1" ] && continue
  echo "migrating $name"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q --single-transaction -f "$dir/migration.sql"
  psql "$DATABASE_URL" -q -c "INSERT INTO \"_applied_migration\"(name) VALUES ('$name')"
done

if [ "${SEED_DEMO_DATA:-true}" = "true" ]; then
  count=$(psql "$DATABASE_URL" -tAc 'SELECT count(*) FROM "Startup"')
  if [ "$count" = "0" ]; then
    echo "seeding demo startups and agents …"
    pnpm exec tsx prisma/seed.ts || echo 'seed skipped'
  fi
fi

exec node dist/main.js
