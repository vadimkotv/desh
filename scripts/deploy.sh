#!/usr/bin/env sh
# Ship the committed tree (git archive HEAD) to a Docker host and (re)build the prod stack.
#   DEPLOY_HOST=root@1.2.3.4 sh scripts/deploy.sh
# First run: create $DEPLOY_DIR/.env on the host from .env.example (set PUBLIC_HOST there).
set -eu
HOST="${DEPLOY_HOST:?set DEPLOY_HOST=user@host}"
DIR="${DEPLOY_DIR:-/opt/agentipo}"

git archive --format=tar HEAD | ssh "$HOST" "mkdir -p '$DIR' && tar -x -C '$DIR'"
ssh "$HOST" "cd '$DIR' && test -f .env || { echo 'missing $DIR/.env'; exit 1; }
  docker compose -f docker-compose.prod.yml build api && \
  docker compose -f docker-compose.prod.yml build web && \
  docker compose -f docker-compose.prod.yml up -d && \
  docker compose -f docker-compose.prod.yml ps"
