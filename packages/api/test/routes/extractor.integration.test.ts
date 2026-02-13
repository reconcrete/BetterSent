import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { scrapeUrl } from "../../src/services/scraper";
import { extractContent, extractMarkdown, extractMetadata } from "../../src/services/extractor";
import {
  extractTextInputSchema,
  extractUrlInputSchema,
  extractOutputSchema,
} from "../../src/routes/extractor/extractor.schema";
import * as extractorService from "../../src/routes/extractor/extractor.service";

/**
 * Integration test for the URL extraction pipeline.
 *
 * Usage:
 *   1. Set TEST_URL below to whatever URL you want to debug.
 *   2. Run:  bun test test/routes/extractor.integration.test.ts
 *      Or with OpenAI steps:
 *            OPENAI_API_KEY=sk-... bun test test/routes/extractor.integration.test.ts
 *
 * Each step of the pipeline is tested independently so you can see
 * exactly which step fails and why. The tests are ordered to match
 * the real pipeline: fetch → scrape HTML → extract markdown → extract metadata.
 *
 * The final step tests through the Elysia router using app.handle(),
 * following Elysia's recommended testing pattern.
 */

// ====================================================================
// CHANGE THIS URL TO DEBUG ANY LINK
// ====================================================================
const TEST_URL = "https://www.lynalden.com/february-2026-newsletter/";
// ====================================================================

/**
 * Creates an Elysia app with mock auth but real extractor services,
 * following the Elysia testing pattern: https://elysiajs.com/patterns/unit-test
 */
