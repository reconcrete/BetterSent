import fs from "fs";
import { eq, and } from "drizzle-orm";

import { extractContent, saveEpub, scrapeUrl } from "../../services";
import { EmailService } from "../../services/email";
import { db } from "../../db";
import { kindleEmailAddress } from "../../db/schema";
import { log } from "../../lib/logger";

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
  log.debug({ contentLength: textContent.length }, "Received text content");

  // Get kindle email first to fail fast if not configured
  const toEmail = await getKindleEmail(userId, kindleEmailId);
  log.debug({ toEmail }, "Will send to");

  log.debug("LLM process starting");
  const startTime = Date.now();
  const { markdown, metadata } = await extractContent(textContent);
  const llmDuration = Date.now() - startTime;
  log.debug({ duration: llmDuration }, "LLM process finished");
  log.debug({ title: metadata.title, author: metadata.author }, "Extracted metadata");

  log.debug("Saving EPUB");
  const { filename, path, savedAt } = await saveEpub(markdown, "text", metadata);
  log.debug({ filename }, "EPUB saved");

  log.debug("Sending email");
  const emailService = new EmailService();
  const attachmentContent = fs.readFileSync(path).toString("base64");
  const emailFilename = `${metadata.title}.epub`;
  await emailService.sendEmail(toEmail, metadata.title, "", [
    { filename: emailFilename, content: attachmentContent },
  ]);
  log.info({ to: toEmail, subject: metadata.title, filename: emailFilename }, "Email sent successfully");

  return { markdown, metadata, filename, savedAt };
};

export const extractUrl = async (url: string, userId: string, kindleEmailId?: string) => {
  log.debug({ url }, "Received URL");

  // Get kindle email first to fail fast if not configured
  const toEmail = await getKindleEmail(userId, kindleEmailId);
  log.debug({ toEmail }, "Will send to");

  log.debug("Scraping URL");
  const textContent = await scrapeUrl(url);
  log.debug({ contentLength: textContent.length }, "URL scraped");

  log.debug("LLM process starting");
  const startTime = Date.now();
  const { markdown, metadata } = await extractContent(textContent);
  const llmDuration = Date.now() - startTime;
  log.debug({ duration: llmDuration }, "LLM process finished");
  log.debug({ title: metadata.title, author: metadata.author }, "Extracted metadata");

  log.debug("Saving EPUB");
  const { filename, path, savedAt } = await saveEpub(markdown, "url", metadata);
  log.debug({ filename }, "EPUB saved");

  const emailService = new EmailService();
  const attachmentContent = fs.readFileSync(path).toString("base64");
  const emailFilename = `${metadata.title}.epub`;

  log.debug("Sending email");
  try {
    await emailService.sendEmail(toEmail, metadata.title, "This is a extract url email", [
      { filename: emailFilename, content: attachmentContent },
    ]);
    log.info({ to: toEmail, subject: metadata.title, filename: emailFilename }, "Email sent successfully");
  } catch (error) {
    log.error({ error, to: toEmail }, "Failed to send email");
  }

  return { markdown, metadata, filename, savedAt };
};
