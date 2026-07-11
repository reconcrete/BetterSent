import { homedir } from "node:os";
import { join } from "node:path";

export const API_URL = (
  process.env.BETTERSENT_API_URL || "https://bettersent-api-production.up.railway.app"
).replace(/\/$/, "");

export const CONFIG_DIR =
  process.env.BETTERSENT_CONFIG_DIR || join(homedir(), ".config", "bettersent");

export const CONFIG_PATH = join(CONFIG_DIR, "config.json");

// Extensions the API accepts on /extract/file (see extractor.service.ts)
export const SUPPORTED_FILE_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "txt",
  "rtf",
  "htm",
  "html",
  "png",
  "gif",
  "jpg",
  "jpeg",
  "bmp",
  "epub",
  "md",
  "markdown",
];
