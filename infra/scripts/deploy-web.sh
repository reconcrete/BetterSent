#!/bin/bash
# Deploy the Web service to Railway

set -e

echo "Deploying kindle-web..."
railway service link kindle-web
railway up --detach

echo ""
echo "Deployment started. View logs at:"
railway logs --service kindle-web
