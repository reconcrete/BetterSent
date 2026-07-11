import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { user } from "./auth";

// Pending device authorization grants (OAuth 2.0 device flow) started by `bettersent login`.
// Rows are short-lived: the CLI exchanges them for a token and they are deleted.
export const cliDeviceCode = pgTable(
  "cli_device_code",
  {
    id: text("id").primaryKey(),
    deviceCode: text("device_code").notNull().unique(), // Secret held by the CLI, used for polling
    userCode: text("user_code").notNull().unique(), // Short code shown in the terminal, e.g. "LFMT-RNMG"
    hostname: text("hostname"), // Machine asking to log in, shown on the approval screen
    status: text("status").notNull().default("pending"), // "pending" | "approved" | "denied"
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    issuedToken: text("issued_token"), // Plaintext token, handed to the CLI once then cleared
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("cli_device_code_userCode_idx").on(table.userCode)]
);

export const cliDeviceCodeRelations = relations(cliDeviceCode, ({ one }) => ({
  user: one(user, {
    fields: [cliDeviceCode.userId],
    references: [user.id],
  }),
}));

// Long-lived CLI access tokens. Only the SHA-256 hash is stored.
export const cliToken = pgTable(
  "cli_token",
  {
    id: text("id").primaryKey(),
    tokenHash: text("token_hash").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    label: text("label"), // Machine the CLI logged in from, e.g. "antons-macbook"
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("cli_token_userId_idx").on(table.userId)]
);

export const cliTokenRelations = relations(cliToken, ({ one }) => ({
  user: one(user, {
    fields: [cliToken.userId],
    references: [user.id],
  }),
}));
