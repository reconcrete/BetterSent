import { basename } from "node:path";

import { API_URL } from "../config";

export type ApiResult<T> = { success: true; data: T } | { success: false; error: string; status: number };

export type DeviceCode = {
  deviceCode: string;
  userCode: string;
  verificationUrl: string;
  verificationUrlComplete: string;
  expiresIn: number;
  interval: number;
};

export type DeviceToken = {
  token: string;
  user: { id: string; email: string; name: string };
};

export type KindleEmail = {
  id: string;
  email: string;
  label: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SendHistoryEntry = {
  id: string;
  type: string;
  title: string | null;
  status: "pending" | "processing" | "completed" | "error";
  errorMessage: string | null;
  kindleLabel: string | null;
};

/** The API answers 202 while a device login is still waiting for browser approval. */
export const AUTHORIZATION_PENDING = 202;

async function request<T>(
  path: string,
  init: RequestInit & { token?: string } = {}
): Promise<ApiResult<T>> {
  const { token, headers, ...rest } = init;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    return { success: false, error: `Could not reach ${API_URL} (${reason})`, status: 0 };
  }

  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  const body = parsed as { success?: boolean; data?: T; error?: string } | null;

  if (response.status === 401 && token) {
    return {
      success: false,
      error: "Your session has expired. Run `bettersent login` again.",
      status: 401,
    };
  }

  if (!response.ok || !body?.success) {
    return {
      success: false,
      error: body?.error ?? `API returned ${response.status}`,
      status: response.status,
    };
  }

  return { success: true, data: body.data as T };
}

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const requestDeviceCode = (hostname: string) =>
  request<DeviceCode>("/cli/device/code", json({ hostname }));

export const exchangeDeviceCode = (deviceCode: string) =>
  request<DeviceToken>("/cli/device/token", json({ deviceCode }));

export const logout = (token: string) => request<{ revoked: boolean }>("/cli/logout", { method: "POST", token });

export const getKindleEmails = (token: string) => request<KindleEmail[]>("/kindle", { token });

export const createKindleEmail = (token: string, email: string, label?: string) =>
  request<KindleEmail>("/kindle", { ...json({ email, label }), token });

export const updateKindleEmail = (
  token: string,
  id: string,
  body: { email?: string; label?: string | null }
) =>
  request<KindleEmail>(`/kindle/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    token,
  });

export const deleteKindleEmail = (token: string, id: string) =>
  request<{ deleted: boolean }>(`/kindle/${id}`, { method: "DELETE", token });

export const setDefaultKindleEmail = (token: string, id: string) =>
  request<KindleEmail>(`/kindle/${id}/default`, { method: "PATCH", token });

export const getHistoryEntry = (token: string, id: string) =>
  request<SendHistoryEntry>(`/history/${id}`, { token });

export const extractUrl = (token: string, url: string, kindleEmailId?: string) =>
  request<{ historyId: string }>("/extract/url", { ...json({ url, kindleEmailId }), token });

export const extractYoutube = (token: string, url: string, kindleEmailId?: string) =>
  request<{ historyId: string }>("/extract/youtube", { ...json({ url, kindleEmailId }), token });

export const extractFile = async (token: string, path: string, kindleEmailId?: string) => {
  const formData = new FormData();
  formData.append("file", Bun.file(path), basename(path));
  if (kindleEmailId) formData.append("kindleEmailId", kindleEmailId);

  return request<{ historyId: string }>("/extract/file", {
    method: "POST",
    body: formData,
    token,
  });
};
