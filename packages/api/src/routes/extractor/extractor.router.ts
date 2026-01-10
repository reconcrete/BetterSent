import Elysia from "elysia";
import { logger } from "@bogeychan/elysia-logger";

import { extractTextInputSchema, extractUrlInputSchema, extractOutputSchema } from "./extractor.schema";

import { extractText, extractUrl } from "./extractor.service";

import { authMiddleware } from "../../lib/auth";

export const extractorRouter = new Elysia({ prefix: "/extract" })
  .use(authMiddleware)
  .post(
    "/text",
    async ({ body, set }) => {
      try {
        const data = await extractText(body.textContent);
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
    { body: extractTextInputSchema, response: extractOutputSchema }
  )
  .post(
    "/url",
    async ({ body, set }) => {
      try {
        const data = await extractUrl(body.url);
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
    { body: extractUrlInputSchema, response: extractOutputSchema }
  );
