export interface EpubMetadata {
  title?: string;
  author?: string;
}

export interface StoredArtifact {
  filename: string;
  path: string;
  savedAt: string;
}

export interface StorageService {
  saveMarkdown(content: string, source?: string, metadata?: EpubMetadata): Promise<StoredArtifact>;
  saveEpub(content: string, source?: string, metadata?: EpubMetadata): Promise<StoredArtifact>;
  readFileAsBase64(path: string): Promise<string>;
}
