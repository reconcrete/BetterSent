import { DEFAULT_ACCEPT_HEADER, DEFAULT_USER_AGENT } from "../../scraper/constants";
import { ensureHttpUrl } from "../../scraper/lib";
import { ExtractionError, reasonFromStatus } from "./errors";

export const DEFAULT_FETCH_TIMEOUT_MS = 20_000;
export const MAX_PAGE_BYTES = 10 * 1024 * 1024;
const MAX_REDIRECTS = 5;

const HTML_CONTENT_TYPES = ["text/html", "application/xhtml+xml"];

export interface FetchedPage {
  html: string;
  /** URL after following redirects — what relative links resolve against. */
  finalUrl: string;
}

export interface FetchPageOptions {
  timeoutMs?: number;
  maxBytes?: number;
}

/** ensureHttpUrl throws plain Errors; classify them so the chain can short-circuit. */
function validateUrl(url: string): URL {
  try {
    return ensureHttpUrl(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const reason = message.includes("private/internal") ? "private_host" : "invalid_url";
    throw new ExtractionError(reason, message, { cause: error });
  }
}

function isHtml(contentType: string | null): boolean {
  if (!contentType) return true; // no header: optimistically parse
  const essence = contentType.split(";")[0]!.trim().toLowerCase();
  return HTML_CONTENT_TYPES.includes(essence);
}

/** Honour the page's declared charset; legacy sites still ship windows-1251 etc. */
function decoderFor(contentType: string | null): TextDecoder {
  const charset = contentType?.match(/charset=([^;]+)/i)?.[1]?.trim().replace(/^["']|["']$/g, "");
  if (!charset) return new TextDecoder();
  try {
    return new TextDecoder(charset);
  } catch {
    return new TextDecoder();
  }
}

/**
 * Read the body, aborting once maxBytes is exceeded rather than buffering an
 * unbounded response into memory.
 */
async function readBodyWithLimit(response: Response, maxBytes: number, decoder: TextDecoder): Promise<string> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new ExtractionError("too_large", `Page is ${declared} bytes (limit ${maxBytes})`);
  }

  if (!response.body) return "";

  const chunks: Uint8Array[] = [];
  let total = 0;

  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        throw new ExtractionError("too_large", `Page exceeds ${maxBytes} bytes`);
      }
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return decoder.decode(merged);
}

/**
 * Fetch a page as HTML, safe for user-supplied URLs.
 *
 * Redirects are followed manually so every hop is re-checked against the
 * private-address blocklist — `redirect: "follow"` would let a public URL
 * bounce to 169.254.169.254 unchecked.
 */
export async function fetchPage(url: string, options: FetchPageOptions = {}): Promise<FetchedPage> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? MAX_PAGE_BYTES;

  // One deadline for the whole redirect chain, not per hop.
  const signal = AbortSignal.timeout(timeoutMs);
  let current = validateUrl(url);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetch(current, {
      redirect: "manual",
      signal,
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
        Accept: DEFAULT_ACCEPT_HEADER,
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new ExtractionError("upstream_error", `Redirect ${response.status} without a Location header`, {
          status: response.status,
        });
      }
      await response.body?.cancel().catch(() => {});
      current = validateUrl(new URL(location, current).toString());
      continue;
    }

    if (!response.ok) {
      throw new ExtractionError(
        reasonFromStatus(response.status),
        `Fetch failed: ${response.status} ${response.statusText}`,
        { status: response.status },
      );
    }

    const contentType = response.headers.get("content-type");
    if (!isHtml(contentType)) {
      await response.body?.cancel().catch(() => {});
      throw new ExtractionError("unsupported_content", `Not an HTML page (content-type: ${contentType})`);
    }

    const html = await readBodyWithLimit(response, maxBytes, decoderFor(contentType));
    if (!html.trim()) {
      throw new ExtractionError("empty_content", "Fetched page had an empty body");
    }

    return { html, finalUrl: current.toString() };
  }

  throw new ExtractionError("upstream_error", `Exceeded ${MAX_REDIRECTS} redirects`);
}
