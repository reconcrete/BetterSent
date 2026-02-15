export interface PersistRunArtifactsInput {
  runFolderPath: string;
  runFolderName: string;
  outputDir: string;
  epubPath: string;
}

export interface PersistRunArtifactsResult {
  filename: string;
}

export interface StorageAdapter {
  kind: "filesystem" | "s3";
  persistRunArtifacts(input: PersistRunArtifactsInput): Promise<PersistRunArtifactsResult>;
}
