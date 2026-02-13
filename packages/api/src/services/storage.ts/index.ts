/**
 * Storage Service
 * Handles saving markdown files to the output directory
 */

import { mkdir, writeFile } from "fs/promises";
import { dirname, join, relative } from "path";
import { $ } from "bun";

/** Inline image syntax: ![alt](url) */
const INLINE_IMAGE_RE = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;

function getExtensionFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.(jpe?g|png|gif|webp|svg|bmp|ico)(\?|$)/i);
    return match ? match[1].toLowerCase() : "png";
  } catch {
    return "png";
  }
}

/**
 * Downloads remote images referenced in markdown into runFolder/images/ and
 * rewrites image URLs to relative paths (images/<file>).
 */
async function localizeMarkdownImages(markdown: string, runFolderPath: string): Promise<string> {
  const imageUrls = [...new Set([...markdown.matchAll(INLINE_IMAGE_RE)].map((m) => m[2]))];
  if (imageUrls.length === 0) return markdown;

  const imagesDir = join(runFolderPath, "images");
  await mkdir(imagesDir, { recursive: true });

  const urlToLocal = new Map<string, string>();
  let index = 0;

  for (const imageUrl of imageUrls) {
    try {
      const res = await fetch(imageUrl, { redirect: "follow" });
      if (!res.ok) continue;
      const contentType = res.headers.get("content-type") ?? "";
      const ext =
        contentType.includes("jpeg") || contentType.includes("jpg")
          ? "jpg"
          : contentType.includes("png")
            ? "png"
            : contentType.includes("gif")
              ? "gif"
              : contentType.includes("webp")
                ? "webp"
                : contentType.includes("svg")
                  ? "svg"
                  : getExtensionFromUrl(imageUrl);
      const basename = `${index}.${ext}`;
      const filepath = join(imagesDir, basename);
      const buffer = Buffer.from(await res.arrayBuffer());
      await writeFile(filepath, buffer);
      urlToLocal.set(imageUrl, join("images", basename));
      index += 1;
    } catch {
      // Leave URL unchanged on fetch error
    }
  }

  if (urlToLocal.size === 0) return markdown;

  return markdown.replace(INLINE_IMAGE_RE, (_, alt: string, url: string) => {
    const local = urlToLocal.get(url);
    return local ? `![${alt}](${local})` : `![${alt}](${url})`;
  });
}

// Output directory relative to the api package
const OUTPUT_DIR = process.env.OUTPUT_DIR || join(dirname(import.meta.dir), "output");

/**
 * Generates a unique run folder name based on source, time, and random suffix
 */
function generateRunFolderName(source?: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const sanitizedSource = source
    ? `-${source
        .replace(/^https?:\/\//, "")
        .replace(/[^a-zA-Z0-9]/g, "-")
        .slice(0, 30)}`
    : "";
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `extract${sanitizedSource}-${timestamp}-${randomSuffix}`;
}

/**
 * Generates a markdown filename.
 */
function generateMarkdownFilename(source?: string): string {
  const sanitizedSource = source
    ? source
        .replace(/^https?:\/\//, "")
        .replace(/[^a-zA-Z0-9]/g, "-")
        .slice(0, 30)
    : "content";
  return `${sanitizedSource}.md`;
}

/**
 * Ensures the output directory exists
 */
async function ensureOutputDir(): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });
}

export interface EpubMetadata {
  title?: string;
  author?: string;
}

export async function saveEpub(
  content: string,
  source?: string,
  metadata?: EpubMetadata
): Promise<{ filename: string; path: string; savedAt: string }> {
  const { path } = await saveMarkdown(content, source, metadata);
  const epubPath = path.replace(".md", ".epub");
  const runFolderPath = dirname(path);
  await $`pandoc ${path} -o ${epubPath} --to epub3 --resource-path=${runFolderPath}`;

  return {
    filename: relative(OUTPUT_DIR, epubPath),
    path: epubPath,
    savedAt: new Date().toISOString(),
  };
}

/**
 * Saves markdown content to a file
 * Returns the filename and full path
 */
export async function saveMarkdown(
  content: string,
  source?: string,
  metadata?: EpubMetadata
): Promise<{ filename: string; path: string; savedAt: string }> {
  await ensureOutputDir();

  const runFolderName = generateRunFolderName(source);
  const runFolderPath = join(OUTPUT_DIR, runFolderName);
  await mkdir(runFolderPath, { recursive: true });

  const localizedContent = await localizeMarkdownImages(content, runFolderPath);

  const markdownFilename = generateMarkdownFilename(source);
  const filepath = join(runFolderPath, markdownFilename);
  const savedAt = new Date().toISOString();

  const title = metadata?.title || "Untitled";
  const author = metadata?.author || "Unknown";

  // Add metadata header to the markdown
  const header = `---
title: "${title}"
author: "${author}"
language: "en-US"
---

`;

  await writeFile(filepath, header + localizedContent, "utf-8");

  return {
    filename: join(runFolderName, markdownFilename),
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
