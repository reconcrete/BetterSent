#!/bin/bash
# Run database migrations against the production database
# Uses the public DATABASE_URL from Railway

set -e

# Get the public database URL from Railway Postgres service
echo "Fetching database URL from Railway..."
DATABASE_PUBLIC_URL=$(railway variables --service Postgres --json 2>/dev/null | grep '"DATABASE_PUBLIC_URL"' | sed 's/.*: *"\(.*\)".*/\1/')

if [ -z "$DATABASE_PUBLIC_URL" ]; then
  echo "Error: Could not fetch DATABASE_PUBLIC_URL from Railway"
  echo "Make sure you're logged in to Railway and linked to the project"
  exit 1
fi

echo "Running migrations..."
DATABASE_URL="$DATABASE_PUBLIC_URL" bun run --filter @kindle-wrap/api db:migrate

echo ""
echo "Migrations completed successfully!"
