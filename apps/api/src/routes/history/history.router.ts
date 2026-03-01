import Elysia from "elysia";

import { historyArrayOutputSchema } from "./history.schema";
import { getSendHistory } from "./history.service";
import { authMiddleware } from "../../lib/auth";
import { log } from "../../lib/logger";

export const historyRouter = new Elysia({ prefix: "/history" })
  .use(authMiddleware)
  // Get all send history for the user
  .get(
    "/",
    async ({ user, set }) => {
      try {
        const data = await getSendHistory(user.id);
        return { success: true, data };
      } catch (error) {
        log.error({ error }, "Get send history error");
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { auth: true, response: historyArrayOutputSchema }
  );
