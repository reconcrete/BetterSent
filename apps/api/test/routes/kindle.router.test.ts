import { describe, expect, it, beforeEach, afterEach, spyOn } from "bun:test";
import { Elysia, t } from "elysia";
import * as kindleService from "../../src/routes/kindle/kindle.service";
import {
  createKindleEmailInputSchema,
  updateKindleEmailInputSchema,
  kindleEmailOutputSchema,
  kindleEmailArrayOutputSchema,
} from "../../src/routes/kindle/kindle.schema";
import { baseResponseSchema } from "../../src/shared/schemas/api";

// Mock return values
const mockKindleEmail = {
  id: "kindle-123",
  email: "test@kindle.com",
  label: "My Kindle",
  isDefault: true,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const mockKindleEmail2 = {
  id: "kindle-456",
  email: "another@kindle.com",
  label: null,
  isDefault: false,
  createdAt: "2024-01-02T00:00:00.000Z",
  updatedAt: "2024-01-02T00:00:00.000Z",
};

// Helper to create test router with mock auth
const createTestKindleRouter = (isAuthenticated: boolean, userId: string = "user-123") => {
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

  return new Elysia({ prefix: "/kindle" })
    .use(mockAuthMiddleware)
    // Get all Kindle email addresses
    .get(
      "/",
      async ({ user, set }) => {
        try {
          const data = await kindleService.getKindleEmails(user.id);
          return { success: true, data };
        } catch (error) {
          set.status = 500;
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
          };
        }
      },
      { auth: true, response: kindleEmailArrayOutputSchema }
    )
    // Get specific Kindle email
    .get(
      "/:id",
      async ({ user, params, set }) => {
        try {
          const data = await kindleService.getKindleEmailById(user.id, params.id);
          if (!data) {
            set.status = 404;
            return { success: false, error: "Kindle email not found" };
          }
          return { success: true, data };
        } catch (error) {
          set.status = 500;
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
          };
        }
      },
      {
        auth: true,
        params: t.Object({ id: t.String() }),
        response: {
          ...kindleEmailOutputSchema,
          404: t.Object({
            success: t.Literal(false),
            error: t.String(),
          }),
        },
      }
    )
    // Create Kindle email
    .post(
      "/",
      async ({ user, body, set }) => {
        try {
          const data = await kindleService.createKindleEmail(user.id, body);
          set.status = 201;
          return { success: true, data };
        } catch (error) {
          set.status = 500;
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
          };
        }
      },
      {
        auth: true,
        body: createKindleEmailInputSchema,
        response: {
          201: t.Object({
            success: t.Literal(true),
            data: kindleEmailOutputSchema[200].properties.data,
          }),
          500: t.Object({
            success: t.Literal(false),
            error: t.String(),
          }),
        },
      }
    )
    // Update Kindle email
    .patch(
      "/:id",
      async ({ user, params, body, set }) => {
        try {
          const data = await kindleService.updateKindleEmail(user.id, params.id, body);
          if (!data) {
            set.status = 404;
            return { success: false, error: "Kindle email not found" };
          }
          return { success: true, data };
        } catch (error) {
          set.status = 500;
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
          };
        }
      },
      {
        auth: true,
        params: t.Object({ id: t.String() }),
        body: updateKindleEmailInputSchema,
        response: {
          ...kindleEmailOutputSchema,
          404: t.Object({
            success: t.Literal(false),
            error: t.String(),
          }),
        },
      }
    )
    // Delete Kindle email
    .delete(
      "/:id",
      async ({ user, params, set }) => {
        try {
          const deleted = await kindleService.deleteKindleEmail(user.id, params.id);
          if (!deleted) {
            set.status = 404;
            return { success: false, error: "Kindle email not found" };
          }
          return { success: true, data: { deleted: true } };
        } catch (error) {
          set.status = 500;
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
          };
        }
      },
      {
        auth: true,
        params: t.Object({ id: t.String() }),
        response: {
          200: t.Object({
            success: t.Literal(true),
            data: t.Object({ deleted: t.Boolean() }),
          }),
          404: t.Object({
            success: t.Literal(false),
            error: t.String(),
          }),
          500: t.Object({
            success: t.Literal(false),
            error: t.String(),
          }),
        },
      }
    )
    // Set default Kindle email
    .patch(
      "/:id/default",
      async ({ user, params, set }) => {
        try {
          const data = await kindleService.setDefaultKindleEmail(user.id, params.id);
          if (!data) {
            set.status = 404;
            return { success: false, error: "Kindle email not found" };
          }
          return { success: true, data };
        } catch (error) {
          set.status = 500;
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
          };
        }
      },
      {
        auth: true,
        params: t.Object({ id: t.String() }),
        response: {
          ...kindleEmailOutputSchema,
          404: t.Object({
            success: t.Literal(false),
            error: t.String(),
          }),
        },
      }
    );
};

