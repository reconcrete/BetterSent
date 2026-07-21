import { eq, and } from "drizzle-orm";

import { createExtractorService, createContentExtractor, createFirecrawlExtractor } from "../../services/extractor";
import { createStorageService } from "../../services/storage";
import { createEmailService } from "../../services/email";
import { db } from "../../db";
import { kindleEmailAddress } from "@bettersent/db/schema";
import { log } from "../../lib/logger";
import { createSendHistoryEntry, updateAndNotifyHistory, saveReferences } from "../history/history.service";
import { createMarkdownParserService } from "../../services/markdown-parser";
import { createPdfParserService } from "../../services/pdf-parser";
import { isProduction } from "../../shared/env";
import { KindleEmailNotConfiguredError } from "./extractor.errors";
import type { PdfConversionMode } from "./extractor.schema";

const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;
const MARKDOWN_FILE_EXTENSIONS = new Set(["md", "markdown"]);
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
  "md",
  "markdown",
]);

const getFileExtension = (filename: string): string | undefined =>
  filename.split(".").pop()?.toLowerCase();

const stripFileExtension = (filename: string): string => {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex <= 0 ? filename : filename.slice(0, dotIndex);
};

export type BookDetailsOverrides = { title?: string; author?: string };

const applyBookDetailsOverrides = (
  metadata: { title: string; author: string },
  overrides?: BookDetailsOverrides,
): { title: string; author: string } => ({
  title: overrides?.title?.trim() || metadata.title,
  author: overrides?.author?.trim() || metadata.author,
});

type MarkdownMetadata = { title: string; author: string; body: string };

