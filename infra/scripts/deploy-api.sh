#!/bin/bash
# Deploy the API service to Railway

set -e

echo "Deploying kindle-api..."
railway service link kindle-api
railway up --detach

echo ""
echo "Deployment started. View logs at:"
railway logs --service kindle-api
