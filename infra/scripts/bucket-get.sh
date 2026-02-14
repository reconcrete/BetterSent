#!/bin/bash
# Download a file from the Railway bucket (S3-compatible)
# Usage: ./bucket-get.sh <s3-key> [local-path]
#   s3-key    - full object key (e.g. extract-url-xxx/article.epub)
#   local-path - where to save (default: current dir, same filename)
#
# Prerequisites: AWS CLI (brew install awscli), Railway CLI, project linked

set -e

S3_KEY="${1:?Usage: $0 <s3-key> [local-path]}"
LOCAL_PATH="${2:-}"

if ! command -v aws &>/dev/null; then
  echo "Error: AWS CLI is required. Install with: brew install awscli"
  exit 1
fi

# Default to basename of key if no local path given
if [ -z "$LOCAL_PATH" ]; then
  LOCAL_PATH=$(basename "$S3_KEY")
fi

echo "Downloading s3://${S3_KEY} -> ${LOCAL_PATH}..."
railway run --service kindle-api -- bash -c '
  B="${BUCKET:-$STORAGE_S3_BUCKET}"
  E="${ENDPOINT:-$STORAGE_S3_ENDPOINT}"
  aws s3 cp "s3://${B}/'"${S3_KEY}"'" "'"${LOCAL_PATH}"'" --endpoint-url "${E}"
'
echo "Saved to ${LOCAL_PATH}"
