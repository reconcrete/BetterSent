import { api } from "./treaty";
import { isYoutubeUrl } from "./urls";

export type SendResult =
  | { ok: true }
  | { ok: false; status: number | null; message: string };

const getErrorMessage = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "string"
  ) {
    return (value as { error: string }).error;
  }
  return null;
};

type TreatyResponse = { error: { status: number; value: unknown } | null };

const toResult = (response: TreatyResponse): SendResult => {
  if (!response.error) return { ok: true };
  const { status, value } = response.error;
  if (status === 401) {
    return { ok: false, status, message: "Sign in to Bettersent to send content to your Kindle." };
  }
  return {
    ok: false,
    status,
    message: getErrorMessage(value) ?? "Something went wrong. Please try again.",
  };
};

const wrap = async (request: () => Promise<TreatyResponse>): Promise<SendResult> => {
  try {
    return toResult(await request());
  } catch {
    return {
      ok: false,
      status: null,
      message: "Could not reach Bettersent. Check your connection and try again.",
    };
  }
};

// YouTube URLs auto-route to the dedicated endpoint; /extract/url rejects them.
export const sendUrl = (url: string, kindleEmailId?: string): Promise<SendResult> =>
  wrap(() =>
    isYoutubeUrl(url)
      ? api.extract.youtube.post({ url, kindleEmailId })
      : api.extract.url.post({ url, kindleEmailId }),
  );

export const sendText = (textContent: string, kindleEmailId?: string): Promise<SendResult> =>
  wrap(() => api.extract.text.post({ textContent, kindleEmailId }));
