export interface ScrapeResult {
  markdown: string;
  metadata: { title: string; author: string };
  needsLlmProcessing: boolean;
}
