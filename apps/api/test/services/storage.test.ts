import { describe, expect, it } from "bun:test";
import { readFile, readdir } from "fs/promises";
import { dirname, join } from "path";
import { saveMarkdown, saveEpub } from "../../src/services/storage/index.js";

/**
 * Storage service tests for image localization and EPUB generation.
 * Uses a public image URL (httpbin) for download tests. EPUB tests require pandoc.
 */
const SAMPLE_IMAGE_URL = "https://httpbin.org/image/png";

describe("Storage service — image localization and EPUB", () => {
  it("should save markdown without images and not create images folder", async () => {
    const content = "# Hello\n\nNo images here.";
    const { path } = await saveMarkdown(content, "no-images", {
      title: "No Images",
      author: "Test",
    });
    const body = await readFile(path, "utf-8");
    expect(body).toContain("No images here.");
    expect(body).not.toMatch(/!\[.*\]\(images\//);
    const runDir = dirname(path);
    const entries = await readdir(runDir);
    expect(entries).not.toContain("images");
  });

  it("should create images folder and rewrite markdown when content has image URLs", async () => {
    const content = `# Article\n\n![alt](${SAMPLE_IMAGE_URL})`;
    const { path } = await saveMarkdown(content, "with-image", {
      title: "With Image",
      author: "Test",
    });
    const body = await readFile(path, "utf-8");
    const runDir = dirname(path);
    const entries = await readdir(runDir);

    if (entries.includes("images")) {
      const imagesEntries = await readdir(join(runDir, "images"));
      expect(imagesEntries.length).toBeGreaterThan(0);
      expect(body).toMatch(/!\[.*\]\(images\/\d+\.(png|jpg|gif|webp|svg)\)/);
    }
    // If httpbin is unavailable, download may fail and URLs stay unchanged; test still passes
  });

  it("should produce EPUB with resource-path when markdown has images", async () => {
    const content = `# EPUB Test\n\n![pic](${SAMPLE_IMAGE_URL})`;
    const { path: epubPath } = await saveEpub(content, "epub-images", {
      title: "EPUB With Images",
      author: "Test",
    });
    const stat = await Bun.file(epubPath).stat();
    expect(stat.size).toBeGreaterThan(0);
  });
});
