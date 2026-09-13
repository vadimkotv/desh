# The dashboard is server-rendered, so the API URL is baked in at build time for the
# browser bundle and also read at runtime by the server components.
FROM node:22-slim AS build
WORKDIR /repo
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable

ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_PRIVY_APP_ID=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_PUBLIC_PRIVY_APP_ID=$NEXT_PUBLIC_PRIVY_APP_ID

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter @agentipo/web... --filter @agentipo/shared

COPY packages/shared packages/shared
COPY apps/web apps/web
RUN pnpm --filter @agentipo/shared build && pnpm --filter @agentipo/web build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000
RUN corepack enable
COPY --from=build /repo /repo
WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
