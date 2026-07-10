import { Defuddle } from "defuddle/node";

import type { ContentExtractor, ExtractedUrlContent } from "../types";
import { ExtractionError, toExtractionError } from "../lib/errors";
import { fetchPage, type FetchPageOptions } from "../lib/fetch-page";

/**
 * Runs Defuddle in-process against a page we fetch ourselves.
 *
 * Preferred over the hosted defuddle.md API because that service fetches from
 * a shared IP that publishers (notably Substack) rate-limit, which surfaces as
 * an opaque 502 regardless of the article.
 */
export class LocalDefuddleExtractor implements ContentExtractor {
  constructor(private readonly fetchOptions: FetchPageOptions = {}) {}

  async extractUrl(url: string): Promise<ExtractedUrlContent> {
    const { html, finalUrl } = await fetchPage(url, this.fetchOptions);

    let parsed;
    try {
      parsed = await Defuddle(html, finalUrl, { markdown: true });
    } catch (error) {
      throw toExtractionError(error, "local-defuddle");
    }

    const markdown = (parsed.content ?? "").trim();
    if (!markdown) {
      throw new ExtractionError("empty_content", "Defuddle found no article content", {
        source: "local-defuddle",
      });
    }

    return {
      markdown,
      metadata: {
        title: parsed.title?.trim() || "Untitled",
        author: parsed.author?.trim() || "Unknown",
      },
      needsLlmProcessing: false,
    };
  }
}