describe("Kindle Router", () => {
  let getKindleEmailsSpy: ReturnType<typeof spyOn>;
  let getKindleEmailByIdSpy: ReturnType<typeof spyOn>;
  let createKindleEmailSpy: ReturnType<typeof spyOn>;
  let updateKindleEmailSpy: ReturnType<typeof spyOn>;
  let deleteKindleEmailSpy: ReturnType<typeof spyOn>;
  let setDefaultKindleEmailSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    getKindleEmailsSpy = spyOn(kindleService, "getKindleEmails").mockResolvedValue([mockKindleEmail, mockKindleEmail2]);
    getKindleEmailByIdSpy = spyOn(kindleService, "getKindleEmailById").mockResolvedValue(mockKindleEmail);
    createKindleEmailSpy = spyOn(kindleService, "createKindleEmail").mockResolvedValue(mockKindleEmail);
    updateKindleEmailSpy = spyOn(kindleService, "updateKindleEmail").mockResolvedValue(mockKindleEmail);
    deleteKindleEmailSpy = spyOn(kindleService, "deleteKindleEmail").mockResolvedValue(true);
    setDefaultKindleEmailSpy = spyOn(kindleService, "setDefaultKindleEmail").mockResolvedValue(mockKindleEmail);
  });

  afterEach(() => {
    getKindleEmailsSpy.mockRestore();
    getKindleEmailByIdSpy.mockRestore();
    createKindleEmailSpy.mockRestore();
    updateKindleEmailSpy.mockRestore();
    deleteKindleEmailSpy.mockRestore();
    setDefaultKindleEmailSpy.mockRestore();
  });

  describe("GET /kindle", () => {
    it("should return all Kindle emails when authenticated", async () => {
      const app = new Elysia().use(createTestKindleRouter(true));

      const response = await app.handle(
        new Request("http://localhost/kindle", {
          headers: {
            Authorization: "Bearer valid-token",
          },
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        data: [mockKindleEmail, mockKindleEmail2],
      });
      expect(getKindleEmailsSpy).toHaveBeenCalledTimes(1);
      expect(getKindleEmailsSpy).toHaveBeenCalledWith("user-123");
    });

    it("should return 401 when not authenticated", async () => {
      const app = new Elysia().use(createTestKindleRouter(false));

      const response = await app.handle(
        new Request("http://localhost/kindle")
      );

      expect(response.status).toBe(401);
      expect(getKindleEmailsSpy).not.toHaveBeenCalled();
    });

    it("should handle service errors gracefully", async () => {
      getKindleEmailsSpy.mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const app = new Elysia().use(createTestKindleRouter(true));

      const response = await app.handle(
        new Request("http://localhost/kindle", {
          headers: {
            Authorization: "Bearer valid-token",
          },
        })
      );

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: "Database error",
      });
    });
  });

  describe("GET /kindle/:id", () => {
    it("should return specific Kindle email when authenticated", async () => {
      const app = new Elysia().use(createTestKindleRouter(true));

      const response = await app.handle(
        new Request("http://localhost/kindle/kindle-123", {
          headers: {
            Authorization: "Bearer valid-token",
          },
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        data: mockKindleEmail,
      });
      expect(getKindleEmailByIdSpy).toHaveBeenCalledTimes(1);
      expect(getKindleEmailByIdSpy).toHaveBeenCalledWith("user-123", "kindle-123");
    });

    it("should return 404 when Kindle email not found", async () => {
      getKindleEmailByIdSpy.mockResolvedValueOnce(null);

      const app = new Elysia().use(createTestKindleRouter(true));

      const response = await app.handle(
        new Request("http://localhost/kindle/nonexistent", {
          headers: {
            Authorization: "Bearer valid-token",
          },
        })
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: "Kindle email not found",
      });
    });

    it("should return 401 when not authenticated", async () => {
      const app = new Elysia().use(createTestKindleRouter(false));

      const response = await app.handle(
        new Request("http://localhost/kindle/kindle-123")
      );

      expect(response.status).toBe(401);
      expect(getKindleEmailByIdSpy).not.toHaveBeenCalled();
    });
  });

  describe("POST /kindle", () => {
    it("should create Kindle email when authenticated with valid data", async () => {
      const app = new Elysia().use(createTestKindleRouter(true));

      const response = await app.handle(
        new Request("http://localhost/kindle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({
            email: "test@kindle.com",
            label: "My Kindle",
            isDefault: true,
          }),
        })
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        data: mockKindleEmail,
      });
      expect(createKindleEmailSpy).toHaveBeenCalledTimes(1);
      expect(createKindleEmailSpy).toHaveBeenCalledWith("user-123", {
        email: "test@kindle.com",
        label: "My Kindle",
        isDefault: true,
      });
    });

    it("should create Kindle email without optional fields", async () => {
      const app = new Elysia().use(createTestKindleRouter(true));

      const response = await app.handle(
        new Request("http://localhost/kindle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({
            email: "test@kindle.com",
          }),
        })
      );

      expect(response.status).toBe(201);
      expect(createKindleEmailSpy).toHaveBeenCalledTimes(1);
      expect(createKindleEmailSpy).toHaveBeenCalledWith("user-123", {
        email: "test@kindle.com",
      });
    });

    it("should return 401 when not authenticated", async () => {
      const app = new Elysia().use(createTestKindleRouter(false));

      const response = await app.handle(
        new Request("http://localhost/kindle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "test@kindle.com",
          }),
        })
      );

      expect(response.status).toBe(401);
      expect(createKindleEmailSpy).not.toHaveBeenCalled();
    });

    it("should reject invalid email format", async () => {
      const app = new Elysia().use(createTestKindleRouter(true));

      const response = await app.handle(
        new Request("http://localhost/kindle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({
            email: "invalid-email",
          }),
        })
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(createKindleEmailSpy).not.toHaveBeenCalled();
    });

    it("should reject missing email field", async () => {
      const app = new Elysia().use(createTestKindleRouter(true));

      const response = await app.handle(
        new Request("http://localhost/kindle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({
            label: "My Kindle",
          }),
        })
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(createKindleEmailSpy).not.toHaveBeenCalled();
    });

    it("should handle service errors gracefully", async () => {
      createKindleEmailSpy.mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const app = new Elysia().use(createTestKindleRouter(true));

      const response = await app.handle(
        new Request("http://localhost/kindle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({
            email: "test@kindle.com",
          }),
        })
      );

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: "Database error",
      });
    });
  });

  describe("PATCH /kindle/:id", () => {
    it("should update Kindle email when authenticated", async () => {
      const app = new Elysia().use(createTestKindleRouter(true));

      const response = await app.handle(
        new Request("http://localhost/kindle/kindle-123", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({
            email: "updated@kindle.com",
            label: "Updated Label",
          }),
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        data: mockKindleEmail,
      });
      expect(updateKindleEmailSpy).toHaveBeenCalledTimes(1);
      expect(updateKindleEmailSpy).toHaveBeenCalledWith("user-123", "kindle-123", {
        email: "updated@kindle.com",
        label: "Updated Label",
      });
    });

    it("should allow partial updates", async () => {
      const app = new Elysia().use(createTestKindleRouter(true));

      const response = await app.handle(
        new Request("http://localhost/kindle/kindle-123", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({
            label: "Only Label Updated",
          }),
        })
      );

      expect(response.status).toBe(200);
      expect(updateKindleEmailSpy).toHaveBeenCalledWith("user-123", "kindle-123", {
        label: "Only Label Updated",
      });
    });

    it("should allow setting label to null", async () => {
      const app = new Elysia().use(createTestKindleRouter(true));

      const response = await app.handle(
        new Request("http://localhost/kindle/kindle-123", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({
            label: null,
          }),
        })
      );

      expect(response.status).toBe(200);
      expect(updateKindleEmailSpy).toHaveBeenCalledWith("user-123", "kindle-123", {
        label: null,
      });
    });

    it("should return 404 when Kindle email not found", async () => {
      updateKindleEmailSpy.mockResolvedValueOnce(null);

      const app = new Elysia().use(createTestKindleRouter(true));

      const response = await app.handle(
        new Request("http://localhost/kindle/nonexistent", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({
            email: "updated@kindle.com",
          }),
        })
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: "Kindle email not found",
      });
    });

    it("should return 401 when not authenticated", async () => {
      const app = new Elysia().use(createTestKindleRouter(false));

      const response = await app.handle(
        new Request("http://localhost/kindle/kindle-123", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "updated@kindle.com",
          }),
        })
      );

      expect(response.status).toBe(401);
      expect(updateKindleEmailSpy).not.toHaveBeenCalled();
    });

    it("should reject invalid email format", async () => {
      const app = new Elysia().use(createTestKindleRouter(true));

      const response = await app.handle(
        new Request("http://localhost/kindle/kindle-123", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({
            email: "invalid-email",
          }),
        })
      );

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(updateKindleEmailSpy).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /kindle/:id", () => {
    it("should delete Kindle email when authenticated", async () => {
      const app = new Elysia().use(createTestKindleRouter(true));

      const response = await app.handle(
        new Request("http://localhost/kindle/kindle-123", {
          method: "DELETE",
          headers: {
            Authorization: "Bearer valid-token",
          },
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        data: { deleted: true },
      });
      expect(deleteKindleEmailSpy).toHaveBeenCalledTimes(1);
      expect(deleteKindleEmailSpy).toHaveBeenCalledWith("user-123", "kindle-123");
    });

    it("should return 404 when Kindle email not found", async () => {
      deleteKindleEmailSpy.mockResolvedValueOnce(false);

      const app = new Elysia().use(createTestKindleRouter(true));

      const response = await app.handle(
        new Request("http://localhost/kindle/nonexistent", {
          method: "DELETE",
          headers: {
            Authorization: "Bearer valid-token",
          },
        })
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: "Kindle email not found",
      });
    });

    it("should return 401 when not authenticated", async () => {
      const app = new Elysia().use(createTestKindleRouter(false));

      const response = await app.handle(
        new Request("http://localhost/kindle/kindle-123", {
          method: "DELETE",
        })
      );

      expect(response.status).toBe(401);
      expect(deleteKindleEmailSpy).not.toHaveBeenCalled();
    });

    it("should handle service errors gracefully", async () => {
      deleteKindleEmailSpy.mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const app = new Elysia().use(createTestKindleRouter(true));

      const response = await app.handle(
        new Request("http://localhost/kindle/kindle-123", {
          method: "DELETE",
          headers: {
            Authorization: "Bearer valid-token",
          },
        })
      );

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: "Database error",
      });
    });
  });

  describe("PATCH /kindle/:id/default", () => {
    it("should set Kindle email as default when authenticated", async () => {
      const app = new Elysia().use(createTestKindleRouter(true));

      const response = await app.handle(
        new Request("http://localhost/kindle/kindle-123/default", {
          method: "PATCH",
          headers: {
            Authorization: "Bearer valid-token",
          },
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        success: true,
        data: mockKindleEmail,
      });
      expect(setDefaultKindleEmailSpy).toHaveBeenCalledTimes(1);
      expect(setDefaultKindleEmailSpy).toHaveBeenCalledWith("user-123", "kindle-123");
    });

    it("should return 404 when Kindle email not found", async () => {
      setDefaultKindleEmailSpy.mockResolvedValueOnce(null);

      const app = new Elysia().use(createTestKindleRouter(true));

      const response = await app.handle(
        new Request("http://localhost/kindle/nonexistent/default", {
          method: "PATCH",
          headers: {
            Authorization: "Bearer valid-token",
          },
        })
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: "Kindle email not found",
      });
    });

    it("should return 401 when not authenticated", async () => {
      const app = new Elysia().use(createTestKindleRouter(false));

      const response = await app.handle(
        new Request("http://localhost/kindle/kindle-123/default", {
          method: "PATCH",
        })
      );

      expect(response.status).toBe(401);
      expect(setDefaultKindleEmailSpy).not.toHaveBeenCalled();
    });

    it("should handle service errors gracefully", async () => {
      setDefaultKindleEmailSpy.mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      const app = new Elysia().use(createTestKindleRouter(true));

      const response = await app.handle(
        new Request("http://localhost/kindle/kindle-123/default", {
          method: "PATCH",
          headers: {
            Authorization: "Bearer valid-token",
          },
        })
      );

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: "Database error",
      });
    });
  });
});
