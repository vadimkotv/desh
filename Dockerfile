# syntax=docker/dockerfile:1
# Multi-stage build for the pnpm workspace. Two runnable targets share one deps layer:
#   docker build --target api .   → NestJS API (runs migrations + seed on start)
#   docker build --target web .   → Next.js dashboard (NEXT_PUBLIC_API_URL baked at build time)

FROM node:22-alpine AS base
RUN npm install -g pnpm@10.28.0
WORKDIR /app
# prisma.config.ts reads DATABASE_URL at `prisma generate` time; the real one comes from compose.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build

# ── deps: only manifests + prisma schema (postinstall runs `prisma generate`) ──
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/prisma.config.ts apps/api/
COPY apps/api/prisma apps/api/prisma
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/contracts/package.json packages/contracts/
RUN pnpm install --frozen-lockfile

FROM deps AS shared
COPY packages/shared packages/shared
RUN pnpm --filter @agentipo/shared build

# ── api ──
FROM shared AS api
COPY apps/api apps/api
RUN pnpm --filter @agentipo/api prisma:generate && pnpm --filter @agentipo/api build
WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "pnpm prisma:deploy && pnpm prisma:seed && node dist/main.js"]

# ── web ──
FROM shared AS web
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY apps/web apps/web
RUN pnpm --filter @agentipo/web build
WORKDIR /app/apps/web
ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "start"]
