import Elysia from "elysia";

import {
  extractTextInputSchema,
  extractUrlInputSchema,
  extractYoutubeInputSchema,
  extractTopicInputSchema,
  extractFileInputSchema,
  extractTestInputSchema,
  extractAcceptedSchema,
} from "./extractor.schema";
import { extractText, extractUrl, extractYoutube, extractTopic, extractFile, sendTestEpub } from "./extractor.service";
import { authMiddleware } from "../../lib/auth";
import { log } from "../../lib/logger";
import { checkAndIncrementUsage } from "../billing/billing.service";
import { UsageLimitError, FeatureLockedError } from "../billing/billing.errors";
import { KindleEmailNotConfiguredError } from "./extractor.errors";

export const extractorRouter = new Elysia({ prefix: "/extract" })
  .use(authMiddleware)
  .post(
    "/text",
    async ({ body, set, user }) => {
      try {
        await checkAndIncrementUsage(user.id, "text");
        const data = await extractText(body.textContent, user.id, body.kindleEmailId);
        return { success: true, data };
      } catch (error) {
        if (error instanceof KindleEmailNotConfiguredError) {
          set.status = 400;
          return { success: false, error: error.message };
        }
        if (error instanceof UsageLimitError) {
          set.status = 429;
          return { success: false, error: error.message };
        }
        log.error({ error }, "Extraction error");
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { auth: true, body: extractTextInputSchema, response: extractAcceptedSchema }
  )
  .post(
    "/url",
    async ({ body, set, user }) => {
      try {
        const normalized = body.url.trim().toLowerCase();
        if (normalized.includes("youtube.com/") || normalized.includes("youtu.be/")) {
          set.status = 400;
          return { success: false, error: "YouTube links should be sent through the YouTube tab." };
        }
        await checkAndIncrementUsage(user.id, "url");
        const data = await extractUrl(body.url, user.id, body.kindleEmailId);
        return { success: true, data };
      } catch (error) {
        if (error instanceof KindleEmailNotConfiguredError) {
          set.status = 400;
          return { success: false, error: error.message };
        }
        if (error instanceof UsageLimitError) {
          set.status = 429;
          return { success: false, error: error.message };
        }
        log.error({ error }, "Extraction error");
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { auth: true, body: extractUrlInputSchema, response: extractAcceptedSchema }
  )
  .post(
    "/youtube",
    async ({ body, set, user }) => {
      try {
        await checkAndIncrementUsage(user.id, "youtube");
        const data = await extractYoutube(body.url, user.id, body.kindleEmailId);
        return { success: true, data };
      } catch (error) {
        if (error instanceof KindleEmailNotConfiguredError) {
          set.status = 400;
          return { success: false, error: error.message };
        }
        if (error instanceof FeatureLockedError) {
          set.status = 403;
          return { success: false, error: error.message };
        }
        if (error instanceof UsageLimitError) {
          set.status = 429;
          return { success: false, error: error.message };
        }
        log.error({ error }, "YouTube extraction error");
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { auth: true, body: extractYoutubeInputSchema, response: extractAcceptedSchema }
  )
  .post(
    "/topic",
    async ({ body, set, user }) => {
      try {
        await checkAndIncrementUsage(user.id, "topic");
        const data = await extractTopic(body.topic, user.id, body.kindleEmailId);
        return { success: true, data };
      } catch (error) {
        if (error instanceof KindleEmailNotConfiguredError) {
          set.status = 400;
          return { success: false, error: error.message };
        }
        if (error instanceof FeatureLockedError) {
          set.status = 403;
          return { success: false, error: error.message };
        }
        if (error instanceof UsageLimitError) {
          set.status = 429;
          return { success: false, error: error.message };
        }
        log.error({ error }, "Topic generation error");
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { auth: true, body: extractTopicInputSchema, response: extractAcceptedSchema }
  )
  .post(
    "/file",
    async ({ body, set, user }) => {
      try {
        await checkAndIncrementUsage(user.id, "file");
        const data = await extractFile(body.file, user.id, body.kindleEmailId);
        return { success: true, data };
      } catch (error) {
        if (error instanceof KindleEmailNotConfiguredError) {
          set.status = 400;
          return { success: false, error: error.message };
        }
        if (error instanceof UsageLimitError) {
          set.status = 429;
          return { success: false, error: error.message };
        }
        log.error({ error }, "File send error");
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { auth: true, body: extractFileInputSchema, response: extractAcceptedSchema }
  )
  .post(
    "/test",
    async ({ body, set, user }) => {
      try {
        const data = await sendTestEpub(user.id, body.kindleEmailId);
        return { success: true, data };
      } catch (error) {
        if (error instanceof KindleEmailNotConfiguredError) {
          set.status = 400;
          return { success: false, error: error.message };
        }
        log.error({ error }, "Test send error");
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { auth: true, body: extractTestInputSchema, response: extractAcceptedSchema }
  );
