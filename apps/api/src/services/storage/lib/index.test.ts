import { describe, expect, it } from "bun:test";

import { buildFrontmatter, detectLanguage } from "./index";

describe("detectLanguage", () => {
  it("detects Russian text", () => {
    expect(detectLanguage("Наступление 2000 года не даёт покоя западному воображению.")).toBe("ru");
  });

  it("defaults to English for Latin text", () => {
    expect(detectLanguage("The coming of the year 2000 has haunted the Western imagination.")).toBe("en-US");
  });

  it("does not switch language for a short foreign quote inside English text", () => {
    const content = `${"The quick brown fox jumps over the lazy dog. ".repeat(20)} Он сказал «привет».`;
    expect(detectLanguage(content)).toBe("en-US");
  });

  it("defaults to English for content without letters", () => {
    expect(detectLanguage("123 456 !!! ---")).toBe("en-US");
  });

  it("detects CJK and Greek", () => {
    expect(detectLanguage("これは日本語のテキストです。".repeat(5))).toBe("ja");
    expect(detectLanguage("Αυτό είναι ελληνικό κείμενο.".repeat(5))).toBe("el");
  });
});

describe("buildFrontmatter", () => {
  it("tags Russian content as ru", () => {
    const fm = buildFrontmatter({ title: "Суверенная личность" }, "Мы полагаем, что современный этап завершится.");
    expect(fm).toContain('language: "ru"');
    expect(fm).toContain('title: "Суверенная личность"');
  });

  it("keeps en-US for English content", () => {
    expect(buildFrontmatter({ title: "T" }, "Plain English body text here.")).toContain('language: "en-US"');
  });

  it("prefers an explicit language over detection", () => {
    expect(buildFrontmatter({ title: "T", language: "uk" }, "Текст українською мовою.")).toContain('language: "uk"');
  });

  it("escapes quotes in the title so the YAML stays valid", () => {
    expect(buildFrontmatter({ title: 'A "quoted" title' }, "body")).toContain('title: "A \\"quoted\\" title"');
  });

  it("falls back to defaults when metadata is missing", () => {
    const fm = buildFrontmatter();
    expect(fm).toContain('title: "Untitled"');
    expect(fm).toContain('author: "Unknown"');
    expect(fm).toContain('language: "en-US"');
  });
});
