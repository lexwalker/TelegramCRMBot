FROM node:22-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/bot/package.json apps/bot/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/db/prisma packages/db/prisma

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @crm-bot/db run prisma:generate

COPY . .

RUN pnpm build

CMD ["pnpm", "--filter", "@crm-bot/web", "run", "start"]
