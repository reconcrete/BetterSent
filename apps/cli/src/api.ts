import { treaty } from "@elysiajs/eden";

import type { Api } from "../../api/src/index";
import { getApiUrl, readConfig } from "./config";

export const CLI_CLIENT_ID = "bettersent-cli";

/** Type-safe Eden client for the Bettersent API, authenticated via the stored CLI token. */
export const createApi = (token?: string) => {
  const authToken = token ?? readConfig()?.token;
  return treaty<Api>(getApiUrl(), {
    headers: authToken ? { authorization: `Bearer ${authToken}` } : undefined,
  });
};

export type ApiClient = ReturnType<typeof createApi>;

/** Extract a human-readable message from a treaty error value. */
export const apiErrorMessage = (error: { status: number; value: unknown } | null): string => {
  if (!error) return "Unknown error";
  if (error.status === 401) {
    return "Not authenticated (or session expired). Run `bettersent login` first.";
  }
  const { value } = error;
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const body = value as { error?: unknown; message?: unknown };
    if (typeof body.error === "string") return body.error;
    if (typeof body.message === "string") return body.message;
  }
  return `Request failed with status ${error.status}`;
};
