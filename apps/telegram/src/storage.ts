import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(import.meta.dir, "..", "data");
const STORAGE_FILE = join(DATA_DIR, "sessions.json");

export interface UserSession {
  cookie: string;
  kindleEmailId?: string;
  email?: string;
}

interface StorageData {
  sessions: Record<string, UserSession>;
}

// In-memory cache
let cache: StorageData = { sessions: {} };

// Ensure data directory exists
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load from disk
function load(): StorageData {
  ensureDataDir();
  try {
    if (existsSync(STORAGE_FILE)) {
      const content = readFileSync(STORAGE_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch {
    // Ignore parse errors, start fresh
  }
  return { sessions: {} };
}

// Save to disk
async function save() {
  ensureDataDir();
  await Bun.write(STORAGE_FILE, JSON.stringify(cache, null, 2));
}

// Initialize cache from disk
export function initStorage() {
  cache = load();
}

// Get session for a Telegram user
export function getSession(telegramUserId: number): UserSession | undefined {
  return cache.sessions[String(telegramUserId)];
}

// Set session for a Telegram user
export async function setSession(
  telegramUserId: number,
  session: UserSession
): Promise<void> {
  cache.sessions[String(telegramUserId)] = session;
  await save();
}

// Update session (partial update)
export async function updateSession(
  telegramUserId: number,
  updates: Partial<UserSession>
): Promise<void> {
  const existing = cache.sessions[String(telegramUserId)];
  if (existing) {
    cache.sessions[String(telegramUserId)] = { ...existing, ...updates };
    await save();
  }
}

// Delete session for a Telegram user
export async function deleteSession(telegramUserId: number): Promise<void> {
  delete cache.sessions[String(telegramUserId)];
  await save();
}

// Check if user has a session
export function hasSession(telegramUserId: number): boolean {
  return !!cache.sessions[String(telegramUserId)]?.cookie;
}
