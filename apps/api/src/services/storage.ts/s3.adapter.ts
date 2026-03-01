import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readFile, readdir } from "fs/promises";
import { join, posix, relative } from "path";

import type { PersistRunArtifactsInput, PersistRunArtifactsResult, StorageAdapter } from "./adapter";

type S3LikeClient = Pick<S3Client, "send">;

export interface S3StorageConfig {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  prefix?: string;
}

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

export class S3StorageAdapter implements StorageAdapter {
  kind = "s3" as const;

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

  async persistRunArtifacts(input: PersistRunArtifactsInput): Promise<PersistRunArtifactsResult> {
    const runFiles = await listFilesRecursively(input.runFolderPath);

    await Promise.all(
      runFiles.map(async (absoluteFilePath) => {
        const relativePath = toPosixPath(relative(input.runFolderPath, absoluteFilePath));
        const key = posix.join(this.prefix, input.runFolderName, relativePath);
        const body = await readFile(absoluteFilePath);

        await this.client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: body,
          })
        );
      })
    );

    const epubRelativePath = toPosixPath(relative(input.runFolderPath, input.epubPath));
    const epubKey = posix.join(this.prefix, input.runFolderName, epubRelativePath);
    return { filename: epubKey };
  }
}
