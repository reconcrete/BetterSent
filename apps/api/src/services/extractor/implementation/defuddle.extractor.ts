import type { ContentExtractor, ExtractedUrlContent } from "../types";
import { ensureHttpUrl } from "../../scraper/lib";

export class DefuddleExtractor implements ContentExtractor {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private parseFrontmatter(raw: string): { frontmatter: Record<string, string>; content: string } {
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
      return { frontmatter: {}, content: raw };
    }

    const frontmatter: Record<string, string> = {};
    for (const line of match[1].split("\n")) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      frontmatter[key] = value;
    }

    return { frontmatter, content: match[2].trim() };
  }

  async extractUrl(url: string): Promise<ExtractedUrlContent> {
    const parsedUrl = ensureHttpUrl(url);

    const response = await fetch(`https://defuddle.md/${parsedUrl.toString()}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Defuddle API error: ${response.status} ${response.statusText}`);
    }

    const raw = await response.text();

    if (!raw.trim()) {
      throw new Error("Defuddle API returned empty content");
    }

    const { frontmatter, content } = this.parseFrontmatter(raw);

    return {
      markdown: content,
      metadata: {
        title: frontmatter.title || "Untitled",
        author: frontmatter.author || "Unknown",
      },
      needsLlmProcessing: false,
    };
  }
}
