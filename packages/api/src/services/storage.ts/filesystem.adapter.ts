import { relative } from "path";

import type { PersistRunArtifactsInput, PersistRunArtifactsResult, StorageAdapter } from "./adapter";

export class FileSystemStorageAdapter implements StorageAdapter {
  kind = "filesystem" as const;

  async persistRunArtifacts(input: PersistRunArtifactsInput): Promise<PersistRunArtifactsResult> {
    return {
      filename: relative(input.outputDir, input.epubPath),
    };
  }
}
