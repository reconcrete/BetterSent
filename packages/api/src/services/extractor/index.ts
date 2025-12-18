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

const SYSTEM_PROMPT = `Your task is to extract the most important information from the provided content and present it in a clear, well-structured Markdown format.

Guidelines:
- The task is to keep the content at the original level of detail. There should be no changes to the content, because your main job is to present it in a Markdown format. If the content is already in Markdown format, you should return it as is. Content can be present as a form of html, text xml, etc. It may also include other information that is not relevant to the main content, you should ignore it
- Don't make the markdown format more complex than it already is in provided content.
- You may add your own comments or explanations to the content, if you see that the content is related to some image or other media and it won't be clear what it is without your explanation.

The content is present below:`;

/**
 * Extracts key information from text content using OpenAI
 */
export async function extractContent(content: string): Promise<string> {
  const openai = getOpenAIClient();

  const completion = await openai.completions.create({
    model: "gpt-oss-120b",
    prompt: SYSTEM_PROMPT + "\n\n" + content,
    temperature: 0.3,
    max_tokens: 4096,
    stream: false,
  });

  const result = completion.choices[0].text;

  if (!result) {
    throw new Error("Failed to get response from OpenAI");
  }

  return result;
}
