#!/bin/bash
# Deploy the Web service to Railway

set -e

echo "Deploying bettersent-web..."
railway service link bettersent-web
railway up --detach

echo ""
echo "Deployment started. View logs at:"
railway logs --service bettersent-web
