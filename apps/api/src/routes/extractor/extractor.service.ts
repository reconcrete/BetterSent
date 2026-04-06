import { eq, and } from "drizzle-orm";

import { createExtractorService, createContentExtractor } from "../../services/extractor";
import { createStorageService } from "../../services/storage";
import { createEmailService } from "../../services/email";
import { db } from "../../db";
import { kindleEmailAddress } from "@bettersent/db/schema";
import { log } from "../../lib/logger";
import { createSendHistoryEntry, updateAndNotifyHistory } from "../history/history.service";
import { isProduction } from "../../shared/env";

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

const getSentFilename = (filename: string): string => {
  if (isProduction) {
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
      "Unsupported file type. Allowed: PDF, DOC, DOCX, TXT, RTF, HTM, HTML, PNG, GIF, JPG, JPEG, BMP, EPUB.",
    );
  }
};

/**
 * Get the kindle email address to send to.
 * If kindleEmailId is provided, use that specific one.
 * Otherwise, use the user's default kindle email.
 */
export const getKindleEmail = async (userId: string, kindleEmailId?: string): Promise<string> => {
  let kindleEmail;

  if (kindleEmailId) {
    kindleEmail = await db
      .select()
      .from(kindleEmailAddress)
      .where(and(eq(kindleEmailAddress.id, kindleEmailId), eq(kindleEmailAddress.userId, userId)))
      .limit(1)
      .then((rows) => rows[0]);
  } else {
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

// --- Background processors ---

const processText = async (historyId: string, textContent: string, userId: string, toEmail: string | null) => {
  log.debug("LLM process starting");
  const extractorService = createExtractorService();
  const { markdown, metadata } = await extractorService.extractContent(textContent);

  await updateAndNotifyHistory(historyId, userId, {
    title: metadata.title,
    author: metadata.author,
    ...(toEmail && { kindleEmail: toEmail }),
  });

  const storageService = createStorageService();
  const { filename, path, markdownPath } = await storageService.saveEpub(markdown, "text", metadata);
  log.debug({ filename }, "EPUB saved");

  await updateAndNotifyHistory(historyId, userId, { markdownPath, epubPath: path });

  if (isProduction && toEmail) {
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

  await updateAndNotifyHistory(historyId, userId, { status: "completed" });
};

const processUrl = async (historyId: string, url: string, userId: string, toEmail: string | null) => {
  log.debug("Extracting URL content");
  const contentExtractor = createContentExtractor();
  const extractResult = await contentExtractor.extractUrl(url);
  log.debug(
    { contentLength: extractResult.markdown.length, needsLlmProcessing: extractResult.needsLlmProcessing },
    "URL content extracted",
  );

  let markdown: string;
  let metadata: { title: string; author: string };

  if (extractResult.needsLlmProcessing) {
    log.debug("LLM process starting (content needs processing)");
    const extractorService = createExtractorService();
    const extracted = await extractorService.extractContent(extractResult.markdown);
    markdown = extracted.markdown;
    metadata = extracted.metadata;
  } else {
    log.debug("Using extracted markdown directly (skipping LLM)");
    markdown = extractResult.markdown;
    metadata = extractResult.metadata;
  }

  await updateAndNotifyHistory(historyId, userId, {
    title: metadata.title,
    author: metadata.author,
    ...(toEmail && { kindleEmail: toEmail }),
  });

  const storageService = createStorageService();
  const { filename, path, markdownPath } = await storageService.saveEpub(markdown, "url", metadata);
  log.debug({ filename }, "EPUB saved");

  await updateAndNotifyHistory(historyId, userId, { markdownPath, epubPath: path });

  if (isProduction && toEmail) {
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

  await updateAndNotifyHistory(historyId, userId, { status: "completed" });
};

const processYoutube = async (historyId: string, url: string, userId: string, toEmail: string | null) => {
  log.debug("Extracting YouTube URL content");
  const contentExtractor = createContentExtractor();
  const extractResult = await contentExtractor.extractUrl(url);
  log.debug({ contentLength: extractResult.markdown.length }, "YouTube page extracted");

  log.debug("LLM process starting (YouTube content)");
  const extractorService = createExtractorService();
  const { markdown, metadata } = await extractorService.extractYoutubeContent(extractResult.markdown);

  await updateAndNotifyHistory(historyId, userId, {
    title: metadata.title,
    author: metadata.author,
    ...(toEmail && { kindleEmail: toEmail }),
  });

  const storageService = createStorageService();
  const { filename, path, markdownPath } = await storageService.saveEpub(markdown, "youtube", metadata);
  log.debug({ filename }, "EPUB saved");

  await updateAndNotifyHistory(historyId, userId, { markdownPath, epubPath: path });

  if (isProduction && toEmail) {
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

  await updateAndNotifyHistory(historyId, userId, { status: "completed" });
};

const processTopic = async (historyId: string, topic: string, userId: string, toEmail: string | null) => {
  log.debug("LLM topic generation starting");
  const extractorService = createExtractorService();
  const { markdown, metadata } = await extractorService.generateTopicContent(topic);

  await updateAndNotifyHistory(historyId, userId, {
    title: metadata.title,
    author: metadata.author,
    ...(toEmail && { kindleEmail: toEmail }),
  });

  const storageService = createStorageService();
  const { filename, path, markdownPath } = await storageService.saveEpub(markdown, "topic", metadata);
  log.debug({ filename }, "EPUB saved");

  await updateAndNotifyHistory(historyId, userId, { markdownPath, epubPath: path });

  if (isProduction && toEmail) {
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

  await updateAndNotifyHistory(historyId, userId, { status: "completed" });
};

const processFile = async (
  historyId: string,
  fileBuffer: Buffer,
  fileName: string,
  userId: string,
  toEmail: string,
) => {
  await updateAndNotifyHistory(historyId, userId, {
    title: fileName,
    kindleEmail: toEmail,
  });

  const attachmentContent = fileBuffer.toString("base64");
  const emailService = createEmailService();
  await emailService.sendEmail(toEmail, fileName, "", [
    { filename: getSentFilename(fileName), content: attachmentContent },
  ]);
  log.info({ to: toEmail, filename: fileName }, "File sent to Kindle successfully");

  await updateAndNotifyHistory(historyId, userId, { status: "completed" });
};

// --- Public API (returns immediately) ---

const runInBackground = (fn: () => Promise<void>, historyId: string, userId: string) => {
  fn().catch(async (error) => {
    log.error({ error, historyId }, "Background processing failed");
    try {
      await updateAndNotifyHistory(historyId, userId, {
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } catch (notifyError) {
      log.error({ error: notifyError, historyId }, "Failed to update error status");
    }
  });
};

export const extractText = async (textContent: string, userId: string, kindleEmailId?: string) => {
  log.debug({ contentLength: textContent.length }, "Received text content");
  const toEmail = isProduction ? await getKindleEmail(userId, kindleEmailId) : null;
  const historyId = await createSendHistoryEntry(userId, { type: "text", content: textContent, kindleEmailId });

  runInBackground(() => processText(historyId, textContent, userId, toEmail), historyId, userId);
  return { historyId };
};

export const extractUrl = async (url: string, userId: string, kindleEmailId?: string) => {
  log.debug({ url }, "Received URL");
  const toEmail = isProduction ? await getKindleEmail(userId, kindleEmailId) : null;
  const historyId = await createSendHistoryEntry(userId, { type: "url", content: url, kindleEmailId });

  runInBackground(() => processUrl(historyId, url, userId, toEmail), historyId, userId);
  return { historyId };
};

export const extractYoutube = async (url: string, userId: string, kindleEmailId?: string) => {
  const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|live\/)|youtu\.be\/)/;

  if (!youtubeUrlRegex.test(url)) {
    throw new Error("Invalid YouTube URL. Please provide a valid YouTube video link.");
  }

  log.debug({ url }, "Received YouTube URL");
  const toEmail = isProduction ? await getKindleEmail(userId, kindleEmailId) : null;
  const historyId = await createSendHistoryEntry(userId, { type: "youtube", content: url, kindleEmailId });

  runInBackground(() => processYoutube(historyId, url, userId, toEmail), historyId, userId);
  return { historyId };
};

export const extractTopic = async (topic: string, userId: string, kindleEmailId?: string) => {
  log.debug({ topicLength: topic.length }, "Received topic for generation");
  const toEmail = isProduction ? await getKindleEmail(userId, kindleEmailId) : null;
  const historyId = await createSendHistoryEntry(userId, { type: "topic", content: topic, kindleEmailId });

  runInBackground(() => processTopic(historyId, topic, userId, toEmail), historyId, userId);
  return { historyId };
};

export const extractFile = async (file: File, userId: string, kindleEmailId?: string) => {
  validateDirectFile(file);
  log.debug({ filename: file.name, size: file.size }, "Received file for direct send");

  const toEmail = await getKindleEmail(userId, kindleEmailId);
  const historyId = await createSendHistoryEntry(userId, { type: "file", content: file.name, kindleEmailId });

  // Read file buffer before backgrounding since File may not be available later
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  runInBackground(() => processFile(historyId, fileBuffer, file.name, userId, toEmail), historyId, userId);
  return { historyId };
};
