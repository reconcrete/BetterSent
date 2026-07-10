import OpenAI from "openai";

import { log } from "../../../lib/logger";
import {
  ExtractorService,
  DefuddleExtractor,
  FirecrawlExtractor,
  FallbackExtractor,
  LocalDefuddleExtractor,
  type ExtractorTier,
} from "../implementation";
import type { ContentExtractor } from "../types";

export function createExtractorService(): ExtractorService {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  return new ExtractorService(
    new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
  );
}

/**
 * URL extraction, cheapest and most reliable tier first:
 *
 *  1. local     — we fetch the page and parse it in-process. Free, one hop.
 *  2. defuddle  — hosted defuddle.md. Different egress IP, so it can clear a
 *                 block that hit our own address.
 *  3. firecrawl — proxied browser rendering. Paid, and the only tier that gets
 *                 past aggressive bot protection (Cloudflare et al).
 *
 * Only the local tier is mandatory; hosted tiers are added when configured.
 */
export function createContentExtractor(): ContentExtractor {
  const tiers: ExtractorTier[] = [{ name: "local", extractor: new LocalDefuddleExtractor() }];

  const defuddleApiKey = process.env.DEFUDDLE_API_KEY;
  if (defuddleApiKey) {
    tiers.push({ name: "defuddle-api", extractor: new DefuddleExtractor(defuddleApiKey) });
  }

  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
  if (firecrawlApiKey) {
    tiers.push({ name: "firecrawl", extractor: new FirecrawlExtractor(firecrawlApiKey) });
  }

  if (tiers.length === 1) {
    log.warn("No DEFUDDLE_API_KEY or FIRECRAWL_API_KEY set: bot-blocked pages will fail without a fallback");
  }

  return new FallbackExtractor(tiers);
}

export function createFirecrawlExtractor(): ContentExtractor {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY environment variable is required");
  }
  return new FirecrawlExtractor(apiKey);
}
