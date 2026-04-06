/**
 * Grant a Pro subscription to a user by email.
 *
 * Usage:
 *   DATABASE_URL=<prod-url> bun apps/api/src/scripts/grant-subscription.ts <email>
 */

import { eq } from "drizzle-orm";
import { createDb } from "@bettersent/db";
import { user, subscription } from "@bettersent/db/schema";

const email = process.argv[2];
if (!email) {
  console.error("Usage: bun apps/api/src/scripts/grant-subscription.ts <email>");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const db = createDb(connectionString);

const found = await db
  .select({ id: user.id, name: user.name, email: user.email })
  .from(user)
  .where(eq(user.email, email))
  .limit(1)
  .then((rows) => rows[0]);

if (!found) {
  console.error(`User not found: ${email}`);
  process.exit(1);
}

console.log(`Found user: ${found.name} (${found.id})`);

const now = new Date();
const periodEnd = new Date(now);
periodEnd.setFullYear(periodEnd.getFullYear() + 10);

const existing = await db
  .select()
  .from(subscription)
  .where(eq(subscription.userId, found.id))
  .limit(1)
  .then((rows) => rows[0]);

if (existing) {
  await db
    .update(subscription)
    .set({
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    })
    .where(eq(subscription.userId, found.id));

  console.log(`Updated existing subscription to active (expires ${periodEnd.toISOString()})`);
} else {
  await db.insert(subscription).values({
    id: crypto.randomUUID(),
    userId: found.id,
    stripeCustomerId: `manual_${found.id}`,
    status: "active",
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
  });

  console.log(`Created new subscription (expires ${periodEnd.toISOString()})`);
}

process.exit(0);
