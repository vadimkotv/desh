# Deliberately simple: build in the workspace and run from it. A pruned production
# image would be smaller, but this mirrors exactly what runs locally, which is worth
# more than a few hundred megabytes on a demo box.
FROM node:22-slim
WORKDIR /repo
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
# Prisma's engine download is blocked on some networks and is not needed here: the
# client is generated for the Rust-free driver adapter (@prisma/adapter-pg).
ENV PRISMA_SCHEMA_ENGINE_BINARY=/bin/true PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
ENV NODE_ENV=production PORT=4000

RUN apt-get update \
 && apt-get install -y --no-install-recommends postgresql-client ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @agentipo/api... --filter @agentipo/shared

COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @agentipo/shared build \
 && pnpm --filter @agentipo/api exec prisma generate \
 && pnpm --filter @agentipo/api exec nest build

COPY deploy/api-entrypoint.sh /usr/local/bin/api-entrypoint
RUN chmod +x /usr/local/bin/api-entrypoint

WORKDIR /repo/apps/api
EXPOSE 4000
ENTRYPOINT ["/usr/local/bin/api-entrypoint"]
