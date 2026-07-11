import { posix } from "path";

import { db } from "../../db";
import { sendHistory, kindleEmailAddress, reference } from "@bettersent/db/schema";
import { eq, and, count, desc, inArray } from "drizzle-orm";
import { log } from "../../lib/logger";
import { sendToUser } from "../../lib/ws";
import type { IStorageService } from "../../services/storage";

export type SendHistoryStatus = "pending" | "processing" | "completed" | "error";

export type SendHistoryData = {
  id: string;
  type: "url" | "text" | "file" | "youtube" | "topic";
  content: string;
  title: string | null;
  author: string | null;
  status: SendHistoryStatus;
  errorMessage: string | null;
  kindleLabel: string | null;
  hasPreview: boolean;
  references: { url: string; title: string | null }[];
  createdAt: string;
  updatedAt: string;
};

export type SendHistoryPage = {
  items: SendHistoryData[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export const toSendHistoryData = (
  row: typeof sendHistory.$inferSelect,
  kindleLabel: string | null,
  references: { url: string; title: string | null }[] = [],
): SendHistoryData => ({
  id: row.id,
  type: row.type as "url" | "text" | "file" | "youtube" | "topic",
  content: row.content,
  title: row.title,
  author: row.author,
  status: row.status as SendHistoryStatus,
  errorMessage: row.errorMessage,
  kindleLabel,
  hasPreview: !!row.markdownPath,
  references,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/**
 * Get a page of send history for a user, ordered by most recent first
 */
export const getSendHistory = async (
  userId: string,
  { page, pageSize }: { page: number; pageSize: number },
): Promise<SendHistoryPage> => {
  log.debug({ userId, page, pageSize }, "Fetching send history");

  const [totals] = await db
    .select({ total: count() })
    .from(sendHistory)
    .where(eq(sendHistory.userId, userId));

  const total = totals?.total ?? 0;

  const history = await db
    .select({
      history: sendHistory,
      kindleLabel: kindleEmailAddress.label,
    })
    .from(sendHistory)
    .leftJoin(kindleEmailAddress, eq(sendHistory.kindleEmailId, kindleEmailAddress.id))
    .where(eq(sendHistory.userId, userId))
    // id breaks ties so rows can't shuffle between pages when timestamps collide
    .orderBy(desc(sendHistory.createdAt), desc(sendHistory.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  log.debug({ userId, page, count: history.length, total }, "Found send history items");

  // Fetch all references for these history items in one query
  const historyIds = history.map((row) => row.history.id);
  const refsMap = await getReferencesMap(historyIds);

  return {
    items: history.map((row) =>
      toSendHistoryData(row.history, row.kindleLabel, refsMap.get(row.history.id) ?? []),
    ),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
};

/**
 * Create a new send history entry
 */
export const createSendHistoryEntry = async (
  userId: string,
  data: {
    type: "url" | "text" | "file" | "youtube" | "topic";
    content: string;
    kindleEmailId?: string;
  }
): Promise<string> => {
  log.debug({ userId, type: data.type }, "Creating send history entry");

  // Get the kindle email address for display
  let kindleEmail: string | null = null;
  if (data.kindleEmailId) {
    const [kindle] = await db
      .select()
      .from(kindleEmailAddress)
      .where(
        and(
          eq(kindleEmailAddress.id, data.kindleEmailId),
          eq(kindleEmailAddress.userId, userId)
        )
      )
      .limit(1);
    kindleEmail = kindle?.email ?? null;
  } else {
    // Get default kindle email
    const [kindle] = await db
      .select()
      .from(kindleEmailAddress)
      .where(
        and(
          eq(kindleEmailAddress.userId, userId),
          eq(kindleEmailAddress.isDefault, true)
        )
      )
      .limit(1);
    kindleEmail = kindle?.email ?? null;
  }

  // Truncate content for storage (keep first 500 chars for text)
  const truncatedContent = data.type === "url" || data.type === "youtube" ? data.content : data.content.slice(0, 500);

  const id = crypto.randomUUID();

  await db.insert(sendHistory).values({
    id,
    userId,
    type: data.type,
    content: truncatedContent,
    status: "processing",
    kindleEmailId: data.kindleEmailId ?? null,
    kindleEmail,
  });

  log.info({ id, type: data.type }, "Send history entry created");

  return id;
};

/**
 * Update send history entry status and metadata
 */
export const updateSendHistoryEntry = async (
  historyId: string,
  data: {
    status?: SendHistoryStatus;
    title?: string;
    author?: string;
    errorMessage?: string;
    kindleEmail?: string;
    markdownPath?: string;
    epubPath?: string;
  }
): Promise<void> => {
  log.debug({ historyId, status: data.status }, "Updating send history entry");

  await db
    .update(sendHistory)
    .set({
      ...(data.status !== undefined && { status: data.status }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.author !== undefined && { author: data.author }),
      ...(data.errorMessage !== undefined && { errorMessage: data.errorMessage }),
      ...(data.kindleEmail !== undefined && { kindleEmail: data.kindleEmail }),
      ...(data.markdownPath !== undefined && { markdownPath: data.markdownPath }),
      ...(data.epubPath !== undefined && { epubPath: data.epubPath }),
      updatedAt: new Date(),
    })
    .where(eq(sendHistory.id, historyId));

  log.debug({ historyId }, "Send history entry updated");
};

/**
 * Get a single send history entry with ownership check
 */
export const getHistoryEntry = async (
  historyId: string,
  userId: string
) => {
  const [entry] = await db
    .select()
    .from(sendHistory)
    .where(and(eq(sendHistory.id, historyId), eq(sendHistory.userId, userId)))
    .limit(1);

  return entry ?? null;
};

/**
 * Get a single send history entry with kindle label (for WebSocket notifications)
 */
export const getHistoryEntryWithLabel = async (
  historyId: string,
  userId: string
): Promise<SendHistoryData | null> => {
  const [row] = await db
    .select({
      history: sendHistory,
      kindleLabel: kindleEmailAddress.label,
    })
    .from(sendHistory)
    .leftJoin(kindleEmailAddress, eq(sendHistory.kindleEmailId, kindleEmailAddress.id))
    .where(and(eq(sendHistory.id, historyId), eq(sendHistory.userId, userId)))
    .limit(1);

  if (!row) return null;

  const refs = await db
    .select({ url: reference.url, title: reference.title })
    .from(reference)
    .where(eq(reference.historyId, historyId));

  return toSendHistoryData(row.history, row.kindleLabel, refs);
};

/**
 * Update a history entry and push a WebSocket notification to the user
 */
export const updateAndNotifyHistory = async (
  historyId: string,
  userId: string,
  data: Parameters<typeof updateSendHistoryEntry>[1]
) => {
  await updateSendHistoryEntry(historyId, data);
  const entry = await getHistoryEntryWithLabel(historyId, userId);
  if (entry) {
    sendToUser(userId, { type: "history:updated", data: entry });
  }
};

/**
 * Save extracted references (outgoing links) for a history entry
 */
export const saveReferences = async (
  historyId: string,
  links: { url: string; title: string }[]
): Promise<void> => {
  if (links.length === 0) return;

  await db.insert(reference).values(
    links.map((link) => ({
      id: crypto.randomUUID(),
      historyId,
      url: link.url,
      title: link.title,
    }))
  );

  log.debug({ historyId, count: links.length }, "References saved");
};

const RELATIVE_IMAGE_RE = /!\[([^\]]*)\]\((?!https?:\/\/|data:)([^)\s]+)\)/g;

const IMAGE_MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
};

const MAX_INLINE_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * The preview markdown stored by the pipeline references images by relative path
 * (e.g. `images/0.jpg`) that live alongside the markdown file in storage. A browser
 * can't resolve those, so before returning the preview we load each one from storage
 * and inline it as a base64 data URI. Absolute http(s) images are left untouched.
 */
export const inlinePreviewImages = async (
  content: string,
  markdownPath: string,
  storageService: IStorageService,
): Promise<string> => {
  const relativePaths = [
    ...new Set([...content.matchAll(RELATIVE_IMAGE_RE)].map((match) => match[2])),
  ];
  if (relativePaths.length === 0) return content;

  const baseDir = posix.dirname(markdownPath.split("\\").join("/"));
  const dataUriByPath = new Map<string, string>();

  await Promise.all(
    relativePaths.map(async (relativePath) => {
      const normalized = posix.normalize(relativePath);
      // Guard against escaping the run folder via traversal.
      if (normalized.startsWith("..") || posix.isAbsolute(normalized)) return;

      const ext = normalized.split(".").pop()?.toLowerCase() ?? "";
      const mime = IMAGE_MIME_BY_EXT[ext];
      if (!mime) return;

      const key = posix.join(baseDir, normalized);
      try {
        const buffer = await storageService.getFile(key);
        if (buffer.byteLength > MAX_INLINE_IMAGE_BYTES) return;
        dataUriByPath.set(relativePath, `data:${mime};base64,${buffer.toString("base64")}`);
      } catch (error) {
        log.warn({ error, key }, "Failed to inline preview image");
      }
    }),
  );

  if (dataUriByPath.size === 0) return content;

  return content.replace(RELATIVE_IMAGE_RE, (whole, alt: string, url: string) => {
    const dataUri = dataUriByPath.get(url);
    return dataUri ? `![${alt}](${dataUri})` : whole;
  });
};

/**
 * Batch-fetch references for multiple history items, grouped by historyId
 */
const getReferencesMap = async (
  historyIds: string[]
): Promise<Map<string, { url: string; title: string | null }[]>> => {
  const map = new Map<string, { url: string; title: string | null }[]>();
  if (historyIds.length === 0) return map;

  const rows = await db
    .select({
      historyId: reference.historyId,
      url: reference.url,
      title: reference.title,
    })
    .from(reference)
    .where(inArray(reference.historyId, historyIds));

  for (const row of rows) {
    const list = map.get(row.historyId);
    if (list) {
      list.push({ url: row.url, title: row.title });
    } else {
      map.set(row.historyId, [{ url: row.url, title: row.title }]);
    }
  }

  return map;
};
