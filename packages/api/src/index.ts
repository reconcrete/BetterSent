import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";

import { scrapeUrl, extractContent, saveMarkdown } from "./services";

const app = new Elysia()
  .use(cors())
  .post(
    "/process",
    async ({ body, set }) => {
      try {
        let textContent: string;
        let source: string | undefined;

        // Get content based on input type
        if (body.type === "url") {
          source = body.content;
          console.log(`📥 Scraping URL: ${source}`);
          textContent = await scrapeUrl(body.content);
          console.log(`📄 Extracted ${textContent.length} characters from URL`);
        } else {
          textContent = body.content;
          console.log(`📄 Processing text input: ${textContent.length} characters`);
        }

        // Extract key information using LLM
        console.log("🤖 Sending to OpenAI for extraction...");
        const markdown = await extractContent(textContent);
        console.log(`✅ Received ${markdown.length} characters from OpenAI`);

        // Save to file
        const { filename, savedAt } = await saveMarkdown(markdown, source);
        console.log(`💾 Saved to: ${filename}`);

        return {
          success: true,
          markdown,
          filename,
          savedAt,
        };
      } catch (error) {
        console.error("❌ Extraction error:", error);
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    {
      body: t.Object({
        type: t.Union([t.Literal("url"), t.Literal("text")]),
        content: t.String({ minLength: 1 }),
      }),
      response: {
        200: t.Object({
          success: t.Literal(true),
          markdown: t.String(),
          filename: t.String(),
          savedAt: t.String(),
        }),
        500: t.Object({
          success: t.Literal(false),
          error: t.String(),
        }),
      },
    }
  )
  .post(
    "/process/text",
    async ({ body, set }) => {
      try {
        console.log(`📄 Processing text input: ${body.content.length} characters`);

        // Extract key information using LLM
        console.log("🤖 Sending to OpenAI for extraction...");
        const markdown = await extractContent(body.content);
        console.log(`✅ Received ${markdown.length} characters from OpenAI`);

        // Save to file
        const { filename, savedAt } = await saveMarkdown(markdown);
        console.log(`💾 Saved to: ${filename}`);

        return {
          success: true,
          markdown,
          filename,
          savedAt,
        };
      } catch (error) {
        console.error("❌ Extraction error:", error);
        set.status = 500;
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    {
      body: t.Object({
        content: t.String({ minLength: 1 }),
      }),
      response: {
        200: t.Object({
          success: t.Literal(true),
          markdown: t.String(),
          filename: t.String(),
          savedAt: t.String(),
        }),
        500: t.Object({
          success: t.Literal(false),
          error: t.String(),
        }),
      },
    }
  )
  .listen(process.env.PORT || 8080);

console.log(`🦊 Content Extractor API running at ${app.server?.hostname}:${app.server?.port}`);

export type Api = typeof app;
