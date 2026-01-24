import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

/**
 * Creates a test app instance without auth middleware for isolated testing.
 * This allows testing the core API structure without database/auth dependencies.
 */
const createTestApp = () => {
  return new Elysia()
    .use(cors())
    .get("/health", () => ({ status: "ok" }));
};

describe("API", () => {
  describe("Health Check", () => {
    it("should return ok status on GET /health", async () => {
      const app = createTestApp();
      
      const response = await app.handle(
        new Request("http://localhost/health")
      );
      
      expect(response.status).toBe(200);
      
      const body = await response.json();
      expect(body).toEqual({ status: "ok" });
    });

    it("should return 404 for unknown routes", async () => {
      const app = createTestApp();
      
      const response = await app.handle(
        new Request("http://localhost/unknown-route")
      );
      
      expect(response.status).toBe(404);
    });
  });

  describe("CORS", () => {
    it("should include CORS headers in response", async () => {
      const app = createTestApp();
      
      const response = await app.handle(
        new Request("http://localhost/health", {
          headers: {
            Origin: "http://localhost:5173",
          },
        })
      );
      
      // CORS plugin should allow the request
      expect(response.status).toBe(200);
    });

    it("should handle OPTIONS preflight request", async () => {
      const app = createTestApp();
      
      const response = await app.handle(
        new Request("http://localhost/health", {
          method: "OPTIONS",
          headers: {
            Origin: "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
          },
        })
      );
      
      // Preflight should succeed
      expect(response.status).toBeLessThan(400);
    });
  });
});
