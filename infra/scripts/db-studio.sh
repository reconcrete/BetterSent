#!/bin/bash
# Open Drizzle Studio connected to production database

set -e

# Get the public database URL from Railway Postgres service
echo "Fetching database URL from Railway..."
DATABASE_PUBLIC_URL=$(railway variables --service Postgres --json 2>/dev/null | grep -o '"DATABASE_PUBLIC_URL":"[^"]*"' | cut -d'"' -f4)

if [ -z "$DATABASE_PUBLIC_URL" ]; then
  echo "Error: Could not fetch DATABASE_PUBLIC_URL from Railway"
  echo "Make sure you're logged in to Railway and linked to the project"
  exit 1
fi

echo "Opening Drizzle Studio..."
DATABASE_URL="$DATABASE_PUBLIC_URL" bun run --filter @bettersent/api db:studio
