#!/bin/bash
# Check status of all Railway services

echo "=== Railway Services Status ==="
echo ""

echo "API Service:"
railway service status --service kindle-api
echo ""

echo "Web Service:"
railway service status --service kindle-web
echo ""

echo "=== Service URLs ==="
echo "API: https://kindle-api-production.up.railway.app"
echo "Web: https://kindle-web-production.up.railway.app"
echo ""

echo "=== Health Check ==="
echo -n "API Health: "
curl -s https://kindle-api-production.up.railway.app/health || echo "Failed"
echo ""
