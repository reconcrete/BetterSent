export interface ContentMetadata {
  author: string;
  title: string;
}

export interface ExtractedContent {
  markdown: string;
  metadata: ContentMetadata;
}

export interface ExtractedUrlContent {
  markdown: string;
  metadata: ContentMetadata;
  needsLlmProcessing: boolean;
}

export interface ContentExtractor {
  extractUrl(url: string): Promise<ExtractedUrlContent>;
}
