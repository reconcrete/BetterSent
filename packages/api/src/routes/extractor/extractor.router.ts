import Elysia from "elysia";

import {
  extractTextInputSchema,
  extractUrlInputSchema,
  extractFileInputSchema,
  extractOutputSchema,
  extractFileOutputSchema,
} from "./extractor.schema";
import { extractText, extractUrl, sendFile } from "./extractor.service";
import { authMiddleware } from "../../lib/auth";
import { log } from "../../lib/logger";

export const extractorRouter = new Elysia({ prefix: "/extract" })
  .use(authMiddleware)
  .post(
    "/text",
    async ({ body, set, user }) => {
      try {
        const data = await extractText(body.textContent, user.id, body.kindleEmailId);
        return { success: true, data };
      } catch (error) {
        log.error({ error }, "Extraction error");
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { auth: true, body: extractTextInputSchema, response: extractOutputSchema }
  )
  .post(
    "/url",
    async ({ body, set, user }) => {
      try {
        const data = await extractUrl(body.url, user.id, body.kindleEmailId);
        return { success: true, data };
      } catch (error) {
        log.error({ error }, "Extraction error");
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { auth: true, body: extractUrlInputSchema, response: extractOutputSchema }
  )
  .post(
    "/file",
    async ({ body, set, user }) => {
      try {
        const data = await sendFile(body.file, user.id, body.kindleEmailId);
        return { success: true, data };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        const isValidationError = message.startsWith("Unsupported file type");
        log.error({ error }, "File send error");
        set.status = isValidationError ? 400 : 500;
        return { success: false, error: message };
      }
    },
    { auth: true, body: extractFileInputSchema, response: extractFileOutputSchema }
  );
