import { ensureHttpUrl, extractTextFromHtml, fetchHtml, fetchViaJinaReader } from "../lib";

const DEFAULT_JINA_BASE_URL = "https://r.jina.ai/";

export class ScraperService {
  private readonly jinaBaseUrl: string;

  constructor(jinaBaseUrl?: string) {
    this.jinaBaseUrl = jinaBaseUrl ?? DEFAULT_JINA_BASE_URL;
  }

  async scrapeUrl(url: string): Promise<string> {
    const parsedUrl = ensureHttpUrl(url);
    const scrapeErrors: string[] = [];

    try {
      return await fetchViaJinaReader(this.jinaBaseUrl, parsedUrl.toString());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Jina Reader error";
      scrapeErrors.push(message);
    }

    try {
      const html = await fetchHtml(parsedUrl.toString());
      return extractTextFromHtml(html);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown direct fetch error";
      scrapeErrors.push(message);
    }

    throw new Error(`Failed to scrape URL: ${scrapeErrors.join(" | ")}`);
  }
}
