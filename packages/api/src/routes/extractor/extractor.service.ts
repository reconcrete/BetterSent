import fs from "fs";

import { extractContent, saveEpub, scrapeUrl } from "../../services";
import { EmailService } from "../../services/email";

export const extractText = async (textContent: string) => {
  console.log("📥 [extractText] Received text content, length:", textContent.length);

  console.log("🤖 [extractText] LLM process starting...");
  const startTime = Date.now();
  const markdown = await extractContent(textContent);
  const llmDuration = Date.now() - startTime;
  console.log(`✅ [extractText] LLM process finished in ${llmDuration}ms`);

  console.log("📚 [extractText] Saving EPUB...");
  const { filename, path, savedAt } = await saveEpub(markdown, "text");
  console.log(`✅ [extractText] EPUB saved: ${filename}`);

  console.log("📧 [extractText] Sending email...");
  const emailService = new EmailService();
  const attachmentContent = fs.readFileSync(path).toString("base64");
  await emailService.sendEmail(process.env.RESEND_TO_EMAIL as string, "", "", [
    { filename, content: attachmentContent },
  ]);
  console.log("✅ [extractText] Email sent successfully");

  return { markdown, filename, savedAt };
};

export const extractUrl = async (url: string) => {
  console.log("📥 [extractUrl] Received URL:", url);

  console.log("🔗 [extractUrl] Scraping URL...");
  const textContent = await scrapeUrl(url);
  console.log(`✅ [extractUrl] URL scraped, content length: ${textContent.length}`);

  console.log("🤖 [extractUrl] LLM process starting...");
  const startTime = Date.now();
  const markdown = await extractContent(textContent);
  const llmDuration = Date.now() - startTime;
  console.log(`✅ [extractUrl] LLM process finished in ${llmDuration}ms`);

  console.log("📚 [extractUrl] Saving EPUB...");
  const { filename, path, savedAt } = await saveEpub(markdown, "url");
  console.log(`✅ [extractUrl] EPUB saved: ${filename}`);

  const emailService = new EmailService();
  const attachmentContent = fs.readFileSync(path).toString("base64");

  console.log("📧 [extractUrl] Sending email...");
  try {
    await emailService.sendEmail(process.env.RESEND_TO_EMAIL as string, "Extract URL", "This is a extract url email", [
      { filename: "Extracted Content.epub", content: attachmentContent },
    ]);
    console.log("✅ [extractUrl] Email sent successfully");
  } catch (error) {
    console.error("❌ [extractUrl] Email error:", error);
  }

  return { markdown, filename, savedAt };
};
