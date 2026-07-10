import { describe, expect, test } from "bun:test";

import { ExtractionError, reasonFromStatus, toExtractionError } from "../lib/errors";

describe("reasonFromStatus", () => {
  test.each([
    [401, "blocked"],
    [403, "blocked"],
    [404, "not_found"],
    [410, "not_found"],
    [429, "rate_limited"],
    [500, "upstream_error"],
    [503, "upstream_error"],
    [418, "unknown"],
  ])("maps %i to %s", (status, expected) => {
    expect(reasonFromStatus(status as number)).toBe(expected as never);
  });
});

describe("ExtractionError.isTerminal", () => {
  test("an image URL can never become an article, whoever fetches it", () => {
    expect(new ExtractionError("unsupported_content", "svg").isTerminal).toBe(true);
  });

  test("a private address must not be retried through a proxy tier", () => {
    expect(new ExtractionError("private_host", "169.254.169.254").isTerminal).toBe(true);
  });

  test("a bot block is not terminal: a proxied tier can still succeed", () => {
    expect(new ExtractionError("blocked", "403").isTerminal).toBe(false);
  });

  test("a rate limit is not terminal: a different egress IP can still succeed", () => {
    expect(new ExtractionError("rate_limited", "429").isTerminal).toBe(false);
  });
});

describe("toExtractionError", () => {
  test("passes ExtractionError through unchanged", () => {
    const original = new ExtractionError("blocked", "nope");
    expect(toExtractionError(original, "tier")).toBe(original);
  });

  test("classifies an aborted fetch as a timeout", () => {
    const abort = new Error("The operation timed out.");
    abort.name = "TimeoutError";
    expect(toExtractionError(abort, "local").reason).toBe("timeout");
  });

  test("records the tier that failed", () => {
    expect(toExtractionError(new Error("boom"), "firecrawl").source).toBe("firecrawl");
  });

  test("survives a non-Error throw", () => {
    const err = toExtractionError("string failure", "local");
    expect(err.reason).toBe("unknown");
    expect(err.message).toBe("string failure");
  });
});

describe("userMessage", () => {
  test("never leaks upstream jargon to the reader", () => {
    const err = new ExtractionError("blocked", "502 Bad Gateway: Failed to fetch: 403 Forbidden");
    expect(err.userMessage).not.toContain("502");
    expect(err.userMessage).toMatch(/blocks automated readers/);
  });
});
