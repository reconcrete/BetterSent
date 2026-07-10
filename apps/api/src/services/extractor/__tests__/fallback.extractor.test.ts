import { describe, expect, test } from "bun:test";

import { FallbackExtractor } from "../implementation/fallback.extractor";
import { ExtractionError } from "../lib/errors";
import type { ContentExtractor, ExtractedUrlContent } from "../types";

const CONTENT: ExtractedUrlContent = {
  markdown: "# Article",
  metadata: { title: "Article", author: "Someone" },
  needsLlmProcessing: false,
};

function succeeds(calls: string[], name: string): ContentExtractor {
  return {
    extractUrl: async () => {
      calls.push(name);
      return CONTENT;
    },
  };
}

function fails(calls: string[], name: string, error: Error): ContentExtractor {
  return {
    extractUrl: async () => {
      calls.push(name);
      throw error;
    },
  };
}

describe("FallbackExtractor", () => {
  test("requires at least one tier", () => {
    expect(() => new FallbackExtractor([])).toThrow(/at least one tier/);
  });

  test("returns the first tier's content without touching later tiers", async () => {
    const calls: string[] = [];
    const chain = new FallbackExtractor([
      { name: "local", extractor: succeeds(calls, "local") },
      { name: "firecrawl", extractor: succeeds(calls, "firecrawl") },
    ]);

    await expect(chain.extractUrl("https://example.com")).resolves.toEqual(CONTENT);
    expect(calls).toEqual(["local"]);
  });

  test("a rate-limited local fetch falls through to a later tier — the Substack case", async () => {
    const calls: string[] = [];
    const chain = new FallbackExtractor([
      { name: "local", extractor: fails(calls, "local", new ExtractionError("rate_limited", "429")) },
      { name: "firecrawl", extractor: succeeds(calls, "firecrawl") },
    ]);

    await expect(chain.extractUrl("https://newsletter.example.com/p/post")).resolves.toEqual(CONTENT);
    expect(calls).toEqual(["local", "firecrawl"]);
  });

  test("a bot block falls through to the proxied tier — the Cloudflare case", async () => {
    const calls: string[] = [];
    const chain = new FallbackExtractor([
      { name: "local", extractor: fails(calls, "local", new ExtractionError("blocked", "403")) },
      { name: "defuddle-api", extractor: fails(calls, "defuddle-api", new ExtractionError("blocked", "403")) },
      { name: "firecrawl", extractor: succeeds(calls, "firecrawl") },
    ]);

    await expect(chain.extractUrl("https://blocked.example.com")).resolves.toEqual(CONTENT);
    expect(calls).toEqual(["local", "defuddle-api", "firecrawl"]);
  });

  test("a terminal failure stops the chain instead of burning the paid tier", async () => {
    const calls: string[] = [];
    const chain = new FallbackExtractor([
      {
        name: "local",
        extractor: fails(calls, "local", new ExtractionError("unsupported_content", "image/svg+xml")),
      },
      { name: "firecrawl", extractor: succeeds(calls, "firecrawl") },
    ]);

    await expect(chain.extractUrl("https://example.com/logo.svg")).rejects.toThrow(/svg/);
    expect(calls).toEqual(["local"]);
  });

  test("an SSRF attempt is never retried through another tier", async () => {
    const calls: string[] = [];
    const chain = new FallbackExtractor([
      {
        name: "local",
        extractor: fails(calls, "local", new ExtractionError("private_host", "private/internal")),
      },
      { name: "firecrawl", extractor: succeeds(calls, "firecrawl") },
    ]);

    await expect(chain.extractUrl("http://169.254.169.254/latest/meta-data/")).rejects.toThrow();
    expect(calls).toEqual(["local"]);
  });

  test("when every tier fails, it reports the most actionable reason", async () => {
    const calls: string[] = [];
    const chain = new FallbackExtractor([
      { name: "local", extractor: fails(calls, "local", new ExtractionError("blocked", "403 Forbidden")) },
      { name: "firecrawl", extractor: fails(calls, "firecrawl", new Error("socket hang up")) },
    ]);

    const error = (await chain.extractUrl("https://x.com").catch((e) => e)) as ExtractionError;

    // "socket hang up" (unknown) came last, but "blocked" is what the user can act on.
    expect(error.reason).toBe("blocked");
    expect(error.userMessage).toMatch(/blocks automated readers/);
  });

  test("wraps a plain Error from a tier into an ExtractionError", async () => {
    const chain = new FallbackExtractor([
      { name: "local", extractor: fails([], "local", new Error("boom")) },
    ]);

    const error = (await chain.extractUrl("https://x.com").catch((e) => e)) as ExtractionError;
    expect(error).toBeInstanceOf(ExtractionError);
    expect(error.reason).toBe("unknown");
  });
});
