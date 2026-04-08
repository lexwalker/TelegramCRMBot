# CRM Bot

Minimal monorepo for a Telegram lead bot and a simple CRM panel.

## Apps

- `apps/web` - Next.js CRM and API
- `apps/bot` - Telegram bot on grammY
- `packages/db` - shared SQLite data layer

## Quick start

```bash
pnpm install
pnpm db:init
pnpm dev
```

## Commands

```bash
pnpm dev
pnpm dev:web
pnpm dev:bot
pnpm db:init
pnpm build
```
