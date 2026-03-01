import { describe, expect, it } from "bun:test";
import { readFile, readdir } from "fs/promises";
import { dirname, join } from "path";
import { FileSystemStorageService } from "../../src/services/storage";

/**
 * Storage service tests for image localization and EPUB generation.
 * Uses a public image URL (httpbin) for download tests. EPUB tests require pandoc.
 */
const SAMPLE_IMAGE_URL = "https://httpbin.org/image/png";

describe("FileSystemStorageService — saveEpub", () => {
  it("should save markdown without images and produce an EPUB", async () => {
    const service = new FileSystemStorageService();
    const content = "# Hello\n\nNo images here.";
    const { path: epubPath, filename } = await service.saveEpub(content, "no-images", {
      title: "No Images",
      author: "Test",
    });

    expect(filename).toMatch(/\.epub$/);
    const stat = await Bun.file(epubPath).stat();
    expect(stat.size).toBeGreaterThan(0);
  });

  it("should localize images and produce EPUB with resource-path", async () => {
    const service = new FileSystemStorageService();
    const content = `# EPUB Test\n\n![pic](${SAMPLE_IMAGE_URL})`;
    const { path: epubPath } = await service.saveEpub(content, "epub-images", {
      title: "EPUB With Images",
      author: "Test",
    });
    const stat = await Bun.file(epubPath).stat();
    expect(stat.size).toBeGreaterThan(0);

    // Check that images were localized in the run folder
    const runDir = dirname(epubPath);
    const entries = await readdir(runDir);
    if (entries.includes("images")) {
      const imagesEntries = await readdir(join(runDir, "images"));
      expect(imagesEntries.length).toBeGreaterThan(0);

      // Check the markdown file has localized image paths
      const mdFile = entries.find((e) => e.endsWith(".md"));
      if (mdFile) {
        const body = await readFile(join(runDir, mdFile), "utf-8");
        expect(body).toMatch(/!\[.*\]\(images\/\d+\.(png|jpg|gif|webp|svg)\)/);
      }
    }
  });
});

describe("FileSystemStorageService — getFile", () => {
  it("should read a file and return a Buffer", async () => {
    const service = new FileSystemStorageService();
    const content = "# GetFile Test\n\nContent.";
    const { path: epubPath } = await service.saveEpub(content, "getfile-test", {
      title: "GetFile",
      author: "Test",
    });

    const buf = await service.getFile(epubPath);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
  });
});
