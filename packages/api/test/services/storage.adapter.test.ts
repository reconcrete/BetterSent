import { describe, expect, it } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

import { FileSystemStorageAdapter } from "../../src/services/storage.ts/filesystem.adapter";
import { createStorageAdapterFromEnv } from "../../src/services/storage.ts";
import { S3StorageAdapter } from "../../src/services/storage.ts/s3.adapter";

describe("Storage adapters", () => {
  it("FileSystemStorageAdapter returns output-relative epub filename", async () => {
    const adapter = new FileSystemStorageAdapter();
    const outputDir = "/tmp/output";
    const runFolderName = "extract-run-1";
    const epubPath = "/tmp/output/extract-run-1/content.epub";

    const result = await adapter.persistRunArtifacts({
      runFolderPath: "/tmp/output/extract-run-1",
      runFolderName,
      outputDir,
      epubPath,
    });

    expect(result.filename).toBe("extract-run-1/content.epub");
  });

  it("S3StorageAdapter uploads full run folder and returns epub key", async () => {
    const runFolderPath = await mkdtemp(join(tmpdir(), "storage-adapter-"));
    try {
      const imagesDir = join(runFolderPath, "images");
      const markdownPath = join(runFolderPath, "content.md");
      const imagePath = join(imagesDir, "0.png");
      const epubPath = join(runFolderPath, "content.epub");

      await mkdir(imagesDir, { recursive: true });
      await writeFile(markdownPath, "# sample", "utf-8");
      await writeFile(imagePath, "image-bytes", "utf-8");
      await writeFile(epubPath, "epub-bytes", "utf-8");

      const uploadedKeys: string[] = [];
      const mockClient = {
        send: async (command: { input: { Key?: string } }) => {
          if (command.input.Key) {
            uploadedKeys.push(command.input.Key);
          }
          return {};
        },
      };

      const adapter = new S3StorageAdapter(
        {
          endpoint: "https://example.com",
          bucket: "bucket",
          region: "us-east-1",
          accessKeyId: "id",
          secretAccessKey: "secret",
          prefix: "extract",
        },
        mockClient
      );

      const result = await adapter.persistRunArtifacts({
        runFolderPath,
        runFolderName: "run-123",
        outputDir: "/tmp/output",
        epubPath,
      });

      expect(uploadedKeys.sort()).toEqual([
        "extract/run-123/content.epub",
        "extract/run-123/content.md",
        "extract/run-123/images/0.png",
      ]);
      expect(result.filename).toBe("extract/run-123/content.epub");
    } finally {
      await rm(runFolderPath, { recursive: true, force: true });
    }
  });
});

describe("Storage adapter selection", () => {
  function setEnv(values: Record<string, string | undefined>) {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }

  it("uses filesystem adapter outside production", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const adapter = createStorageAdapterFromEnv();
    expect(adapter.kind).toBe("filesystem");

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("throws when production S3 env is partially configured", () => {
    const original = {
      NODE_ENV: process.env.NODE_ENV,
      STORAGE_S3_ENDPOINT: process.env.STORAGE_S3_ENDPOINT,
      STORAGE_S3_BUCKET: process.env.STORAGE_S3_BUCKET,
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    };

    setEnv({
      NODE_ENV: "production",
      STORAGE_S3_ENDPOINT: "https://example.com",
      STORAGE_S3_BUCKET: "bucket",
      AWS_REGION: undefined,
      AWS_ACCESS_KEY_ID: undefined,
      AWS_SECRET_ACCESS_KEY: undefined,
    });

    expect(() => createStorageAdapterFromEnv()).toThrow("S3 storage is partially configured");

    setEnv(original);
  });

  it("uses s3 adapter when production S3 env is complete", () => {
    const original = {
      NODE_ENV: process.env.NODE_ENV,
      STORAGE_S3_ENDPOINT: process.env.STORAGE_S3_ENDPOINT,
      STORAGE_S3_BUCKET: process.env.STORAGE_S3_BUCKET,
      AWS_REGION: process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    };

    setEnv({
      NODE_ENV: "production",
      STORAGE_S3_ENDPOINT: "https://example.com",
      STORAGE_S3_BUCKET: "bucket",
      AWS_REGION: "us-east-1",
      AWS_ACCESS_KEY_ID: "id",
      AWS_SECRET_ACCESS_KEY: "secret",
    });

    const adapter = createStorageAdapterFromEnv();
    expect(adapter.kind).toBe("s3");

    setEnv(original);
  });
});
