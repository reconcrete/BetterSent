import { describe, expect, it, beforeEach, afterEach, spyOn, mock } from "bun:test";

// Mock data
const mockKindleEmail = {
  id: "kindle-123",
  email: "test@kindle.com",
  label: "My Kindle",
  isDefault: true,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const mockExtractResult = {
  markdown: "# Test Content",
  filename: "test-article.epub",
  savedAt: "2024-01-01T00:00:00.000Z",
};

describe("API Module", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("signIn", () => {
    it("should return success with cookie on successful login", async () => {
      global.fetch = mock(async () => {
        return new Response(JSON.stringify({ user: { id: "user-123" } }), {
          status: 200,
          headers: {
            "set-cookie": "session=abc123; Path=/; HttpOnly",
          },
        });
      });

      const { signIn } = await import("../src/api");
      const result = await signIn("test@example.com", "password123");

      expect(result.success).toBe(true);
      expect(result.cookie).toBe("session=abc123; Path=/; HttpOnly");
      expect(result.error).toBeUndefined();
    });

    it("should return error on failed login", async () => {
      global.fetch = mock(async () => {
        return new Response(JSON.stringify({ message: "Invalid credentials" }), {
          status: 401,
        });
      });

      const { signIn } = await import("../src/api");
      const result = await signIn("test@example.com", "wrongpassword");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid credentials");
      expect(result.cookie).toBeUndefined();
    });

    it("should return error when no cookie is returned", async () => {
      global.fetch = mock(async () => {
        return new Response(JSON.stringify({ user: { id: "user-123" } }), {
          status: 200,
          // No set-cookie header
        });
      });

      const { signIn } = await import("../src/api");
      const result = await signIn("test@example.com", "password123");

      expect(result.success).toBe(false);
      expect(result.error).toBe("No session cookie returned");
    });

    it("should handle network errors", async () => {
      global.fetch = mock(async () => {
        throw new Error("Network connection failed");
      });

      const { signIn } = await import("../src/api");
      const result = await signIn("test@example.com", "password123");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network connection failed");
    });

    it("should call correct endpoint with correct body", async () => {
      let capturedUrl: string = "";
      let capturedBody: unknown = null;

      global.fetch = mock(async (url, options) => {
        capturedUrl = url as string;
        capturedBody = JSON.parse(options?.body as string);
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { "set-cookie": "session=test" },
        });
      });

      const { signIn } = await import("../src/api");
      await signIn("user@test.com", "mypassword");

      expect(capturedUrl).toContain("/api/auth/sign-in/email");
      expect(capturedBody).toEqual({ email: "user@test.com", password: "mypassword" });
    });
  });

  describe("getKindleEmails", () => {
    it("should return kindle emails on success", async () => {
      global.fetch = mock(async () => {
        return new Response(
          JSON.stringify({ success: true, data: [mockKindleEmail] }),
          { status: 200 }
        );
      });

      const { getKindleEmails } = await import("../src/api");
      const result = await getKindleEmails("session-cookie");

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockKindleEmail]);
    });

    it("should include cookie in request headers", async () => {
      let capturedHeaders: Record<string, string> = {};

      global.fetch = mock(async (url, options) => {
        capturedHeaders = options?.headers as Record<string, string>;
        return new Response(JSON.stringify({ success: true, data: [] }), {
          status: 200,
        });
      });

      const { getKindleEmails } = await import("../src/api");
      await getKindleEmails("my-session-cookie");

      expect(capturedHeaders["Cookie"]).toBe("my-session-cookie");
    });

    it("should handle API errors", async () => {
      global.fetch = mock(async () => {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          { status: 401 }
        );
      });

      const { getKindleEmails } = await import("../src/api");
      const result = await getKindleEmails("invalid-cookie");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("should handle network errors gracefully", async () => {
      global.fetch = mock(async () => {
        throw new Error("Connection refused");
      });

      const { getKindleEmails } = await import("../src/api");
      const result = await getKindleEmails("session-cookie");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Connection refused");
    });
  });

  describe("createKindleEmail", () => {
    it("should create kindle email successfully", async () => {
      let capturedBody: unknown = null;

      global.fetch = mock(async (url, options) => {
        capturedBody = JSON.parse(options?.body as string);
        return new Response(
          JSON.stringify({ success: true, data: mockKindleEmail }),
          { status: 201 }
        );
      });

      const { createKindleEmail } = await import("../src/api");
      const result = await createKindleEmail(
        "session-cookie",
        "new@kindle.com",
        "New Kindle"
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockKindleEmail);
      expect(capturedBody).toEqual({ email: "new@kindle.com", label: "New Kindle" });
    });

    it("should create kindle email without label", async () => {
      let capturedBody: unknown = null;

      global.fetch = mock(async (url, options) => {
        capturedBody = JSON.parse(options?.body as string);
        return new Response(
          JSON.stringify({ success: true, data: mockKindleEmail }),
          { status: 201 }
        );
      });

      const { createKindleEmail } = await import("../src/api");
      await createKindleEmail("session-cookie", "new@kindle.com");

      expect(capturedBody).toEqual({ email: "new@kindle.com", label: undefined });
    });

    it("should use POST method", async () => {
      let capturedMethod: string = "";

      global.fetch = mock(async (url, options) => {
        capturedMethod = options?.method as string;
        return new Response(
          JSON.stringify({ success: true, data: mockKindleEmail }),
          { status: 201 }
        );
      });

      const { createKindleEmail } = await import("../src/api");
      await createKindleEmail("session-cookie", "new@kindle.com");

      expect(capturedMethod).toBe("POST");
    });
  });

  describe("setDefaultKindleEmail", () => {
    it("should set default kindle email", async () => {
      let capturedUrl: string = "";
      let capturedMethod: string = "";

      global.fetch = mock(async (url, options) => {
        capturedUrl = url as string;
        capturedMethod = options?.method as string;
        return new Response(
          JSON.stringify({ success: true, data: mockKindleEmail }),
          { status: 200 }
        );
      });

      const { setDefaultKindleEmail } = await import("../src/api");
      const result = await setDefaultKindleEmail("session-cookie", "kindle-123");

      expect(result.success).toBe(true);
      expect(capturedUrl).toContain("/kindle/kindle-123/default");
      expect(capturedMethod).toBe("PATCH");
    });
  });

  describe("sendText", () => {
    it("should send text content successfully", async () => {
      let capturedBody: unknown = null;

      global.fetch = mock(async (url, options) => {
        capturedBody = JSON.parse(options?.body as string);
        return new Response(
          JSON.stringify({ success: true, data: mockExtractResult }),
          { status: 200 }
        );
      });

      const { sendText } = await import("../src/api");
      const result = await sendText(
        "session-cookie",
        "This is my text content",
        "kindle-123"
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockExtractResult);
      expect(capturedBody).toEqual({
        textContent: "This is my text content",
        kindleEmailId: "kindle-123",
      });
    });

    it("should send text without kindle email ID", async () => {
      let capturedBody: unknown = null;

      global.fetch = mock(async (url, options) => {
        capturedBody = JSON.parse(options?.body as string);
        return new Response(
          JSON.stringify({ success: true, data: mockExtractResult }),
          { status: 200 }
        );
      });

      const { sendText } = await import("../src/api");
      await sendText("session-cookie", "Text content");

      expect(capturedBody).toEqual({
        textContent: "Text content",
        kindleEmailId: undefined,
      });
    });

    it("should call correct endpoint", async () => {
      let capturedUrl: string = "";

      global.fetch = mock(async (url) => {
        capturedUrl = url as string;
        return new Response(
          JSON.stringify({ success: true, data: mockExtractResult }),
          { status: 200 }
        );
      });

      const { sendText } = await import("../src/api");
      await sendText("session-cookie", "Text");

      expect(capturedUrl).toContain("/extract/text");
    });
  });

  describe("sendUrl", () => {
    it("should send URL content successfully", async () => {
      let capturedBody: unknown = null;

      global.fetch = mock(async (url, options) => {
        capturedBody = JSON.parse(options?.body as string);
        return new Response(
          JSON.stringify({ success: true, data: mockExtractResult }),
          { status: 200 }
        );
      });

      const { sendUrl } = await import("../src/api");
      const result = await sendUrl(
        "session-cookie",
        "https://example.com/article",
        "kindle-123"
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockExtractResult);
      expect(capturedBody).toEqual({
        url: "https://example.com/article",
        kindleEmailId: "kindle-123",
      });
    });

    it("should call correct endpoint", async () => {
      let capturedUrl: string = "";

      global.fetch = mock(async (url) => {
        capturedUrl = url as string;
        return new Response(
          JSON.stringify({ success: true, data: mockExtractResult }),
          { status: 200 }
        );
      });

      const { sendUrl } = await import("../src/api");
      await sendUrl("session-cookie", "https://example.com");

      expect(capturedUrl).toContain("/extract/url");
    });

    it("should handle extraction errors", async () => {
      global.fetch = mock(async () => {
        return new Response(
          JSON.stringify({ success: false, error: "Failed to extract content" }),
          { status: 500 }
        );
      });

      const { sendUrl } = await import("../src/api");
      const result = await sendUrl("session-cookie", "https://invalid.url");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to extract content");
    });
  });

  describe("checkSession", () => {
    it("should return true for valid session", async () => {
      global.fetch = mock(async () => {
        return new Response(
          JSON.stringify({ success: true, data: { id: "user-123" } }),
          { status: 200 }
        );
      });

      const { checkSession } = await import("../src/api");
      const isValid = await checkSession("valid-session-cookie");

      expect(isValid).toBe(true);
    });

    it("should return false for invalid session", async () => {
      global.fetch = mock(async () => {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          { status: 401 }
        );
      });

      const { checkSession } = await import("../src/api");
      const isValid = await checkSession("invalid-session-cookie");

      expect(isValid).toBe(false);
    });

    it("should return false on network error", async () => {
      global.fetch = mock(async () => {
        throw new Error("Network error");
      });

      const { checkSession } = await import("../src/api");
      const isValid = await checkSession("session-cookie");

      expect(isValid).toBe(false);
    });

    it("should call user/me endpoint", async () => {
      let capturedUrl: string = "";

      global.fetch = mock(async (url) => {
        capturedUrl = url as string;
        return new Response(
          JSON.stringify({ success: true, data: { id: "user-123" } }),
          { status: 200 }
        );
      });

      const { checkSession } = await import("../src/api");
      await checkSession("session-cookie");

      expect(capturedUrl).toContain("/user/me");
    });
  });
});
