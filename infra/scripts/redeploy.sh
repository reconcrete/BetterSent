#!/bin/bash
# Redeploy a service without uploading new code (uses last deployment)
# Usage: ./redeploy.sh [api|web|telegram]

SERVICE=${1:-api}

case $SERVICE in
  api)
    echo "Redeploying kindle-api..."
    railway redeploy --service kindle-api
    ;;
  web)
    echo "Redeploying kindle-web..."
    railway redeploy --service kindle-web
    ;;
  telegram|bot)
    echo "Redeploying kindle-telegram..."
    railway redeploy --service kindle-telegram
    ;;
  *)
    echo "Usage: ./redeploy.sh [api|web|telegram]"
    exit 1
    ;;
esac
