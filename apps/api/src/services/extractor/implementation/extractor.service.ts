import OpenAI from "openai";

import type { ContentMetadata, ExtractedContent } from "../types";
import { METADATA_SYSTEM_PROMPT, SYSTEM_PROMPT, YOUTUBE_SYSTEM_PROMPT } from "../constants";

export class ExtractorService {
  private readonly client: OpenAI;

  constructor(client: OpenAI) {
    this.client = client;
  }

  async extractContent(content: string): Promise<ExtractedContent> {
    const [markdown, metadata] = await Promise.all([
      this.extractMarkdown(content),
      this.extractMetadata(content),
    ]);

    return { markdown, metadata };
  }

  async extractMarkdown(content: string): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: "gpt-5-mini-2025-08-07",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content },
      ],
    });

    return completion.choices[0].message.content || "Failed to extract content";
  }

  async extractYoutubeContent(content: string): Promise<ExtractedContent> {
    const [markdown, metadata] = await Promise.all([
      this.extractYoutubeMarkdown(content),
      this.extractMetadata(content),
    ]);

    return { markdown, metadata };
  }

  private async extractYoutubeMarkdown(content: string): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: "gpt-5-mini-2025-08-07",
      messages: [
        { role: "system", content: YOUTUBE_SYSTEM_PROMPT },
        { role: "user", content },
      ],
    });

    return completion.choices[0].message.content || "Failed to extract content";
  }

  async extractMetadata(content: string): Promise<ContentMetadata> {
    const completion = await this.client.chat.completions.create({
      model: "gpt-5-mini-2025-08-07",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: METADATA_SYSTEM_PROMPT },
        { role: "user", content },
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
      return { author: "Unknown", title: "Untitled" };
    }
  }
}
