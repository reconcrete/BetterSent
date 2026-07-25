import Elysia, { t } from "elysia";

import { historyArrayOutputSchema, historyItemOutputSchema, previewOutputSchema } from "./history.schema";
import { getSendHistory, getHistoryEntry, getHistoryEntryWithLabel, inlinePreviewImages } from "./history.service";
import { authMiddleware } from "../../lib/auth";
import { createStorageService } from "../../services/storage";
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
  )
  // Get a single history entry (used by the CLI to follow a send to completion)
  .get(
    "/:id",
    async ({ user, params, set }) => {
      try {
        const entry = await getHistoryEntryWithLabel(params.id, user.id);

        if (!entry) {
          set.status = 404;
          return { success: false, error: "History entry not found" };
        }

        return { success: true, data: entry };
      } catch (error) {
        log.error({ error, historyId: params.id }, "Get history entry error");
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
      response: historyItemOutputSchema,
    }
  )
  // Get markdown preview for a history entry
  .get(
    "/:id/preview",
    async ({ user, params, set }) => {
      try {
        const entry = await getHistoryEntry(params.id, user.id);

        if (!entry) {
          set.status = 404;
          return { success: false, error: "History entry not found" };
        }

        if (!entry.markdownPath) {
          set.status = 404;
          return { success: false, error: "No markdown preview available for this entry" };
        }

        const storageService = createStorageService();
        const buffer = await storageService.getFile(entry.markdownPath);
        const content = await inlinePreviewImages(
          buffer.toString("utf-8"),
          entry.markdownPath,
          storageService,
        );

        return {
          success: true,
          data: { content },
        };
      } catch (error) {
        log.error({ error, historyId: params.id }, "Get preview error");
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
      response: previewOutputSchema,
    }
  );
