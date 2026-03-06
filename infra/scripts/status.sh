#!/bin/bash
# Check status of all Railway services

echo "=== Railway Services Status ==="
echo ""

echo "API Service:"
railway service status --service bettersent-api
echo ""

echo "Web Service:"
railway service status --service bettersent-web
echo ""

echo "Telegram Service:"
railway service status --service bettersent-telegram
echo ""

echo "=== Service URLs ==="
echo "API: https://bettersent-api-production.up.railway.app"
echo "Web: https://bettersent-web-production.up.railway.app"
echo "Telegram: (bot service - no URL)"
echo ""

echo "=== Health Check ==="
echo -n "API Health: "
curl -s https://bettersent-api-production.up.railway.app/health || echo "Failed"
echo ""
