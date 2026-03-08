import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const kindleEmailAddress = pgTable(
  "kindle_email_address",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    label: text("label"), // Optional friendly name like "My Kindle Paperwhite"
    isDefault: boolean("is_default").default(false).notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("kindle_email_address_userId_idx").on(table.userId),
  ]
);

export const kindleEmailAddressRelations = relations(kindleEmailAddress, ({ one }) => ({
  user: one(user, {
    fields: [kindleEmailAddress.userId],
    references: [user.id],
  }),
}));

// Send history table to track content sent to Kindle
export const sendHistory = pgTable(
  "send_history",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // "url" | "text" | "file"
    content: text("content").notNull(), // URL or text snippet (truncated for display)
    title: text("title"), // Extracted title from content
    author: text("author"), // Extracted author from content
    status: text("status").notNull().default("pending"), // "pending" | "processing" | "completed" | "error"
    errorMessage: text("error_message"), // Error details if status is "error"
    kindleEmailId: text("kindle_email_id").references(() => kindleEmailAddress.id, {
      onDelete: "set null",
    }),
    kindleEmail: text("kindle_email"), // Store email directly for display even if kindle deleted
    markdownPath: text("markdown_path"), // Path/key to the stored .md file
    epubPath: text("epub_path"), // Path/key to the stored .epub file
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("send_history_userId_idx").on(table.userId),
    index("send_history_createdAt_idx").on(table.createdAt),
  ]
);

export const sendHistoryRelations = relations(sendHistory, ({ one }) => ({
  user: one(user, {
    fields: [sendHistory.userId],
    references: [user.id],
  }),
  kindleEmailAddress: one(kindleEmailAddress, {
    fields: [sendHistory.kindleEmailId],
    references: [kindleEmailAddress.id],
  }),
}));
