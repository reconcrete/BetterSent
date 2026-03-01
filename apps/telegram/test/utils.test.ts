import { describe, expect, it } from "bun:test";

// URL detection function (extracted from index.ts for testing)
function isUrl(text: string): boolean {
  return /^https?:\/\//i.test(text.trim());
}

describe("Utility Functions", () => {
  describe("isUrl", () => {
    it("should return true for http URLs", () => {
      expect(isUrl("http://example.com")).toBe(true);
      expect(isUrl("http://example.com/path")).toBe(true);
      expect(isUrl("http://example.com/path?query=1")).toBe(true);
      expect(isUrl("http://subdomain.example.com")).toBe(true);
    });

    it("should return true for https URLs", () => {
      expect(isUrl("https://example.com")).toBe(true);
      expect(isUrl("https://example.com/path")).toBe(true);
      expect(isUrl("https://secure.example.com")).toBe(true);
    });

    it("should be case-insensitive", () => {
      expect(isUrl("HTTP://example.com")).toBe(true);
      expect(isUrl("HTTPS://example.com")).toBe(true);
      expect(isUrl("Http://example.com")).toBe(true);
      expect(isUrl("HtTpS://example.com")).toBe(true);
    });

    it("should handle whitespace", () => {
      expect(isUrl("  https://example.com")).toBe(true);
      expect(isUrl("https://example.com  ")).toBe(true);
      expect(isUrl("  https://example.com  ")).toBe(true);
      expect(isUrl("\thttps://example.com\n")).toBe(true);
    });

    it("should return false for non-URLs", () => {
      expect(isUrl("example.com")).toBe(false);
      expect(isUrl("www.example.com")).toBe(false);
      expect(isUrl("ftp://example.com")).toBe(false);
      expect(isUrl("mailto:test@example.com")).toBe(false);
    });

    it("should return false for plain text", () => {
      expect(isUrl("Hello world")).toBe(false);
      expect(isUrl("This is a test")).toBe(false);
      expect(isUrl("Some text with http in it")).toBe(false);
    });

    it("should return false for text containing URLs but not starting with them", () => {
      expect(isUrl("Check out https://example.com")).toBe(false);
      expect(isUrl("Visit http://example.com today")).toBe(false);
    });

    it("should handle empty and whitespace-only strings", () => {
      expect(isUrl("")).toBe(false);
      expect(isUrl("   ")).toBe(false);
      expect(isUrl("\t\n")).toBe(false);
    });

    it("should handle complex URLs", () => {
      expect(isUrl("https://example.com/path/to/page?query=value&other=123#anchor")).toBe(true);
      expect(isUrl("https://user:pass@example.com:8080/path")).toBe(true);
      expect(isUrl("http://localhost:3000")).toBe(true);
      expect(isUrl("http://127.0.0.1:8080/api")).toBe(true);
    });

    it("should handle international URLs", () => {
      expect(isUrl("https://例え.jp")).toBe(true);
      expect(isUrl("https://münchen.de")).toBe(true);
    });
  });
});

describe("Email Validation", () => {
  // Simple email validation used in the bot
  function isValidEmail(text: string): boolean {
    return text.includes("@");
  }

  describe("isValidEmail", () => {
    it("should return true for valid email addresses", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user@kindle.com")).toBe(true);
      expect(isValidEmail("name.surname@domain.org")).toBe(true);
    });

    it("should return false for invalid email addresses", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("no-at-sign.com")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });
  });
});
