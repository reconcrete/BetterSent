import { basename, resolve } from "node:path";

import * as p from "@clack/prompts";
import color from "picocolors";

import {
  extractFile,
  extractUrl,
  extractYoutube,
  getHistoryEntry,
  getKindleEmails,
  type ApiResult,
} from "../api/client";
import { SUPPORTED_FILE_EXTENSIONS } from "../config";
import { describeDevice, promptForDevice } from "../lib/devices";
import { requireCredentials } from "../lib/session";
import type { SendSource } from "../lib/args";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isYoutubeUrl = (url: string) => {
  const normalized = url.trim().toLowerCase();
  return normalized.includes("youtube.com/") || normalized.includes("youtu.be/");
};

const isHttpUrl = (url: string) => /^https?:\/\//i.test(url.trim());

/** Rejects sources the API would only reject later, so the user gets a fast, specific message. */
async function validateSource(source: SendSource): Promise<string | null> {
  if (source.type === "url") {
    if (!isHttpUrl(source.value)) return "The --url value must start with http:// or https://";
    if (isYoutubeUrl(source.value)) return "That's a YouTube link — send it with --youtube instead.";
    return null;
  }

  if (source.type === "youtube") {
    if (!isHttpUrl(source.value)) return "The --youtube value must start with http:// or https://";
    if (!isYoutubeUrl(source.value)) return "That doesn't look like a YouTube link.";
    return null;
  }

  const path = resolve(source.value);
  if (!(await Bun.file(path).exists())) return `No such file: ${path}`;

  const extension = basename(path).split(".").pop()?.toLowerCase();
  if (!extension || !SUPPORTED_FILE_EXTENSIONS.includes(extension)) {
    return `Unsupported file type. Supported: ${SUPPORTED_FILE_EXTENSIONS.join(", ")}`;
  }

  return null;
}

/** Follows a send to completion. The API queues the work and reports progress on the history entry. */
async function waitForSend(token: string, historyId: string): Promise<ApiResult<{ title: string | null }>> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const entry = await getHistoryEntry(token, historyId);
    if (!entry.success) return entry;

    if (entry.data.status === "completed") {
      return { success: true, data: { title: entry.data.title } };
    }

    if (entry.data.status === "error") {
      return {
        success: false,
        error: entry.data.errorMessage ?? "The send failed.",
        status: 500,
      };
    }

    await sleep(POLL_INTERVAL_MS);
  }

  return { success: false, error: "Timed out waiting for the send to finish.", status: 0 };
}

export async function send(source: SendSource, chooseDevice: boolean): Promise<number> {
  p.intro(color.bgCyan(color.black(" bettersent ")));

  const credentials = await requireCredentials();
  if (!credentials) return 1;

  const { token } = credentials;

  const invalid = await validateSource(source);
  if (invalid) {
    p.cancel(invalid);
    return 1;
  }

  // Without --choose-device the API falls back to the user's default device.
  let kindleEmailId: string | undefined;
  let target = "your default device";

  if (chooseDevice) {
    const devices = await getKindleEmails(token);
    if (!devices.success) {
      p.cancel(devices.error);
      return 1;
    }

    if (devices.data.length === 0) {
      p.cancel(`You don't have any devices yet. Run ${color.cyan("bettersent setup")} to add one.`);
      return 1;
    }

    const device = await promptForDevice(devices.data);
    if (!device) {
      p.cancel("Cancelled.");
      return 1;
    }

    kindleEmailId = device.id;
    target = describeDevice(device);
  }

  const spinner = p.spinner();
  spinner.start(`Sending to ${target}`);

  const accepted =
    source.type === "url"
      ? await extractUrl(token, source.value, kindleEmailId)
      : source.type === "youtube"
        ? await extractYoutube(token, source.value, kindleEmailId)
        : await extractFile(token, resolve(source.value), kindleEmailId);

  if (!accepted.success) {
    spinner.stop("Send failed", 1);
    p.cancel(accepted.error);
    return 1;
  }

  spinner.message("Converting and emailing your document");

  const result = await waitForSend(token, accepted.data.historyId);

  if (!result.success) {
    spinner.stop("Send failed", 1);
    p.cancel(result.error);
    return 1;
  }

  spinner.stop(`Sent ${color.cyan(result.data.title ?? source.value)}`);
  p.outro("It should show up on your device shortly.");
  return 0;
}
