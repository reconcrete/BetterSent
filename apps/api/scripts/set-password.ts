/**
 * Set (or reset) the email + password login for an existing user.
 *
 * Sign-up through the API is disabled, so this is the only way a password gets
 * attached to an account. The user must already exist (signed in once with
 * Google or a magic link). Hashing goes through better-auth itself, so the hash
 * format always matches what sign-in checks against.
 *
 * Usage (inside the API container, which has DATABASE_URL and the auth env):
 *   docker exec -it bettersent-api bun apps/api/scripts/set-password.ts <email> [password]
 *
 * With no password argument a random one is generated and printed once.
 */

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { user } from "@bettersent/db/schema";

import { auth } from "../src/lib/auth";
import { db } from "../src/db";

const [email, given] = process.argv.slice(2);
if (!email) {
  console.error("Usage: bun apps/api/scripts/set-password.ts <email> [password]");
  process.exit(1);
}

const password = given ?? randomBytes(18).toString("base64url");
if (password.length < 8) {
  console.error("Password must be at least 8 characters");
  process.exit(1);
}

const found = await db.query.user.findFirst({ where: eq(user.email, email) });
if (!found) {
  console.error(`No user with email ${email}`);
  process.exit(1);
}

const ctx = await auth.$context;
const hash = await ctx.password.hash(password);
const accounts = await ctx.internalAdapter.findAccounts(found.id);

if (accounts.some((a) => a.providerId === "credential")) {
  await ctx.internalAdapter.updatePassword(found.id, hash);
} else {
  await ctx.internalAdapter.createAccount({
    userId: found.id,
    accountId: found.id,
    providerId: "credential",
    password: hash,
  });
}

console.log(`Password set for ${email}`);
if (!given) console.log(`Password: ${password}`);
process.exit(0);
