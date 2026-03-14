import { session } from "grammy";
import { eq } from "@bettersent/db";
import { db, telegramSession } from "../db";
import type { SessionData } from "../types/session";
import type { BotContext } from "../types/context";

export function sessionMiddleware() {
  return session<SessionData, BotContext>({
    initial: () => ({}),
    getSessionKey: (ctx) => ctx.chat?.id?.toString(),
    storage: {
      read: async (key) => {
        const row = await db
          .select()
          .from(telegramSession)
          .where(eq(telegramSession.key, key))
          .then((rows) => rows[0]);
        return (row?.data as SessionData) ?? undefined;
      },
      write: async (key, value) => {
        await db
          .insert(telegramSession)
          .values({ key, data: value })
          .onConflictDoUpdate({
            target: telegramSession.key,
            set: { data: value, updatedAt: new Date() },
          });
      },
      delete: async (key) => {
        await db.delete(telegramSession).where(eq(telegramSession.key, key));
      },
    },
  });
}
