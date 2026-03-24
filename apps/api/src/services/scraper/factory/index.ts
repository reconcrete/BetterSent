import { FirecrawlScraperService } from "../implementation";
import type { IScraperService } from "../interface";

export function createScraperService(): IScraperService {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY environment variable is required");
  }
  return new FirecrawlScraperService(apiKey);
}
