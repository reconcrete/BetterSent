export type { IStorageService } from "./interface";
export type { EpubMetadata, SaveResult, S3StorageConfig } from "./types";
export { FileSystemStorageService, S3StorageService } from "./implementation";
export { createStorageService } from "./factory";
