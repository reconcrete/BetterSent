import { API_URL, INTERNAL_API_KEY } from "../config";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ExtractAcceptedResult {
  historyId: string;
}

function getHeaders(userId: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Internal-Api-Key": INTERNAL_API_KEY,
    "X-User-Id": userId,
  };
}

async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  if (!res.ok) {
    const text = await res.text();
    console.error(`API error ${res.status}: ${text}`);
    return { success: false, error: `API returned ${res.status}` };
  }
  const json = await res.json();
  if (!json) {
    return { success: false, error: "Empty response from API" };
  }
  return json;
}

export async function extractUrl(
  url: string,
  userId: string,
  kindleEmailId?: string
): Promise<ApiResponse<ExtractAcceptedResult>> {
  const res = await fetch(`${API_URL}/extract/url`, {
    method: "POST",
    headers: getHeaders(userId),
    body: JSON.stringify({ url, kindleEmailId }),
  });
  return handleResponse(res);
}

export async function extractText(
  textContent: string,
  userId: string,
  kindleEmailId?: string
): Promise<ApiResponse<ExtractAcceptedResult>> {
  const res = await fetch(`${API_URL}/extract/text`, {
    method: "POST",
    headers: getHeaders(userId),
    body: JSON.stringify({ textContent, kindleEmailId }),
  });
  return handleResponse(res);
}

export async function extractFile(
  fileData: ArrayBuffer,
  fileName: string,
  userId: string,
  kindleEmailId?: string
): Promise<ApiResponse<ExtractAcceptedResult>> {
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
  return handleResponse(res);
}
