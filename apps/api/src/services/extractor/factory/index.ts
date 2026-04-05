import OpenAI from "openai";

import { ExtractorService, DefuddleExtractor, FirecrawlExtractor } from "../implementation";
import type { ContentExtractor } from "../types";

export function createExtractorService(): ExtractorService {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  return new ExtractorService(
    new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
  );
}

export function createContentExtractor(): ContentExtractor {
  const apiKey = process.env.DEFUDDLE_API_KEY;
  if (!apiKey) {
    throw new Error("DEFUDDLE_API_KEY environment variable is required");
  }
  return new DefuddleExtractor(apiKey);
}

export function createFirecrawlExtractor(): ContentExtractor {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY environment variable is required");
  }
  return new FirecrawlExtractor(apiKey);
}
