#!/bin/bash
# Forward Stripe webhook events to local API server for development.
#
# Usage:
#   ./infra/scripts/stripe-webhook.sh
#
# Prerequisites:
#   - Stripe CLI installed: brew install stripe/stripe-cli/stripe
#   - Logged in: stripe login
#
# This script:
#   1. Starts `stripe listen` forwarding to localhost:8080/billing/webhook
#   2. Prints the webhook signing secret — copy it to apps/api/.env as STRIPE_WEBHOOK_SECRET
#   3. All test-mode Stripe events (checkout, subscription updates, etc.) get forwarded

set -e

API_PORT="${API_PORT:-8080}"
ENDPOINT="http://localhost:${API_PORT}/billing/webhook"

echo "Starting Stripe webhook listener → ${ENDPOINT}"
echo ""
echo "Copy the 'whsec_...' secret printed below into your apps/api/.env as STRIPE_WEBHOOK_SECRET"
echo "Then restart the API server to pick it up."
echo ""

stripe listen --forward-to "${ENDPOINT}"
