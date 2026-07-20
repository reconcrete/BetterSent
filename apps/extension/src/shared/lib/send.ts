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

// Optional overrides for the EPUB metadata; omitted fields fall back to what
// the extractor infers from the content.
export type BookDetails = { title?: string; author?: string };

// Empty strings would override the inferred metadata with nothing, so drop them.
const normalize = (details: BookDetails | undefined): BookDetails => ({
  title: details?.title?.trim() || undefined,
  author: details?.author?.trim() || undefined,
});

// YouTube URLs auto-route to the dedicated endpoint; /extract/url rejects them.
export const sendUrl = (
  url: string,
  kindleEmailId?: string,
  details?: BookDetails,
): Promise<SendResult> => {
  const body = { url, kindleEmailId, ...normalize(details) };
  return wrap(() =>
    isYoutubeUrl(url) ? api.extract.youtube.post(body) : api.extract.url.post(body),
  );
};

export const sendText = (
  textContent: string,
  kindleEmailId?: string,
  details?: BookDetails,
): Promise<SendResult> =>
  wrap(() => api.extract.text.post({ textContent, kindleEmailId, ...normalize(details) }));
