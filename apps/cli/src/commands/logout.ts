import * as p from "@clack/prompts";
import { createAuthClient } from "better-auth/client";

import { deleteConfig, getApiUrl, readConfig } from "./../config";

export const logout = async (): Promise<void> => {
  const config = readConfig();

  if (!config) {
    p.log.message("Not logged in — nothing to do.");
    return;
  }

  // Revoke the session server-side; the bearer plugin turns the header into a session.
  const authClient = createAuthClient({ baseURL: getApiUrl() });
  try {
    await authClient.signOut({
      fetchOptions: { headers: { authorization: `Bearer ${config.token}` } },
    });
  } catch {
    // Even if revocation fails (e.g. offline), still forget the token locally.
  }

  deleteConfig();
  p.log.success("Logged out.");
};
