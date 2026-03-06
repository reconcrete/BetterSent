#!/bin/bash
# Redeploy a service without uploading new code (uses last deployment)
# Usage: ./redeploy.sh [api|web|telegram]

SERVICE=${1:-api}

case $SERVICE in
  api)
    echo "Redeploying bettersent-api..."
    railway redeploy --service bettersent-api
    ;;
  web)
    echo "Redeploying bettersent-web..."
    railway redeploy --service bettersent-web
    ;;
  telegram|bot)
    echo "Redeploying bettersent-telegram..."
    railway redeploy --service bettersent-telegram
    ;;
  *)
    echo "Usage: ./redeploy.sh [api|web|telegram]"
    exit 1
    ;;
esac
