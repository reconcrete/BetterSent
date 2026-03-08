import { API_URL, INTERNAL_API_KEY } from "../config";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ExtractResult {
  markdown: string;
  filename: string;
  savedAt: string;
}

interface ExtractFileResult {
  filename: string;
  sentAt: string;
}

function getHeaders(userId: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Internal-Api-Key": INTERNAL_API_KEY,
    "X-User-Id": userId,
  };
}

export async function extractUrl(
  url: string,
  userId: string,
  kindleEmailId?: string
): Promise<ApiResponse<ExtractResult>> {
  const res = await fetch(`${API_URL}/extract/url`, {
    method: "POST",
    headers: getHeaders(userId),
    body: JSON.stringify({ url, kindleEmailId }),
  });
  return res.json();
}

export async function extractText(
  textContent: string,
  userId: string,
  kindleEmailId?: string
): Promise<ApiResponse<ExtractResult>> {
  const res = await fetch(`${API_URL}/extract/text`, {
    method: "POST",
    headers: getHeaders(userId),
    body: JSON.stringify({ textContent, kindleEmailId }),
  });
  return res.json();
}

export async function extractFile(
  fileData: ArrayBuffer,
  fileName: string,
  userId: string,
  kindleEmailId?: string
): Promise<ApiResponse<ExtractFileResult>> {
  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(fileData)]), fileName);
  if (kindleEmailId) formData.append("kindleEmailId", kindleEmailId);

  const res = await fetch(`${API_URL}/extract/file`, {
    method: "POST",
    headers: {
      "X-Internal-Api-Key": INTERNAL_API_KEY,
      "X-User-Id": userId,
    },
    body: formData,
  });
  return res.json();
}
