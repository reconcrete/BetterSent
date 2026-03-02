import { readFile } from "fs/promises";
import { dirname, join, relative } from "path";

import type { IStorageService } from "../interface";
import type { EpubMetadata, SaveResult } from "../types";
import { buildEpubLocally, buildMarkdownLocally } from "../lib";

export class FileSystemStorageService implements IStorageService {
  private readonly outputDir: string;

  constructor(outputDir?: string) {
    this.outputDir = outputDir ?? process.env.OUTPUT_DIR ?? join(dirname(import.meta.dir), "..", "output");
  }

  async saveEpub(content: string, source?: string, metadata?: EpubMetadata): Promise<SaveResult> {
    const { runFolderPath, markdownPath } =
      await buildMarkdownLocally(content, this.outputDir, source, metadata);
    const epubPath = await buildEpubLocally(markdownPath, runFolderPath);

    return {
      filename: relative(this.outputDir, epubPath),
      path: epubPath,
      markdownPath: relative(this.outputDir, markdownPath),
      savedAt: new Date().toISOString(),
    };
  }

  async getFile(filePath: string): Promise<Buffer> {
    return readFile(filePath);
  }
}
