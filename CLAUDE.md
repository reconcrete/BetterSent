# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bettersent is a service that lets users grab content from URLs and send it to their Kindle. It has web, API, and Telegram bot interfaces.

## Monorepo Structure

- **apps/api** — Elysia backend (Better Auth, Drizzle ORM, S3 storage, OpenAI, Resend email, Pandoc)
- **apps/web** — React + Vite frontend (TanStack Query, shadcn/ui, Tailwind CSS 4)
- **apps/telegram** — Grammy Telegram bot
- **apps/storage-browser** — S3 bucket browser utility
- **packages/db** — Shared database layer (Drizzle ORM + PostgreSQL)

Package manager: **Bun** (1.3.3). Build orchestration: **Turborepo**.

## Commands

```bash
# Development
bun dev                    # Run all apps in dev mode
bun --filter api dev       # Run only API
bun --filter web dev       # Run only web

# Build
bun run build              # Build all packages

# Database (from root)
bun run db:generate        # Generate Drizzle migrations
bun run db:migrate         # Run migrations
bun run db:push            # Push schema directly (dev)
bun run db:studio          # Open Drizzle Studio

# Testing
bun test                   # Run all tests (Bun test runner)

# Lint
bun run lint               # Lint all packages

# API production
bun run api:start          # Start API server
```

## Architecture

### API (`apps/api`)
- **Framework**: Elysia with type-safe routes
- **Auth**: Better Auth with Google OAuth and Magic Link (no password auth)
- **Auth middleware**: Custom Elysia macro + internal API key support for Telegram bot
- **Services use factory pattern**: Extractor (content extraction) and Storage (S3 vs filesystem) have interface/implementation/factory structure
- **Content pipeline**: URL → scrape → OpenAI extraction → Pandoc conversion (HTML→Markdown/EPUB) → S3 storage → Resend email to Kindle

### Web (`apps/web`)
- **Architecture**: Feature-Sliced Design (FSD) with strict layer imports:
  - `app` → `pages` → `widgets` → `features` → `entities` → `shared`
  - Each layer can only import from layers below it. Every slice exports via `index.ts`.
- **API client**: Elysia Eden (type-safe, generated from API types) — configured in `shared/lib/treaty/`
- **State**: Zustand for UI state (modals), TanStack Query for server state
- **UI**: shadcn/ui (new-york style) + Tailwind CSS 4 with OKLch color tokens and dark mode
- **Analytics**: PostHog — use `useAnalytics()` hook, not direct `posthog-js` imports
- **Path aliases**: `~/app`, `~/pages`, `~/widgets`, `~/features`, `~/entities`, `~/shared`, `~/backend` (points to API source for Eden types)

### Database (`packages/db`)
- Drizzle ORM with PostgreSQL
- Schema in `packages/db/src/schema/` — auth tables, `kindleEmailAddress`, `sendHistory`, `telegramSession`
- Exports: `@bettersent/db` (client factory) and `@bettersent/db/schema` (schema + Drizzle utilities)
- Local dev uses Docker Compose for PostgreSQL

### Telegram (`apps/telegram`)
- Grammy framework with conversation flows
- Authenticates via internal API key to the Elysia API
- Commands: `/start`, `/device`, `/add_device`, `/extract`, `/me`, `/help`, `/logout`

## Deployment

- **Platform**: Railway
- **CI/CD**: GitHub Actions for DB migrations (triggers on changes to `packages/db/migrations/`)
- **Docker**: Bun-based images; API image includes Pandoc 3.8.3
- **Infra scripts**: `infra/` directory has deploy, migrate, logs, and storage management scripts
