import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const telegramSession = pgTable("telegram_session", {
  key: text("key").primaryKey(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
