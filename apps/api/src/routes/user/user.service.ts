import { db } from "../../db";
import { user } from "@bettersent/db/schema";
import { eq } from "drizzle-orm";
import { log } from "../../lib/logger";

export const getProfile = async (userId: string) => {
  log.debug({ userId }, "Fetching user profile");

  const [userData] = await db.select().from(user).where(eq(user.id, userId));

  if (!userData) {
    throw new Error("User not found");
  }

  log.debug({ userId }, "User profile retrieved");

  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    createdAt: userData.createdAt.toISOString(),
  };
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

  log.debug({ userId }, "User profile updated");

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    createdAt: updatedUser.createdAt.toISOString(),
  };
};
