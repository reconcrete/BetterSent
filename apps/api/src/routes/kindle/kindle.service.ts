import { db } from "../../db";
import { kindleEmailAddress } from "@bettersent/db/schema";
import { eq, and } from "drizzle-orm";
import { log } from "../../lib/logger";

export type KindleEmailData = {
  id: string;
  email: string;
  label: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

const toKindleEmailData = (row: typeof kindleEmailAddress.$inferSelect): KindleEmailData => ({
  id: row.id,
  email: row.email,
  label: row.label,
  isDefault: row.isDefault,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const getKindleEmails = async (userId: string): Promise<KindleEmailData[]> => {
  log.debug({ userId }, "Fetching Kindle emails");

  const emails = await db
    .select()
    .from(kindleEmailAddress)
    .where(eq(kindleEmailAddress.userId, userId));

  log.debug({ userId, count: emails.length }, "Found Kindle emails");

  return emails.map(toKindleEmailData);
};

export const getKindleEmailById = async (
  userId: string,
  emailId: string
): Promise<KindleEmailData | null> => {
  log.debug({ emailId }, "Fetching Kindle email");

  const [email] = await db
    .select()
    .from(kindleEmailAddress)
    .where(
      and(eq(kindleEmailAddress.id, emailId), eq(kindleEmailAddress.userId, userId))
    );

  if (!email) {
    return null;
  }

  log.debug({ emailId }, "Kindle email found");

  return toKindleEmailData(email);
};

export const createKindleEmail = async (
  userId: string,
  data: { email: string; label?: string; isDefault?: boolean }
): Promise<KindleEmailData> => {
  log.debug({ userId, email: data.email }, "Creating Kindle email");

  // Check if this should be the default (first email or explicitly set)
  const existingEmails = await db
    .select()
    .from(kindleEmailAddress)
    .where(eq(kindleEmailAddress.userId, userId));

  const shouldBeDefault = data.isDefault || existingEmails.length === 0;

  // If setting as default, unset other defaults
  if (shouldBeDefault && existingEmails.length > 0) {
    await db
      .update(kindleEmailAddress)
      .set({ isDefault: false })
      .where(eq(kindleEmailAddress.userId, userId));
  }

  const [newEmail] = await db
    .insert(kindleEmailAddress)
    .values({
      id: crypto.randomUUID(),
      email: data.email,
      label: data.label ?? null,
      isDefault: shouldBeDefault,
      userId,
    })
    .returning();

  log.info({ id: newEmail.id, email: newEmail.email }, "Kindle email created");

  return toKindleEmailData(newEmail);
};

export const updateKindleEmail = async (
  userId: string,
  emailId: string,
  data: { email?: string; label?: string | null }
): Promise<KindleEmailData | null> => {
  log.debug({ emailId }, "Updating Kindle email");

  // First verify the email belongs to the user
  const [existing] = await db
    .select()
    .from(kindleEmailAddress)
    .where(
      and(eq(kindleEmailAddress.id, emailId), eq(kindleEmailAddress.userId, userId))
    );

  if (!existing) {
    return null;
  }

  const [updatedEmail] = await db
    .update(kindleEmailAddress)
    .set({
      ...(data.email !== undefined && { email: data.email }),
      ...(data.label !== undefined && { label: data.label }),
      updatedAt: new Date(),
    })
    .where(and(eq(kindleEmailAddress.id, emailId), eq(kindleEmailAddress.userId, userId)))
    .returning();

  log.debug({ emailId }, "Kindle email updated");

  return toKindleEmailData(updatedEmail);
};

export const deleteKindleEmail = async (
  userId: string,
  emailId: string
): Promise<boolean> => {
  log.debug({ emailId }, "Deleting Kindle email");

  // First verify the email belongs to the user and get its state
  const [existing] = await db
    .select()
    .from(kindleEmailAddress)
    .where(
      and(eq(kindleEmailAddress.id, emailId), eq(kindleEmailAddress.userId, userId))
    );

  if (!existing) {
    return false;
  }

  const wasDefault = existing.isDefault;

  await db.delete(kindleEmailAddress).where(and(eq(kindleEmailAddress.id, emailId), eq(kindleEmailAddress.userId, userId)));

  // If the deleted email was the default, set another one as default
  if (wasDefault) {
    const [firstRemaining] = await db
      .select()
      .from(kindleEmailAddress)
      .where(eq(kindleEmailAddress.userId, userId))
      .limit(1);

    if (firstRemaining) {
      await db
        .update(kindleEmailAddress)
        .set({ isDefault: true })
        .where(eq(kindleEmailAddress.id, firstRemaining.id));
    }
  }

  log.info({ emailId }, "Kindle email deleted");

  return true;
};

export const setDefaultKindleEmail = async (
  userId: string,
  emailId: string
): Promise<KindleEmailData | null> => {
  log.debug({ emailId }, "Setting default Kindle email");

  // First verify the email belongs to the user
  const [existing] = await db
    .select()
    .from(kindleEmailAddress)
    .where(
      and(eq(kindleEmailAddress.id, emailId), eq(kindleEmailAddress.userId, userId))
    );

  if (!existing) {
    return null;
  }

  // Unset all defaults for this user
  await db
    .update(kindleEmailAddress)
    .set({ isDefault: false })
    .where(eq(kindleEmailAddress.userId, userId));

  // Set the new default
  const [updatedEmail] = await db
    .update(kindleEmailAddress)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(eq(kindleEmailAddress.id, emailId))
    .returning();

  log.info({ emailId }, "Default Kindle email set");

  return toKindleEmailData(updatedEmail);
};
