import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { existsSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// We need to reset the module cache to get fresh storage state
// So we'll import dynamically in each test

const TEST_DATA_DIR = join(import.meta.dir, "..", "data");
const TEST_STORAGE_FILE = join(TEST_DATA_DIR, "sessions.json");

describe("Storage Module", () => {
  beforeEach(() => {
    // Clean up any existing test data
    if (existsSync(TEST_STORAGE_FILE)) {
      rmSync(TEST_STORAGE_FILE);
    }
  });

  afterEach(() => {
    // Clean up after tests
    if (existsSync(TEST_STORAGE_FILE)) {
      rmSync(TEST_STORAGE_FILE);
    }
  });

  describe("initStorage", () => {
    it("should initialize with empty sessions when no file exists", async () => {
      // Import fresh module
      const storage = await import("../src/storage");
      storage.initStorage();

      expect(storage.hasSession(12345)).toBe(false);
      expect(storage.getSession(12345)).toBeUndefined();
    });

    it("should create data directory if it does not exist", async () => {
      // Remove data directory if exists
      if (existsSync(TEST_DATA_DIR)) {
        rmSync(TEST_DATA_DIR, { recursive: true });
      }

      const storage = await import("../src/storage");
      storage.initStorage();

      // After setting a session, the directory should be created
      await storage.setSession(12345, { cookie: "test-cookie" });
      expect(existsSync(TEST_DATA_DIR)).toBe(true);
    });
  });

  describe("setSession and getSession", () => {
    it("should store and retrieve a session", async () => {
      const storage = await import("../src/storage");
      storage.initStorage();

      const testSession = {
        cookie: "session-cookie-123",
        email: "test@example.com",
        kindleEmailId: "kindle-456",
      };

      await storage.setSession(12345, testSession);
      const retrieved = storage.getSession(12345);

      expect(retrieved).toEqual(testSession);
    });

    it("should handle numeric user IDs correctly", async () => {
      const storage = await import("../src/storage");
      storage.initStorage();

      await storage.setSession(9876543210, { cookie: "cookie-1" });
      await storage.setSession(1234567890, { cookie: "cookie-2" });

      expect(storage.getSession(9876543210)?.cookie).toBe("cookie-1");
      expect(storage.getSession(1234567890)?.cookie).toBe("cookie-2");
    });

    it("should return undefined for non-existent session", async () => {
      const storage = await import("../src/storage");
      storage.initStorage();

      expect(storage.getSession(99999)).toBeUndefined();
    });

    it("should overwrite existing session", async () => {
      const storage = await import("../src/storage");
      storage.initStorage();

      await storage.setSession(12345, { cookie: "old-cookie" });
      await storage.setSession(12345, { cookie: "new-cookie" });

      expect(storage.getSession(12345)?.cookie).toBe("new-cookie");
    });
  });

  describe("updateSession", () => {
    it("should partially update an existing session", async () => {
      const storage = await import("../src/storage");
      storage.initStorage();

      await storage.setSession(12345, {
        cookie: "test-cookie",
        email: "test@example.com",
      });

      await storage.updateSession(12345, { kindleEmailId: "kindle-123" });

      const session = storage.getSession(12345);
      expect(session).toEqual({
        cookie: "test-cookie",
        email: "test@example.com",
        kindleEmailId: "kindle-123",
      });
    });

    it("should not create session if it does not exist", async () => {
      const storage = await import("../src/storage");
      storage.initStorage();

      await storage.updateSession(99999, { kindleEmailId: "kindle-123" });

      expect(storage.getSession(99999)).toBeUndefined();
    });

    it("should allow updating cookie", async () => {
      const storage = await import("../src/storage");
      storage.initStorage();

      await storage.setSession(12345, { cookie: "old-cookie" });
      await storage.updateSession(12345, { cookie: "new-cookie" });

      expect(storage.getSession(12345)?.cookie).toBe("new-cookie");
    });
  });

  describe("deleteSession", () => {
    it("should remove a session", async () => {
      const storage = await import("../src/storage");
      storage.initStorage();

      await storage.setSession(12345, { cookie: "test-cookie" });
      expect(storage.hasSession(12345)).toBe(true);

      await storage.deleteSession(12345);
      expect(storage.hasSession(12345)).toBe(false);
      expect(storage.getSession(12345)).toBeUndefined();
    });

    it("should not throw when deleting non-existent session", async () => {
      const storage = await import("../src/storage");
      storage.initStorage();

      // Should not throw
      await storage.deleteSession(99999);
      expect(storage.getSession(99999)).toBeUndefined();
    });
  });

  describe("hasSession", () => {
    it("should return true when session exists with cookie", async () => {
      const storage = await import("../src/storage");
      storage.initStorage();

      await storage.setSession(12345, { cookie: "test-cookie" });
      expect(storage.hasSession(12345)).toBe(true);
    });

    it("should return false when session does not exist", async () => {
      const storage = await import("../src/storage");
      storage.initStorage();

      expect(storage.hasSession(99999)).toBe(false);
    });

    it("should return false when cookie is empty string", async () => {
      const storage = await import("../src/storage");
      storage.initStorage();

      await storage.setSession(12345, { cookie: "" });
      expect(storage.hasSession(12345)).toBe(false);
    });
  });

  describe("persistence", () => {
    it("should persist sessions to disk", async () => {
      const storage = await import("../src/storage");
      storage.initStorage();

      await storage.setSession(12345, {
        cookie: "persistent-cookie",
        email: "test@example.com",
      });

      // Check that file exists
      expect(existsSync(TEST_STORAGE_FILE)).toBe(true);

      // Read and verify content
      const content = await Bun.file(TEST_STORAGE_FILE).text();
      const parsed = JSON.parse(content);
      expect(parsed.sessions["12345"]).toEqual({
        cookie: "persistent-cookie",
        email: "test@example.com",
      });
    });

    it("should load sessions from disk on init", async () => {
      // Ensure data directory exists
      if (!existsSync(TEST_DATA_DIR)) {
        mkdirSync(TEST_DATA_DIR, { recursive: true });
      }

      // Write test data directly to file
      const testData = {
        sessions: {
          "12345": {
            cookie: "loaded-cookie",
            email: "loaded@example.com",
          },
        },
      };
      await Bun.write(TEST_STORAGE_FILE, JSON.stringify(testData));

      // Re-import to get fresh module state (this is tricky with Bun's module caching)
      // In practice, we'll test this by checking the file was read
      const storage = await import("../src/storage");
      storage.initStorage();

      // The session should be loaded from disk
      const session = storage.getSession(12345);
      expect(session?.cookie).toBe("loaded-cookie");
      expect(session?.email).toBe("loaded@example.com");
    });
  });
});
