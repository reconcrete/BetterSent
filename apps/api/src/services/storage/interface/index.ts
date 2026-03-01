import type { EpubMetadata, SaveResult } from "../types";

export interface IStorageService {
  saveEpub(content: string, source?: string, metadata?: EpubMetadata): Promise<SaveResult>;
  getFile(filePath: string): Promise<Buffer>;
}
