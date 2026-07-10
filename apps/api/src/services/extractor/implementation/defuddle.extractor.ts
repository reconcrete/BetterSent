import type { ContentExtractor, ExtractedUrlContent } from "../types";
import { ensureHttpUrl } from "../../scraper/lib";
import { ExtractionError, reasonFromStatus, toExtractionError } from "../lib/errors";
import { DEFAULT_FETCH_TIMEOUT_MS } from "../lib/fetch-page";

const SOURCE = "defuddle-api";

/** defuddle.md reports every upstream failure as 502; the cause is in the body. */
const UPSTREAM_STATUS_PATTERN = /Failed to fetch:\s*(\d{3})/i;
const NOT_HTML_PATTERN = /^Not an HTML page/i;

export class DefuddleExtractor implements ContentExtractor {
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(apiKey: string, timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS) {
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs;
  }

  private parseFrontmatter(raw: string): { frontmatter: Record<string, string>; content: string } {
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
      return { frontmatter: {}, content: raw };
    }

    const frontmatter: Record<string, string> = {};
    for (const line of match[1].split("\n")) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      frontmatter[key] = value;
    }

    return { frontmatter, content: match[2].trim() };
  }

  /**
   * Recover the real failure from the response body.
   *
   * A bare `502 Bad Gateway` says nothing: the target site may have blocked the
   * fetch (403), throttled it (429), or served an image instead of an article.
   * defuddle.md puts that detail in `{"error": "..."}`, so read it before
   * deciding whether another extractor is worth trying.
   */
  private classifyFailure(status: number, statusText: string, body: string): ExtractionError {
    let detail = "";
    try {
      const parsed = JSON.parse(body) as { error?: unknown };
      if (typeof parsed.error === "string") detail = parsed.error;
    } catch {
      detail = body.slice(0, 200).trim();
    }

    const describe = detail ? `${status} ${statusText}: ${detail}` : `${status} ${statusText}`;

    if (NOT_HTML_PATTERN.test(detail)) {
      return new ExtractionError("unsupported_content", describe, { source: SOURCE, status });
    }

    const upstream = detail.match(UPSTREAM_STATUS_PATTERN);
    if (upstream) {
      const upstreamStatus = Number(upstream[1]);
      return new ExtractionError(reasonFromStatus(upstreamStatus), describe, {
        source: SOURCE,
        status: upstreamStatus,
      });
    }

    // No upstream marker, so the failure is defuddle.md's own (auth, outage).
    // Deliberately non-terminal: another tier may still succeed.
    if (status === 401 || status === 403) {
      return new ExtractionError("upstream_error", `defuddle.md rejected our credentials (${describe})`, {
        source: SOURCE,
        status,
      });
    }

    return new ExtractionError(reasonFromStatus(status), describe, { source: SOURCE, status });
  }

  async extractUrl(url: string): Promise<ExtractedUrlContent> {
    const parsedUrl = ensureHttpUrl(url);

    let response: Response;
    try {
      response = await fetch(`https://defuddle.md/${parsedUrl.toString()}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw toExtractionError(error, SOURCE);
    }

    if (!response.ok) {
      throw this.classifyFailure(response.status, response.statusText, await response.text().catch(() => ""));
    }

    const raw = await response.text();

    if (!raw.trim()) {
      throw new ExtractionError("empty_content", "Defuddle API returned empty content", { source: SOURCE });
    }

    const { frontmatter, content } = this.parseFrontmatter(raw);

    return {
      markdown: content,
      metadata: {
        title: frontmatter.title || "Untitled",
        author: frontmatter.author || "Unknown",
      },
      needsLlmProcessing: false,
    };
  }
}
