import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { readFile, readdir, rm } from "fs/promises";
import { basename, join, posix, relative } from "path";
import { mkdtemp } from "fs/promises";
import { tmpdir } from "os";

import type { IStorageService } from "../interface";
import type { EpubMetadata, S3StorageConfig, SaveResult } from "../types";
import { buildEpubLocally, buildMarkdownLocally } from "../lib";

type S3LikeClient = Pick<S3Client, "send">;

function toPosixPath(pathLike: string): string {
  return pathLike.split("\\").join("/");
}

async function listFilesRecursively(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        return listFilesRecursively(fullPath);
      }
      return [fullPath];
    })
  );

  return files.flat();
}

export class S3StorageService implements IStorageService {
  private readonly bucket: string;
  private readonly prefix: string;
  private readonly client: S3LikeClient;

  constructor(config: S3StorageConfig, client?: S3LikeClient) {
    this.bucket = config.bucket;
    this.prefix = config.prefix ?? "extract";
    this.client =
      client ??
      new S3Client({
        endpoint: config.endpoint,
        region: config.region,
        forcePathStyle: true,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });
  }

  async saveEpub(content: string, source?: string, metadata?: EpubMetadata): Promise<SaveResult> {
    const tmpDir = await mkdtemp(join(tmpdir(), "storage-"));
    try {
      const { runFolderPath, markdownPath } =
        await buildMarkdownLocally(content, tmpDir, source, metadata);
      const epubPath = await buildEpubLocally(markdownPath, runFolderPath);

      await this.uploadDirectory(runFolderPath, basename(runFolderPath));

      const epubRelativePath = toPosixPath(relative(runFolderPath, epubPath));
      const epubKey = posix.join(this.prefix, basename(runFolderPath), epubRelativePath);

      return {
        filename: epubKey,
        path: epubKey,
        savedAt: new Date().toISOString(),
      };
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  }

  async getFile(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key })
    );
    const bytes = await response.Body!.transformToByteArray();
    return Buffer.from(bytes);
  }

  private async uploadDirectory(localDir: string, runFolderName: string): Promise<void> {
    const files = await listFilesRecursively(localDir);
    await Promise.all(
      files.map(async (absolutePath) => {
        const relativePath = toPosixPath(relative(localDir, absolutePath));
        const key = posix.join(this.prefix, runFolderName, relativePath);
        const body = await readFile(absolutePath);
        await this.client.send(
          new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body })
        );
      })
    );
  }
}
