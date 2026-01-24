import { db } from "../../db";
import { user } from "../../db/schema";
import { eq } from "drizzle-orm";

export const getProfile = async (userId: string) => {
  console.log("📥 [getProfile] Fetching user profile for:", userId);

  const [userData] = await db.select().from(user).where(eq(user.id, userId));

  if (!userData) {
    throw new Error("User not found");
  }

  console.log("✅ [getProfile] User profile retrieved");

  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    createdAt: userData.createdAt.toISOString(),
  };
};

export const updateProfile = async (userId: string, data: { name?: string }) => {
  console.log("📥 [updateProfile] Updating user profile for:", userId);

  const [updatedUser] = await db
    .update(user)
    .set({ name: data.name, updatedAt: new Date() })
    .where(eq(user.id, userId))
    .returning();

  if (!updatedUser) {
    throw new Error("User not found");
  }

  console.log("✅ [updateProfile] User profile updated");

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    createdAt: updatedUser.createdAt.toISOString(),
  };
};
