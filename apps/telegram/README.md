# Bettersent Telegram Bot

A Telegram bot interface for sending content to your Kindle device.

## Features

- Authenticate with your existing Bettersent account (email + password)
- List and select from your configured Kindle email addresses
- Add new Kindle email addresses
- Send URLs to extract articles and deliver to Kindle
- Send plain text to convert and deliver to Kindle

## Setup

1. Create a bot via [@BotFather](https://t.me/BotFather) on Telegram to get a `BOT_TOKEN`

2. Create a `.env` file:
   ```env
   BOT_TOKEN=your_bot_token_here
   API_URL=http://localhost:8080
   ```

3. Install dependencies:
   ```bash
   bun install
   ```

4. Start the bot:
   ```bash
   bun run dev
   ```

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and current status |
| `/login` | Log in with your Bettersent account |
| `/logout` | Log out and clear session |
| `/kindle` | List and select Kindle email addresses |
| `/add_kindle` | Add a new Kindle email address |
| `/help` | Show available commands |

## Message Handling

Simply send a message to the bot:

- **URLs** (starting with `http://` or `https://`) - The article is extracted and sent to your Kindle
- **Plain text** - The text is converted and sent to your Kindle

Both use your selected Kindle email (or the default one).

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Telegram  │────▶│  Bot Server │────▶│   API       │
│   User      │◀────│  (Telegraf) │◀────│  (Elysia)   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Local     │
                    │   Storage   │
                    │  (sessions) │
                    └─────────────┘
```

### How It Works

1. User authenticates via `/login` with email + password
2. Bot calls the API's Better Auth endpoint to get a session cookie
3. Session is stored locally (JSON file) mapped to Telegram user ID
4. Subsequent requests use the stored cookie to authenticate with the API
5. Content (URLs or text) is sent to the API's extractor endpoints
6. API processes content and sends it to the user's selected Kindle email

## Project Structure

```
packages/telegram/
├── src/
│   ├── index.ts      # Bot entrypoint and command handlers
│   ├── api.ts        # API client for Better Auth and Bettersent API
│   └── storage.ts    # Local JSON session storage
├── test/
│   ├── api.test.ts   # API client tests
│   ├── storage.test.ts # Storage module tests
│   └── utils.test.ts # Utility function tests
├── data/             # Session storage (gitignored)
├── package.json
└── tsconfig.json
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BOT_TOKEN` | Telegram bot token from @BotFather | (required) |
| `API_URL` | Bettersent API URL | `http://localhost:8080` |

## Development

```bash
# Start in development mode (with auto-reload)
bun run dev

# Start in production mode
bun run start

# Run tests
bun test
```

## Deployment

The bot can be deployed to Railway using the provided Dockerfile:

```bash
# Using Railway CLI
./infra/scripts/deploy-telegram.sh
```

Required Railway environment variables:
- `BOT_TOKEN` - Your Telegram bot token
- `API_URL` - Your deployed API URL (e.g., `https://kindle-api-production.up.railway.app`)

## Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test test/api.test.ts
```

Tests cover:
- **Storage module** - Session CRUD operations and persistence
- **API module** - Authentication, Kindle email management, content extraction
- **Utilities** - URL detection, email validation
