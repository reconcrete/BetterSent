import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type CliConfig = {
  apiUrl: string;
  token: string;
};

const PROD_API_URL = "https://api.bettersent.com";

const configDir = () =>
  join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "bettersent");

const configPath = () => join(configDir(), "config.json");

/** API base URL: env override > stored config (set at login) > production. */
export const getApiUrl = (): string =>
  process.env.BETTERSENT_API_URL || readConfig()?.apiUrl || PROD_API_URL;

export const readConfig = (): CliConfig | null => {
  try {
    const raw = readFileSync(configPath(), "utf-8");
    const parsed = JSON.parse(raw);
    if (typeof parsed?.apiUrl === "string" && typeof parsed?.token === "string") {
      return parsed as CliConfig;
    }
    return null;
  } catch {
    return null;
  }
};

/** The token is a bearer credential — keep the file readable only by the owner. */
export const writeConfig = (config: CliConfig): void => {
  mkdirSync(configDir(), { recursive: true, mode: 0o700 });
  writeFileSync(configPath(), `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  chmodSync(configPath(), 0o600);
};

export const deleteConfig = (): void => {
  if (existsSync(configPath())) {
    rmSync(configPath());
  }
};
