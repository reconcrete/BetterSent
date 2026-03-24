import { eq, and } from "drizzle-orm";

import { createExtractorService } from "../../services/extractor";
import { createScraperService } from "../../services/scraper";
import { createStorageService } from "../../services/storage";
import { createEmailService } from "../../services/email";
import { db } from "../../db";
import { kindleEmailAddress } from "@bettersent/db/schema";
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

  // In production, resolve kindle email first to fail fast if not configured
  const toEmail = isProductionEnv ? await getKindleEmail(userId, kindleEmailId) : null;
  if (toEmail) log.debug({ toEmail }, "Will send to");

  // Create history entry with processing status
  const historyId = await createSendHistoryEntry(userId, {
    type: "text",
    content: textContent,
    kindleEmailId,
  });

  try {
    log.debug("LLM process starting");
    const extractorService = createExtractorService();
    const startTime = Date.now();
    const { markdown, metadata } = await extractorService.extractContent(textContent);
    const llmDuration = Date.now() - startTime;
    log.debug({ duration: llmDuration }, "LLM process finished");
    log.debug({ title: metadata.title, author: metadata.author }, "Extracted metadata");

    // Update history with extracted metadata
    await updateSendHistoryEntry(historyId, {
      title: metadata.title,
      author: metadata.author,
      ...(toEmail && { kindleEmail: toEmail }),
    });

    log.debug("Saving EPUB");
    const storageService = createStorageService();
    const { filename, path, markdownPath, savedAt } = await storageService.saveEpub(markdown, "text", metadata);
    log.debug({ filename }, "EPUB saved");

    // Store file paths in history
    await updateSendHistoryEntry(historyId, { markdownPath, epubPath: path });

    // Send email only in production
    if (isProductionEnv && toEmail) {
      log.debug("Sending email");
      const emailService = createEmailService();
      const attachmentContent = (await storageService.getFile(path)).toString("base64");
      const emailFilename = getSentFilename(`${metadata.title}.epub`);
      await emailService.sendEmail(toEmail, metadata.title, "", [
        { filename: emailFilename, content: attachmentContent },
      ]);
      log.info({ to: toEmail, subject: metadata.title, filename: emailFilename }, "Email sent successfully");
    } else {
      log.info({ filename }, "Dev mode: skipping email, epub stored locally");
    }

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

  // In production, resolve kindle email first to fail fast if not configured
  const toEmail = isProductionEnv ? await getKindleEmail(userId, kindleEmailId) : null;
  if (toEmail) log.debug({ toEmail }, "Will send to");

  // Create history entry with processing status
  const historyId = await createSendHistoryEntry(userId, {
    type: "url",
    content: url,
    kindleEmailId,
  });

  try {
    log.debug("Scraping URL");
    const scraperService = createScraperService();
    const scrapeResult = await scraperService.scrapeUrl(url);
    log.debug({ contentLength: scrapeResult.markdown.length, needsLlmProcessing: scrapeResult.needsLlmProcessing }, "URL scraped");

    let markdown: string;
    let metadata: { title: string; author: string };

    if (scrapeResult.needsLlmProcessing) {
      log.debug("LLM process starting (fallback scraper used)");
      const extractorService = createExtractorService();
      const startTime = Date.now();
      const extracted = await extractorService.extractContent(scrapeResult.markdown);
      const llmDuration = Date.now() - startTime;
      log.debug({ duration: llmDuration }, "LLM process finished");
      markdown = extracted.markdown;
      metadata = extracted.metadata;
    } else {
      log.debug("Using Firecrawl markdown directly (skipping LLM)");
      markdown = scrapeResult.markdown;
      metadata = scrapeResult.metadata;
    }

    log.debug({ title: metadata.title, author: metadata.author }, "Extracted metadata");

    // Update history with extracted metadata
    await updateSendHistoryEntry(historyId, {
      title: metadata.title,
      author: metadata.author,
      ...(toEmail && { kindleEmail: toEmail }),
    });

    log.debug("Saving EPUB");
    const storageService = createStorageService();
    const { filename, path, markdownPath, savedAt } = await storageService.saveEpub(markdown, "url", metadata);
    log.debug({ filename }, "EPUB saved");

    // Store file paths in history
    await updateSendHistoryEntry(historyId, { markdownPath, epubPath: path });

    // Send email only in production
    if (isProductionEnv && toEmail) {
      const emailService = createEmailService();
      const attachmentContent = (await storageService.getFile(path)).toString("base64");
      const emailFilename = getSentFilename(`${metadata.title}.epub`);

      log.debug("Sending email");
      await emailService.sendEmail(toEmail, metadata.title, "This is a extract url email", [
        { filename: emailFilename, content: attachmentContent },
      ]);
      log.info({ to: toEmail, subject: metadata.title, filename: emailFilename }, "Email sent successfully");
    } else {
      log.info({ filename }, "Dev mode: skipping email, epub stored locally");
    }

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

const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|live\/)|youtu\.be\/)/;

export const extractYoutube = async (url: string, userId: string, kindleEmailId?: string) => {
  if (!YOUTUBE_URL_REGEX.test(url)) {
    throw new Error("Invalid YouTube URL. Please provide a valid YouTube video link.");
  }

  log.debug({ url }, "Received YouTube URL");

  const toEmail = isProductionEnv ? await getKindleEmail(userId, kindleEmailId) : null;
  if (toEmail) log.debug({ toEmail }, "Will send to");

  const historyId = await createSendHistoryEntry(userId, {
    type: "youtube",
    content: url,
    kindleEmailId,
  });

  try {
    log.debug("Scraping YouTube URL");
    const scraperService = createScraperService();
    const scrapeResult = await scraperService.scrapeUrl(url);
    log.debug({ contentLength: scrapeResult.markdown.length }, "YouTube page scraped");

    log.debug("LLM process starting (YouTube content)");
    const extractorService = createExtractorService();
    const startTime = Date.now();
    const { markdown, metadata } = await extractorService.extractYoutubeContent(scrapeResult.markdown);
    const llmDuration = Date.now() - startTime;
    log.debug({ duration: llmDuration }, "LLM process finished");
    log.debug({ title: metadata.title, author: metadata.author }, "Extracted metadata");

    await updateSendHistoryEntry(historyId, {
      title: metadata.title,
      author: metadata.author,
      ...(toEmail && { kindleEmail: toEmail }),
    });

    log.debug("Saving EPUB");
    const storageService = createStorageService();
    const { filename, path, markdownPath, savedAt } = await storageService.saveEpub(markdown, "youtube", metadata);
    log.debug({ filename }, "EPUB saved");

    await updateSendHistoryEntry(historyId, { markdownPath, epubPath: path });

    if (isProductionEnv && toEmail) {
      const emailService = createEmailService();
      const attachmentContent = (await storageService.getFile(path)).toString("base64");
      const emailFilename = getSentFilename(`${metadata.title}.epub`);

      log.debug("Sending email");
      await emailService.sendEmail(toEmail, metadata.title, "", [
        { filename: emailFilename, content: attachmentContent },
      ]);
      log.info({ to: toEmail, subject: metadata.title, filename: emailFilename }, "Email sent successfully");
    } else {
      log.info({ filename }, "Dev mode: skipping email, epub stored locally");
    }

    await updateSendHistoryEntry(historyId, { status: "completed" });

    return { markdown, metadata, filename, savedAt };
  } catch (error) {
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
    const emailService = createEmailService();

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
