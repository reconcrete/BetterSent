#!/bin/bash
# Deploy the API service to Railway

set -e

echo "Deploying bettersent-api..."
railway service link bettersent-api
railway up --detach

echo ""
echo "Deployment started. View logs at:"
railway logs --service bettersent-api