const createIntegrationApp = () => {
  const mockAuthMiddleware = new Elysia({ name: "mock-auth-middleware" }).macro({
    auth: {
      async resolve() {
        return {
          user: { id: "test-user-integration" },
          session: { id: "test-session-integration" },
        };
      },
    },
  });

  return new Elysia().use(mockAuthMiddleware).post(
    "/extract/url",
    async ({ body, set }) => {
      try {
        // Call scrapeUrl + extractContent directly (skip DB/email)
        const textContent = await scrapeUrl(body.url);
        const { markdown, metadata } = await extractContent(textContent);
        return {
          success: true as const,
          data: {
            markdown,
            filename: `${metadata.title}.epub`,
            savedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false as const,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        };
      }
    },
    { body: extractUrlInputSchema }
  );
};

// Shared state so later steps can reuse output from earlier steps
let scrapedText: string | null = null;

describe(`Integration: extract pipeline for ${TEST_URL}`, () => {
  // ------------------------------------------------------------------
  // Step 1a: Raw HTTP fetch — diagnose network/HTTP-level issues
  // ------------------------------------------------------------------
  describe("Step 1a — raw HTTP fetch", () => {
    it("should fetch the URL and show full HTTP diagnostics", async () => {
      const response = await fetch(TEST_URL, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
        },
        redirect: "follow",
      });

      console.log("\n--- HTTP Response Diagnostics ---");
      console.log(`  Status:         ${response.status} ${response.statusText}`);
      console.log(`  Content-Type:   ${response.headers.get("content-type")}`);
      console.log(`  Content-Length:  ${response.headers.get("content-length") ?? "unknown (chunked)"}`);
      console.log(`  URL (final):    ${response.url}`);
      console.log(`  Redirected:     ${response.redirected}`);

      console.log("  Headers:");
      response.headers.forEach((value, key) => {
        console.log(`    ${key}: ${value}`);
      });

      const body = await response.text();
      console.log(`  Body length:    ${body.length} chars`);

      if (!response.ok) {
        console.log(`\n--- Response body (first 2000 chars) ---`);
        console.log(body.slice(0, 2000));
        console.log("--- end ---\n");
      } else {
        console.log(`\n--- HTML preview (first 500 chars) ---`);
        console.log(body.slice(0, 500));
        console.log("--- end ---\n");
      }

      expect(response.ok).toBe(true);
    });
  });

  // ------------------------------------------------------------------
  // Step 1b: scrapeUrl — the actual scraper function
  // ------------------------------------------------------------------
  describe("Step 1b — scrapeUrl (fetch + HTML to text)", () => {
    it("should scrapeUrl and return non-empty text", async () => {
      try {
        scrapedText = await scrapeUrl(TEST_URL);
      } catch (error) {
        console.log("\n--- scrapeUrl threw an error ---");
        console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`);
        if (error instanceof Error && error.stack) {
          console.log(`  Stack: ${error.stack}`);
        }
        console.log("--- end ---\n");
        throw error;
      }

      console.log("\n--- scrapeUrl result ---");
      console.log(`  Text length:   ${scrapedText.length} chars`);
      console.log(`  Word count:    ${scrapedText.split(/\s+/).filter(Boolean).length}`);
      console.log(`\n  First 500 chars:\n${scrapedText.slice(0, 500)}`);
      console.log(`\n  Last 300 chars:\n${scrapedText.slice(-300)}`);
      console.log("--- end ---\n");

      expect(scrapedText.length).toBeGreaterThan(0);
    });

    it("should produce text that looks like article content", () => {
      if (!scrapedText) {
        console.log("  Skipped — scrapeUrl failed in previous test");
        return;
      }

      const wordCount = scrapedText.split(/\s+/).filter(Boolean).length;
      console.log(`  Word count: ${wordCount}`);
      expect(wordCount).toBeGreaterThan(100);

      const htmlTagMatches = scrapedText.match(/<[^>]+>/g);
      const remainingTags = htmlTagMatches?.length ?? 0;
      console.log(`  Remaining HTML tags in text: ${remainingTags}`);
      expect(remainingTags).toBe(0);
    });
  });

  // ------------------------------------------------------------------
  // Step 2: Send scraped text to OpenAI for markdown + metadata
  // Skipped if OPENAI_API_KEY is not set or scraping failed.
  // ------------------------------------------------------------------
  describe("Step 2 — extractMarkdown + extractMetadata (OpenAI LLM)", () => {
    const hasKey = !!process.env.OPENAI_API_KEY;

    it.skipIf(!hasKey)(
      "should convert scraped text to markdown via OpenAI",
      async () => {
        if (!scrapedText) {
          console.log("  Skipped — scrapeUrl failed, no text to process");
          return;
        }

        console.log(`  Sending ${scrapedText.length} chars to OpenAI for markdown extraction...`);
        const startTime = Date.now();
        const markdown = await extractMarkdown(scrapedText);
        const duration = Date.now() - startTime;

        console.log(`  OpenAI responded in ${duration}ms`);
        console.log(`  Markdown length: ${markdown.length} chars`);
        console.log(`  First 500 chars of markdown:\n${markdown.slice(0, 500)}`);

        expect(markdown.length).toBeGreaterThan(0);
        expect(markdown).not.toBe("Failed to extract content");
      },
      { timeout: 120_000 }
    );

    it.skipIf(!hasKey)(
      "should extract metadata (title + author) via OpenAI",
      async () => {
        if (!scrapedText) {
          console.log("  Skipped — scrapeUrl failed, no text to process");
          return;
        }

        console.log(`  Sending ${scrapedText.length} chars to OpenAI for metadata extraction...`);
        const startTime = Date.now();
        const metadata = await extractMetadata(scrapedText);
        const duration = Date.now() - startTime;

        console.log(`  OpenAI responded in ${duration}ms`);
        console.log(`  Title:  "${metadata.title}"`);
        console.log(`  Author: "${metadata.author}"`);

        expect(metadata.title).toBeTruthy();
        expect(metadata.author).toBeTruthy();
      },
      { timeout: 120_000 }
    );
  });

  // ------------------------------------------------------------------
  // Step 3: Full pipeline through Elysia app.handle()
  // Uses mock auth but real scrapeUrl + extractContent.
  // Follows: https://elysiajs.com/patterns/unit-test
  // ------------------------------------------------------------------
  describe("Step 3 — Elysia app.handle() end-to-end", () => {
    const hasKey = !!process.env.OPENAI_API_KEY;

    it.skipIf(!hasKey)(
      "should extract URL content through the Elysia router",
      async () => {
        const app = createIntegrationApp();

        const response = await app.handle(
          new Request("http://localhost/extract/url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: TEST_URL }),
          })
        );

        const body = await response.json();

        console.log("\n--- Elysia app.handle() result ---");
        console.log(`  HTTP status: ${response.status}`);
        console.log(`  success:     ${body.success}`);

        if (body.success) {
          console.log(`  filename:    ${body.data.filename}`);
          console.log(`  savedAt:     ${body.data.savedAt}`);
          console.log(`  markdown (first 500 chars):\n${body.data.markdown?.slice(0, 500)}`);
        } else {
          console.log(`  error:       ${body.error}`);
        }
        console.log("--- end ---\n");

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.markdown.length).toBeGreaterThan(0);
      },
      { timeout: 120_000 }
    );

    it("should return 500 with error message when scraping fails", async () => {
      const app = createIntegrationApp();

      const response = await app.handle(
        new Request("http://localhost/extract/url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: "https://httpstat.us/403" }),
        })
      );

      const body = await response.json();

      console.log("\n--- Elysia error handling ---");
      console.log(`  HTTP status: ${response.status}`);
      console.log(`  success:     ${body.success}`);
      console.log(`  error:       ${body.error}`);
      console.log("--- end ---\n");

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    it("should reject invalid body via Elysia schema validation", async () => {
      const app = createIntegrationApp();

      const response = await app.handle(
        new Request("http://localhost/extract/url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: "" }),
        })
      );

      console.log(`  Schema validation status: ${response.status}`);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
