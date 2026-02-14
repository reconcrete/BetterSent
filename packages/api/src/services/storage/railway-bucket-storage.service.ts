/**
 * Railway Bucket Storage Service
 * S3-compatible storage for Railway Buckets (production).
 * Uses Railway variable references: BUCKET, ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION, ENDPOINT.
 */

import { mkdir, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { $ } from "bun";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import type { EpubMetadata, StorageService, StoredArtifact } from "./types";
import {
  buildMarkdownHeader,
  generateMarkdownFilename,
  generateRunFolderName,
  localizeMarkdownImages,
} from "./storage.shared";

interface PreparedMarkdown {
  runFolderName: string;
  markdownFilename: string;
  markdownPath: string;
  savedAt: string;
}

const TMP_ROOT_DIR = process.env.STORAGE_TMP_DIR || join(tmpdir(), "wrap-storage");

export class RailwayBucketStorageService implements StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly keyPrefix: string;

  constructor() {
    // Railway-provided variables (primary); optional AWS/STORAGE_S3_ aliases for compatibility
    const bucket =
      process.env.BUCKET ??
      process.env.STORAGE_S3_BUCKET ??
      process.env.S3_BUCKET ??
      process.env.BUCKET_NAME;
    const endpoint =
      process.env.ENDPOINT ??
      process.env.STORAGE_S3_ENDPOINT ??
      process.env.S3_ENDPOINT ??
      process.env.AWS_ENDPOINT_URL_S3;
    const region =
      process.env.REGION ??
      process.env.AWS_REGION ??
      process.env.STORAGE_S3_REGION ??
      process.env.S3_REGION ??
      "auto";
    const accessKeyId =
      process.env.ACCESS_KEY_ID ??
      process.env.AWS_ACCESS_KEY_ID ??
      process.env.STORAGE_S3_ACCESS_KEY_ID ??
      process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey =
      process.env.SECRET_ACCESS_KEY ??
      process.env.AWS_SECRET_ACCESS_KEY ??
      process.env.STORAGE_S3_SECRET_ACCESS_KEY ??
      process.env.S3_SECRET_ACCESS_KEY;
    const sessionToken =
      process.env.AWS_SESSION_TOKEN ??
      process.env.STORAGE_S3_SESSION_TOKEN ??
      process.env.S3_SESSION_TOKEN;

    if (!bucket) {
      throw new Error(
        "Railway bucket is not set. Use BUCKET (Railway variable reference) or STORAGE_S3_BUCKET."
      );
    }
    if (!endpoint) {
      throw new Error(
        "Railway bucket endpoint is not set. Use ENDPOINT (Railway variable reference) or STORAGE_S3_ENDPOINT."
      );
    }
    if ((accessKeyId && !secretAccessKey) || (!accessKeyId && secretAccessKey)) {
      throw new Error(
        "Incomplete Railway bucket credentials. Provide both ACCESS_KEY_ID and SECRET_ACCESS_KEY, or neither."
      );
    }

    this.client = new S3Client({
      region,
      endpoint,
      forcePathStyle: process.env.STORAGE_S3_FORCE_PATH_STYLE === "true",
      credentials:
        accessKeyId && secretAccessKey
          ? { accessKeyId, secretAccessKey, sessionToken }
          : undefined,
    });
    this.bucket = bucket;
    this.keyPrefix = (process.env.STORAGE_S3_PREFIX ?? "").replace(/^\/+|\/+$/g, "");
  }

  private toObjectKey(relativePath: string): string {
    const normalizedPath = relativePath.replace(/^\/+/, "");
    return this.keyPrefix ? `${this.keyPrefix}/${normalizedPath}` : normalizedPath;
  }

  private async prepareMarkdown(
    content: string,
    source?: string,
    metadata?: EpubMetadata
  ): Promise<PreparedMarkdown> {
    await mkdir(TMP_ROOT_DIR, { recursive: true });

    const runFolderName = generateRunFolderName(source);
    const runFolderPath = join(TMP_ROOT_DIR, runFolderName);
    await mkdir(runFolderPath, { recursive: true });

    const localizedContent = await localizeMarkdownImages(content, runFolderPath);
    const markdownFilename = generateMarkdownFilename(source);
    const markdownPath = join(runFolderPath, markdownFilename);
    const savedAt = new Date().toISOString();

    await writeFile(markdownPath, buildMarkdownHeader(metadata) + localizedContent, "utf-8");

    return { runFolderName, markdownFilename, markdownPath, savedAt };
  }

  private async uploadFile(
    localPath: string,
    objectKey: string,
    contentType: string
  ): Promise<void> {
    const file = Bun.file(localPath);
    const body = Buffer.from(await file.arrayBuffer());

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: body,
        ContentType: contentType,
      })
    );
  }

  public async saveMarkdown(
    content: string,
    source?: string,
    metadata?: EpubMetadata
  ): Promise<StoredArtifact> {
    const prepared = await this.prepareMarkdown(content, source, metadata);
    const filename = join(prepared.runFolderName, prepared.markdownFilename);
    const objectKey = this.toObjectKey(filename);

    await this.uploadFile(prepared.markdownPath, objectKey, "text/markdown; charset=utf-8");

    return {
      filename,
      path: objectKey,
      savedAt: prepared.savedAt,
    };
  }

  public async saveEpub(
    content: string,
    source?: string,
    metadata?: EpubMetadata
  ): Promise<StoredArtifact> {
    const prepared = await this.prepareMarkdown(content, source, metadata);
    const epubFilename = prepared.markdownFilename.replace(/\.md$/i, ".epub");
    const epubPath = prepared.markdownPath.replace(/\.md$/i, ".epub");
    const runFolderPath = dirname(prepared.markdownPath);

    await $`pandoc ${prepared.markdownPath} -o ${epubPath} --to epub3 --resource-path=${runFolderPath}`;

    const filename = join(prepared.runFolderName, epubFilename);
    const objectKey = this.toObjectKey(filename);
    await this.uploadFile(epubPath, objectKey, "application/epub+zip");

    return {
      filename,
      path: objectKey,
      savedAt: new Date().toISOString(),
    };
  }

  public async readFileAsBase64(path: string): Promise<string> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: path,
      })
    );

    if (!response.Body) {
      throw new Error(`Railway bucket object has no body: ${path}`);
    }

    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes).toString("base64");
  }
}
