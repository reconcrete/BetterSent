import Elysia from "elysia";

import { updateProfileInputSchema, userProfileOutputSchema } from "./user.schema";
import { getProfile, updateProfile } from "./user.service";
import { authMiddleware } from "../../lib/auth";

export const userRouter = new Elysia({ prefix: "/user" })
  .use(authMiddleware)
  .get(
    "/me",
    async ({ user, set }) => {
      try {
        const data = await getProfile(user.id);
        return { success: true, data };
      } catch (error) {
        console.error("❌ Get profile error:", error);
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { auth: true, response: userProfileOutputSchema }
  )
  .patch(
    "/me",
    async ({ user, body, set }) => {
      try {
        const data = await updateProfile(user.id, body);
        return { success: true, data };
      } catch (error) {
        console.error("❌ Update profile error:", error);
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { auth: true, body: updateProfileInputSchema, response: userProfileOutputSchema }
  );
