import Elysia from "elysia";
import { logger } from "@bogeychan/elysia-logger";

import { extractTextInputSchema, extractUrlInputSchema, extractOutputSchema } from "./extractor.schema";

import { extractText, extractUrl } from "./extractor.service";

import { authMiddleware } from "../../lib/auth";

export const extractorRouter = new Elysia({ prefix: "/extract" })
  .use(authMiddleware)
  .post(
    "/text",
    async ({ body, set, user }) => {
      try {
        const data = await extractText(body.textContent, user.id, body.kindleEmailId);
        return { success: true, data };
      } catch (error) {
        console.error("❌ Extraction error:", error);
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
        console.error("❌ Extraction error:", error);
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { auth: true, body: extractUrlInputSchema, response: extractOutputSchema }
  );
