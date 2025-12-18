/**
 * Content Extractor Service
 * Uses OpenAI to extract key information from text and format as Markdown
 */

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

const SYSTEM_PROMPT = `You are an expert content analyst. Your task is to extract the most important information from the provided content and present it in a clear, well-structured Markdown format.

Guidelines:
- Identify the main topic and key points
- Extract important facts, data, and insights
- Organize information hierarchically with headers
- Use bullet points for lists of related items
- Include any notable quotes or statistics
- Preserve important names, dates, and numbers
- Remove redundant or irrelevant information
- Keep the summary comprehensive but concise

Output format:
- Start with a brief summary (1-2 sentences)
- Use ## for main sections
- Use ### for subsections if needed
- Use bullet points and numbered lists appropriately
- Bold **important terms** and *italicize* emphasis where appropriate`;

/**
 * Extracts key information from text content using OpenAI
 */
export async function extractContent(content: string): Promise<string> {
  const openai = getOpenAIClient();

  // Truncate content if too long (GPT-4 has ~128k token limit, but we'll be conservative)
  const maxLength = 100000;
  const truncatedContent = content.length > maxLength ? content.slice(0, maxLength) + "\n\n[Content truncated...]" : content;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Please extract and summarize the key information from the following content:\n\n${truncatedContent}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });

  const result = completion.choices[0]?.message?.content;

  if (!result) {
    throw new Error("Failed to get response from OpenAI");
  }

  return result;
}

