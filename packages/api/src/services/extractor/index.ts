import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

const SYSTEM_PROMPT = `Your task is to convert the provided content into clean, well-structured Markdown format while preserving every detail exactly as it appears in the original. Do not shorten, summarize, rephrase, or alter any part of the content—output it verbatim where possible, just formatted appropriately.

Guidelines:
- Preserve the full original level of detail. If the content is already in Markdown, return it unchanged. Otherwise, adapt formats like HTML, plain text, XML, or other structures into equivalent Markdown (e.g., convert <h1> to #, <p> to paragraphs, <ul> to bullet lists, etc.).
- Ignore any irrelevant surrounding information (e.g., ads, navigation menus, metadata, scripts, copy content buttons, or boilerplate) and focus only on the core article or main content body.
- Do not add, remove, or modify any text from the main content. Only use Markdown syntax to improve readability if it's not already formatted that way.
- If the content references images, media, or embeds (e.g., via URLs or alt text), include Markdown image syntax like ![description](url).
- Output only the formatted Markdown content—do not include additional commentary unless clarifying media.

The content is provided below:`;

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

/**
 * Extracts metadata (author and title) from content using OpenAI
 */
export async function extractMetadata(content: string): Promise<ContentMetadata> {
  const openai = getOpenAIClient();

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
export async function extractMarkdown(content: string): Promise<string> {
  const openai = getOpenAIClient();

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
export async function extractContent(content: string): Promise<ExtractedContent> {
  const [markdown, metadata] = await Promise.all([extractMarkdown(content), extractMetadata(content)]);

  return { markdown, metadata };
}
