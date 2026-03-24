import type { ScrapeResult } from "../types";

export interface IScraperService {
  scrapeUrl(url: string): Promise<ScrapeResult>;
}
