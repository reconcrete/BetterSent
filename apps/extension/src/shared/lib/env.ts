const PROD_API_URL = "https://api.bettersent.com";
const PROD_WEB_URL = "https://app.bettersent.com";

// Production builds always target production (a stray .env.local must not leak
// localhost URLs into a store zip); VITE_* overrides apply to dev builds only.
export const API_URL = import.meta.env.PROD
  ? PROD_API_URL
  : import.meta.env.VITE_API_URL || "http://localhost:8080";

export const WEB_URL = import.meta.env.PROD
  ? PROD_WEB_URL
  : import.meta.env.VITE_WEB_URL || "http://localhost:5173";

export const SIGN_IN_URL = `${WEB_URL}/sign-in`;
export const SETTINGS_URL = `${WEB_URL}/settings`;
export const HISTORY_URL = `${WEB_URL}/history`;
