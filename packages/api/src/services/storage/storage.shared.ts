import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

import type { EpubMetadata } from "./types";

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

export function buildMarkdownHeader(metadata?: EpubMetadata): string {
  const title = metadata?.title || "Untitled";
  const author = metadata?.author || "Unknown";
  return `---
title: "${title}"
author: "${author}"
language: "en-US"
---

`;
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
      // Leave URL unchanged on fetch error.
    }
  }

  if (urlToLocal.size === 0) return markdown;

  return markdown.replace(INLINE_IMAGE_RE, (_, alt: string, url: string) => {
    const local = urlToLocal.get(url);
    return local ? `![${alt}](${local})` : `![${alt}](${url})`;
  });
}
