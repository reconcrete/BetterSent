import fs from "fs";
import { eq, and } from "drizzle-orm";

import { extractContent, saveEpub, scrapeUrl } from "../../services";
import { EmailService } from "../../services/email";
import { db } from "../../db";
import { kindleEmailAddress } from "../../db/schema";

/**
 * Get the kindle email address to send to.
 * If kindleEmailId is provided, use that specific one.
 * Otherwise, use the user's default kindle email.
 * Falls back to RESEND_TO_EMAIL env var if no kindle email is found.
 */
const getKindleEmail = async (userId: string, kindleEmailId?: string): Promise<string> => {
  let kindleEmail;

  if (kindleEmailId) {
    // Get specific kindle email by ID
    kindleEmail = await db
      .select()
      .from(kindleEmailAddress)
      .where(and(eq(kindleEmailAddress.id, kindleEmailId), eq(kindleEmailAddress.userId, userId)))
      .limit(1)
      .then((rows) => rows[0]);
  } else {
    // Get user's default kindle email
    kindleEmail = await db
      .select()
      .from(kindleEmailAddress)
      .where(and(eq(kindleEmailAddress.userId, userId), eq(kindleEmailAddress.isDefault, true)))
      .limit(1)
      .then((rows) => rows[0]);
  }

  if (kindleEmail) {
    return kindleEmail.email;
  }

  // Fallback to env var
  const fallbackEmail = process.env.RESEND_TO_EMAIL;
  if (!fallbackEmail) {
    throw new Error("No Kindle email configured. Please add a Kindle email in settings.");
  }
  return fallbackEmail;
};

export const extractText = async (textContent: string, userId: string, kindleEmailId?: string) => {
  console.log("📥 [extractText] Received text content, length:", textContent.length);

  // Get kindle email first to fail fast if not configured
  const toEmail = await getKindleEmail(userId, kindleEmailId);
  console.log(`📧 [extractText] Will send to: ${toEmail}`);

  console.log("🤖 [extractText] LLM process starting...");
  const startTime = Date.now();
  const { markdown, metadata } = await extractContent(textContent);
  const llmDuration = Date.now() - startTime;
  console.log(`✅ [extractText] LLM process finished in ${llmDuration}ms`);
  console.log(`📝 [extractText] Extracted metadata - Title: "${metadata.title}", Author: "${metadata.author}"`);

  console.log("📚 [extractText] Saving EPUB...");
  const { filename, path, savedAt } = await saveEpub(markdown, "text", metadata);
  console.log(`✅ [extractText] EPUB saved: ${filename}`);

  console.log("📧 [extractText] Sending email...");
  const emailService = new EmailService();
  const attachmentContent = fs.readFileSync(path).toString("base64");
  const emailFilename = `${metadata.title}.epub`;
  await emailService.sendEmail(toEmail, metadata.title, "", [
    { filename: emailFilename, content: attachmentContent },
  ]);
  console.log("✅ [extractText] Email sent successfully");

  return { markdown, metadata, filename, savedAt };
};

export const extractUrl = async (url: string, userId: string, kindleEmailId?: string) => {
  console.log("📥 [extractUrl] Received URL:", url);

  // Get kindle email first to fail fast if not configured
  const toEmail = await getKindleEmail(userId, kindleEmailId);
  console.log(`📧 [extractUrl] Will send to: ${toEmail}`);

  console.log("🔗 [extractUrl] Scraping URL...");
  const textContent = await scrapeUrl(url);
  console.log(`✅ [extractUrl] URL scraped, content length: ${textContent.length}`);

  console.log("🤖 [extractUrl] LLM process starting...");
  const startTime = Date.now();
  const { markdown, metadata } = await extractContent(textContent);
  const llmDuration = Date.now() - startTime;
  console.log(`✅ [extractUrl] LLM process finished in ${llmDuration}ms`);
  console.log(`📝 [extractUrl] Extracted metadata - Title: "${metadata.title}", Author: "${metadata.author}"`);

  console.log("📚 [extractUrl] Saving EPUB...");
  const { filename, path, savedAt } = await saveEpub(markdown, "url", metadata);
  console.log(`✅ [extractUrl] EPUB saved: ${filename}`);

  const emailService = new EmailService();
  const attachmentContent = fs.readFileSync(path).toString("base64");
  const emailFilename = `${metadata.title}.epub`;

  console.log("📧 [extractUrl] Sending email...");
  try {
    await emailService.sendEmail(toEmail, metadata.title, "This is a extract url email", [
      { filename: emailFilename, content: attachmentContent },
    ]);
    console.log("✅ [extractUrl] Email sent successfully");
  } catch (error) {
    console.error("❌ [extractUrl] Email error:", error);
  }

  return { markdown, metadata, filename, savedAt };
};
