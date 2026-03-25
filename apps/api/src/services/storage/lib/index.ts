import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { $ } from "bun";

import type { EpubMetadata } from "../types";
import { INLINE_IMAGE_RE } from "../constants";
import { DEFAULT_USER_AGENT } from "../../scraper/constants";

export function getExtensionFromUrl(url: string): string {
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
export async function localizeMarkdownImages(markdown: string, runFolderPath: string): Promise<string> {
  const imageUrls = [...new Set([...markdown.matchAll(INLINE_IMAGE_RE)].map((m) => m[2]))];
  if (imageUrls.length === 0) return markdown;

  const imagesDir = join(runFolderPath, "images");
  await mkdir(imagesDir, { recursive: true });

  const urlToLocal = new Map<string, string>();
  let index = 0;

  for (const imageUrl of imageUrls) {
    try {
      const res = await fetch(imageUrl, {
        redirect: "follow",
        headers: {
          "User-Agent": DEFAULT_USER_AGENT,
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          Referer: imageUrl,
        },
      });
      if (!res.ok) continue;
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/")) continue;
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

export function generateRunFolderName(source?: string): string {
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

export function generateMarkdownFilename(source?: string): string {
  const sanitizedSource = source
    ? source
        .replace(/^https?:\/\//, "")
        .replace(/[^a-zA-Z0-9]/g, "-")
        .slice(0, 30)
    : "content";
  return `${sanitizedSource}.md`;
}

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export function buildFrontmatter(metadata?: EpubMetadata): string {
  const title = metadata?.title || "Untitled";
  const author = metadata?.author || "Unknown";
  return `---
title: "${title}"
author: "${author}"
language: "en-US"
---

`;
}

export interface LocalBuildResult {
  runFolderName: string;
  runFolderPath: string;
  markdownFilename: string;
  markdownPath: string;
}

/**
 * Builds a markdown file locally: creates run folder, localizes images,
 * writes the .md file with frontmatter.
 */
export async function buildMarkdownLocally(
  content: string,
  outputDir: string,
  source?: string,
  metadata?: EpubMetadata,
): Promise<LocalBuildResult> {
  await ensureDir(outputDir);

  const runFolderName = generateRunFolderName(source);
  const runFolderPath = join(outputDir, runFolderName);
  await ensureDir(runFolderPath);

  const localizedContent = await localizeMarkdownImages(content, runFolderPath);

  const markdownFilename = generateMarkdownFilename(source);
  const markdownPath = join(runFolderPath, markdownFilename);

  const header = buildFrontmatter(metadata);
  await writeFile(markdownPath, header + localizedContent, "utf-8");

  return { runFolderName, runFolderPath, markdownFilename, markdownPath };
}

/**
 * Runs pandoc on a local markdown file to produce an EPUB.
 * Returns the path to the generated .epub file.
 */
export async function buildEpubLocally(markdownPath: string, runFolderPath: string): Promise<string> {
  const epubPath = markdownPath.replace(".md", ".epub");
  await $`pandoc ${markdownPath} -o ${epubPath} --to epub3 --resource-path=${runFolderPath}`;
  return epubPath;
}
