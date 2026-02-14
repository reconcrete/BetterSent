import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join, relative } from "path";
import { $ } from "bun";

import type { EpubMetadata, StorageService, StoredArtifact } from "./types";
import {
  buildMarkdownHeader,
  generateMarkdownFilename,
  generateRunFolderName,
  localizeMarkdownImages,
} from "./storage.shared";

// Output directory relative to the api package.
const OUTPUT_DIR = process.env.OUTPUT_DIR || join(dirname(import.meta.dir), "output");

export class FileSystemStorageService implements StorageService {
  private async ensureOutputDir(): Promise<void> {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  public async saveMarkdown(
    content: string,
    source?: string,
    metadata?: EpubMetadata
  ): Promise<StoredArtifact> {
    await this.ensureOutputDir();

    const runFolderName = generateRunFolderName(source);
    const runFolderPath = join(OUTPUT_DIR, runFolderName);
    await mkdir(runFolderPath, { recursive: true });

    const localizedContent = await localizeMarkdownImages(content, runFolderPath);
    const markdownFilename = generateMarkdownFilename(source);
    const filepath = join(runFolderPath, markdownFilename);
    const savedAt = new Date().toISOString();

    await writeFile(filepath, buildMarkdownHeader(metadata) + localizedContent, "utf-8");

    return {
      filename: join(runFolderName, markdownFilename),
      path: filepath,
      savedAt,
    };
  }

  public async saveEpub(content: string, source?: string, metadata?: EpubMetadata): Promise<StoredArtifact> {
    const { path } = await this.saveMarkdown(content, source, metadata);
    const epubPath = path.replace(".md", ".epub");
    const runFolderPath = dirname(path);
    await $`pandoc ${path} -o ${epubPath} --to epub3 --resource-path=${runFolderPath}`;

    return {
      filename: relative(OUTPUT_DIR, epubPath),
      path: epubPath,
      savedAt: new Date().toISOString(),
    };
  }

  public async readFileAsBase64(path: string): Promise<string> {
    const buffer = await readFile(path);
    return buffer.toString("base64");
  }

  public getOutputDir(): string {
    return OUTPUT_DIR;
  }
}
