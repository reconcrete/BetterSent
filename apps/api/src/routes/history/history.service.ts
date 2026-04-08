import { db } from "../../db";
import { sendHistory, kindleEmailAddress, reference } from "@bettersent/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { log } from "../../lib/logger";
import { sendToUser } from "../../lib/ws";

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
 * Get all send history for a user, ordered by most recent first
 */
export const getSendHistory = async (userId: string): Promise<SendHistoryData[]> => {
  log.debug({ userId }, "Fetching send history");

  const history = await db
    .select({
      history: sendHistory,
      kindleLabel: kindleEmailAddress.label,
    })
    .from(sendHistory)
    .leftJoin(kindleEmailAddress, eq(sendHistory.kindleEmailId, kindleEmailAddress.id))
    .where(eq(sendHistory.userId, userId))
    .orderBy(desc(sendHistory.createdAt));

  log.debug({ userId, count: history.length }, "Found send history items");

  // Fetch all references for these history items in one query
  const historyIds = history.map((row) => row.history.id);
  const refsMap = await getReferencesMap(historyIds);

  return history.map((row) => toSendHistoryData(row.history, row.kindleLabel, refsMap.get(row.history.id) ?? []));
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
