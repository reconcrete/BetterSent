import * as p from "@clack/prompts";
import color from "picocolors";

import { logout as revokeToken } from "../api/client";
import { clearCredentials, readCredentials } from "../lib/credentials";

export async function logout(): Promise<number> {
  p.intro(color.bgCyan(color.black(" bettersent logout ")));

  const credentials = await readCredentials();
  if (!credentials) {
    p.outro("You're not logged in.");
    return 0;
  }

  const revoked = await revokeToken(credentials.token);
  // The local token is dropped either way — a server-side failure shouldn't leave it on disk.
  await clearCredentials();

  if (!revoked.success && revoked.status !== 401) {
    p.log.warn(`Could not revoke the token on the server: ${revoked.error}`);
  }

  p.outro(`Logged out ${color.cyan(credentials.email)}.`);
  return 0;
}
