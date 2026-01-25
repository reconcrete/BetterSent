#!/bin/bash
# View logs for a Railway service
# Usage: ./logs.sh [api|web|telegram|postgres]

SERVICE=${1:-api}

case $SERVICE in
  api)
    railway logs --service kindle-api
    ;;
  web)
    railway logs --service kindle-web
    ;;
  telegram|bot)
    railway logs --service kindle-telegram
    ;;
  postgres|db)
    railway logs --service Postgres
    ;;
  *)
    echo "Usage: ./logs.sh [api|web|telegram|postgres]"
    exit 1
    ;;
esac
