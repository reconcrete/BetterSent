import { db } from "../../db";
import { user, subscription } from "@bettersent/db/schema";
import { eq } from "drizzle-orm";
import { log } from "../../lib/logger";

export const getProfile = async (userId: string) => {
  log.debug({ userId }, "Fetching user profile");

  const [userData] = await db.select().from(user).where(eq(user.id, userId));

  if (!userData) {
    throw new Error("User not found");
  }

  const plan = await getUserPlan(userId);

  log.debug({ userId }, "User profile retrieved");

  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    createdAt: userData.createdAt.toISOString(),
    onboarded: userData.onboarded,
    plan,
  };
};

const getUserPlan = async (userId: string): Promise<"free" | "pro"> => {
  const sub = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  return sub?.status === "active" ? "pro" : "free";
};

export const updateProfile = async (userId: string, data: { name?: string }) => {
  log.debug({ userId }, "Updating user profile");

  const [updatedUser] = await db
    .update(user)
    .set({ name: data.name, updatedAt: new Date() })
    .where(eq(user.id, userId))
    .returning();

  if (!updatedUser) {
    throw new Error("User not found");
  }

  const plan = await getUserPlan(userId);

  log.debug({ userId }, "User profile updated");

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    createdAt: updatedUser.createdAt.toISOString(),
    onboarded: updatedUser.onboarded,
    plan,
  };
};

export const markOnboarded = async (userId: string) => {
  log.debug({ userId }, "Marking user as onboarded");

  const [updatedUser] = await db
    .update(user)
    .set({ onboarded: true, updatedAt: new Date() })
    .where(eq(user.id, userId))
    .returning();

  if (!updatedUser) {
    throw new Error("User not found");
  }

  const plan = await getUserPlan(userId);

  log.debug({ userId }, "User marked as onboarded");

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    createdAt: updatedUser.createdAt.toISOString(),
    onboarded: updatedUser.onboarded,
    plan,
  };
};
