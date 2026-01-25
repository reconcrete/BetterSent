# Wrap

A service that allows you to easily grab content from URLs and send it to your Kindle device.

## Packages

This is a monorepo with three packages:

| Package | Description |
|---------|-------------|
| [`packages/api`](packages/api) | Backend API (Elysia + Better Auth + Drizzle) |
| [`packages/web`](packages/web) | Web frontend (React + Vite) |
| [`packages/telegram`](packages/telegram) | Telegram bot interface (Telegraf) |

## Quick Start

```bash
# Install dependencies
bun install

# Start local database
docker compose up -d postgres

# Run database migrations
cd packages/api && bun run db:migrate

# Start all services in development mode
bun run dev
```

## Development

```bash
# Run all tests
bun run test

# Run tests for a specific package
cd packages/api && bun test
```

## Deployment

See [infra/README.md](infra/README.md) for deployment instructions using Railway.