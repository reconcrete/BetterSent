import { db } from "../../db";
import { sendHistory, kindleEmailAddress } from "@bettersent/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { log } from "../../lib/logger";

export type SendHistoryStatus = "pending" | "processing" | "completed" | "error";

export type SendHistoryData = {
  id: string;
  type: "url" | "text" | "file" | "youtube" | "topic";
  content: string;
  title: string | null;
  author: string | null;
  status: SendHistoryStatus;
  errorMessage: string | null;
  kindleEmail: string | null;
  hasPreview: boolean;
  createdAt: string;
  updatedAt: string;
};

const toSendHistoryData = (row: typeof sendHistory.$inferSelect): SendHistoryData => ({
  id: row.id,
  type: row.type as "url" | "text" | "file" | "youtube" | "topic",
  content: row.content,
  title: row.title,
  author: row.author,
  status: row.status as SendHistoryStatus,
  errorMessage: row.errorMessage,
  kindleEmail: row.kindleEmail,
  hasPreview: !!row.markdownPath,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/**
 * Get all send history for a user, ordered by most recent first
 */
export const getSendHistory = async (userId: string): Promise<SendHistoryData[]> => {
  log.debug({ userId }, "Fetching send history");

  const history = await db
    .select()
    .from(sendHistory)
    .where(eq(sendHistory.userId, userId))
    .orderBy(desc(sendHistory.createdAt));

  log.debug({ userId, count: history.length }, "Found send history items");

  return history.map(toSendHistoryData);
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
