import Elysia, { t } from "elysia";

import {
  createKindleEmailInputSchema,
  updateKindleEmailInputSchema,
  kindleEmailOutputSchema,
  kindleEmailArrayOutputSchema,
} from "./kindle.schema";
import {
  getKindleEmails,
  getKindleEmailById,
  createKindleEmail,
  updateKindleEmail,
  deleteKindleEmail,
  setDefaultKindleEmail,
} from "./kindle.service";
import { authMiddleware } from "../../lib/auth";
import { log } from "../../lib/logger";

export const kindleRouter = new Elysia({ prefix: "/kindle" })
  .use(authMiddleware)
  // Get all Kindle email addresses for the user
  .get(
    "/",
    async ({ user, set }) => {
      try {
        const data = await getKindleEmails(user.id);
        return { success: true, data };
      } catch (error) {
        log.error({ error }, "Get Kindle emails error");
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { auth: true, response: kindleEmailArrayOutputSchema }
  )
  // Get a specific Kindle email address
  .get(
    "/:id",
    async ({ user, params, set }) => {
      try {
        const data = await getKindleEmailById(user.id, params.id);
        if (!data) {
          set.status = 404;
          return { success: false, error: "Kindle email not found" };
        }
        return { success: true, data };
      } catch (error) {
        log.error({ error }, "Get Kindle email error");
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    {
      auth: true,
      params: t.Object({ id: t.String() }),
      response: {
        ...kindleEmailOutputSchema,
        404: t.Object({
          success: t.Literal(false),
          error: t.String(),
        }),
      },
    }
  )
  // Create a new Kindle email address
  .post(
    "/",
    async ({ user, body, set }) => {
      try {
        const data = await createKindleEmail(user.id, body);
        set.status = 201;
        return { success: true, data };
      } catch (error) {
        log.error({ error }, "Create Kindle email error");
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    {
      auth: true,
      body: createKindleEmailInputSchema,
      response: {
        201: t.Object({
          success: t.Literal(true),
          data: kindleEmailOutputSchema[200].properties.data,
        }),
        500: t.Object({
          success: t.Literal(false),
          error: t.String(),
        }),
      },
    }
  )
  // Update a Kindle email address
  .patch(
    "/:id",
    async ({ user, params, body, set }) => {
      try {
        const data = await updateKindleEmail(user.id, params.id, body);
        if (!data) {
          set.status = 404;
          return { success: false, error: "Kindle email not found" };
        }
        return { success: true, data };
      } catch (error) {
        log.error({ error }, "Update Kindle email error");
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    {
      auth: true,
      params: t.Object({ id: t.String() }),
      body: updateKindleEmailInputSchema,
      response: {
        ...kindleEmailOutputSchema,
        404: t.Object({
          success: t.Literal(false),
          error: t.String(),
        }),
      },
    }
  )
  // Delete a Kindle email address
  .delete(
    "/:id",
    async ({ user, params, set }) => {
      try {
        const deleted = await deleteKindleEmail(user.id, params.id);
        if (!deleted) {
          set.status = 404;
          return { success: false, error: "Kindle email not found" };
        }
        return { success: true, data: { deleted: true } };
      } catch (error) {
        log.error({ error }, "Delete Kindle email error");
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    {
      auth: true,
      params: t.Object({ id: t.String() }),
      response: {
        200: t.Object({
          success: t.Literal(true),
          data: t.Object({ deleted: t.Boolean() }),
        }),
        404: t.Object({
          success: t.Literal(false),
          error: t.String(),
        }),
        500: t.Object({
          success: t.Literal(false),
          error: t.String(),
        }),
      },
    }
  )
  // Set a Kindle email address as default
  .patch(
    "/:id/default",
    async ({ user, params, set }) => {
      try {
        const data = await setDefaultKindleEmail(user.id, params.id);
        if (!data) {
          set.status = 404;
          return { success: false, error: "Kindle email not found" };
        }
        return { success: true, data };
      } catch (error) {
        log.error({ error }, "Set default Kindle email error");
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    {
      auth: true,
      params: t.Object({ id: t.String() }),
      response: {
        ...kindleEmailOutputSchema,
        404: t.Object({
          success: t.Literal(false),
          error: t.String(),
        }),
      },
    }
  );
