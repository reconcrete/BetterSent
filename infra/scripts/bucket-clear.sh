#!/bin/bash
# Delete all files from Railway S3 bucket using API service env vars.
# Usage: ./bucket-clear.sh [--yes]

set -euo pipefail

ASSUME_YES=false
if [[ "${1:-}" == "--yes" ]]; then
  ASSUME_YES=true
fi

if ! command -v railway >/dev/null 2>&1; then
  echo "Railway CLI is required. Install with: brew install railway"
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI is required. Install with: brew install awscli"
  exit 1
fi

if [[ "$ASSUME_YES" != "true" ]]; then
  echo "This will permanently delete ALL objects in the configured bucket."
  read -r -p "Type 'DELETE' to continue: " confirmation
  if [[ "$confirmation" != "DELETE" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

echo "Clearing all bucket objects..."
echo ""

railway run --service bettersent-api -- bash -lc '
set -euo pipefail

if [ -z "${STORAGE_S3_BUCKET:-}" ] || [ -z "${STORAGE_S3_ENDPOINT:-}" ] || [ -z "${AWS_REGION:-}" ]; then
  echo "Missing required env vars in Railway service bettersent-api."
  echo "Required: STORAGE_S3_BUCKET, STORAGE_S3_ENDPOINT, AWS_REGION"
  exit 1
fi

aws s3 rm "s3://${STORAGE_S3_BUCKET}" \
  --recursive \
  --endpoint-url "$STORAGE_S3_ENDPOINT" \
  --region "$AWS_REGION"
'

echo ""
echo "Bucket cleared."
