import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const subscription = pgTable(
  "subscription",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
    stripeCustomerId: text("stripe_customer_id").notNull().unique(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    stripePriceId: text("stripe_price_id"),
    status: text("status").notNull().default("inactive"), // active | past_due | canceled | unpaid | incomplete | inactive
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("subscription_userId_idx").on(table.userId),
  ]
);

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  user: one(user, {
    fields: [subscription.userId],
    references: [user.id],
  }),
}));

export const usageRecord = pgTable(
  "usage_record",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    extractionCount: integer("extraction_count").default(0).notNull(),
    topicCount: integer("topic_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("usage_record_userId_periodStart_idx").on(table.userId, table.periodStart),
  ]
);

export const usageRecordRelations = relations(usageRecord, ({ one }) => ({
  user: one(user, {
    fields: [usageRecord.userId],
    references: [user.id],
  }),
}));
