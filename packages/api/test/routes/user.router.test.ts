import { describe, expect, it, beforeEach, afterEach, spyOn } from "bun:test";
import { Elysia } from "elysia";
import * as userService from "../../src/routes/user/user.service";
import { updateProfileInputSchema, userProfileOutputSchema } from "../../src/routes/user/user.schema";

// Mock return values
const mockProfileData = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  createdAt: "2024-01-01T00:00:00.000Z",
};

const mockUpdatedProfileData = {
  id: "user-123",
  email: "test@example.com",
  name: "Updated Name",
  createdAt: "2024-01-01T00:00:00.000Z",
};

// Helper to create test router with mock auth
const createTestUserRouter = (isAuthenticated: boolean, userId: string = "user-123") => {
  const mockAuthMiddleware = new Elysia({ name: 'mock-auth-middleware' })
    .macro({
      auth: {
        async resolve({ status }) {
          if (!isAuthenticated) {
            return status(401);
          }
          return {
            user: { id: userId },
            session: { id: "session-123" },
          };
        },
      },
    });

  return new Elysia({ prefix: "/user" })
    .use(mockAuthMiddleware)
    .get(
      "/me",
      async ({ user, set }) => {
        try {
          const data = await userService.getProfile(user.id);
          return { success: true, data };
        } catch (error) {
          console.error("❌ Get profile error:", error);
          set.status = 500;
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
          };
        }
      },
      { auth: true, response: userProfileOutputSchema }
    )
    .patch(
      "/me",
      async ({ user, body, set }) => {
        try {
          const data = await userService.updateProfile(user.id, body);
          return { success: true, data };
        } catch (error) {
          console.error("❌ Update profile error:", error);
          set.status = 500;
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
          };
        }
      },
      { auth: true, body: updateProfileInputSchema, response: userProfileOutputSchema }
    );
};

describe("User Router", () => {
  let getProfileSpy: ReturnType<typeof spyOn>;
  let updateProfileSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    getProfileSpy = spyOn(userService, "getProfile").mockResolvedValue(mockProfileData);
    updateProfileSpy = spyOn(userService, "updateProfile").mockResolvedValue(mockUpdatedProfileData);
  });

  afterEach(() => {
    getProfileSpy.mockRestore();
    updateProfileSpy.mockRestore();
  });

  describe("GET /user/me", () => {
    it("should return user profile when authenticated", async () => {
      const app = new Elysia().use(createTestUserRouter(true));

      const response = await app.handle(
        new Request("http://localhost/user/me", {
          headers: {
            Authorization: "Bearer valid-token",
          },
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        data: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      });
      expect(getProfileSpy).toHaveBeenCalledTimes(1);
      expect(getProfileSpy).toHaveBeenCalledWith("user-123");
    });

    it("should return 401 when not authenticated", async () => {
      const app = new Elysia().use(createTestUserRouter(false));

      const response = await app.handle(
        new Request("http://localhost/user/me")
      );

      expect(response.status).toBe(401);
      expect(getProfileSpy).not.toHaveBeenCalled();
    });

    it("should handle service errors gracefully", async () => {
      getProfileSpy.mockImplementationOnce(() => {
        throw new Error("User not found");
      });

      const app = new Elysia().use(createTestUserRouter(true));

      const response = await app.handle(
        new Request("http://localhost/user/me", {
          headers: {
            Authorization: "Bearer valid-token",
          },
        })
      );

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: "User not found",
      });
    });

    it("should handle unknown errors gracefully", async () => {
      getProfileSpy.mockImplementationOnce(() => {
        throw "Unknown error";
      });

      const app = new Elysia().use(createTestUserRouter(true));

      const response = await app.handle(
        new Request("http://localhost/user/me", {
          headers: {
            Authorization: "Bearer valid-token",
          },
        })
      );

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: "Unknown error occurred",
      });
    });
  });

  describe("PATCH /user/me", () => {
    it("should update user profile when authenticated with valid data", async () => {
      const app = new Elysia().use(createTestUserRouter(true));

      const response = await app.handle(
        new Request("http://localhost/user/me", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({ name: "Updated Name" }),
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        data: {
          id: "user-123",
          email: "test@example.com",
          name: "Updated Name",
          createdAt: "2024-01-01T00:00:00.000Z",
        },
      });
      expect(updateProfileSpy).toHaveBeenCalledTimes(1);
      expect(updateProfileSpy).toHaveBeenCalledWith("user-123", { name: "Updated Name" });
    });

    it("should return 401 when not authenticated", async () => {
      const app = new Elysia().use(createTestUserRouter(false));

      const response = await app.handle(
        new Request("http://localhost/user/me", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: "Updated Name" }),
        })
      );

      expect(response.status).toBe(401);
      expect(updateProfileSpy).not.toHaveBeenCalled();
    });

    it("should validate input schema - reject empty name", async () => {
      const app = new Elysia().use(createTestUserRouter(true));

      const response = await app.handle(
        new Request("http://localhost/user/me", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({ name: "" }),
        })
      );

      // Elysia should validate and return 400 for invalid schema
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(updateProfileSpy).not.toHaveBeenCalled();
    });

    it("should accept request without name (optional field)", async () => {
      const app = new Elysia().use(createTestUserRouter(true));

      const response = await app.handle(
        new Request("http://localhost/user/me", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({}),
        })
      );

      expect(response.status).toBe(200);
      expect(updateProfileSpy).toHaveBeenCalledTimes(1);
      expect(updateProfileSpy).toHaveBeenCalledWith("user-123", {});
    });

    it("should handle service errors gracefully", async () => {
      updateProfileSpy.mockImplementationOnce(() => {
        throw new Error("User not found");
      });

      const app = new Elysia().use(createTestUserRouter(true));

      const response = await app.handle(
        new Request("http://localhost/user/me", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({ name: "Updated Name" }),
        })
      );

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: "User not found",
      });
    });

    it("should handle invalid JSON body", async () => {
      const app = new Elysia().use(createTestUserRouter(true));

      const response = await app.handle(
        new Request("http://localhost/user/me", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: "invalid json",
        })
      );

      // Elysia should return 400 for invalid JSON
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(updateProfileSpy).not.toHaveBeenCalled();
    });

    it("should handle invalid request body schema", async () => {
      const app = new Elysia().use(createTestUserRouter(true));

      const response = await app.handle(
        new Request("http://localhost/user/me", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({ name: 123 }), // Invalid type
        })
      );

      // Elysia should validate and return 400 for invalid schema
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(updateProfileSpy).not.toHaveBeenCalled();
    });
  });
});
