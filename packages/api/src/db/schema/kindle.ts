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
