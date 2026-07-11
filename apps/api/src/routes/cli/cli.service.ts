import { randomUUID, randomBytes, createHash } from "node:crypto";
import { and, eq, lt } from "drizzle-orm";

import { db } from "../../db";
import { cliDeviceCode, cliToken, user as userTable } from "@bettersent/db/schema";
import {
  AuthorizationDeniedError,
  AuthorizationPendingError,
  DeviceCodeExpiredError,
  DeviceCodeNotFoundError,
} from "./cli.errors";

// Seconds a user code stays valid, and how often the CLI is asked to poll.
export const DEVICE_CODE_TTL_SECONDS = 15 * 60;
export const DEVICE_POLL_INTERVAL_SECONDS = 3;

const TOKEN_PREFIX = "bs_";
// Ambiguous characters (0/O, 1/I) are left out so the code is easy to read out loud and retype.
const USER_CODE_ALPHABET = "BCDFGHJKLMNPQRSTVWXZ23456789";

const generateUserCode = () => {
  const bytes = randomBytes(8);
  const chars = Array.from(bytes, (byte) => USER_CODE_ALPHABET[byte % USER_CODE_ALPHABET.length]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
};

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const normalizeUserCode = (userCode: string) => userCode.trim().toUpperCase();

export const getWebAppUrl = () =>
  process.env.WEB_APP_URL || process.env.CORS_ORIGIN || "http://localhost:5173";

/** Starts a device authorization grant. Called unauthenticated by `bettersent login`. */
export async function createDeviceCode(hostname?: string) {
  // Opportunistically drop grants nobody ever completed.
  await db.delete(cliDeviceCode).where(lt(cliDeviceCode.expiresAt, new Date()));

  const deviceCode = randomBytes(32).toString("hex");
  const userCode = generateUserCode();
  const expiresAt = new Date(Date.now() + DEVICE_CODE_TTL_SECONDS * 1000);

  await db.insert(cliDeviceCode).values({
    id: randomUUID(),
    deviceCode,
    userCode,
    hostname: hostname?.slice(0, 100) || null,
    expiresAt,
  });

  const verificationUrl = `${getWebAppUrl()}/device`;

  return {
    deviceCode,
    userCode,
    verificationUrl,
    verificationUrlComplete: `${verificationUrl}?user_code=${encodeURIComponent(userCode)}`,
    expiresIn: DEVICE_CODE_TTL_SECONDS,
    interval: DEVICE_POLL_INTERVAL_SECONDS,
  };
}

/** Details shown on the browser approval screen. Requires a signed-in browser session. */
export async function getDeviceCodeByUserCode(userCode: string) {
  const record = await db.query.cliDeviceCode.findFirst({
    where: eq(cliDeviceCode.userCode, normalizeUserCode(userCode)),
  });

  if (!record) throw new DeviceCodeNotFoundError();
  if (record.expiresAt.getTime() < Date.now()) throw new DeviceCodeExpiredError();

  return {
    userCode: record.userCode,
    hostname: record.hostname,
    status: record.status as "pending" | "approved" | "denied",
    expiresAt: record.expiresAt.toISOString(),
  };
}

/** Approves a grant from the browser and mints the CLI token the poll will hand over. */
export async function approveDeviceCode(userCode: string, userId: string) {
  const normalized = normalizeUserCode(userCode);

  const record = await db.query.cliDeviceCode.findFirst({
    where: eq(cliDeviceCode.userCode, normalized),
  });

  if (!record) throw new DeviceCodeNotFoundError();
  if (record.expiresAt.getTime() < Date.now()) throw new DeviceCodeExpiredError();
  if (record.status === "denied") throw new AuthorizationDeniedError();
  // Approving twice would mint a second token for the same grant.
  if (record.status === "approved") return { userCode: record.userCode, status: "approved" as const };

  const token = `${TOKEN_PREFIX}${randomBytes(32).toString("hex")}`;

  await db.insert(cliToken).values({
    id: randomUUID(),
    tokenHash: hashToken(token),
    userId,
    label: record.hostname,
  });

  await db
    .update(cliDeviceCode)
    .set({ status: "approved", userId, issuedToken: token })
    .where(eq(cliDeviceCode.id, record.id));

  return { userCode: record.userCode, status: "approved" as const };
}

export async function denyDeviceCode(userCode: string) {
  const normalized = normalizeUserCode(userCode);

  const record = await db.query.cliDeviceCode.findFirst({
    where: eq(cliDeviceCode.userCode, normalized),
  });

  if (!record) throw new DeviceCodeNotFoundError();

  await db
    .update(cliDeviceCode)
    .set({ status: "denied", issuedToken: null })
    .where(eq(cliDeviceCode.id, record.id));

  return { userCode: record.userCode, status: "denied" as const };
}

/**
 * Exchanges a device code for an access token. The CLI polls this until the user approves
 * in the browser; the grant is consumed on success so the token is only ever handed out once.
 */
export async function exchangeDeviceCode(deviceCode: string) {
  const record = await db.query.cliDeviceCode.findFirst({
    where: eq(cliDeviceCode.deviceCode, deviceCode),
  });

  if (!record) throw new DeviceCodeNotFoundError();

  if (record.expiresAt.getTime() < Date.now()) {
    await db.delete(cliDeviceCode).where(eq(cliDeviceCode.id, record.id));
    throw new DeviceCodeExpiredError();
  }

  if (record.status === "denied") {
    await db.delete(cliDeviceCode).where(eq(cliDeviceCode.id, record.id));
    throw new AuthorizationDeniedError();
  }

  if (record.status !== "approved" || !record.issuedToken || !record.userId) {
    throw new AuthorizationPendingError();
  }

  const token = record.issuedToken;
  const dbUser = await db.query.user.findFirst({ where: eq(userTable.id, record.userId) });

  await db.delete(cliDeviceCode).where(eq(cliDeviceCode.id, record.id));

  return {
    token,
    user: {
      id: record.userId,
      email: dbUser?.email ?? "",
      name: dbUser?.name ?? "",
    },
  };
}

/** Resolves a `Authorization: Bearer bs_…` token to its user. Used by the auth middleware. */
export async function resolveCliToken(token: string) {
  if (!token.startsWith(TOKEN_PREFIX)) return null;

  const record = await db.query.cliToken.findFirst({
    where: eq(cliToken.tokenHash, hashToken(token)),
    with: { user: true },
  });

  if (!record) return null;

  await db.update(cliToken).set({ lastUsedAt: new Date() }).where(eq(cliToken.id, record.id));

  return record.user;
}

/** Revokes the token the request was made with — `bettersent logout`. */
export async function revokeCliToken(token: string, userId: string) {
  const deleted = await db
    .delete(cliToken)
    .where(and(eq(cliToken.tokenHash, hashToken(token)), eq(cliToken.userId, userId)))
    .returning({ id: cliToken.id });

  return deleted.length > 0;
}
