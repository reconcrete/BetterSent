import fs from "fs";
import { eq, and } from "drizzle-orm";

import { extractContent, saveEpub, scrapeUrl } from "../../services";
import { EmailService } from "../../services/email";
import { db } from "../../db";
import { kindleEmailAddress } from "../../db/schema";
import { log } from "../../lib/logger";
import {
  createSendHistoryEntry,
  updateSendHistoryEntry,
} from "../history/history.service";

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
  } else {
    throw new Error("No Kindle email configured. Please add a Kindle email in settings.");
  }
};

export const extractText = async (textContent: string, userId: string, kindleEmailId?: string) => {
  log.debug({ contentLength: textContent.length }, "Received text content");

  // Get kindle email first to fail fast if not configured
  const toEmail = await getKindleEmail(userId, kindleEmailId);
  log.debug({ toEmail }, "Will send to");

  // Create history entry with processing status
  const historyId = await createSendHistoryEntry(userId, {
    type: "text",
    content: textContent,
    kindleEmailId,
  });

  try {
    log.debug("LLM process starting");
    const startTime = Date.now();
    const { markdown, metadata } = await extractContent(textContent);
    const llmDuration = Date.now() - startTime;
    log.debug({ duration: llmDuration }, "LLM process finished");
    log.debug({ title: metadata.title, author: metadata.author }, "Extracted metadata");

    // Update history with extracted metadata
    await updateSendHistoryEntry(historyId, {
      title: metadata.title,
      author: metadata.author,
      kindleEmail: toEmail,
    });

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

    // Update history to completed
    await updateSendHistoryEntry(historyId, { status: "completed" });

    return { markdown, metadata, filename, savedAt };
  } catch (error) {
    // Update history with error status
    await updateSendHistoryEntry(historyId, {
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Unknown error occurred",
    });
    throw error;
  }
};

export const extractUrl = async (url: string, userId: string, kindleEmailId?: string) => {
  log.debug({ url }, "Received URL");

  // Get kindle email first to fail fast if not configured
  const toEmail = await getKindleEmail(userId, kindleEmailId);
  log.debug({ toEmail }, "Will send to");

  // Create history entry with processing status
  const historyId = await createSendHistoryEntry(userId, {
    type: "url",
    content: url,
    kindleEmailId,
  });

  try {
    log.debug("Scraping URL");
    const textContent = await scrapeUrl(url);
    log.debug({ contentLength: textContent.length }, "URL scraped");

    log.debug("LLM process starting");
    const startTime = Date.now();
    const { markdown, metadata } = await extractContent(textContent);
    const llmDuration = Date.now() - startTime;
    log.debug({ duration: llmDuration }, "LLM process finished");
    log.debug({ title: metadata.title, author: metadata.author }, "Extracted metadata");

    // Update history with extracted metadata
    await updateSendHistoryEntry(historyId, {
      title: metadata.title,
      author: metadata.author,
      kindleEmail: toEmail,
    });

    log.debug("Saving EPUB");
    const { filename, path, savedAt } = await saveEpub(markdown, "url", metadata);
    log.debug({ filename }, "EPUB saved");

    const emailService = new EmailService();
    const attachmentContent = fs.readFileSync(path).toString("base64");
    const emailFilename = `${metadata.title}.epub`;

    log.debug("Sending email");
    await emailService.sendEmail(toEmail, metadata.title, "This is a extract url email", [
      { filename: emailFilename, content: attachmentContent },
    ]);
    log.info({ to: toEmail, subject: metadata.title, filename: emailFilename }, "Email sent successfully");

    // Update history to completed
    await updateSendHistoryEntry(historyId, { status: "completed" });

    return { markdown, metadata, filename, savedAt };
  } catch (error) {
    // Update history with error status
    await updateSendHistoryEntry(historyId, {
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Unknown error occurred",
    });
    throw error;
  }
};
