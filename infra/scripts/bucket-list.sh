#!/bin/bash
# List files in Railway S3 bucket using API service env vars.
# Usage: ./bucket-list.sh [prefix]

set -euo pipefail

PREFIX="${1:-}"

if ! command -v railway >/dev/null 2>&1; then
  echo "Railway CLI is required. Install with: brew install railway"
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI is required. Install with: brew install awscli"
  exit 1
fi

echo "Listing bucket objects${PREFIX:+ under prefix '$PREFIX'}..."
echo ""

railway run --service kindle-api -- bash -lc '
set -euo pipefail

if [ -z "${STORAGE_S3_BUCKET:-}" ] || [ -z "${STORAGE_S3_ENDPOINT:-}" ] || [ -z "${AWS_REGION:-}" ]; then
  echo "Missing required env vars in Railway service kindle-api."
  echo "Required: STORAGE_S3_BUCKET, STORAGE_S3_ENDPOINT, AWS_REGION"
  exit 1
fi

TARGET="s3://${STORAGE_S3_BUCKET}"
if [ -n "'"$PREFIX"'" ]; then
  TARGET="${TARGET}/'"$PREFIX"'"
fi

aws s3 ls "$TARGET" \
  --recursive \
  --endpoint-url "$STORAGE_S3_ENDPOINT" \
  --region "$AWS_REGION"
'
