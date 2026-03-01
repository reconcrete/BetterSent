import { ScraperService } from "../implementation";

export function createScraperService(): ScraperService {
  return new ScraperService(process.env.JINA_READER_BASE_URL);
}
