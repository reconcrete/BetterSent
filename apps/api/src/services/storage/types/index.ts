export interface EpubMetadata {
  title?: string;
  author?: string;
}

export interface SaveResult {
  filename: string;
  path: string;
  savedAt: string;
}

export interface S3StorageConfig {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  prefix?: string;
}
