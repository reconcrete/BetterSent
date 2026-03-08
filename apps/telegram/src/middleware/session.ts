import { session } from "grammy";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import type { SessionData } from "../types/session";
import type { BotContext } from "../types/context";

const SESSION_FILE = "data/sessions.json";

function ensureDataDir() {
  const dir = dirname(SESSION_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function readSessions(): Record<string, SessionData> {
  ensureDataDir();
  if (!existsSync(SESSION_FILE)) return {};
  try {
    return JSON.parse(readFileSync(SESSION_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeSessions(sessions: Record<string, SessionData>) {
  ensureDataDir();
  writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2));
}

export function sessionMiddleware() {
  return session<SessionData, BotContext>({
    initial: () => ({}),
    getSessionKey: (ctx) => ctx.chat?.id?.toString(),
    storage: {
      read: (key) => readSessions()[key],
      write: (key, value) => {
        const sessions = readSessions();
        sessions[key] = value;
        writeSessions(sessions);
      },
      delete: (key) => {
        const sessions = readSessions();
        delete sessions[key];
        writeSessions(sessions);
      },
    },
  });
}
