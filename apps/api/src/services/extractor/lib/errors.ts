/**
 * Why an extraction attempt failed.
 *
 * The distinction that matters is whether a *different* extractor could
 * succeed where this one failed. A 403 is worth retrying through a proxied
 * scraper; an SVG will never be an article no matter who fetches it.
 */
export type ExtractionFailureReason =
  | "invalid_url"
  | "private_host"
  | "unsupported_content"
  | "not_found"
  | "blocked"
  | "rate_limited"
  | "upstream_error"
  | "timeout"
  | "too_large"
  | "empty_content"
  | "unknown";

/** Reasons where retrying through another extractor cannot change the outcome. */
const TERMINAL_REASONS: ReadonlySet<ExtractionFailureReason> = new Set([
  "invalid_url",
  "private_host",
  "unsupported_content",
  "not_found",
  "too_large",
]);

/**
 * When every tier fails, the chain reports the most actionable reason rather
 * than whichever happened to come last. Higher wins.
 */
const REASON_PRIORITY: Record<ExtractionFailureReason, number> = {
  invalid_url: 100,
  private_host: 100,
  unsupported_content: 90,
  not_found: 80,
  too_large: 80,
  blocked: 70,
  rate_limited: 60,
  timeout: 50,
  upstream_error: 40,
  empty_content: 30,
  unknown: 0,
};

const USER_MESSAGES: Record<ExtractionFailureReason, string> = {
  invalid_url: "That doesn't look like a valid web address.",
  private_host: "That address points to a private network and can't be fetched.",
  unsupported_content: "That link isn't an article — only web pages can be sent.",
  not_found: "That page doesn't exist (404).",
  blocked: "That site blocks automated readers, so its content can't be fetched.",
  rate_limited: "That site is rate-limiting requests right now. Try again in a few minutes.",
  upstream_error: "That site returned an error. Try again later.",
  timeout: "That site took too long to respond. Try again later.",
  too_large: "That page is too large to convert.",
  empty_content: "No readable article content was found on that page.",
  unknown: "The page couldn't be extracted.",
};

export interface ExtractionErrorOptions {
  /** Which extractor produced this failure, for logs. */
  source?: string;
  /** HTTP status observed from the *target site* (not the extraction API). */
  status?: number;
  cause?: unknown;
}

export class ExtractionError extends Error {
  readonly reason: ExtractionFailureReason;
  readonly source?: string;
  readonly status?: number;

  constructor(reason: ExtractionFailureReason, message: string, options: ExtractionErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "ExtractionError";
    this.reason = reason;
    this.source = options.source;
    this.status = options.status;
  }

  /** True when no other extractor could plausibly succeed. */
  get isTerminal(): boolean {
    return TERMINAL_REASONS.has(this.reason);
  }

  get priority(): number {
    return REASON_PRIORITY[this.reason];
  }

  /** Safe to show to an end user: no URLs, no stack, no upstream jargon. */
  get userMessage(): string {
    return USER_MESSAGES[this.reason];
  }
}

/** Map an HTTP status from the *target site* onto a failure reason. */
export function reasonFromStatus(status: number): ExtractionFailureReason {
  if (status === 401 || status === 403) return "blocked";
  if (status === 404 || status === 410) return "not_found";
  if (status === 429) return "rate_limited";
  if (status === 413) return "too_large";
  if (status >= 500) return "upstream_error";
  return "unknown";
}

/** Normalize anything thrown during extraction into an ExtractionError. */
export function toExtractionError(error: unknown, source?: string): ExtractionError {
  if (error instanceof ExtractionError) return error;

  if (error instanceof Error) {
    // fetch() surfaces its AbortSignal.timeout as a TimeoutError DOMException.
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return new ExtractionError("timeout", error.message, { source, cause: error });
    }
    return new ExtractionError("unknown", error.message, { source, cause: error });
  }

  return new ExtractionError("unknown", String(error), { source, cause: error });
}
