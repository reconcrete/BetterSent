import { readFileSync, statSync } from "node:fs";
import { basename, extname, resolve } from "node:path";

import * as p from "@clack/prompts";

import { apiErrorMessage, createApi, type ApiClient } from "../api";
import type { SendKind } from "../args";
import { readConfig } from "../config";

// Mirrors SUPPORTED_FILE_EXTENSIONS in apps/api/src/routes/extractor/extractor.service.ts
const SUPPORTED_FILE_EXTENSIONS = [
  "pdf", "doc", "docx", "txt", "rtf", "htm", "html",
  "png", "gif", "jpg", "jpeg", "bmp", "epub", "md", "markdown",
];

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const fail = (message: string): never => {
  p.cancel(message);
  process.exit(1);
};

/** Prompt the user to pick one of their devices. Returns the kindleEmailId. */
const chooseDevice = async (api: ApiClient): Promise<string> => {
  const { data, error } = await api.kindle.get();
  if (error || !data?.success) return fail(apiErrorMessage(error));

  const devices = data.data;
  if (devices.length === 0) {
    return fail("No devices configured. Run `bettersent setup` to add one.");
  }

  const picked = await p.select({
    message: "Send to which device?",
    options: devices.map((device) => ({
      value: device.id,
      label: device.label || device.email,
      hint: device.isDefault ? `${device.email} · default` : device.email,
    })),
  });

  if (p.isCancel(picked)) {
    p.cancel("Cancelled.");
    process.exit(1);
  }

  return picked;
};

const submit = async (
  api: ApiClient,
  kind: SendKind,
  target: string,
  kindleEmailId: string | undefined,
) => {
  if (kind === "url") {
    return api.extract.url.post({ url: target, kindleEmailId });
  }

  if (kind === "youtube") {
    return api.extract.youtube.post({ url: target, kindleEmailId });
  }

  // kind === "file"
  const path = resolve(target);
  try {
    if (!statSync(path).isFile()) return fail(`Not a file: ${path}`);
  } catch {
    return fail(`File not found: ${path}`);
  }

  const extension = extname(path).slice(1).toLowerCase();
  if (!SUPPORTED_FILE_EXTENSIONS.includes(extension)) {
    return fail(
      `Unsupported file type ".${extension}". Supported: ${SUPPORTED_FILE_EXTENSIONS.join(", ")}`,
    );
  }

  const file = new File([new Uint8Array(readFileSync(path))], basename(path));
  // Multipart bodies turn `undefined` into the string "undefined", so only add
  // the device when one was actually chosen; the API falls back to the default.
  return api.extract.file.post({ file, ...(kindleEmailId && { kindleEmailId }) });
};

/** Poll the history entry until the send reaches a terminal state. */
const waitForCompletion = async (api: ApiClient, historyId: string) => {
  const spinner = p.spinner();
  spinner.start("Processing…");

  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);

    const { data, error } = await api.history({ id: historyId }).get();
    if (error) {
      spinner.stop("Lost track of the send.");
      return fail(apiErrorMessage(error));
    }
    if (!data?.success) continue;

    const entry = data.data;
    if (entry.status === "completed") {
      const title = entry.title ? `"${entry.title}"` : "Content";
      const device = entry.kindleLabel ? ` to ${entry.kindleLabel}` : "";
      spinner.stop(`${title} sent${device}.`);
      p.outro("Check your Kindle in a few minutes.");
      return;
    }
    if (entry.status === "error") {
      spinner.stop("Send failed.");
      return fail(entry.errorMessage || "The send failed without an error message.");
    }
    // "pending" | "processing" → keep waiting
  }

  spinner.stop("Still processing.");
  p.outro("This is taking longer than expected — check the history page in the web app.");
};

export const send = async (
  kind: SendKind,
  target: string,
  chooseDeviceFlag: boolean,
): Promise<void> => {
  if (!readConfig()) {
    fail("Not logged in. Run `bettersent login` first.");
  }

  const api = createApi();

  p.intro(`bettersent — send ${kind}`);

  const kindleEmailId = chooseDeviceFlag ? await chooseDevice(api) : undefined;

  const { data, error } = await submit(api, kind, target, kindleEmailId);
  if (error || !data?.success) {
    fail(apiErrorMessage(error));
  }

  await waitForCompletion(api, data!.data.historyId);
};
