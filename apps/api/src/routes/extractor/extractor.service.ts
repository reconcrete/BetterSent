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

const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;
const SUPPORTED_FILE_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "txt",
  "rtf",
  "htm",
  "html",
  "png",
  "gif",
  "jpg",
  "jpeg",
  "bmp",
  "epub",
]);

const isProductionEnv = process.env.NODE_ENV === "production";

const getSentFilename = (filename: string): string => {
  if (isProductionEnv) {
    return filename;
  }

  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex <= 0) {
    return `${filename} (dev)`;
  }

  const name = filename.slice(0, dotIndex);
  const extension = filename.slice(dotIndex);
  return `${name} (dev)${extension}`;
};

const validateDirectFile = (file: File) => {
  if (!file.name) {
    throw new Error("Uploaded file must have a filename.");
  }

  if (file.size <= 0) {
    throw new Error("Uploaded file is empty.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File size exceeds 200 MB limit.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !SUPPORTED_FILE_EXTENSIONS.has(extension)) {
    throw new Error(
      "Unsupported file type. Allowed: PDF, DOC, DOCX, TXT, RTF, HTM, HTML, PNG, GIF, JPG, JPEG, BMP, EPUB."
    );
  }
};

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
    const emailFilename = getSentFilename(`${metadata.title}.epub`);
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
    const emailFilename = getSentFilename(`${metadata.title}.epub`);

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

export const extractFile = async (file: File, userId: string, kindleEmailId?: string) => {
  validateDirectFile(file);
  log.debug({ filename: file.name, size: file.size }, "Received file for direct send");

  const toEmail = await getKindleEmail(userId, kindleEmailId);
  log.debug({ toEmail }, "Will send to");

  const historyId = await createSendHistoryEntry(userId, {
    type: "file",
    content: file.name,
    kindleEmailId,
  });

  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const attachmentContent = fileBuffer.toString("base64");
    const emailService = new EmailService();

    await updateSendHistoryEntry(historyId, {
      title: file.name,
      kindleEmail: toEmail,
    });

    await emailService.sendEmail(toEmail, file.name, "This is a extract file email", [
      { filename: getSentFilename(file.name), content: attachmentContent },
    ]);
    log.info({ to: toEmail, filename: file.name }, "File sent to Kindle successfully");

    await updateSendHistoryEntry(historyId, { status: "completed" });

    return {
      filename: file.name,
      sentAt: new Date().toISOString(),
    };
  } catch (error) {
    await updateSendHistoryEntry(historyId, {
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Unknown error occurred",
    });
    throw error;
  }
};
