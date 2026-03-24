import { ScraperService } from "../implementation";

export function createScraperService(): ScraperService {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY environment variable is required");
  }
  return new ScraperService(apiKey);
}
