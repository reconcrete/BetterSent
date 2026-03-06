#!/bin/bash
# Deploy the Telegram bot service to Railway

set -e

echo "Deploying bettersent-telegram..."
railway service link bettersent-telegram
railway up --detach

echo ""
echo "Deployment started. View logs at:"
railway logs --service bettersent-telegram
