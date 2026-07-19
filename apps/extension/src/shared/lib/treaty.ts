import { treaty } from "@elysiajs/eden";
import type { Api } from "~api/index";

import { API_URL } from "./env";

// Auth reuses the web app's session cookie: host_permissions on the API origin
// exempt extension-initiated requests from CORS and SameSite restrictions.
export const api = treaty<Api>(API_URL, {
  fetch: {
    credentials: "include",
  },
});
