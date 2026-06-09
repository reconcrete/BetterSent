import { defaultUrlTransform } from "react-markdown";

import type { Frontmatter } from "../types";

export const parseFrontmatter = (raw: string): Frontmatter => {
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) return { body: raw };

  const yaml = match[1];
  const readField = (key: string): string | undefined => {
    const fieldMatch = yaml.match(new RegExp(`^${key}\\s*:\\s*["']?(.+?)["']?\\s*$`, "m"));
    return fieldMatch?.[1].trim() || undefined;
  };

  return {
    title: readField("title"),
    author: readField("author"),
    body: raw.slice(match[0].length),
  };
};

export const previewUrlTransform = (url: string): string =>
  url.startsWith("data:image/") ? url : defaultUrlTransform(url);
