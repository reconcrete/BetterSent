#!/bin/bash
# Deploy both API and Web services to Railway

set -e

echo "=== Deploying API ==="
railway service link kindle-api
railway up --detach
echo "API deployment started."

echo ""
echo "=== Deploying Web ==="
railway service link kindle-web
railway up --detach
echo "Web deployment started."

echo ""
echo "=== Deployment Status ==="
sleep 5
railway service status --service kindle-api
railway service status --service kindle-web

echo ""
echo "View build logs at: https://railway.com/project/a9f90556-a558-41a7-af40-b3cf0ea7f15c"
