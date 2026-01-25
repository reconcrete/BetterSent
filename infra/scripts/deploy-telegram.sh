#!/bin/bash
# Deploy the Telegram bot service to Railway

set -e

echo "Deploying kindle-telegram..."
railway service link kindle-telegram
railway up --detach

echo ""
echo "Deployment started. View logs at:"
railway logs --service kindle-telegram
