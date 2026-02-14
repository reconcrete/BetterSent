import OpenAI from "openai";

const SYSTEM_PROMPT = `You are an extraction and normalization engine.

Your task is to extract ONLY the primary content (e.g., article body, documentation text, or main readable content) from the provided input and output it as clean, well-structured Markdown.

CRITICAL RULES:
- Preserve the extracted content exactly as it appears in the source.
- Do NOT summarize, rewrite, rephrase, simplify, translate, or normalize wording.
- The output should be semantically identical to the original content.

CONTENT SELECTION:
- Extract only the main content body (e.g., article text, documentation sections).
- Explicitly EXCLUDE non-content elements such as:
  - Navigation menus
  - Headers/footers
  - Sidebars
  - Advertisements
  - Cookie banners
  - “Copy”, “Copy code”, “Copy text”, or similar UI labels
  - Buttons, icons, tooltips, or interactive UI instructions
  - Script/style tags or metadata

MARKDOWN CONVERSION:
- Convert structural elements to Markdown:
  - Headings → #, ##, ###
  - Paragraphs → blank-line-separated text
  - Lists → Markdown lists
  - Tables → Markdown tables where possible
- If the content is already valid Markdown, return it unchanged.

CODE BLOCK HANDLING (VERY IMPORTANT):
- Preserve code blocks EXACTLY as written in the source.
- Output code using fenced Markdown blocks with the correct language identifier.
- DO NOT:
  - HTML-escape characters inside code blocks
  - Convert '<', '>', '{', '}' into entities
  - Modify spacing, indentation, or formatting
- Decode any HTML entities found inside code blocks back to their literal characters.

HTML ENTITY HANDLING:
- Decode HTML entities (e.g., &lt;, &gt;, &#x3C;) into their literal characters in all extracted content.
- The final Markdown must contain human-readable text, not HTML entity encodings.

MEDIA:
- If images or media are part of the main content, include them using Markdown syntax:
  ![alt text](url)
- Ignore decorative or UI-related images.

OUTPUT CONSTRAINTS:
- Output ONLY the final Markdown.
- Do NOT include explanations, notes, or commentary.
- Do NOT add or remove content.
- If something is ambiguous, prefer fidelity to the original source.

The content to process is provided below:`;

const METADATA_SYSTEM_PROMPT = `You are a metadata extraction assistant. Analyze the provided content and extract:
1. The author's name - if explicitly mentioned in the content. If no author is found, return "Unknown".
2. A concise, descriptive title for the content - this should be suitable for an e-book title. Keep it short (max 60 characters), clear, and representative of the main topic.

Respond ONLY with valid JSON in this exact format:
{
  "author": "Author Name or Unknown",
  "title": "Concise Title Here"
}`;

export interface ContentMetadata {
  author: string;
  title: string;
}

export interface ExtractedContent {
  markdown: string;
  metadata: ContentMetadata;
}

export class ExtractorService {
  private static openaiClient: OpenAI | null = null;

  private getOpenAIClient(): OpenAI {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    if (!ExtractorService.openaiClient) {
      ExtractorService.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    return ExtractorService.openaiClient;
  }

  /**
   * Extracts metadata (author and title) from content using OpenAI
   */
  public async extractMetadata(content: string): Promise<ContentMetadata> {
    const openai = this.getOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini-2025-08-07",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: METADATA_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: content,
        },
      ],
    });

    const responseText = completion.choices[0].message.content || '{"author": "Unknown", "title": "Untitled"}';

    try {
      const parsed = JSON.parse(responseText) as ContentMetadata;
      return {
        author: parsed.author || "Unknown",
        title: parsed.title || "Untitled",
      };
    } catch {
      return {
        author: "Unknown",
        title: "Untitled",
      };
    }
  }

  /**
   * Extracts markdown content from text using OpenAI
   */
  public async extractMarkdown(content: string): Promise<string> {
    const openai = this.getOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini-2025-08-07",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: content,
        },
      ],
    });

    return completion.choices[0].message.content || "Failed to extract content";
  }

  /**
   * Extracts both markdown content and metadata from text content using OpenAI
   */
  public async extractContent(content: string): Promise<ExtractedContent> {
    const [markdown, metadata] = await Promise.all([
      this.extractMarkdown(content),
      this.extractMetadata(content),
    ]);

    return { markdown, metadata };
  }
}

export const extractorService = new ExtractorService();
