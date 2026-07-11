import * as p from "@clack/prompts";
import color from "picocolors";

import { readCredentials, type Credentials } from "./credentials";

/** Returns the stored credentials, or tells the user to log in first and returns null. */
export async function requireCredentials(): Promise<Credentials | null> {
  const credentials = await readCredentials();

  if (!credentials) {
    p.cancel(`You're not logged in. Run ${color.cyan("bettersent login")} first.`);
    return null;
  }

  return credentials;
}
