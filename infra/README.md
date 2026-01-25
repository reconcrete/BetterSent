# Infrastructure Scripts

Utility scripts for deploying and managing the Kindle Wrap application on Railway.

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

## Service URLs

- **API**: https://kindle-api-production.up.railway.app
- **Web**: https://kindle-web-production.up.railway.app
- **Telegram**: (no URL - bot service)

## Environment Variables

### API Service (`kindle-api`)

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

### Web Service (`kindle-web`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API URL for frontend |
| `RAILPACK_BUILD_CMD` | Custom build command |
| `RAILPACK_SPA_OUTPUT_DIR` | SPA output directory |

### Telegram Service (`kindle-telegram`)

| Variable | Description |
|----------|-------------|
| `BOT_TOKEN` | Telegram bot token from @BotFather |
| `API_URL` | API URL for backend calls |

## Quick Commands

```bash
# Check service status
railway service status --service kindle-api

# View logs
railway logs --service kindle-api

# Set environment variable
railway variable set KEY=value --service kindle-api

# Open Railway dashboard
railway open
```
