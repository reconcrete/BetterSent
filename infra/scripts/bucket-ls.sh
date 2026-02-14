#!/bin/bash
# List files in the Railway bucket (S3-compatible)
# Usage: ./bucket-ls.sh [prefix]
#   prefix - optional path prefix (e.g. "extract" to list extract folders)
#
# Prerequisites: AWS CLI (brew install awscli), Railway CLI, project linked

set -e

PREFIX="${1:-}"

if ! command -v aws &>/dev/null; then
  echo "Error: AWS CLI is required. Install with: brew install awscli"
  exit 1
fi

echo "Listing bucket contents..."
railway run --service kindle-api -- bash -c '
  B="${BUCKET:-$STORAGE_S3_BUCKET}"
  E="${ENDPOINT:-$STORAGE_S3_ENDPOINT}"
  aws s3 ls "s3://${B}/'"${PREFIX}"'" --endpoint-url "${E}" --recursive
'
