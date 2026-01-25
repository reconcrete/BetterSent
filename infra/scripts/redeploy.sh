#!/bin/bash
# Redeploy a service without uploading new code (uses last deployment)
# Usage: ./redeploy.sh [api|web]

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
  *)
    echo "Usage: ./redeploy.sh [api|web]"
    exit 1
    ;;
esac
