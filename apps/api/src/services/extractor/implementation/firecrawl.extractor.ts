import Firecrawl from "@mendable/firecrawl-js";

import type { ContentExtractor, ExtractedUrlContent } from "../types";
import { ensureHttpUrl, extractTextFromHtml, fetchHtml } from "../../scraper/lib";

export class FirecrawlExtractor implements ContentExtractor {
  private readonly firecrawl: Firecrawl;

  constructor(apiKey: string) {
    this.firecrawl = new Firecrawl({ apiKey });
  }

  async extractUrl(url: string): Promise<ExtractedUrlContent> {
    const parsedUrl = ensureHttpUrl(url);
    const scrapeErrors: string[] = [];

    try {
      const result = await this.firecrawl.scrape(parsedUrl.toString(), {
        formats: ["markdown"],
      });

      if (result.markdown) {
        return {
          markdown: result.markdown,
          metadata: {
            title: result.metadata?.title || "Untitled",
            author: "Unknown",
          },
          needsLlmProcessing: false,
        };
      }

      scrapeErrors.push("Firecrawl returned empty markdown");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Firecrawl error";
      scrapeErrors.push(message);
    }

    try {
      const html = await fetchHtml(parsedUrl.toString());
      const text = extractTextFromHtml(html);
      return {
        markdown: text,
        metadata: { title: "Untitled", author: "Unknown" },
        needsLlmProcessing: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown direct fetch error";
      scrapeErrors.push(message);
    }

    throw new Error(`Failed to extract URL: ${scrapeErrors.join(" | ")}`);
  }
}
