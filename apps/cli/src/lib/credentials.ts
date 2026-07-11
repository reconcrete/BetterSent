import { mkdir, chmod, unlink } from "node:fs/promises";

import { CONFIG_DIR, CONFIG_PATH } from "../config";

export type Credentials = {
  token: string;
  email: string;
  name: string;
};

export async function readCredentials(): Promise<Credentials | null> {
  const file = Bun.file(CONFIG_PATH);
  if (!(await file.exists())) return null;

  try {
    const parsed = (await file.json()) as Partial<Credentials>;
    if (!parsed.token) return null;
    return { token: parsed.token, email: parsed.email ?? "", name: parsed.name ?? "" };
  } catch {
    // A corrupt config file should read as "not logged in" rather than crash the CLI.
    return null;
  }
}

export async function writeCredentials(credentials: Credentials): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await Bun.write(CONFIG_PATH, JSON.stringify(credentials, null, 2));
  // The token is a bearer credential — keep it out of reach of other users on the machine.
  await chmod(CONFIG_PATH, 0o600);
}

export async function clearCredentials(): Promise<void> {
  try {
    await unlink(CONFIG_PATH);
  } catch {
    // Already gone — nothing to do.
  }
}
