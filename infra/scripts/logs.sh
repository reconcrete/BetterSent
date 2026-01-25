#!/bin/bash
# View logs for a Railway service
# Usage: ./logs.sh [api|web|postgres]

SERVICE=${1:-api}

case $SERVICE in
  api)
    railway logs --service kindle-api
    ;;
  web)
    railway logs --service kindle-web
    ;;
  postgres|db)
    railway logs --service Postgres
    ;;
  *)
    echo "Usage: ./logs.sh [api|web|postgres]"
    exit 1
    ;;
esac
