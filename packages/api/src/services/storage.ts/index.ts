/**
 * Storage Service
 * Handles saving markdown files to the output directory
 */

import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";

// Output directory relative to the api package
const OUTPUT_DIR = join(dirname(import.meta.dir), "output");

/**
 * Generates a unique filename based on timestamp and optional source
 */
function generateFilename(source?: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const sanitizedSource = source
    ? `-${source
        .replace(/^https?:\/\//, "")
        .replace(/[^a-zA-Z0-9]/g, "-")
        .slice(0, 30)}`
    : "";
  return `extract${sanitizedSource}-${timestamp}.md`;
}

/**
 * Ensures the output directory exists
 */
async function ensureOutputDir(): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });
}

/**
 * Saves markdown content to a file
 * Returns the filename and full path
 */
export async function saveMarkdown(
  content: string,
  source?: string
): Promise<{ filename: string; path: string; savedAt: string }> {
  await ensureOutputDir();

  const filename = generateFilename(source);
  const filepath = join(OUTPUT_DIR, filename);
  const savedAt = new Date().toISOString();

  // Add metadata header to the markdown
  const header = `---
source: ${source || "text input"}
extracted: ${savedAt}
---

`;

  await writeFile(filepath, header + content, "utf-8");

  return {
    filename,
    path: filepath,
    savedAt,
  };
}

/**
 * Gets the output directory path
 */
export function getOutputDir(): string {
  return OUTPUT_DIR;
}

