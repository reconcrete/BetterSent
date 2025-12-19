import Elysia from "elysia";

import { extractTextInputSchema, extractUrlInputSchema, extractOutputSchema } from "./extractor.schema";

import { extractText, extractUrl } from "./extractor.service";

export const extractorRouter = new Elysia({ prefix: "/extract" })
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
