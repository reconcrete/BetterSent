# Infrastructure Scripts

Utility scripts for deploying and managing the Bettersent application on Railway.

## Prerequisites

- Railway CLI installed (`brew install railway`)
- Logged in to Railway (`railway login`)
- Project linked (`railway link`)

## Scripts

### Deployment

| Script | Description |
|--------|-------------|
| `./deploy-api.sh` | Deploy the API service |
| `./deploy-web.sh` | Deploy the Web service |
| `./deploy-telegram.sh` | Deploy the Telegram bot service |
| `./deploy-all.sh` | Deploy all services |
| `./redeploy.sh [api\|web\|telegram]` | Redeploy without new code |

### Database

| Script | Description |
|--------|-------------|
| `./db-migrate.sh` | Run database migrations on production |
| `./db-studio.sh` | Open Drizzle Studio with production DB |

### Monitoring

| Script | Description |
|--------|-------------|
| `./status.sh` | Check status of all services |
| `./logs.sh [api\|web\|telegram\|postgres]` | View service logs |

### Storage

| Script | Description |
|--------|-------------|
| `./bucket-list.sh [prefix]` | List files in Railway S3 bucket (optionally filter by prefix) |
| `./bucket-download.sh [prefix] [destination]` | Download files from bucket prefix to local directory |
| `./bucket-clear.sh [--yes]` | Delete all files from Railway S3 bucket (prompts for confirmation) |

## Service URLs

- **API**: https://bettersent-api-production.up.railway.app
- **Web**: https://bettersent-web-production.up.railway.app
- **Telegram**: (no URL - bot service)

## Environment Variables

### API Service (`bettersent-api`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `CORS_ORIGIN` | Allowed CORS origin (web URL) |
| `TRUSTED_ORIGINS` | Comma-separated trusted origins for better-auth |
| `BETTER_AUTH_SECRET` | Auth secret key |
| `BETTER_AUTH_URL` | Auth base URL |
| `OPENAI_API_KEY` | OpenAI API key for content extraction |
| `RESEND_API_KEY` | Resend API key for emails |
| `RESEND_FROM_EMAIL` | From email address |
| `NODE_ENV` | Environment (production) |
| `STORAGE_S3_ENDPOINT` | S3-compatible endpoint for Railway bucket |
| `STORAGE_S3_BUCKET` | Bucket name for persisted extraction artifacts |
| `AWS_REGION` | Region for S3 client configuration |
| `AWS_ACCESS_KEY_ID` | Access key for bucket access |
| `AWS_SECRET_ACCESS_KEY` | Secret key for bucket access |
| `STORAGE_S3_PREFIX` | Optional object key prefix (defaults to `extract`) |

Storage script requirements:
- `aws` CLI installed locally (`brew install awscli`).
- Railway service `bettersent-api` contains S3 env vars (`STORAGE_S3_BUCKET`, `STORAGE_S3_ENDPOINT`, `AWS_REGION`, credentials).

Production behavior:
- In `NODE_ENV=production` with full S3 configuration, extractor artifacts (`.md`, `images/*`, `.epub`) are uploaded to the bucket.
- In local/dev environments, filesystem storage is used and artifacts are kept in `OUTPUT_DIR`.
- If production has partial S3 configuration, API storage throws a startup/runtime error listing missing variables.

### Web Service (`bettersent-web`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API URL for frontend |
| `RAILPACK_BUILD_CMD` | Custom build command |
| `RAILPACK_SPA_OUTPUT_DIR` | SPA output directory |

### Telegram Service (`bettersent-telegram`)

| Variable | Description |
|----------|-------------|
| `BOT_TOKEN` | Telegram bot token from @BotFather |
| `API_URL` | API URL for backend calls |

## Quick Commands

```bash
# Check service status
railway service status --service bettersent-api

# View logs
railway logs --service bettersent-api

# Set environment variable
railway variable set KEY=value --service bettersent-api

# Open Railway dashboard
railway open
```
