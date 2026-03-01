import { describe, expect, it } from "bun:test";

import {
  FileSystemStorageService,
  S3StorageService,
  createStorageService,
} from "../../src/services/storage";

describe("S3StorageService — saveEpub uploads to S3", () => {
  it("uploads all run files and returns the S3 epub key", async () => {
    const uploadedKeys: string[] = [];
    const mockClient = {
      send: async (command: { input: { Key?: string } }) => {
        if (command.input.Key) {
          uploadedKeys.push(command.input.Key);
        }
        return {};
      },
    };

    const service = new S3StorageService(
      {
        endpoint: "https://example.com",
        bucket: "bucket",
        region: "us-east-1",
        accessKeyId: "id",
        secretAccessKey: "secret",
        prefix: "extract",
      },
      mockClient,
    );

    const content = "# S3 Test\n\nSimple content.";
    const { filename, path } = await service.saveEpub(content, "s3test", {
      title: "S3 Test",
      author: "Test",
    });

    const mdKeys = uploadedKeys.filter((k) => k.endsWith(".md"));
    const epubKeys = uploadedKeys.filter((k) => k.endsWith(".epub"));
    expect(mdKeys.length).toBe(1);
    expect(epubKeys.length).toBe(1);

    expect(filename).toMatch(/^extract\//);
    expect(filename).toMatch(/\.epub$/);
    expect(path).toBe(filename);
  });
});

describe("createStorageService — environment-based selection", () => {
  function setEnv(values: Record<string, string | undefined>) {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }

  it("uses FileSystemStorageService outside production", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const service = createStorageService();
    expect(service).toBeInstanceOf(FileSystemStorageService);

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

    expect(() => createStorageService()).toThrow("S3 storage is partially configured");

    setEnv(original);
  });

  it("uses S3StorageService when production S3 env is complete", () => {
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

    const service = createStorageService();
    expect(service).toBeInstanceOf(S3StorageService);

    setEnv(original);
  });
});
