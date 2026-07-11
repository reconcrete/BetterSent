# @bettersent/cli

`bettersent` — send content to your Kindle from the terminal.

## Usage

```bash
bettersent --url https://example.com/article    # Send a web page
bettersent --file ./book.epub                   # Send a file
bettersent --youtube https://youtu.be/abc123    # Send a YouTube video

bettersent --url https://example.com --choose-device   # Pick the target device

bettersent login     # Sign in from this machine
bettersent logout    # Sign out of this machine
bettersent setup     # Add or edit your Kindle devices
```

Without `--choose-device`, content goes to your default device.

## Auth

`bettersent login` uses an OAuth 2.0 style device authorization grant, like `vercel login`:

1. The CLI asks the API for a device code and prints a short user code (e.g. `LFMT-RNMG`).
2. It opens `<web>/device?user_code=LFMT-RNMG` in your browser.
3. You sign in (if needed), check that the code matches, and confirm.
4. The CLI, which has been polling, receives an access token and stores it in
   `~/.config/bettersent/config.json` (mode `600`).

`bettersent logout` revokes the token server-side and deletes the local file.

## Development

```bash
bun run --filter @bettersent/cli start -- --help   # Run against BETTERSENT_API_URL
bun run --filter @bettersent/cli test
```

| Env var | Default | Description |
|---|---|---|
| `BETTERSENT_API_URL` | `https://bettersent-api-production.up.railway.app` | API to talk to |
| `BETTERSENT_CONFIG_DIR` | `~/.config/bettersent` | Where the access token is stored |

The API needs `WEB_APP_URL` (falls back to `CORS_ORIGIN`) set to the web app's origin so it can
build the verification link the CLI opens.
