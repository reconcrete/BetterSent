export interface ContentMetadata {
  author: string;
  title: string;
}

export interface ExtractedContent {
  markdown: string;
  metadata: ContentMetadata;
}