const parseMarkdownMetadata = (content: string, fallbackTitle: string): MarkdownMetadata => {
  let body = content;
  let title: string | null = null;
  let author: string | null = null;

  const frontmatterMatch = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (frontmatterMatch) {
    body = content.slice(frontmatterMatch[0].length);
    const yaml = frontmatterMatch[1];

    const titleMatch = yaml.match(/^title\s*:\s*["']?(.+?)["']?\s*$/m);
    if (titleMatch) title = titleMatch[1].trim();

    const authorMatch = yaml.match(/^author\s*:\s*["']?(.+?)["']?\s*$/m);
    if (authorMatch) author = authorMatch[1].trim();
  }

  if (!title) {
    const headingMatch = body.match(/^#\s+(.+?)\s*$/m);
    if (headingMatch) title = headingMatch[1].trim();
  }

  return {
    title: title || fallbackTitle,
    author: author || "Unknown",
    body,
  };
};

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

  const extension = getFileExtension(file.name);
  if (!extension || !SUPPORTED_FILE_EXTENSIONS.has(extension)) {
    throw new Error(
      "Unsupported file type. Allowed: PDF, DOC, DOCX, TXT, RTF, HTM, HTML, PNG, GIF, JPG, JPEG, BMP, EPUB, MD, MARKDOWN.",
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
    throw new KindleEmailNotConfiguredError();
  }
};

// --- Background processors ---

// Amazon delivers to Kindle asynchronously (~30s after email); delay completion to match real arrival time.
const KINDLE_DELIVERY_DELAY_MS = 30_000;

const markCompletedAfterDelivery = async (historyId: string, userId: string, wasEmailSent: boolean) => {
  if (wasEmailSent) {
    log.debug({ historyId, delayMs: KINDLE_DELIVERY_DELAY_MS }, "Awaiting Kindle delivery before marking completed");
    await new Promise((resolve) => setTimeout(resolve, KINDLE_DELIVERY_DELAY_MS));
  }
  await updateAndNotifyHistory(historyId, userId, { status: "completed" });
};

const processText = async (
  historyId: string,
  textContent: string,
  userId: string,
  toEmail: string | null,
  overrides?: BookDetailsOverrides,
) => {
  log.debug("LLM process starting");
  const extractorService = createExtractorService();
  const { markdown, metadata: extractedMetadata } = await extractorService.extractContent(textContent);
  const metadata = applyBookDetailsOverrides(extractedMetadata, overrides);

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

  await markCompletedAfterDelivery(historyId, userId, isProduction && !!toEmail);
};

const processUrl = async (
  historyId: string,
  url: string,
  userId: string,
  toEmail: string | null,
  overrides?: BookDetailsOverrides,
) => {
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

  metadata = applyBookDetailsOverrides(metadata, overrides);

  await updateAndNotifyHistory(historyId, userId, {
    title: metadata.title,
    author: metadata.author,
    ...(toEmail && { kindleEmail: toEmail }),
  });

  // Extract and save references from markdown
  const markdownParserService = createMarkdownParserService();
  const links = markdownParserService.parseLinks(markdown);
  if (links.length > 0) {
    try {
      await saveReferences(historyId, links);
    } catch (e) {
      log.warn({ error: e, historyId }, "Failed to save references");
    }
  }

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

  await markCompletedAfterDelivery(historyId, userId, isProduction && !!toEmail);
};

const processYoutube = async (
  historyId: string,
  url: string,
  userId: string,
  toEmail: string | null,
  overrides?: BookDetailsOverrides,
) => {
  log.debug("Extracting YouTube URL content");
  const contentExtractor = createFirecrawlExtractor();
  const extractResult = await contentExtractor.extractUrl(url);
  log.debug({ contentLength: extractResult.markdown.length }, "YouTube page extracted");

  // Truncate to avoid OpenAI JSON payload size issues
  const MAX_CONTENT_LENGTH = 500_000;
  const truncatedContent =
    extractResult.markdown.length > MAX_CONTENT_LENGTH
      ? extractResult.markdown.slice(0, MAX_CONTENT_LENGTH)
      : extractResult.markdown;

  log.debug("LLM process starting (YouTube content)");
  const extractorService = createExtractorService();
  const { markdown, metadata: extractedMetadata } = await extractorService.extractYoutubeContent(truncatedContent);
  const metadata = applyBookDetailsOverrides(extractedMetadata, overrides);

  await updateAndNotifyHistory(historyId, userId, {
    title: metadata.title,
    author: metadata.author,
    ...(toEmail && { kindleEmail: toEmail }),
  });

  // Extract and save references from markdown
  const markdownParserService = createMarkdownParserService();
  const links = markdownParserService.parseLinks(markdown);
  if (links.length > 0) {
    try {
      await saveReferences(historyId, links);
    } catch (e) {
      log.warn({ error: e, historyId }, "Failed to save references");
    }
  }

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

  await markCompletedAfterDelivery(historyId, userId, isProduction && !!toEmail);
};

const processFile = async (
  historyId: string,
  fileBuffer: Buffer,
  fileName: string,
  userId: string,
  toEmail: string,
  overrides?: BookDetailsOverrides,
) => {
  // Kindle uses the attachment filename as the document title, so a title
  // override renames the sent file (keeping the original extension).
  const titleOverride = overrides?.title?.trim();
  const authorOverride = overrides?.author?.trim();
  const extension = getFileExtension(fileName);
  const sentFileName = titleOverride && extension ? `${titleOverride}.${extension}` : fileName;

  await updateAndNotifyHistory(historyId, userId, {
    title: titleOverride || fileName,
    ...(authorOverride && { author: authorOverride }),
    kindleEmail: toEmail,
  });

  const attachmentContent = fileBuffer.toString("base64");
  const emailService = createEmailService();
  await emailService.sendEmail(toEmail, sentFileName, "", [
    { filename: getSentFilename(sentFileName), content: attachmentContent },
  ]);
  log.info({ to: toEmail, filename: sentFileName }, "File sent to Kindle successfully");

  await markCompletedAfterDelivery(historyId, userId, true);
};

const processPdfAsEpub = async (
  historyId: string,
  fileBuffer: Buffer,
  fileName: string,
  userId: string,
  toEmail: string | null,
  includeOriginalPdf: boolean,
  overrides?: BookDetailsOverrides,
) => {
  const metadata = applyBookDetailsOverrides(
    { title: stripFileExtension(fileName), author: "Unknown" },
    overrides,
  );
  const { title, author } = metadata;

  await updateAndNotifyHistory(historyId, userId, {
    title,
    author,
    ...(toEmail && { kindleEmail: toEmail }),
  });

  log.debug({ fileName }, "Parsing PDF to markdown");
  const pdfParserService = createPdfParserService();
  const markdown = await pdfParserService.parseToMarkdown(fileBuffer);
  log.debug({ fileName, markdownLength: markdown.length }, "PDF parsed to markdown");

  const markdownParserService = createMarkdownParserService();
  const links = markdownParserService.parseLinks(markdown);
  if (links.length > 0) {
    try {
      await saveReferences(historyId, links);
    } catch (e) {
      log.warn({ error: e, historyId }, "Failed to save references");
    }
  }

  const storageService = createStorageService();
  const { filename, path, markdownPath } = await storageService.saveEpub(markdown, "file", metadata);
  log.debug({ filename }, "EPUB saved");

  await updateAndNotifyHistory(historyId, userId, { markdownPath, epubPath: path });

  if (isProduction && toEmail) {
    const emailService = createEmailService();
    const epubContent = (await storageService.getFile(path)).toString("base64");
    const attachments = [{ filename: getSentFilename(`${title}.epub`), content: epubContent }];
    if (includeOriginalPdf) {
      attachments.push({ filename: getSentFilename(`${title}.pdf`), content: fileBuffer.toString("base64") });
    }
    await emailService.sendEmail(toEmail, title, "", attachments);
    log.info(
      { to: toEmail, subject: title, attachmentCount: attachments.length },
      "Email sent successfully",
    );
  } else {
    log.info({ filename }, "Dev mode: skipping email, epub stored locally");
  }

  await markCompletedAfterDelivery(historyId, userId, isProduction && !!toEmail);
};

const processMarkdownFile = async (
  historyId: string,
  fileBuffer: Buffer,
  fileName: string,
  userId: string,
  toEmail: string | null,
  overrides?: BookDetailsOverrides,
) => {
  const rawContent = fileBuffer.toString("utf-8");
  const parsed = parseMarkdownMetadata(rawContent, stripFileExtension(fileName));
  const { body } = parsed;
  const metadata = applyBookDetailsOverrides(parsed, overrides);
  const { title, author } = metadata;

  await updateAndNotifyHistory(historyId, userId, {
    title,
    author,
    ...(toEmail && { kindleEmail: toEmail }),
  });

  const markdownParserService = createMarkdownParserService();
  const links = markdownParserService.parseLinks(body);
  if (links.length > 0) {
    try {
      await saveReferences(historyId, links);
    } catch (e) {
      log.warn({ error: e, historyId }, "Failed to save references");
    }
  }

  const storageService = createStorageService();
  const { filename, path, markdownPath } = await storageService.saveEpub(body, "file", metadata);
  log.debug({ filename }, "EPUB saved");

  await updateAndNotifyHistory(historyId, userId, { markdownPath, epubPath: path });

  if (isProduction && toEmail) {
    const emailService = createEmailService();
    const attachmentContent = (await storageService.getFile(path)).toString("base64");
    const emailFilename = getSentFilename(`${title}.epub`);
    await emailService.sendEmail(toEmail, title, "", [
      { filename: emailFilename, content: attachmentContent },
    ]);
    log.info({ to: toEmail, subject: title, filename: emailFilename }, "Email sent successfully");
  } else {
    log.info({ filename }, "Dev mode: skipping email, epub stored locally");
  }

  await markCompletedAfterDelivery(historyId, userId, isProduction && !!toEmail);
};

// --- Public API (returns immediately) ---

const runInBackground = (fn: () => Promise<void>, historyId: string, userId: string) => {
  fn().catch(async (error) => {
    const message = error instanceof Error ? error.message : String(error);
    log.error({ err: error, historyId }, `Background processing failed: ${message}`);
    try {
      await updateAndNotifyHistory(historyId, userId, {
        status: "error",
        errorMessage: message,
      });
    } catch (notifyError) {
      log.error({ err: notifyError, historyId }, "Failed to update error status");
    }
  });
};

export const extractText = async (
  textContent: string,
  userId: string,
  kindleEmailId?: string,
  overrides?: BookDetailsOverrides,
) => {
  log.debug({ contentLength: textContent.length }, "Received text content");
  const toEmail = isProduction ? await getKindleEmail(userId, kindleEmailId) : null;
  const historyId = await createSendHistoryEntry(userId, { type: "text", content: textContent, kindleEmailId });

  runInBackground(() => processText(historyId, textContent, userId, toEmail, overrides), historyId, userId);
  return { historyId };
};

export const extractUrl = async (
  url: string,
  userId: string,
  kindleEmailId?: string,
  overrides?: BookDetailsOverrides,
) => {
  log.debug({ url }, "Received URL");
  const toEmail = isProduction ? await getKindleEmail(userId, kindleEmailId) : null;
  const historyId = await createSendHistoryEntry(userId, { type: "url", content: url, kindleEmailId });

  runInBackground(() => processUrl(historyId, url, userId, toEmail, overrides), historyId, userId);
  return { historyId };
};

export const extractYoutube = async (
  url: string,
  userId: string,
  kindleEmailId?: string,
  overrides?: BookDetailsOverrides,
) => {
  const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|live\/)|youtu\.be\/)/;

  if (!youtubeUrlRegex.test(url)) {
    throw new Error("Invalid YouTube URL. Please provide a valid YouTube video link.");
  }

  log.debug({ url }, "Received YouTube URL");
  const toEmail = isProduction ? await getKindleEmail(userId, kindleEmailId) : null;
  const historyId = await createSendHistoryEntry(userId, { type: "youtube", content: url, kindleEmailId });

  runInBackground(() => processYoutube(historyId, url, userId, toEmail, overrides), historyId, userId);
  return { historyId };
};

export const sendTestEpub = async (userId: string, kindleEmailId?: string) => {
  log.debug("Sending test EPUB");
  const toEmail = await getKindleEmail(userId, kindleEmailId);
  const historyId = await createSendHistoryEntry(userId, { type: "text", content: "Test EPUB", kindleEmailId });

  runInBackground(async () => {
    const now = new Date();
    const time = now.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
    const title = `Bettersent Test — ${time}`;
    const author = "Bettersent";
    const markdown = `# Welcome to Bettersent\n\nThis is a test document to verify your Kindle delivery is working correctly.\n\nIf you can read this on your Kindle, everything is set up properly!`;

    await updateAndNotifyHistory(historyId, userId, { title, author, kindleEmail: toEmail });

    const storageService = createStorageService();
    const { path, markdownPath } = await storageService.saveEpub(markdown, "test", { title, author });
    log.debug("Test EPUB saved");

    await updateAndNotifyHistory(historyId, userId, { markdownPath, epubPath: path });

    const emailService = createEmailService();
    const attachmentContent = (await storageService.getFile(path)).toString("base64");
    await emailService.sendEmail(toEmail, title, "", [
      { filename: getSentFilename(`${title}.epub`), content: attachmentContent },
    ]);
    log.info({ to: toEmail }, "Test EPUB sent successfully");

    await markCompletedAfterDelivery(historyId, userId, true);
  }, historyId, userId);

  return { historyId };
};

export const extractFile = async (
  file: File,
  userId: string,
  kindleEmailId?: string,
  overrides?: BookDetailsOverrides,
  pdfConversion?: PdfConversionMode,
) => {
  validateDirectFile(file);
  log.debug({ filename: file.name, size: file.size, pdfConversion }, "Received file for direct send");

  const extension = getFileExtension(file.name);
  const isMarkdown = !!extension && MARKDOWN_FILE_EXTENSIONS.has(extension);
  const convertPdf =
    extension === "pdf" && (pdfConversion === "epub" || pdfConversion === "both");

  const historyId = await createSendHistoryEntry(userId, { type: "file", content: file.name, kindleEmailId });

  // Read file buffer before backgrounding since File may not be available later
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  if (isMarkdown) {
    const toEmail = isProduction ? await getKindleEmail(userId, kindleEmailId) : null;
    runInBackground(
      () => processMarkdownFile(historyId, fileBuffer, file.name, userId, toEmail, overrides),
      historyId,
      userId,
    );
  } else if (convertPdf) {
    const toEmail = isProduction ? await getKindleEmail(userId, kindleEmailId) : null;
    runInBackground(
      () =>
        processPdfAsEpub(
          historyId,
          fileBuffer,
          file.name,
          userId,
          toEmail,
          pdfConversion === "both",
          overrides,
        ),
      historyId,
      userId,
    );
  } else {
    const toEmail = await getKindleEmail(userId, kindleEmailId);
    runInBackground(
      () => processFile(historyId, fileBuffer, file.name, userId, toEmail, overrides),
      historyId,
      userId,
    );
  }
  return { historyId };
};
