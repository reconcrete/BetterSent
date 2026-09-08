export interface EpubMetadata {
  title?: string;
  author?: string;
  /** BCP-47 tag. Detected from the content when omitted. */
  language?: string;
}

export interface SaveResult {
  filename: string;
  path: string;
  markdownPath: string;
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
