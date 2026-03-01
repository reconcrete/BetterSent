import type { IStorageService } from "../interface";
import { FileSystemStorageService } from "../implementation/filesystem.storage.service";
import { S3StorageService } from "../implementation/s3.storage.service";

interface S3EnvironmentConfig {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

function readS3Environment(): { config: S3EnvironmentConfig | null; missing: string[]; hasAny: boolean } {
  const values = {
    STORAGE_S3_ENDPOINT: process.env.STORAGE_S3_ENDPOINT,
    STORAGE_S3_BUCKET: process.env.STORAGE_S3_BUCKET,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  };

  const missing = Object.entries(values)
    .filter(([, value]) => !value || !value.trim())
    .map(([key]) => key);

  const hasAny = Object.values(values).some((value) => Boolean(value && value.trim()));
  if (missing.length > 0) {
    return { config: null, missing, hasAny };
  }

  return {
    config: {
      endpoint: values.STORAGE_S3_ENDPOINT!,
      bucket: values.STORAGE_S3_BUCKET!,
      region: values.AWS_REGION!,
      accessKeyId: values.AWS_ACCESS_KEY_ID!,
      secretAccessKey: values.AWS_SECRET_ACCESS_KEY!,
    },
    missing: [],
    hasAny,
  };
}

export function createStorageService(): IStorageService {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  if (nodeEnv !== "production") {
    return new FileSystemStorageService();
  }

  const { config, missing, hasAny } = readS3Environment();
  if (config) {
    return new S3StorageService({
      ...config,
      prefix: process.env.STORAGE_S3_PREFIX || "extract",
    });
  }

  if (hasAny) {
    throw new Error(
      `S3 storage is partially configured. Missing required variables: ${missing.join(", ")}`
    );
  }

  return new FileSystemStorageService();
}
