# @bettersent/extension

Chrome (MV3) extension for sending content to your Kindle, built with [WXT](https://wxt.dev), React, Tailwind 4, and shadcn/ui.

## What it does

- **Popup** — shows the current page and a device dropdown (pre-selected to your default device from `GET /kindle`). Send calls `POST /extract/url`. The device pick applies to that send only; it never changes the account default.
- **Context menu** — one item per context ("Send page / this text / a link to my default device"); Chrome shows the one matching the click target. Links and pages go to `POST /extract/url`, selections to `POST /extract/text`. Always uses the default device. Silent on success; system notification on failure (clicking the signed-out notification opens the web app).
- YouTube URLs (`youtube.com` / `youtu.be`) auto-route to `POST /extract/youtube` in both modes.

## Auth

The extension reuses the web app's session cookie (`credentials: include` + `host_permissions` for the API origin — extension requests with host permissions are exempt from CORS and SameSite). If you're signed out, the popup shows a Sign in button that opens the web app; the context menu shows a notification.

The extension ID is pinned to `fbimedfnalioofncdcpcojjfkdfknlol` via the manifest `key` in `wxt.config.ts`, and the API appends `chrome-extension://fbimedfnalioofncdcpcojjfkdfknlol` to Better Auth's trusted origins in `apps/api/src/lib/auth.ts` — no `TRUSTED_ORIGINS` env change needed. The matching private key is in `keys/chrome-extension.pem` (gitignored; only needed if we ever package a `.crx` ourselves — the Chrome Web Store manages its own key).

## Development

```bash
bun --filter @bettersent/extension dev   # runs `wxt` — dev mode with HMR, opens a Chrome profile
bun --filter @bettersent/extension build # production build to .output/chrome-mv3
bun --filter @bettersent/extension zip   # store-ready zip in .output/
bun --filter @bettersent/extension lint  # wxt prepare + tsc --noEmit
```

Dev builds target `http://localhost:8080` (API) and `http://localhost:5173` (web); override with `VITE_API_URL` / `VITE_WEB_URL` in `.env.local`. Production builds always target `api.bettersent.com` / `app.bettersent.com` regardless of env files (see `src/shared/lib/env.ts`).

### Load unpacked

1. `bun --filter @bettersent/extension build`
2. Open `chrome://extensions`, enable Developer mode
3. "Load unpacked" → select `apps/extension/.output/chrome-mv3`
4. Verify the extension ID shown is `fbimedfnalioofncdcpcojjfkdfknlol`

Chrome Web Store submission is a separate, later task (`wxt zip` output is store-ready).

## Structure

```
src/
  entrypoints/
    background.ts    # context menu + failure notifications
    popup/           # React popup (App.tsx, style.css with web app's OKLch tokens)
  shared/
    lib/             # treaty client (Eden, typed from apps/api), env, URL routing, send helpers
    ui/              # Button, Select (copied from apps/web shadcn components)
public/icon/         # icons generated from apps/web/public/favicon.svg
```
