import { describe, expect, it, beforeEach, afterEach, spyOn } from "bun:test";
import { Elysia } from "elysia";
import * as extractorService from "../../src/routes/extractor/extractor.service";
import { extractTextInputSchema, extractUrlInputSchema, extractOutputSchema } from "../../src/routes/extractor/extractor.schema";

// Mock return values
const mockExtractTextData = {
  markdown: "# Test Content\n\nThis is test markdown content.",
  metadata: {
    title: "Test Document",
    author: "Test Author",
  },
  filename: "test-document.epub",
  savedAt: "2024-01-01T00:00:00.000Z",
};

const mockExtractUrlData = {
  markdown: "# Scraped Content\n\nThis is scraped content from URL.",
  metadata: {
    title: "Scraped Document",
    author: "Unknown Author",
  },
  filename: "scraped-document.epub",
  savedAt: "2024-01-01T00:00:00.000Z",
};

// Helper to create test router with mock auth
// Note: The extractor router uses authMiddleware but doesn't require { auth: true },
// so routes are accessible without authentication. We'll test both scenarios.
const createTestExtractorRouter = (isAuthenticated: boolean = true) => {
  const mockAuthMiddleware = new Elysia({ name: 'mock-auth-middleware' })
    .macro({
      auth: {
        async resolve({ status }) {
          if (!isAuthenticated) {
            return status(401);
          }
          return {
            user: { id: "user-123" },
            session: { id: "session-123" },
          };
        },
      },
    });

  return new Elysia({ prefix: "/extract" })
    .use(mockAuthMiddleware)
    .post(
      "/text",
      async ({ body, set }) => {
        try {
          const data = await extractorService.extractText(body.textContent, "user-123");
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
          const data = await extractorService.extractUrl(body.url, "user-123");
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
};

describe("Extractor Router", () => {
  let extractTextSpy: ReturnType<typeof spyOn>;
  let extractUrlSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    extractTextSpy = spyOn(extractorService, "extractText").mockResolvedValue(mockExtractTextData);
    extractUrlSpy = spyOn(extractorService, "extractUrl").mockResolvedValue(mockExtractUrlData);
  });

  afterEach(() => {
    extractTextSpy.mockRestore();
    extractUrlSpy.mockRestore();
  });

  describe("POST /extract/text", () => {
    it("should extract text content when authenticated with valid input", async () => {
      const app = new Elysia().use(createTestExtractorRouter(true));

      const response = await app.handle(
        new Request("http://localhost/extract/text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({ textContent: "This is test content to extract." }),
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        data: {
          markdown: "# Test Content\n\nThis is test markdown content.",
          filename: "test-document.epub",
          savedAt: "2024-01-01T00:00:00.000Z",
        },
      });
      expect(extractTextSpy).toHaveBeenCalledTimes(1);
      expect(extractTextSpy).toHaveBeenCalledWith("This is test content to extract.", "user-123");
    });

    it("should work even when not authenticated (router doesn't require auth)", async () => {
      // Note: The extractor router doesn't use { auth: true }, so it doesn't check authentication
      // This test verifies the current behavior
      const app = new Elysia().use(createTestExtractorRouter(false));

      const response = await app.handle(
        new Request("http://localhost/extract/text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ textContent: "Test content" }),
        })
      );

      // Since the router doesn't use { auth: true }, it should still work
      expect(response.status).toBe(200);
      expect(extractTextSpy).toHaveBeenCalledTimes(1);
    });

    it("should validate input schema - reject empty textContent", async () => {
      const app = new Elysia().use(createTestExtractorRouter(true));

      const response = await app.handle(
        new Request("http://localhost/extract/text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({ textContent: "" }),
        })
      );

      // Elysia should validate and return 400 for invalid schema
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(extractTextSpy).not.toHaveBeenCalled();
    });

    it("should validate input schema - reject missing textContent", async () => {
      const app = new Elysia().use(createTestExtractorRouter(true));

      const response = await app.handle(
        new Request("http://localhost/extract/text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({}),
        })
      );

      // Elysia should validate and return 400 for missing required field
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(extractTextSpy).not.toHaveBeenCalled();
    });

    it("should handle service errors gracefully", async () => {
      extractTextSpy.mockImplementationOnce(() => {
        throw new Error("Extraction failed");
      });

      const app = new Elysia().use(createTestExtractorRouter(true));

      const response = await app.handle(
        new Request("http://localhost/extract/text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({ textContent: "Test content" }),
        })
      );

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: "Extraction failed",
      });
    });

    it("should handle unknown errors gracefully", async () => {
      extractTextSpy.mockImplementationOnce(() => {
        throw "Unknown error";
      });

      const app = new Elysia().use(createTestExtractorRouter(true));

      const response = await app.handle(
        new Request("http://localhost/extract/text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({ textContent: "Test content" }),
        })
      );

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: "Unknown error occurred",
      });
    });

    it("should handle invalid JSON body", async () => {
      const app = new Elysia().use(createTestExtractorRouter(true));

      const response = await app.handle(
        new Request("http://localhost/extract/text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: "invalid json",
        })
      );

      // Elysia should return 400 for invalid JSON
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(extractTextSpy).not.toHaveBeenCalled();
    });

    it("should handle long text content", async () => {
      const longText = "A".repeat(10000);
      
      const app = new Elysia().use(createTestExtractorRouter(true));

      const response = await app.handle(
        new Request("http://localhost/extract/text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({ textContent: longText }),
        })
      );

      expect(response.status).toBe(200);
      expect(extractTextSpy).toHaveBeenCalledTimes(1);
      expect(extractTextSpy).toHaveBeenCalledWith(longText, "user-123");
    });
  });

  describe("POST /extract/url", () => {
    it("should extract URL content when authenticated with valid input", async () => {
      const app = new Elysia().use(createTestExtractorRouter(true));

      const response = await app.handle(
        new Request("http://localhost/extract/url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({ url: "https://example.com/article" }),
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        data: {
          markdown: "# Scraped Content\n\nThis is scraped content from URL.",
          filename: "scraped-document.epub",
          savedAt: "2024-01-01T00:00:00.000Z",
        },
      });
      expect(extractUrlSpy).toHaveBeenCalledTimes(1);
      expect(extractUrlSpy).toHaveBeenCalledWith("https://example.com/article", "user-123");
    });

    it("should work even when not authenticated (router doesn't require auth)", async () => {
      // Note: The extractor router doesn't use { auth: true }, so it doesn't check authentication
      const app = new Elysia().use(createTestExtractorRouter(false));

      const response = await app.handle(
        new Request("http://localhost/extract/url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: "https://example.com/article" }),
        })
      );

      // Since the router doesn't use { auth: true }, it should still work
      expect(response.status).toBe(200);
      expect(extractUrlSpy).toHaveBeenCalledTimes(1);
    });

    it("should validate input schema - reject empty URL", async () => {
      const app = new Elysia().use(createTestExtractorRouter(true));

      const response = await app.handle(
        new Request("http://localhost/extract/url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({ url: "" }),
        })
      );

      // Elysia should validate and return 400 for invalid schema
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(extractUrlSpy).not.toHaveBeenCalled();
    });

    it("should validate input schema - reject missing URL", async () => {
      const app = new Elysia().use(createTestExtractorRouter(true));

      const response = await app.handle(
        new Request("http://localhost/extract/url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({}),
        })
      );

      // Elysia should validate and return 400 for missing required field
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(extractUrlSpy).not.toHaveBeenCalled();
    });

    it("should handle service errors gracefully", async () => {
      extractUrlSpy.mockImplementationOnce(() => {
        throw new Error("URL scraping failed");
      });

      const app = new Elysia().use(createTestExtractorRouter(true));

      const response = await app.handle(
        new Request("http://localhost/extract/url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({ url: "https://example.com/article" }),
        })
      );

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: "URL scraping failed",
      });
    });

    it("should handle invalid URL format", async () => {
      const app = new Elysia().use(createTestExtractorRouter(true));

      // Note: The schema only validates minLength, not URL format
      // So this should pass schema validation but might fail in service
      const response = await app.handle(
        new Request("http://localhost/extract/url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({ url: "not-a-valid-url" }),
        })
      );

      // Schema validation should pass (minLength check)
      // But we can test that the service is called
      expect(response.status).toBe(200);
      expect(extractUrlSpy).toHaveBeenCalledTimes(1);
      expect(extractUrlSpy).toHaveBeenCalledWith("not-a-valid-url", "user-123");
    });

    it("should handle invalid JSON body", async () => {
      const app = new Elysia().use(createTestExtractorRouter(true));

      const response = await app.handle(
        new Request("http://localhost/extract/url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: "invalid json",
        })
      );

      // Elysia should return 400 for invalid JSON
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(extractUrlSpy).not.toHaveBeenCalled();
    });

    it("should handle different URL formats", async () => {
      const urls = [
        "https://example.com/article",
        "http://example.com/article",
        "https://subdomain.example.com/path/to/page",
      ];

      const app = new Elysia().use(createTestExtractorRouter(true));

      for (const url of urls) {
        const response = await app.handle(
          new Request("http://localhost/extract/url", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer valid-token",
            },
            body: JSON.stringify({ url }),
          })
        );

        expect(response.status).toBe(200);
      }

      expect(extractUrlSpy).toHaveBeenCalledTimes(urls.length);
    });
  });
});
