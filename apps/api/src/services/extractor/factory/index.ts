import OpenAI from "openai";

import { ExtractorService } from "../implementation";

export function createExtractorService(): ExtractorService {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  return new ExtractorService(
    new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
  );
}
